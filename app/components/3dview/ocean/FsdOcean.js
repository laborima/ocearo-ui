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

// Wave field: a few trains around the downwind direction, displaced on the
// GPU and anchored to the sea (uOffset = our position), so they stream past
// the hull. Facets come from screen-space derivatives (flat shading).
const seaVertex = `
    uniform float uTime;
    uniform float uAmp;
    uniform float uDir;
    uniform vec2 uOffset;
    uniform float uWaveLength;
    varying vec3 vWorld;
    varying float vHeight;
    varying float vDist;

    float train(vec2 p, float angle, float lengthFactor, float speed, float phase) {
        vec2 d = vec2(sin(angle), cos(angle));
        float k = 6.2831853 / (uWaveLength * lengthFactor);
        return sin(dot(p, d) * k - uTime * speed * sqrt(9.81 * k) + phase);
    }

    void main() {
        vec2 local = position.xy;
        vec2 world = local + uOffset;
        float dist = length(local);
        // Calm down far away: keeps the horizon clean and the facets readable
        float fade = 1.0 - smoothstep(600.0, 1800.0, dist);
        float h = 0.55 * train(world, uDir, 1.0, 1.0, 0.0)
                + 0.28 * train(world, uDir + 0.45, 0.63, 1.0, 1.7)
                + 0.17 * train(world, uDir - 0.6, 0.41, 1.0, 4.1);
        float height = uAmp * fade * h;
        vHeight = h;
        vDist = dist;
        vec3 displaced = vec3(local, height);
        vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
        vWorld = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
`;

const seaFragment = `
    uniform vec3 uSea;
    uniform vec3 uTrough;
    uniform vec3 uCrest;
    uniform vec3 uHorizon;
    uniform vec3 uLight;
    uniform float uFoam;
    uniform float uFadeNear;
    uniform float uFadeFar;
    varying vec3 vWorld;
    varying float vHeight;
    varying float vDist;

    void main() {
        // Faceted normal from the triangle's own slope
        vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
        if (n.y < 0.0) n = -n;
        float diffuse = clamp(dot(n, normalize(uLight)), 0.0, 1.0);
        vec3 color = mix(uTrough, uSea, smoothstep(-0.9, 0.4, vHeight));
        color *= 0.62 + 0.5 * diffuse;
        // Light crests where the waves peak (more with wind)
        float crest = smoothstep(0.55, 0.95, vHeight) * uFoam;
        color = mix(color, uCrest, crest);
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
            uSea: { value: new THREE.Color() },
            uTrough: { value: new THREE.Color() },
            uCrest: { value: new THREE.Color() },
            uHorizon: { value: new THREE.Color() },
            uLight: { value: new THREE.Vector3(0.4, 1.0, 0.3) },
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
        seaMaterial.uniforms.uAmp.value = Math.max(0.15, hs / 2) * s;
        seaMaterial.uniforms.uWaveLength.value = Math.min(120, Math.max(8, 0.6 * u * u)) * s;
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
