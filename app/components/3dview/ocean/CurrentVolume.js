import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import configService from '../../settings/ConfigService';
import { useSignalKPaths } from '../../hooks/useSignalK';
import { fetchCurrentField, uniformCurrent, setCurrentScale } from '../meteo/currentField';
import { getForecastHour, subscribeForecast } from '../meteo/forecastStore';
import { colorMapTexture } from '../meteo/colorMaps';
import { useFieldTexture, NOISE_GLSL, FIELD_GLSL } from '../meteo/fieldVolume';

const PATHS = ['navigation.position', 'environment.current'];
export const DEFAULT_CURRENT_MAP = 'speed';
const CURRENT_RANGE = 4; // m/s stored in the field texture

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
        float alpha = uOpacity * (1.0 - exp(-L / uDepthScale)) * streak;
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
 * colour. A soft pattern drifts with the stream to show where it goes.
 * Over the translucent chart, so the colours keep their strength.
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

    const meshRef = useRef();
    const cam = useMemo(() => new THREE.Vector3(), []);
    useFrame(({ camera, clock }) => {
        const mesh = meshRef.current;
        if (!mesh) return;
        mesh.updateWorldMatrix(true, false);
        material.uniforms.uCam.value.copy(mesh.worldToLocal(cam.copy(camera.position)));
        material.uniforms.uTime.value = clock.elapsedTime;
    });

    if (!field) return null;
    return <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} geometry={geometry} material={material} renderOrder={2} />;
};

export default CurrentVolume;
