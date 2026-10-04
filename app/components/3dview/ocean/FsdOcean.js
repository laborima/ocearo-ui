import React, { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useTheme from '../../theme/useTheme';
import configService from '../../settings/ConfigService';
import { useSignalKPaths } from '../../hooks/useSignalK';
import useOwnTrack from '../fsd/useOwnTrack';

// Scene units per metre, shared with the AIS layer
const sceneScale = () => configService.get('aisLengthScalingFactor') || 0.7;
const RADIUS = 2400;
const SEGMENTS = 300;
const SKY_RADIUS = 3800;

const PATHS = ['environment.wind.speedTrue', 'environment.wind.directionTrue'];

// Wave field: Gerstner trains spread around the downwind direction, a long
// swell and shorter wind waves, with sharp crests and round troughs, displaced
// on the GPU and anchored to the sea (uOffset = our position) so they stream
// past the hull. Normals are analytic; shading mixes in a little of the
// triangle's own slope for the FSD faceted look.
const seaVertex = `
    uniform float uTime;
    uniform float uAmp;
    uniform float uDir;
    uniform vec2 uOffset;
    uniform float uWaveLength;
    uniform float uChop;
    varying vec3 vWorld;
    varying vec3 vNormal2;
    varying float vHeight;
    varying float vCrest;
    varying float vDist;

    // One Gerstner train: adds displacement and the partial derivatives
    void gerstner(vec2 p, float angle, float lengthFactor, float ampFactor, float steep, float phase,
                  inout vec3 disp, inout vec3 tangent, inout vec3 binormal) {
        vec2 d = vec2(sin(angle), cos(angle));
        float L = uWaveLength * lengthFactor;
        float k = 6.2831853 / L;
        float c = sqrt(9.81 / k);
        float a = uAmp * ampFactor;
        float f = k * (dot(d, p) - c * uTime) + phase;
        float q = steep * uChop / (k * a * 5.0 + 1e-4);
        q = min(q, 1.0 / (k * a * 5.0 + 1e-4));
        float qa = q * a;
        disp.x += d.x * qa * cos(f);
        disp.y += d.y * qa * cos(f);
        disp.z += a * sin(f);
        float wa = k * a;
        tangent += vec3(-q * d.x * d.x * wa * sin(f), -q * d.x * d.y * wa * sin(f), d.x * wa * cos(f));
        binormal += vec3(-q * d.x * d.y * wa * sin(f), -q * d.y * d.y * wa * sin(f), d.y * wa * cos(f));
    }

    void main() {
        vec2 local = position.xy;
        vec2 world = local + uOffset;
        float dist = length(local);
        // Calmer far away: a clean horizon, facets readable near the boat
        float fade = 1.0 - smoothstep(700.0, 2000.0, dist);
        vec3 disp = vec3(0.0);
        vec3 t = vec3(1.0, 0.0, 0.0);
        vec3 b = vec3(0.0, 1.0, 0.0);
        gerstner(world, uDir,         1.00, 0.62, 1.0, 0.0, disp, t, b);
        gerstner(world, uDir + 0.35,  0.62, 0.28, 0.8, 1.7, disp, t, b);
        gerstner(world, uDir - 0.45,  0.47, 0.22, 0.8, 4.1, disp, t, b);
        gerstner(world, uDir + 0.9,   0.29, 0.12, 0.7, 2.3, disp, t, b);
        gerstner(world, uDir - 1.1,   0.21, 0.08, 0.7, 5.2, disp, t, b);
        gerstner(world, uDir + 0.15,  0.13, 0.05, 0.6, 0.9, disp, t, b);
        disp *= fade;
        vec3 n = normalize(cross(t, b));
        vNormal2 = normalize(mix(vec3(0.0, 0.0, 1.0), n, fade));
        vHeight = disp.z / max(uAmp, 1e-3);
        vCrest = fade * clamp(1.0 - n.z, 0.0, 1.0);
        vDist = dist;
        vec4 worldPos = modelMatrix * vec4(local + disp.xy, disp.z, 1.0);
        vWorld = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

const seaFragment = `
    uniform vec3 uSea;
    uniform vec3 uTrough;
    uniform vec3 uCrest;
    uniform vec3 uHorizon;
    uniform vec3 uSky;
    uniform vec3 uLight;
    uniform float uFoam;
    uniform float uFadeNear;
    uniform float uFadeFar;
    varying vec3 vWorld;
    varying vec3 vNormal2;
    varying float vHeight;
    varying float vCrest;
    varying float vDist;

    void main() {
        // Plane normal is local +Z: the mesh is laid flat by its parent, so
        // rebuild a world normal from the faceted slope and the smooth one
        vec3 flatN = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
        if (flatN.y < 0.0) flatN = -flatN;
        vec3 smoothN = normalize(vec3(vNormal2.x, vNormal2.z, -vNormal2.y));
        vec3 n = normalize(mix(smoothN, flatN, 0.5));
        vec3 view = normalize(cameraPosition - vWorld);
        vec3 l = normalize(uLight);
        float diffuse = clamp(dot(n, l), 0.0, 1.0);
        // Body: troughs darker, slopes facing the light brighter
        vec3 color = mix(uTrough, uSea, smoothstep(-1.0, 0.8, vHeight));
        color *= 0.42 + 0.78 * diffuse;
        // Sky reflection at grazing angles (Fresnel) and a soft sun glint
        float fresnel = pow(1.0 - clamp(dot(n, view), 0.0, 1.0), 4.0);
        color = mix(color, uSky, fresnel * 0.3);
        float spec = pow(clamp(dot(reflect(-l, n), view), 0.0, 1.0), 60.0);
        color += vec3(spec * 0.35);
        // White water on steep crests, more with the wind
        float foam = smoothstep(0.55, 0.95, vCrest * 1.4 + vHeight * 0.2) * uFoam * 0.8;
        color = mix(color, uCrest, foam);
        color = mix(color, uHorizon, smoothstep(uFadeNear, uFadeFar, vDist));
        gl_FragColor = vec4(color, 1.0);
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
    uniform vec3 uHorizon;
    uniform vec3 uZenith;
    uniform vec3 uSunDir;
    uniform float uSun;
    varying vec3 vDir;
    void main() {
        float up = clamp(vDir.y, 0.0, 1.0);
        vec3 color = mix(uHorizon, uZenith, pow(up, 0.55));
        // Soft diffuse glow towards the sun, no disc: a clean FSD sky
        float glow = pow(max(dot(normalize(vDir), normalize(uSunDir)), 0.0), 24.0) * uSun;
        color = mix(color, vec3(1.0), glow * 0.35);
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
    }
`;

/**
 * FSD-style ocean for the "water" mode: a faceted grey-blue sea whose waves
 * follow the true wind (height from the wind speed, trains travelling
 * downwind), light crests, dissolving into a pale gradient sky. One pass, no
 * reflection: far lighter than a mirror water on a Raspberry Pi.
 */
const FsdOcean = ({ y = -0.3 }) => {
    const { scene } = useTheme();
    const { heading, offset } = useOwnTrack();
    const v = useSignalKPaths(PATHS);
    const tws = v['environment.wind.speedTrue'];
    const twd = v['environment.wind.directionTrue'];

    const seaMaterial = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uAmp: { value: 0.4 },
            uDir: { value: 0 },
            uOffset: { value: new THREE.Vector2() },
            uWaveLength: { value: 30 },
            uChop: { value: 0.6 },
            uSky: { value: new THREE.Color() },
            uSea: { value: new THREE.Color() },
            uTrough: { value: new THREE.Color() },
            uCrest: { value: new THREE.Color() },
            uHorizon: { value: new THREE.Color() },
            // Low, raking light: slopes read clearly
            uLight: { value: new THREE.Vector3(0.7, 0.55, 0.25) },
            uFoam: { value: 0.3 },
            uFadeNear: { value: 500 },
            uFadeFar: { value: 2200 },
        },
        vertexShader: seaVertex,
        fragmentShader: seaFragment,
        // Keel and rudders stay visible below, drawn as seen through water
        depthWrite: false,
    }), []);

    const skyMaterial = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uHorizon: { value: new THREE.Color() },
            uZenith: { value: new THREE.Color() },
            uSunDir: { value: new THREE.Vector3(0.3, 0.5, -0.8) },
            uSun: { value: 1 },
        },
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
    }), []);

    useEffect(() => {
        seaMaterial.uniforms.uSea.value.set(scene.sea);
        seaMaterial.uniforms.uTrough.value.set(scene.seaTrough);
        seaMaterial.uniforms.uCrest.value.set(scene.seaCrest);
        seaMaterial.uniforms.uHorizon.value.set(scene.background);
        seaMaterial.uniforms.uSky.value.set(scene.skyZenith);
        skyMaterial.uniforms.uHorizon.value.set(scene.background);
        skyMaterial.uniforms.uZenith.value.set(scene.skyZenith);
        skyMaterial.uniforms.uSun.value = scene.background === '#000000' ? 0 : 1;
    }, [seaMaterial, skyMaterial, scene]);

    // Sea state from the true wind: fully developed sea Hs ≈ 0.21·U²/g
    // (capped), wavelength from the wind (L ≈ 0.6·U², 8–120 m), crests from 6 m/s
    useEffect(() => {
        const s = sceneScale();
        const u = Number.isFinite(tws) ? tws : 4;
        const hs = Math.min(0.21 * u * u / 9.81, 5);
        // Exaggerated x2 so the sea state reads from the cockpit view
        seaMaterial.uniforms.uAmp.value = Math.max(0.3, hs / 2) * 2.0 * s;
        seaMaterial.uniforms.uChop.value = 0.35 + 0.55 * THREE.MathUtils.smoothstep(u, 4, 14);
        seaMaterial.uniforms.uWaveLength.value = Math.min(90, Math.max(8, 0.45 * u * u)) * s;
        seaMaterial.uniforms.uFoam.value = THREE.MathUtils.smoothstep(u, 5, 14);
        // Waves travel downwind; the plane is in the north-up layer (+Y north)
        seaMaterial.uniforms.uDir.value = Number.isFinite(twd) ? twd + Math.PI : Math.PI;
    }, [seaMaterial, tws, twd]);

    useEffect(() => {
        const s = sceneScale();
        const wl = seaMaterial.uniforms.uWaveLength.value * 50;
        seaMaterial.uniforms.uOffset.value.set((offset.x * s) % wl, (offset.y * s) % wl);
    }, [seaMaterial, offset]);

    useFrame((_, delta) => {
        seaMaterial.uniforms.uTime.value += Math.min(delta, 0.1);
    });

    useEffect(() => () => { seaMaterial.dispose(); skyMaterial.dispose(); }, [seaMaterial, skyMaterial]);

    // Dense near the boat, coarse towards the horizon: a grid whose spacing
    // grows with distance (x' = R·(0.12·u + 0.88·u³))
    const grid = useMemo(() => {
        const g = new THREE.PlaneGeometry(2, 2, SEGMENTS, SEGMENTS);
        const p = g.attributes.position;
        const warp = (u) => RADIUS * (0.12 * u + 0.88 * u * u * u);
        for (let i = 0; i < p.count; i++) p.setXY(i, warp(p.getX(i)), warp(p.getY(i)));
        return g;
    }, []);
    useEffect(() => () => grid.dispose(), [grid]);

    return (
        <>
            <mesh material={skyMaterial} renderOrder={-2} frustumCulled={false}>
                <sphereGeometry args={[SKY_RADIUS, 32, 16]} />
            </mesh>
            <group rotation={[0, heading, 0]} position={[0, y, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={grid} material={seaMaterial} renderOrder={-1} frustumCulled={false} />
            </group>
        </>
    );
};

export default FsdOcean;
