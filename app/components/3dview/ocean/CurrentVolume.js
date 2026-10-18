import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import configService from '../../settings/ConfigService';
import { useSignalKPaths } from '../../hooks/useSignalK';
import { fetchCurrentField, uniformCurrent, setCurrentScale } from '../meteo/currentField';
import { getForecastHour, subscribeForecast, setSeries } from '../meteo/forecastStore';
import { colorMapTexture, colorAt } from '../meteo/colorMaps';
import { sampleWind } from '../meteo/windField';
import FlowMarkers from '../meteo/FlowMarkers';
import { markerLattice } from '../meteo/markerLattice';
import { useFieldTexture, NOISE_GLSL, FIELD_GLSL } from '../meteo/fieldVolume';

const PATHS = ['navigation.position', 'environment.current'];
export const DEFAULT_CURRENT_MAP = 'thermal';
const CURRENT_RANGE = 4; // m/s stored in the field texture
const MIN_ARROW_DEPTH = 1.5; // metres of water
// Arrow size on screen: shares of its distance to the camera
const ARROW_LENGTH = 0.16;
const ARROW_WIDTH = 0.028;

/** Water depth (m) at a point of the seabed mesh (local x, y), bilinear; NaN outside */
const depthAt = (geometry, x, y) => {
    const { width, widthSegments: n } = geometry.parameters;
    const fx = (x + width / 2) / width * n;
    const fy = (width / 2 - y) / width * n;
    if (fx < 0 || fy < 0 || fx >= n || fy >= n) return NaN;
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const a = fx - i;
    const b = fy - j;
    const d = geometry.attributes.aDepth.array;
    const at = (ii, jj) => d[jj * (n + 1) + ii];
    return (at(i, j) * (1 - a) + at(i + 1, j) * a) * (1 - b) + (at(i, j + 1) * (1 - a) + at(i + 1, j + 1) * a) * b;
};

const vertexShader = `
    attribute float aDepth;
    attribute vec2 aGround;
    varying float vDepth;
    varying vec2 vGround;
    varying vec3 vLocal;
    varying vec3 vWorld;
    void main() {
        vDepth = aDepth;
        vGround = aGround;
        vLocal = position;
        // Same expression as the seabed's: the same depth, no fighting
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
    }
`;

const fragmentShader = `
    uniform vec3 uCam;          // camera in the mesh frame (x east, y north, z up)
    uniform float uScale;       // scene units per metre
    uniform float uTime;
    uniform float uMax;         // speed at the top of the colour map, m/s
    uniform float uOpacity;     // opacity of a deep column
    uniform float uDepthScale;  // metres of water for ~63 % of it
    uniform float uFlow;        // drift of the pattern, times the current
    uniform sampler2D uMap;
    varying float vDepth;
    varying vec2 vGround;
    varying vec3 vLocal;
    varying vec3 vWorld;
    ${NOISE_GLSL}
    ${FIELD_GLSL}

    void main() {
        if (vDepth <= 0.05) discard;
        // Water the view ray crosses from the surface down to this point of
        // the bottom, counted up to twice the depth: grazing rays cross
        // hundreds of metres, and the far seabed would vanish under the colour
        vec3 P = vLocal;
        vec3 C = uCam;
        vec3 E = C.z > 0.0 ? C + (P - C) * (C.z / (C.z - P.z)) : C;
        float L = min(length(P - E) / uScale, vDepth * 2.0);
        // Surface current; the column's mean is ~7/8 of it (1/7 power law)
        vec2 flow = flowAt(vGround);
        float t = clamp(length(flow) * 0.875 / uMax, 0.0, 1.0);
        vec3 col = texture2D(uMap, vec2(t, 0.5)).rgb;
        // A soft pattern drifting with the stream (sped up so it shows) and
        // stretched along it: the direction reads without a single line
        float fl = length(flow);
        vec2 dir = fl > 1e-3 ? flow / fl : vec2(0.0, 1.0);
        vec2 drift = vGround - flow * uTime * uFlow;
        vec2 q = vec2(dot(drift, dir) / 240.0, dot(drift, vec2(-dir.y, dir.x)) / 36.0);
        float n = fbm(vec3(q, uTime * 0.04));
        float streak = mix(1.0, 0.6 + 0.8 * n, smoothstep(0.02, 0.25, t));
        col *= 0.85 + 0.3 * n * smoothstep(0.02, 0.25, t);
        // Slack water stays light: the veil thickens with the speed too
        float alpha = uOpacity * (1.0 - exp(-L / uDepthScale)) * streak * mix(0.3, 1.0, t);
        alpha *= fieldMask(vGround) * (1.0 - smoothstep(1500.0, 2100.0, length(vWorld.xz)));
        if (alpha < 0.004) discard;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
        #include <colorspace_fragment>
    }
`;

/**
 * The water column between the surface and the seabed, coloured by the
 * current (Grid Viewer's colour maps): drawn on the seabed mesh, each pixel
 * is as opaque as the water the view ray crosses down to the bottom, so the
 * shallows stay light over the relief and the deep channels take the full
 * colour. A soft pattern drifts with the stream, and a few arrows drawn the
 * way chart plotters draw tidal streams give its direction, its speed in
 * knots and whether it is building or easing. Over the translucent chart,
 * so the colours keep their strength.
 *
 * @param {THREE.BufferGeometry} geometry - the seabed mesh (aDepth, aGround)
 */
const CurrentVolume = ({ geometry }) => {
    const v = useSignalKPaths(PATHS);
    const position = v['navigation.position'];
    const measured = v['environment.current'];
    const hour = useSyncExternalStore(subscribeForecast, getForecastHour, getForecastHour);
    const [field, setField] = useState(null);
    const scale = configService.get('aisLengthScalingFactor') || 0.7;
    const mapName = configService.get('currentColorMap') || DEFAULT_CURRENT_MAP;
    const lat = position?.latitude;
    const lon = position?.longitude;
    const roundedKey = Number.isFinite(lat) ? `${lat.toFixed(1)},${lon.toFixed(1)}` : null;

    useEffect(() => {
        if (!roundedKey) return undefined;
        let cancelled = false;
        const [la, lo] = roundedKey.split(',').map(Number);
        fetchCurrentField(la, lo)
            .then((f) => { if (!cancelled) setField(f); })
            .catch(() => {
                if (!cancelled && Number.isFinite(measured?.drift) && Number.isFinite(measured?.setTrue)) {
                    setField(uniformCurrent(la, lo, measured.drift, measured.setTrue));
                }
            });
        return () => { cancelled = true; };
    }, [roundedKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const fieldTexture = useFieldTexture(field, hour, CURRENT_RANGE);
    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uCam: { value: new THREE.Vector3() },
            uScale: { value: scale },
            uTime: { value: 0 },
            uMax: { value: 1 },
            uOpacity: { value: Number(configService.get('currentOpacity')) || 0.75 },
            uDepthScale: { value: 8 },
            uFlow: { value: 12 },
            uMap: { value: null },
            uField: { value: null },
            uFieldHalf: { value: 1 },
            uFieldRange: { value: CURRENT_RANGE },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
    }), [scale]);
    useEffect(() => () => material.dispose(), [material]);
    const mapTexture = useMemo(() => colorMapTexture(mapName), [mapName]);
    useEffect(() => () => mapTexture.dispose(), [mapTexture]);
    useEffect(() => {
        const u = material.uniforms;
        u.uMap.value = mapTexture; // eslint-disable-line react-hooks/immutability
        u.uField.value = fieldTexture;
        u.uFieldHalf.value = field?.half ?? 1;
        u.uMax.value = setCurrentScale(field) ?? 1;
    }, [material, mapTexture, fieldTexture, field]);
    useEffect(() => () => setCurrentScale(null), []);

    // Speed at the boat over the forecast, for the curve of the forecast bar
    useEffect(() => {
        if (!field || !Number.isFinite(lat)) return undefined;
        const east = (lon - field.origin.lon) * Math.PI / 180 * 6371000 * Math.cos(field.origin.lat * Math.PI / 180);
        const north = (lat - field.origin.lat) * Math.PI / 180 * 6371000;
        const values = Array.from({ length: field.hours }, (_, h) => {
            const f = sampleWind(field, east, north, h);
            return Math.hypot(f.u, f.v);
        });
        setSeries('current', { start: field.start, values, top: field.max });
        return () => setSeries('current', null);
    }, [field, Math.round(lat * 100), Math.round(lon * 100)]); // eslint-disable-line react-hooks/exhaustive-deps

    const meshRef = useRef();
    const cam = useMemo(() => new THREE.Vector3(), []);
    const [markers, setMarkers] = useState([]);
    const tick = useRef(1);
    useFrame(({ camera, clock }, delta) => {
        const mesh = meshRef.current;
        if (!mesh) return;
        mesh.updateWorldMatrix(true, false);
        material.uniforms.uCam.value.copy(mesh.worldToLocal(cam.copy(camera.position)));
        material.uniforms.uTime.value = clock.elapsedTime;

        // Markers fixed to the ground, about evenly spread on screen,
        // refreshed once a second
        tick.current += delta;
        if (tick.current < 1 || !field) return;
        tick.current = 0;
        const top = material.uniforms.uMax.value;
        const p = geometry.attributes.position;
        const g = geometry.attributes.aGround;
        // Ground metres of the mesh's origin (the boat when it was built)
        const refE = g.getX(0) - p.getX(0) / scale;
        const refN = g.getY(0) - p.getY(0) / scale;
        // Camera over the ground, in the lattice frame (ground metres)
        const camLocal = cam.copy(camera.position);
        mesh.worldToLocal(camLocal);
        const cx = refE + camLocal.x / scale;
        const cy = refN + camLocal.y / scale;
        const heightM = Math.max(5, camLocal.z / scale);
        const step = THREE.MathUtils.clamp(Math.round(heightM * 0.9 / 5) * 5, 25, 400);
        const nodes = markerLattice({ cx, cy, radius: 1450, step, near: step * 3, originE: refE, originN: refN, max: 40 });
        const items = [];
        nodes.forEach(({ e: ge, n: gn }) => {
            const x = (ge - refE) * scale;
            const y = (gn - refN) * scale;
            // None on the boat itself
            if (Math.hypot(ge - refE, gn - refN) < 15) return;
            if (!(depthAt(geometry, x, y) > MIN_ARROW_DEPTH)) return;
            const f = sampleWind(field, ge, gn, hour);
            const later = sampleWind(field, ge, gn, hour + 1);
            const speed = Math.hypot(f.u, f.v);
            const t = Math.min(1, speed / top);
            const [cr, cg, cb] = colorAt(mapName, 0.28 + 0.72 * t);
            items.push({ key: `${ge},${gn}`, x, y, z: 0.3, u: f.u, v: f.v, speed,
                trend: Math.hypot(later.u, later.v) - speed, color: [cr / 255, cg / 255, cb / 255],
                len: ARROW_LENGTH * (0.4 + 0.6 * t) });
        });
        setMarkers(items);
    });

    if (!field) return null;
    return (
        <>
            <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} geometry={geometry} material={material} renderOrder={2} />
            {/* Same frame as the mesh: x east, y north, z up */}
            <group rotation={[-Math.PI / 2, 0, 0]}>
                <FlowMarkers items={markers} width={ARROW_WIDTH} screen={1} />
            </group>
        </>
    );
};

export default CurrentVolume;
