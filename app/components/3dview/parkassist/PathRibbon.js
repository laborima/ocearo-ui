import React, { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
    attribute float aAlong;
    varying vec2 vUv;
    varying float vAlong;
    void main() {
        vUv = uv;
        vAlong = aAlong;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// vUv.x across (0..1), vAlong = metres from the start, vUv.y = 0..1 along
const fragmentShader = `
    uniform vec3 uColor;
    uniform vec3 uGlow;
    uniform float uTime;
    uniform float uOpacity;
    varying vec2 vUv;
    varying float vAlong;
    void main() {
        float across = abs(vUv.x - 0.5) * 2.0;
        float edge = 1.0 - smoothstep(0.8, 1.0, across);
        float rim = smoothstep(0.84, 0.92, across) * (1.0 - smoothstep(0.92, 1.0, across));
        float fade = 1.0 - smoothstep(0.65, 1.0, vUv.y);
        // Chevrons pointing along the path, streaming forward
        float c = fract(vAlong * 0.45 + across * 0.9 - uTime * 0.9);
        float chevron = smoothstep(0.55, 0.62, c) * (1.0 - smoothstep(0.78, 0.86, c));
        vec3 color = mix(uColor, uGlow, chevron);
        float alpha = (0.28 * edge + 0.5 * chevron * edge + 0.45 * rim) * fade * uOpacity;
        gl_FragColor = vec4(color, alpha);
    }
`;

/**
 * Flat curved band along a list of [x, z] points (scene units), Tesla-style
 * blue path with chevrons moving in the direction of travel.
 */
const PathRibbon = ({ points, width = 2, color, glow, y = 0.05, opacity = 1 }) => {
    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uColor: { value: new THREE.Color() },
            uGlow: { value: new THREE.Color() },
            uTime: { value: 0 },
            uOpacity: { value: 1 },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
    }), []);

    useEffect(() => {
        material.uniforms.uColor.value.set(color);
        material.uniforms.uGlow.value.set(glow || color);
        material.uniforms.uOpacity.value = opacity;
    }, [material, color, glow, opacity]);
    useEffect(() => () => material.dispose(), [material]);
    useFrame((_, delta) => { material.uniforms.uTime.value += delta; });

    const geometry = useMemo(() => {
        const n = points.length;
        const pos = new Float32Array(n * 2 * 3);
        const uv = new Float32Array(n * 2 * 2);
        const along = new Float32Array(n * 2);
        let dist = 0;
        const total = points.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) : 0), 0) || 1;
        for (let i = 0; i < n; i++) {
            const prev = points[Math.max(0, i - 1)];
            const next = points[Math.min(n - 1, i + 1)];
            let dx = next[0] - prev[0];
            let dz = next[1] - prev[1];
            const len = Math.hypot(dx, dz) || 1;
            dx /= len; dz /= len;
            if (i > 0) dist += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
            const nx = -dz * width / 2;
            const nz = dx * width / 2;
            pos.set([points[i][0] + nx, y, points[i][1] + nz, points[i][0] - nx, y, points[i][1] - nz], i * 6);
            uv.set([0, dist / total, 1, dist / total], i * 4);
            along.set([dist, dist], i * 2);
        }
        const index = [];
        for (let i = 0; i < n - 1; i++) {
            const a = i * 2;
            index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        geo.setAttribute('aAlong', new THREE.BufferAttribute(along, 1));
        geo.setIndex(index);
        return geo;
    }, [points, width, y]);
    useEffect(() => () => geometry.dispose(), [geometry]);

    if (points.length < 2) return null;
    return <mesh geometry={geometry} material={material} renderOrder={2} />;
};

export default PathRibbon;
