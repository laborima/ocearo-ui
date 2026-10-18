import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import configService from '../../settings/ConfigService';
import { useSignalKPaths } from '../../hooks/useSignalK';
import useOwnTrack from '../fsd/useOwnTrack';
import { fetchWindField, uniformField, sampleWind, windColor, HALF_EXTENT_M } from './windField';
import { colorMapTexture, colorAt } from './colorMaps';
import { useFieldTexture, NOISE_GLSL, FIELD_GLSL } from './fieldVolume';
import { getForecastHour, subscribeForecast, setSeries } from './forecastStore';
import FlowMarkers from './FlowMarkers';
import { markerLattice } from './markerLattice';
import useTheme from '../../theme/useTheme';

const PATHS = ['navigation.position', 'environment.wind.speedTrue', 'environment.wind.directionTrue'];
const TEX = 128;
const PARTICLES = 1100;
// Each streak is a short streamline: its head plus TRAIL points traced back
// upwind through the field, so it bends with the flow and fades to its tail
const TRAIL = 7;
const SEGMENTS = PARTICLES * TRAIL;
// Streaks take the colour of their wind, darkened on the light day sheet and
// lightened on the dark ones, to stand out from the sheet of the same colour
const SHADE_DAY = -0.6;
const SHADE_NIGHT = 0.45;
// Speed labels: on a ground-anchored lattice, the ones on screen only
// Wind markers (arrows with the speed): at most, size on screen (shares of
// the distance to the camera), height (m)
const MAX_MARKERS = 10;
const MARKER_LENGTH = 0.14;
const MARKER_WIDTH = 0.025;
const MARKER_HEIGHT = 10;
// Streak width in pixels (WebGL draws plain lines one pixel wide, lost in the
// grazing view of the cockpit camera)
const STREAK_WIDTH = 3;
const R = 6371000;
// Air volume: the layer of air drawn above the water, metres, and the top of
// a colour map (m/s) when one replaces Windy's scale
const AIR_HEIGHT = 150;
export const WIND_MAP_TOP = 20;
// Streaks kept over the air volume: a few, for the direction at a glance
const VOLUME_STREAKS = 150;

/** Colour of a wind speed (m/s) in the chosen scale: Windy's or a colour map */
export const windColorIn = (mapName, speed) => (mapName && mapName !== 'windy'
    ? colorAt(mapName, speed / WIND_MAP_TOP) : windColor(speed));

/** Windy's scale as a 256×1 texture over 0..WIND_MAP_TOP m/s */
const windyTexture = () => {
    const data = new Uint8Array(256 * 4);
    for (let i = 0; i < 256; i++) {
        const [r, g, b] = windColor(i / 255 * WIND_MAP_TOP);
        data.set([Math.round(r), Math.round(g), Math.round(b), 255], i * 4);
    }
    const t = new THREE.DataTexture(data, 256, 1, THREE.RGBAFormat);
    t.magFilter = THREE.LinearFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
};

const airVertex = `
    uniform float uScale;
    varying vec2 vGround;
    varying vec3 vWorld;
    void main() {
        vGround = position.xy / uScale;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
    }
`;

const airFragment = `
    uniform float uScale;
    uniform float uTop;         // top of the air layer, world y
    uniform float uTime;
    uniform float uMaxSpeed;    // top of the colour scale, m/s
    uniform float uOpacity;
    uniform float uLength;      // metres of air for ~63 % of the opacity
    uniform float uFlow;
    uniform sampler2D uMap;
    varying vec2 vGround;
    varying vec3 vWorld;
    ${NOISE_GLSL}
    ${FIELD_GLSL}
    void main() {
        // Air the view ray crosses from the top of the layer down to the water
        vec3 P = vWorld;
        vec3 C = cameraPosition;
        vec3 E = C.y > uTop ? C + (P - C) * ((C.y - uTop) / max(C.y - P.y, 1e-3)) : C;
        float L = length(P - E) / uScale;
        vec2 flow = flowAt(vGround);
        float speed = length(flow);
        float t = clamp(speed / uMaxSpeed, 0.0, 1.0);
        vec3 col = texture2D(uMap, vec2(t, 0.5)).rgb;
        // Gusty wisps carried by the wind, stretched along it
        vec2 dir = speed > 1e-3 ? flow / speed : vec2(0.0, 1.0);
        vec2 drift = vGround - flow * uTime * uFlow;
        vec2 q = vec2(dot(drift, dir) / 1400.0, dot(drift, vec2(-dir.y, dir.x)) / 220.0);
        float n = fbm(vec3(q, uTime * 0.05));
        col *= 0.88 + 0.28 * n;
        // A floor so the air right around the boat shows its colour, more
        // with the depth of air crossed towards the horizon
        float alpha = uOpacity * (0.3 + 0.7 * (1.0 - exp(-L / uLength))) * (0.25 + 1.5 * n * n);
        alpha *= fieldMask(vGround);
        if (alpha < 0.004) discard;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
        #include <colorspace_fragment>
    }
`;

/** East / north metres of `p` from `origin` */
const offsetM = (origin, p) => ({
    east: (p.longitude - origin.lon) * Math.PI / 180 * R * Math.cos(origin.lat * Math.PI / 180),
    north: (p.latitude - origin.lat) * Math.PI / 180 * R,
});

/**
 * Windy-style wind layer (the "Wind" layer, over any base mode): the forecast
 * wind speed painted with Windy's colour scale on a translucent sheet, and
 * streaks drifting with the wind. Pull the camera out to see the winds along
 * the route; the forecast hour comes from the meteo bar. `sheet`: false over
 * the sea, where only the streaks are drawn, above the waves.
 */
const WindLayer3D = ({ y = 0.05, sheet = true }) => {
    // 'volume': the air coloured by the wind, a few streaks; 'sheet': the
    // flat Windy sheet and its many streaks
    const style = configService.get('windStyle') || 'volume';
    const volume = sheet && style === 'volume';
    const mapName = configService.get('windColorMap') || 'windy';
    const v = useSignalKPaths(PATHS);
    const position = v['navigation.position'];
    const { heading } = useOwnTrack();
    const hour = useSyncExternalStore(subscribeForecast, getForecastHour, getForecastHour);
    const [field, setField] = useState(null);
    const { id: themeId } = useTheme();
    const shade = themeId === 'day' ? SHADE_DAY : SHADE_NIGHT;
    const layerRef = useRef();
    const scale = configService.get('aisLengthScalingFactor') || 0.7;

    const lat = position?.latitude;
    const lon = position?.longitude;
    const roundedKey = Number.isFinite(lat) ? `${lat.toFixed(1)},${lon.toFixed(1)}` : null;
    const tws = v['environment.wind.speedTrue'];
    const twd = v['environment.wind.directionTrue'];

    // Forecast grid around the boat; the boat's own wind when offline
    useEffect(() => {
        if (!roundedKey) return undefined;
        let cancelled = false;
        const [la, lo] = roundedKey.split(',').map(Number);
        fetchWindField(la, lo)
            .then((f) => { if (!cancelled) setField(f); })
            .catch(() => {
                if (!cancelled && Number.isFinite(tws) && Number.isFinite(twd)) setField(uniformField(la, lo, tws, twd));
            });
        return () => { cancelled = true; };
    }, [roundedKey]); // eslint-disable-line react-hooks/exhaustive-deps

    // Speed sheet: a small texture computed on the CPU from the grid
    const texture = useMemo(() => {
        const data = new Uint8Array(TEX * TEX * 4);
        const t = new THREE.DataTexture(data, TEX, TEX, THREE.RGBAFormat);
        t.magFilter = THREE.LinearFilter;
        t.minFilter = THREE.LinearFilter;
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    }, []);
    useEffect(() => {
        if (!field) return;
        const data = texture.image.data;
        for (let j = 0; j < TEX; j++) {
            for (let i = 0; i < TEX; i++) {
                const east = (i / (TEX - 1) * 2 - 1) * HALF_EXTENT_M;
                const north = (j / (TEX - 1) * 2 - 1) * HALF_EXTENT_M;
                const w = sampleWind(field, east, north, hour);
                const [r, g, b] = windColorIn(mapName, Math.hypot(w.u, w.v));
                const k = (j * TEX + i) * 4;
                // Fade out at the grid's edge
                const edge = Math.max(Math.abs(i / (TEX - 1) * 2 - 1), Math.abs(j / (TEX - 1) * 2 - 1));
                data[k] = r; data[k + 1] = g; data[k + 2] = b;
                data[k + 3] = Math.round(255 * Math.min(1, (1 - edge) * 8));
            }
        }
        texture.needsUpdate = true;
    }, [texture, field, hour]);
    useEffect(() => () => texture.dispose(), [texture]);

    // Streaks: particles advected by the field, drawn as streamline segments
    // of wide lines. Fat lines have no per-vertex alpha: the tail fades by
    // blending into the colour of the sheet under it (the same wind colour)
    const particles = useMemo(() => {
        const geo = new LineSegmentsGeometry();
        geo.setPositions(new Float32Array(SEGMENTS * 6));
        geo.setColors(new Float32Array(SEGMENTS * 6));
        const material = new LineMaterial({ linewidth: STREAK_WIDTH, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false });
        const object = new LineSegments2(geo, material);
        object.frustumCulled = false;
        object.renderOrder = 2;
        const state = Array.from({ length: PARTICLES }, () => ({ x: 0, y: 0, age: Math.random() * 4, life: 2 + Math.random() * 3 }));
        return { geo, material, object, state };
    }, []);
    useEffect(() => () => { particles.geo.dispose(); particles.material.dispose(); }, [particles]);
    // Air volume material
    const fieldTexture = useFieldTexture(volume ? field : null, hour);
    const air = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uScale: { value: scale }, uTop: { value: 0 }, uTime: { value: 0 }, uMaxSpeed: { value: WIND_MAP_TOP },
            uOpacity: { value: Number(configService.get('windOpacity')) || 0.7 }, uLength: { value: 600 }, uFlow: { value: 25 },
            uMap: { value: null }, uField: { value: null }, uFieldHalf: { value: HALF_EXTENT_M }, uFieldRange: { value: 40 },
        },
        vertexShader: airVertex,
        fragmentShader: airFragment,
        transparent: true,
        depthWrite: false,
    }), [scale]);
    const airMap = useMemo(() => (mapName === 'windy' ? windyTexture() : colorMapTexture(mapName)), [mapName]);
    useEffect(() => {
        air.uniforms.uMap.value = airMap; // eslint-disable-line react-hooks/immutability
        air.uniforms.uField.value = fieldTexture;
    }, [air, airMap, fieldTexture]);
    useEffect(() => () => { air.dispose(); airMap.dispose(); }, [air, airMap]);
    // Fewer streaks over the air volume
    useEffect(() => {
        particles.geo.instanceCount = (volume ? VOLUME_STREAKS : PARTICLES) * TRAIL; // eslint-disable-line react-hooks/immutability
    }, [particles, volume]);
    const [markers, setMarkers] = useState([]);
    const labelClock = useRef(0);

    // Wind at the boat over the forecast, for the curve of the forecast bar
    useEffect(() => {
        if (!field || !Number.isFinite(lat)) return undefined;
        const at = offsetM(field.origin, { latitude: lat, longitude: lon });
        const values = Array.from({ length: field.hours }, (_, h) => {
            const w = sampleWind(field, at.east, at.north, h);
            return Math.hypot(w.u, w.v);
        });
        setSeries('wind', { start: field.start, values, top: Math.max(...values) });
        return () => setSeries('wind', null);
    }, [field, Math.round(lat * 100), Math.round(lon * 100)]); // eslint-disable-line react-hooks/exhaustive-deps

    const boatRef = useRef({ east: 0, north: 0 });
    useEffect(() => {
        if (field && Number.isFinite(lat)) boatRef.current = offsetM(field.origin, { latitude: lat, longitude: lon });
    }, [field, lat, lon]);

    // Close to the boat the chart matters more than the colours: lighter sheet
    const sheetRef = useRef();
    useFrame(({ camera, size, clock }, delta) => {
        if (!field) return;
        if (volume) {
            air.uniforms.uTime.value = clock.elapsedTime;
            // World y of the layer's top: the sheet's height plus the air shown
            air.uniforms.uTop.value = y + AIR_HEIGHT * scale;
        }
        if (sheetRef.current) {
            const distM = camera.position.length() / scale;
            if (sheetRef.current) sheetRef.current.opacity = THREE.MathUtils.clamp(0.3 + (distM - 300) / 3000 * 0.3, 0.3, 0.6);
        }
        const dt = Math.min(delta, 0.1);
        // Streaks cover what the camera sees: a few times its distance
        const radiusM = Math.min(HALF_EXTENT_M, Math.max(800, camera.position.length() / scale * 2.5));
        // Visual speed: a streak crosses ~1/12 of the view per second in 10 m/s
        const speedUp = radiusM / 120;
        const step = radiusM / 140; // length of one trail segment
        const { east: be, north: bn } = boatRef.current;
        particles.material.resolution.set(size.width, size.height);
        const pos = particles.geo.attributes.instanceStart.data.array;
        const col = particles.geo.attributes.instanceColorStart.data.array;
        const count = volume ? VOLUME_STREAKS : PARTICLES;
        particles.state.forEach((p, k) => {
            if (k >= count) return;
            p.age += dt;
            if (p.age > p.life || Math.abs(p.x) > radiusM || Math.abs(p.y) > radiusM) {
                p.x = (Math.random() * 2 - 1) * radiusM;
                p.y = (Math.random() * 2 - 1) * radiusM;
                p.age = 0;
                p.life = 2 + Math.random() * 3;
            }
            const w = sampleWind(field, be + p.x, bn + p.y, hour);
            const s = Math.hypot(w.u, w.v);
            p.x += w.u * speedUp * dt / 10;
            p.y += w.v * speedUp * dt / 10;
            // Fade in and out over the streak's life: no popping
            const life = Math.min(1, p.age / 0.5, (p.life - p.age) / 0.7);
            const [r, g, b] = windColorIn(mapName, s);
            const toShade = (c) => (shade >= 0 ? (c / 255) * (1 - shade) + shade : (c / 255) * (1 + shade));
            const cr = toShade(r);
            const cg = toShade(g);
            const cb = toShade(b);
            // Colour of the sheet under the streak, what the tail fades into
            const br = r / 255;
            const bgc = g / 255;
            const bb = b / 255;
            // Longer tails in stronger wind
            const len = step * Math.min(1.6, 0.5 + s / 10);
            let x = p.x;
            let y = p.y;
            for (let t = 0; t < TRAIL; t++) {
                const wt = t === 0 ? w : sampleWind(field, be + x, bn + y, hour);
                const st = Math.hypot(wt.u, wt.v) || 1;
                const nx = x - wt.u / st * len;
                const ny = y - wt.v / st * len;
                const o = (k * TRAIL + t) * 6;
                pos[o] = x * scale; pos[o + 1] = y * scale; pos[o + 2] = 0.2;
                pos[o + 3] = nx * scale; pos[o + 4] = ny * scale; pos[o + 5] = 0.2;
                const a0 = life * (1 - t / TRAIL) ** 1.6;
                const a1 = life * (1 - (t + 1) / TRAIL) ** 1.6;
                const c = (k * TRAIL + t) * 6;
                col[c] = br + (cr - br) * a0; col[c + 1] = bgc + (cg - bgc) * a0; col[c + 2] = bb + (cb - bb) * a0;
                col[c + 3] = br + (cr - br) * a1; col[c + 4] = bgc + (cg - bgc) * a1; col[c + 5] = bb + (cb - bb) * a1;
                x = nx;
                y = ny;
            }
        });
        particles.geo.attributes.instanceStart.data.needsUpdate = true;
        particles.geo.attributes.instanceColorStart.data.needsUpdate = true;

        // Wind markers at 10 m, refreshed once a second on a lattice fixed to
        // the ground (they do not swim with the boat) and sized to the view
        labelClock.current += delta;
        if (labelClock.current < 1) return;
        labelClock.current = 0;
        const layer = layerRef.current;
        if (!layer) return;
        // Camera over the ground, metres in the field frame
        const camLocal = layer.worldToLocal(new THREE.Vector3().copy(camera.position));
        const cx = be + camLocal.x / scale;
        const cy = bn + camLocal.y / scale;
        const heightM = Math.max(5, camLocal.z / scale);
        const markerStep = THREE.MathUtils.clamp(Math.round(heightM * 3 / 10) * 10, 60, 4000);
        // Not too far: from the cockpit, 10 m up sits on the horizon beyond a
        // few hundred metres, and the arrows would pile up there
        const reach = Math.min(radiusM * 0.9, Math.max(800, heightM * 60));
        const nodes = markerLattice({ cx, cy, radius: reach, step: markerStep, near: markerStep * 3, originE: cx, originN: cy, max: 80 });
        const next = [];
        const ndc = new THREE.Vector3();
        nodes.forEach(({ e, n, d }) => {
            if (Math.hypot(e - be, n - bn) < 20) return; // none on the boat itself
            // Keep the points the camera sees, away from the screen edges
            ndc.set((e - be) * scale, (n - bn) * scale, MARKER_HEIGHT * scale);
            layer.localToWorld(ndc).project(camera);
            if (ndc.z > 1 || Math.abs(ndc.x) > 0.9 || Math.abs(ndc.y) > 0.9) return;
            const wl = sampleWind(field, e, n, hour);
            const later = sampleWind(field, e, n, hour + 1);
            const speed = Math.hypot(wl.u, wl.v);
            const [r, g, b] = windColorIn(mapName, speed);
            next.push({ key: `${e},${n}`, x: (e - be) * scale, y: (n - bn) * scale, z: MARKER_HEIGHT * scale, u: wl.u, v: wl.v,
                speed, trend: Math.hypot(later.u, later.v) - speed, color: [r / 255, g / 255, b / 255],
                len: MARKER_LENGTH * (0.4 + 0.6 * Math.min(1, speed / 15)), d });
        });
        // The closest ones first, few enough to stay readable
        next.sort((a, b) => a.d - b.d).splice(MAX_MARKERS);
        setMarkers(next);
    });

    if (!field) return null;
    const { east: be, north: bn } = boatRef.current;
    const size = HALF_EXTENT_M * 2 * scale;

    return (
        // North-up layer turned into the boat frame; local x east, y north
        <group rotation={[0, heading, 0]} position={[0, y, 0]}>
            <group ref={layerRef} rotation={[-Math.PI / 2, 0, 0]}>
                {sheet && (
                    <mesh position={[-be * scale, -bn * scale, 0]} renderOrder={1}>
                        <planeGeometry args={[size, size]} />
                        {volume ? <primitive object={air} attach="material" />
                            : <meshBasicMaterial ref={sheetRef} map={texture} transparent opacity={0.6} depthWrite={false} toneMapped={false} />}
                    </mesh>
                )}
                <primitive object={particles.object} />
                <FlowMarkers items={markers} width={MARKER_WIDTH} screen={1} format={(kn) => String(Math.round(kn))} slackLabel="calm" />
            </group>
        </group>
    );
};

export default WindLayer3D;
