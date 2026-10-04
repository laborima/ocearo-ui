import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';

const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// vUv.x across, vUv.y from `from` (0) to `to` (1)
const fragmentShader = `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uFadeFrom;
    uniform float uFadeTo;
    varying vec2 vUv;
    void main() {
        float across = abs(vUv.x - 0.5) * 2.0;
        float body = 1.0 - smoothstep(0.7, 1.0, across);
        float rim = smoothstep(0.82, 0.92, across) * (1.0 - smoothstep(0.92, 1.0, across));
        float fade = mix(1.0, smoothstep(0.0, 0.35, vUv.y), uFadeFrom)
                   * mix(1.0, 1.0 - smoothstep(0.6, 1.0, vUv.y), uFadeTo);
        gl_FragColor = vec4(uColor, (body * uOpacity + rim * uOpacity * 1.4) * fade);
    }
`;

/**
 * Flat translucent band on the water between two scene points (x/z), with
 * soft edges, brighter rims, and optional fades at either end.
 */
const Ribbon = ({ from, to, width = 2.4, color, opacity = 0.22, fadeFrom = false, fadeTo = false, y = 0 }) => {
    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    const length = Math.hypot(dx, dz);

    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uColor: { value: new THREE.Color() },
            uOpacity: { value: opacity },
            uFadeFrom: { value: 0 },
            uFadeTo: { value: 0 },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), []);

    useEffect(() => {
        material.uniforms.uColor.value.set(color);
        material.uniforms.uOpacity.value = opacity;
        material.uniforms.uFadeFrom.value = fadeFrom ? 1 : 0;
        material.uniforms.uFadeTo.value = fadeTo ? 1 : 0;
    }, [material, color, opacity, fadeFrom, fadeTo]);

    useEffect(() => () => material.dispose(), [material]);

    if (length < 0.01) return null;
    // Plane along local +Y, turned so that +Y points from `from` to `to`
    const angle = Math.atan2(dx, -dz);
    return (
        <group position={[(from[0] + to[0]) / 2, y, (from[1] + to[1]) / 2]} rotation={[0, -angle, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} material={material} renderOrder={1}>
                <planeGeometry args={[width, length]} />
            </mesh>
        </group>
    );
};

export default Ribbon;
