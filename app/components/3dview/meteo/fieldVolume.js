import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { sampleWind, HALF_EXTENT_M } from './windField';

/**
 * Shared pieces of the volume layers (the water column coloured by the
 * current, the air coloured by the wind): the flow field as a small texture
 * and the GLSL noise that makes the medium drift with it.
 *
 * Instead of streaks, the medium itself carries the information: its colour
 * is the speed on a colour map, its density grows with the speed (slack
 * water and calm air stay clear), and soft wisps of turbidity drift along
 * the flow, so the direction reads from the motion.
 */

// Texture texels per side; the field is smooth (bilinear between 9×9 nodes)
const TEX = 64;
// Velocities stored in two bytes, ±FIELD_RANGE m/s
export const FIELD_RANGE = 40;

/**
 * Field (u, v) at the forecast `hour` as an RG texture over the field's
 * extent: R, G = 0.5 + u / (2 range), 0.5 + v / (2 range). `range` in m/s.
 */
export const useFieldTexture = (field, hour, range = FIELD_RANGE) => {
    const texture = useMemo(() => {
        const t = new THREE.DataTexture(new Uint8Array(TEX * TEX * 4), TEX, TEX, THREE.RGBAFormat);
        t.magFilter = THREE.LinearFilter;
        t.minFilter = THREE.LinearFilter;
        t.wrapS = THREE.ClampToEdgeWrapping;
        t.wrapT = THREE.ClampToEdgeWrapping;
        return t;
    }, []);
    useEffect(() => {
        if (!field) return;
        const data = texture.image.data;
        const half = field.half ?? HALF_EXTENT_M;
        for (let j = 0; j < TEX; j++) {
            for (let i = 0; i < TEX; i++) {
                const w = sampleWind(field, (i / (TEX - 1) * 2 - 1) * half, (j / (TEX - 1) * 2 - 1) * half, hour);
                const k = (j * TEX + i) * 4;
                data[k] = Math.round(255 * Math.min(1, Math.max(0, 0.5 + w.u / (2 * range))));
                data[k + 1] = Math.round(255 * Math.min(1, Math.max(0, 0.5 + w.v / (2 * range))));
                data[k + 2] = 0;
                data[k + 3] = 255;
            }
        }
        texture.needsUpdate = true; // eslint-disable-line react-hooks/immutability
    }, [texture, field, hour, range]);
    useEffect(() => () => texture.dispose(), [texture]);
    return texture;
};

/** Value noise and fractal noise in 3D (cheap: no texture lookups) */
export const NOISE_GLSL = `
    float hash13(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.zyx + 31.32);
        return fract((p.x + p.y) * p.z);
    }
    float vnoise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x),
                       mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
                   mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x),
                       mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
    }
    float fbm(vec3 p) {
        return 0.6 * vnoise(p) + 0.3 * vnoise(p * 2.03 + 17.0) + 0.1 * vnoise(p * 4.1 + 41.0);
    }
`;

/** Field at a point (metres from the field origin): u, v in m/s */
export const FIELD_GLSL = `
    uniform sampler2D uField;
    uniform float uFieldHalf;
    uniform float uFieldRange;
    vec2 flowAt(vec2 g) {
        vec2 t = g / (2.0 * uFieldHalf) + 0.5;
        return (texture2D(uField, t).rg - 0.5) * 2.0 * uFieldRange;
    }
    // 1 inside the field, fading to 0 over its outer tenth
    float fieldMask(vec2 g) {
        vec2 a = abs(g) / uFieldHalf;
        return 1.0 - smoothstep(0.85, 1.0, max(a.x, a.y));
    }
`;
