import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useTheme from '../../theme/useTheme';
import { useSignalKPaths } from '../../hooks/useSignalK';
import { sunPosition } from '../../utils/SunUtils';
import { vesselNow } from '../../utils/VesselClock';
import useOwnTrack from '../fsd/useOwnTrack';
import { getRenderProfile } from '../../utils/RenderProfile';

// The sea is drawn at the own boat's scale (scene units per metre, see
// ThreeDBoatView): wavelengths, wake and speed past the hull read true
// against the hull, whatever the AIS scale.
const BOAT_SCALE = 0.7;
const RADIUS = 2400;
const SEGMENTS = 320;
const SKY_RADIUS = 3800;
// Wake: a point every ~1.5 scene units of track, the last TRAIL kept
const TRAIL = 32;
const TRAIL_STEP = 1.5;
// Hull footprint at the waterline (semi-length, semi-beam), scene units
const HULL = [4.0, 1.35];

// Shader budget: the Raspberry Pi profile halves the noise octaves, the
// ripples and the wake history (a Pi 4 GPU is fill-rate bound)
const shaderDefines = (pi) => ({
    FBM_OCTAVES: pi ? 2 : 4,
    RIPPLES: pi ? 3 : 6,
    TRAIL_SEGMENTS: pi ? 12 : TRAIL - 1,
});

const PATHS = [
    'environment.wind.speedTrue',
    'environment.wind.directionTrue',
    'navigation.speedThroughWater',
    'navigation.speedOverGround',
];

const common = `
    uniform float uTime;
    uniform float uAmp;
    uniform float uDir;
    uniform float uWaveLength;
    uniform float uChop;
    uniform vec2 uOffset;
`;

// Wave field: a spectrum of Gerstner trains spread around the downwind
// direction (sharp crests, round troughs) plus a long swell, displaced on the
// GPU and anchored to the sea (uOffset = our position) so the waves stream
// past the hull. Shorter waves are only in the pixel normals (see fragment).
const seaVertex = `
    ${common}
    varying vec3 vPos;
    varying vec3 vNormalW;
    varying vec2 vSea;
    varying float vHeight;
    varying float vJacobian;
    varying float vDist;

    #define NW 6
    const float WL[NW] = float[NW](1.0, 0.74, 0.58, 0.45, 0.36, 0.29);
    const float WA[NW] = float[NW](0.46, 0.30, 0.22, 0.15, 0.11, 0.08);
    const float WD[NW] = float[NW](0.0, 0.43, -0.37, 0.86, -0.74, 0.18);
    const float WP[NW] = float[NW](0.0, 1.7, 4.1, 2.3, 5.2, 0.9);

    void wave(vec2 p, float angle, float L, float a, float steep, float phase,
              inout vec3 disp, inout vec3 dDx, inout vec3 dDy) {
        vec2 d = vec2(sin(angle), cos(angle));
        float k = 6.2831853 / L;
        float c = sqrt(9.81 * ${BOAT_SCALE.toFixed(2)} / k);
        float f = k * (dot(d, p) - c * uTime) + phase;
        float q = clamp(steep / (k * a * float(NW) + 1e-4), 0.0, 1.0);
        float s = sin(f);
        float co = cos(f);
        disp += vec3(d.x * q * a * co, d.y * q * a * co, a * s);
        // Partial derivatives of the displaced surface (x, y, z) along x and y
        dDx += vec3(-q * d.x * d.x * k * a * s, -q * d.x * d.y * k * a * s, d.x * k * a * co);
        dDy += vec3(-q * d.x * d.y * k * a * s, -q * d.y * d.y * k * a * s, d.y * k * a * co);
    }

    void main() {
        vec2 local = position.xy;
        vec2 sea = local + uOffset;
        float dist = length(local);
        // Calmer far away (clean horizon) and under the hull, which does not heave
        float fade = (1.0 - smoothstep(900.0, 2200.0, dist)) * mix(0.4, 1.0, smoothstep(3.0, 16.0, dist));
        vec3 disp = vec3(0.0);
        vec3 dDx = vec3(0.0);
        vec3 dDy = vec3(0.0);
        for (int i = 0; i < NW; i++) {
            wave(sea, uDir + WD[i], uWaveLength * WL[i], uAmp * WA[i], uChop, WP[i], disp, dDx, dDy);
        }
        // Long swell, from a little off the wind
        wave(sea, uDir + 0.55, 70.0 * ${BOAT_SCALE.toFixed(2)}, 0.16 * ${BOAT_SCALE.toFixed(2)}, 0.2, 0.0, disp, dDx, dDy);
        disp *= fade;
        dDx *= fade;
        dDy *= fade;
        vec3 tx = vec3(1.0, 0.0, 0.0) + dDx;
        vec3 ty = vec3(0.0, 1.0, 0.0) + dDy;
        vNormalW = normalize(cross(tx, ty));
        // Horizontal compression: below ~0.6 the crest is about to break
        vJacobian = (1.0 + dDx.x) * (1.0 + dDy.y) - dDx.y * dDy.x;
        vHeight = disp.z / max(uAmp, 1e-3);
        vSea = sea + disp.xy;
        vDist = dist;
        vPos = vec3(local + disp.xy, disp.z);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos, 1.0);
    }
`;

const skyFunction = `
    uniform vec3 uZenith;
    uniform vec3 uHorizon;
    uniform vec3 uSunDir;
    uniform float uSunI;
    // Sky radiance in a direction (z up): horizon haze to zenith, a soft sun
    vec3 skyColor(vec3 d) {
        float up = clamp(d.z, 0.0, 1.0);
        vec3 c = mix(uHorizon, uZenith, pow(up, 0.45));
        float s = max(dot(d, uSunDir), 0.0);
        c += uSunI * (pow(s, 6.0) * 0.18 + pow(s, 120.0) * 0.6) * vec3(1.0, 0.94, 0.82);
        return c;
    }
`;

const noise = `
    // Sin-free hash (Dave Hoskins): sin() of large arguments loses float
    // precision on the GPU and the noise falls apart into blocks far from
    // the session origin. Lattice wrapped to keep the inputs small.
    float hash(vec2 p) {
        vec3 p3 = fract(vec3(mod(p, 1024.0).xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
    }
    float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < FBM_OCTAVES; i++) { v += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.3); a *= 0.5; }
        return v;
    }
`;

const seaFragment = `
    ${common}
    ${skyFunction}
    ${noise}
    uniform vec3 uCam;
    uniform vec3 uDeep;
    uniform vec3 uScatter;
    uniform vec3 uFoamColor;
    uniform float uWind;
    uniform float uFog;
    uniform vec4 uTrail[${TRAIL}];
    uniform float uTrailReach;
    uniform vec2 uBow;
    uniform float uSpeed;
    uniform vec2 uHull;
    uniform float uOcclude;
    varying vec3 vPos;
    varying vec3 vNormalW;
    varying vec2 vSea;
    varying float vHeight;
    varying float vJacobian;
    varying float vDist;

    // Foam left by the hull: a turbulent band along our real track that
    // widens and fades with age, the two Kelvin arms (19.5°) and the bow wave
    float wakeFoam(vec2 p) {
        if (length(p) > uTrailReach) return 0.0;
        float best = 1e6;
        float age = 0.0;
        for (int i = 0; i < TRAIL_SEGMENTS; i++) {
            vec4 a = uTrail[i];
            vec4 b = uTrail[i + 1];
            if (b.z < 0.0) break;
            vec2 ab = b.xy - a.xy;
            float t = clamp(dot(p - a.xy, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
            float d = length(p - a.xy - ab * t);
            if (d < best) { best = d; age = mix(a.z, b.z, t); }
        }
        float moving = smoothstep(0.3, 1.6, uSpeed);
        float width = uHull.y * 0.55 + age * 0.12;
        float grain = fbm(vSea * 1.3 + vec2(0.0, uTime * 0.2));
        float band = (1.0 - smoothstep(width * 0.35, width, best)) * exp(-age / 22.0);
        band *= 0.45 + 0.75 * grain;

        // Boat frame: x ahead, y to port
        vec2 side = vec2(-uBow.y, uBow.x);
        float ahead = dot(p, uBow);
        float lat = dot(p, side);
        float behind = -ahead - uHull.x * 0.6;
        float arms = 0.0;
        if (behind > 0.0) {
            float off = abs(abs(lat) - uHull.y * 0.7 - behind * 0.354);
            float w = 0.2 + behind * 0.02;
            arms = (1.0 - smoothstep(0.0, w, off)) * exp(-behind / (10.0 + uSpeed * 5.0));
            // Broken, lacy foam rather than a painted line
            arms *= smoothstep(0.42, 0.75, fbm(vSea * 2.4 - vec2(uTime * 0.3))) * 0.7;
        }
        // Bow wave and the water pushed along the topsides
        float e = length(vec2(ahead / uHull.x, lat / uHull.y));
        float hug = smoothstep(1.45, 1.0, e) * smoothstep(0.92, 1.05, e) * (0.35 + 0.65 * smoothstep(-0.6, 0.9, ahead / uHull.x));
        hug *= 0.5 + 0.7 * fbm(vSea * 3.0 + vec2(uTime * 0.5));
        return clamp((band + arms + hug * 0.9) * moving, 0.0, 1.0);
    }

    void main() {
        // Seen through the water: only the hull's underwater part gets this pass
        vec2 bowP = vec2(dot(vPos.xy, uBow), dot(vPos.xy, vec2(-uBow.y, uBow.x)));
        float inHull = length(bowP / uHull);
        if (uOcclude > 0.5 && inHull > 1.02) discard;

        // Short wind waves and ripples, in the normal only, faded with distance
        float detail = (1.0 - smoothstep(30.0, 260.0, vDist)) * (0.5 + 0.5 * uWind);
        vec2 grad = vec2(0.0);
        for (int i = 0; i < RIPPLES; i++) {
            float fi = float(i);
            float ang = uDir + (hash(vec2(fi, 3.7)) - 0.5) * 2.2;
            vec2 d = vec2(sin(ang), cos(ang));
            float L = uWaveLength * (0.22 - fi * 0.028);
            float k = 6.2831853 / L;
            float f = k * (dot(d, vSea) - sqrt(9.81 * ${BOAT_SCALE.toFixed(2)} / k) * uTime) + fi * 1.9;
            grad += d * cos(f) * 0.07;
        }
        // Capillary texture: soft noise drifting downwind (wide finite
        // differences, so no value-noise cells show in the sun glitter),
        // faded out before it would alias into stripes
        vec2 drift = vec2(sin(uDir), cos(uDir)) * uTime * 0.6;
        mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
        vec2 q = rot * (vSea * 0.7) - drift;
        float e1 = fbm(q);
        float e2 = fbm(q + vec2(0.35, 0.0));
        float e3 = fbm(q + vec2(0.0, 0.35));
        grad += vec2(e2 - e1, e3 - e1) * 0.45 * (0.3 + 0.7 * uWind) * (1.0 - smoothstep(15.0, 90.0, vDist));
        vec3 n = normalize(vNormalW - vec3(grad * detail, 0.0));

        vec3 v = normalize(uCam - vPos);
        float ndv = max(dot(n, v), 0.0);
        float fresnel = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
        vec3 r = reflect(-v, n);
        r.z = abs(r.z);
        vec3 refl = skyColor(r);

        // Water body: deep colour, light scattered through the crests (more
        // when looking towards the sun), slopes facing the sky a little lighter
        float h = clamp(vHeight * 0.5 + 0.5, 0.0, 1.0);
        vec2 look = normalize(-v.xy + 1e-5);
        vec2 sunH = normalize(uSunDir.xy + 1e-5);
        float towardSun = pow(clamp(dot(look, sunH) * 0.5 + 0.5, 0.0, 1.0), 3.0);
        float sss = h * h * (0.45 + 0.75 * towardSun) * (0.35 + 0.65 * uSunI);
        vec3 body = mix(uDeep, uScatter, clamp(sss, 0.0, 1.0));
        float diffuse = max(dot(n, uSunDir), 0.0);
        body *= 0.78 + 0.22 * n.z + 0.18 * diffuse * uSunI;
        vec3 color = mix(body, refl, fresnel);

        // Sun glitter: a sharp core and a broad sheen
        vec3 hv = normalize(uSunDir + v);
        float nh = max(dot(n, hv), 0.0);
        float spec = pow(nh, 500.0) * 2.2 + pow(nh, 70.0) * 0.18;
        color += uSunI * step(0.0, uSunDir.z) * spec * vec3(1.0, 0.95, 0.86);

        // White water: breaking crests from the wind, foam patches, our wake
        float grain = fbm(vSea * 0.55 + vec2(uTime * 0.05, 0.0));
        float streak = fbm(vec2(dot(vSea, vec2(cos(uDir), -sin(uDir))) * 0.35, dot(vSea, vec2(sin(uDir), cos(uDir))) * 0.06));
        float crest = smoothstep(0.82, 0.38, vJacobian) * smoothstep(-0.1, 0.6, vHeight);
        float caps = crest * smoothstep(0.35, 0.8, grain + crest * 0.45) * uWind;
        caps += smoothstep(0.66, 0.9, streak) * 0.18 * uWind * uWind * (1.0 - smoothstep(60.0, 250.0, vDist));
        float foam = clamp(caps * (1.0 - smoothstep(300.0, 900.0, vDist)) + wakeFoam(vPos.xy), 0.0, 1.0);
        vec3 foamLit = uFoamColor * (0.82 + 0.18 * diffuse * uSunI);
        color = mix(color, foamLit, foam);

        // Aerial perspective: the sea dissolves into the horizon haze
        float fog = 1.0 - exp(-pow(vDist * uFog, 1.4));
        vec3 haze = skyColor(normalize(vec3(normalize(vPos.xy - uCam.xy + 1e-4), 0.02)));
        color = mix(color, haze, clamp(fog, 0.0, 1.0));

        gl_FragColor = vec4(color, uOcclude > 0.5 ? 0.72 : 1.0);
        #include <colorspace_fragment>
    }
`;

const skyVertex = `
    varying vec3 vDir;
    void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const skyFragment = `
    ${skyFunction}
    uniform vec3 uDeep;
    varying vec3 vDir;
    void main() {
        // World is y up; the shared sky function is z up
        vec3 d = normalize(vec3(vDir.x, -vDir.z, vDir.y));
        vec3 color = skyColor(d);
        // Below the horizon (seen only past the sea's edge): the sea's own tone
        color = mix(color, mix(uHorizon, uDeep, 0.35), smoothstep(0.0, -0.06, d.z));
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
    }
`;

const _cam = new THREE.Vector3();

/**
 * Sun from the boat's position and clock: direction in the north-up frame
 * (east, north, up) and an intensity, 0 at night to 1 by day. For the
 * lighting it never quite reaches the horizon.
 */
export const useSun = () => {
    const position = useSignalKPaths(['navigation.position'])['navigation.position'];
    const [sun, setSun] = useState(() => ({ dir: new THREE.Vector3(0.3, 0.6, 0.5).normalize(), intensity: 1 }));
    useEffect(() => {
        const update = () => {
            const p = sunPosition(position?.latitude, position?.longitude, vesselNow());
            const elevation = p ? p.elevation : 35;
            const azimuth = (p ? p.azimuth : 200) * Math.PI / 180;
            const e = Math.max(elevation, 4) * Math.PI / 180;
            setSun({
                dir: new THREE.Vector3(Math.sin(azimuth) * Math.cos(e), Math.cos(azimuth) * Math.cos(e), Math.sin(e)).normalize(),
                intensity: THREE.MathUtils.smoothstep(elevation, -6, 6),
            });
        };
        update();
        const id = setInterval(update, 60000);
        return () => clearInterval(id);
    }, [position?.latitude, position?.longitude]);
    return sun;
};

/**
 * Clean gradient sky with the sun where it really is: zenith to a pale haze
 * at the horizon, no clouds (FSD look). Shared by every ocean mode.
 */
export const SkyDome = () => {
    const { scene } = useTheme();
    const { heading } = useOwnTrack();
    const sun = useSun();
    const uniforms = useMemo(() => ({
        uZenith: { value: new THREE.Color() },
        uHorizon: { value: new THREE.Color() },
        uDeep: { value: new THREE.Color() },
        uSunDir: { value: new THREE.Vector3() },
        uSunI: { value: 1 },
    }), []);
    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms,
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
    }), [uniforms]);
    useEffect(() => {
        uniforms.uZenith.value.set(scene.skyZenith);
        uniforms.uHorizon.value.set(scene.skyHorizon);
        uniforms.uDeep.value.set(scene.sea);
    }, [uniforms, scene]);
    useFrame(() => {
        // North-up (east, north, up) to the sky's frame: the scene is boat-up,
        // turned by the heading; the sky shader's frame is (x, -z, y) of the world
        const { x: e, y: n, z: u } = sun.dir;
        const c = Math.cos(heading);
        const s = Math.sin(heading);
        const wx = e * c - n * s;
        const wz = -e * s - n * c;
        uniforms.uSunDir.value.set(wx, -wz, u).normalize();
        uniforms.uSunI.value = sun.intensity * (scene.background === '#000000' ? 0.06 : 1); // eslint-disable-line react-hooks/immutability
    });
    useEffect(() => () => material.dispose(), [material]);
    return (
        <mesh material={material} renderOrder={-3} frustumCulled={false}>
            <sphereGeometry args={[SKY_RADIUS, 48, 24]} />
        </mesh>
    );
};

/**
 * Ocean for the "water" mode: a realistic sea in a clean FSD treatment. The
 * waves come from the true wind (height, length and direction of a developed
 * wind sea, plus a swell), the water reflects the sky and the sun where it
 * really is, light shines through the crests, whitecaps appear with the wind,
 * and our own wake follows the track actually sailed. One pass for the sea
 * and a small one for the hull's waterline: light enough for a Raspberry Pi.
 */
const FsdOcean = ({ y = -0.3 }) => {
    const { scene } = useTheme();
    const { heading, offset } = useOwnTrack();
    const v = useSignalKPaths(PATHS);
    const tws = v['environment.wind.speedTrue'];
    const twd = v['environment.wind.directionTrue'];
    const speed = v['navigation.speedThroughWater'] ?? v['navigation.speedOverGround'];
    const sun = useSun();
    const seaRef = useRef();
    const trail = useRef([]);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uAmp: { value: 0.3 },
        uDir: { value: 0 },
        uWaveLength: { value: 15 },
        uChop: { value: 0.6 },
        uOffset: { value: new THREE.Vector2() },
        uCam: { value: new THREE.Vector3() },
        uSunDir: { value: new THREE.Vector3(0.3, 0.6, 0.5).normalize() },
        uSunI: { value: 1 },
        uZenith: { value: new THREE.Color() },
        uHorizon: { value: new THREE.Color() },
        uDeep: { value: new THREE.Color() },
        uScatter: { value: new THREE.Color() },
        uFoamColor: { value: new THREE.Color() },
        uWind: { value: 0.3 },
        uFog: { value: 1 / 2600 },
        uTrail: { value: Array.from({ length: TRAIL }, () => new THREE.Vector4(0, 0, -1, 0)) },
        uTrailReach: { value: 0 },
        uBow: { value: new THREE.Vector2(0, 1) },
        uSpeed: { value: 0 },
        uHull: { value: new THREE.Vector2(...HULL) },
        uOcclude: { value: 0 },
    }), []);

    const defines = useMemo(() => shaderDefines(getRenderProfile().id === 'pi'), []);

    const seaMaterial = useMemo(() => new THREE.ShaderMaterial({
        uniforms,
        defines,
        vertexShader: seaVertex,
        fragmentShader: seaFragment,
        // Drawn first: the HUD (compass, laylines, wake ribbons) stays on top
        depthWrite: false,
    }), [uniforms, defines]);

    // Second pass over the hull footprint only, after the boat: the hull
    // below the waterline is seen through the water
    const waterlineMaterial = useMemo(() => new THREE.ShaderMaterial({
        uniforms: { ...uniforms, uOcclude: { value: 1 } },
        defines,
        vertexShader: seaVertex,
        fragmentShader: seaFragment,
        transparent: true,
        depthWrite: false,
    }), [uniforms, defines]);

    // A dark theme dims the light to a moon's: no bright glitter on a night sea
    const lightScale = scene.background === '#000000' ? 0.06 : 1;
    useEffect(() => {
        uniforms.uDeep.value.set(scene.sea);
        uniforms.uScatter.value.set(scene.seaScatter);
        uniforms.uFoamColor.value.set(scene.seaFoam);
        uniforms.uZenith.value.set(scene.skyZenith);
        uniforms.uHorizon.value.set(scene.skyHorizon);
    }, [uniforms, scene]);

    // Sea state from the true wind. Coastal waters rarely see a fully
    // developed sea (Hs ≈ 0.21·U²/g): the fetch keeps waves shorter and
    // steeper, so cap the wavelength (≈ 0.5·U², 6 – 55 m) and the height
    // (2.5 m). Whitecaps from ~4 m/s.
    useEffect(() => {
        const u = Number.isFinite(tws) ? tws : 4;
        const hs = Math.min(0.21 * u * u / 9.81, 2.5);
        uniforms.uAmp.value = Math.max(0.15, hs) * BOAT_SCALE;
        uniforms.uChop.value = 0.4 + 0.5 * THREE.MathUtils.smoothstep(u, 3, 13);
        uniforms.uWaveLength.value = Math.min(55, Math.max(6, 0.5 * u * u)) * BOAT_SCALE;
        uniforms.uWind.value = THREE.MathUtils.smoothstep(u, 3.5, 13);
        // Waves travel downwind; the plane is in the north-up layer (+Y north)
        uniforms.uDir.value = Number.isFinite(twd) ? twd + Math.PI : Math.PI;
    }, [uniforms, tws, twd]);

    // Position between fixes: the GPS gives one a second, the waves must
    // not jump with it. Dead-reckon at our speed and heading, easing onto
    // each new fix.
    const fix = useRef({ x: 0, y: 0, at: 0, init: false });
    const smooth = useRef({ x: 0, y: 0 });
    useEffect(() => {
        fix.current = { x: offset.x * BOAT_SCALE, y: offset.y * BOAT_SCALE, at: performance.now() / 1000, init: true };
    }, [offset]);

    useFrame((state, delta) => {
        const mesh = seaRef.current;
        if (!mesh) return;
        const dt = Math.min(delta, 0.1);
        uniforms.uTime.value += dt;

        const ms = Number.isFinite(speed) ? speed : 0;
        const vx = Math.sin(heading) * ms * BOAT_SCALE;
        const vy = Math.cos(heading) * ms * BOAT_SCALE;
        const f = fix.current;
        const sm = smooth.current;
        if (f.init) {
            const since = Math.min(3, performance.now() / 1000 - f.at);
            const tx = f.x + vx * since;
            const ty = f.y + vy * since;
            if (Math.hypot(tx - sm.x, ty - sm.y) > 40) { sm.x = tx; sm.y = ty; }
            sm.x += vx * dt + (tx - sm.x - vx * dt) * Math.min(1, dt * 3);
            sm.y += vy * dt + (ty - sm.y - vy * dt) * Math.min(1, dt * 3);
        }
        uniforms.uOffset.value.set(sm.x, sm.y);

        // Camera in the sea's frame (east, north, up), for reflections
        mesh.updateWorldMatrix(true, false);
        uniforms.uCam.value.copy(mesh.worldToLocal(_cam.copy(state.camera.position)));
        uniforms.uSunDir.value.copy(sun.dir);
        uniforms.uSunI.value = sun.intensity * lightScale;

        // Wake: our track in the sea's frame (newest first), ages in seconds
        const now = state.clock.elapsedTime;
        const pts = trail.current;
        const last = pts[0];
        if (last && Math.hypot(sm.x - last.x, sm.y - last.y) > 60) pts.length = 0; // new fix far away
        if (!pts[0] || Math.hypot(sm.x - pts[0].x, sm.y - pts[0].y) > TRAIL_STEP) {
            pts.unshift({ x: sm.x, y: sm.y, t: now });
            if (pts.length > TRAIL + 4) pts.length = TRAIL + 4;
        }
        uniforms.uSpeed.value = ms;
        uniforms.uBow.value.set(Math.sin(heading), Math.cos(heading));
        // From the stern aft: track points still under the hull are skipped
        const stern = HULL[0] * 0.85;
        const out = uniforms.uTrail.value;
        out[0].set(-Math.sin(heading) * stern, -Math.cos(heading) * stern, 0, 0);
        let n = 1;
        let reach = stern;
        for (const p of pts) {
            if (n >= TRAIL) break;
            const x = p.x - sm.x;
            const y = p.y - sm.y;
            if (Math.hypot(x, y) <= stern + 0.5) continue;
            out[n++].set(x, y, now - p.t, 0);
            reach = Math.max(reach, Math.hypot(x, y));
        }
        for (; n < TRAIL; n++) out[n].set(0, 0, -1, 0);
        uniforms.uTrailReach.value = reach + 60;
    });

    useEffect(() => () => {
        seaMaterial.dispose();
        waterlineMaterial.dispose();
    }, [seaMaterial, waterlineMaterial]);

    // Dense near the boat, coarse towards the horizon: a grid whose spacing
    // grows with distance (x' = R·(0.05·u + 0.95·u³))
    const grid = useMemo(() => {
        const g = new THREE.PlaneGeometry(2, 2, SEGMENTS, SEGMENTS);
        const p = g.attributes.position;
        const warp = (u) => RADIUS * (0.05 * u + 0.95 * u * u * u);
        for (let i = 0; i < p.count; i++) p.setXY(i, warp(p.getX(i)), warp(p.getY(i)));
        return g;
    }, []);
    // Just the hull's footprint for the waterline pass
    const hullGrid = useMemo(() => new THREE.PlaneGeometry(HULL[0] * 2.4, HULL[0] * 2.4, 48, 48), []);
    useEffect(() => () => { grid.dispose(); hullGrid.dispose(); }, [grid, hullGrid]);

    return (
        <>
            <SkyDome />
            <group rotation={[0, heading, 0]} position={[0, y, 0]}>
                <mesh ref={seaRef} rotation={[-Math.PI / 2, 0, 0]} geometry={grid} material={seaMaterial} renderOrder={-1} frustumCulled={false} />
                <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={hullGrid} material={waterlineMaterial} renderOrder={10} frustumCulled={false} />
            </group>
        </>
    );
};

export default FsdOcean;
