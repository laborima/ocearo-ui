import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import useTheme from '../../theme/useTheme';
import configService from '../../settings/ConfigService';
import useOwnTrack from './useOwnTrack';

// Scene units per metre, shared with the AIS layer
const sceneScale = () => configService.get('aisLengthScalingFactor') || 0.7;
// Ground grid spacing: a faint 50 m mesh gives a sense of speed without noise
const GRID_METERS = 50;
const RADIUS = 2400;

const vertexShader = `
    varying vec2 vLocal;
    void main() {
        vLocal = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// The plane lies in the north-up layer: local x = East, local y = North.
// Grid lines are anchored to the sea (uOffset = our position), so they
// stream past the hull like road markings in Tesla's view.
const fragmentShader = `
    uniform vec3 uGround;
    uniform vec3 uLine;
    uniform vec3 uBackground;
    uniform vec2 uOffset;
    uniform float uSpacing;
    uniform float uFadeNear;
    uniform float uFadeFar;
    varying vec2 vLocal;

    void main() {
        vec2 world = vLocal + uOffset;
        vec2 cell = abs(fract(world / uSpacing - 0.5) - 0.5) / fwidth(world / uSpacing);
        float line = 1.0 - min(min(cell.x, cell.y), 1.0);

        float dist = length(vLocal);
        float gridFade = 1.0 - smoothstep(uFadeNear * 0.4, uFadeNear, dist);
        vec3 color = mix(uGround, uLine, line * 0.4 * gridFade);
        color = mix(color, uBackground, smoothstep(uFadeNear, uFadeFar, dist));
        gl_FragColor = vec4(color, 1.0);
        // Uniform colours are linear: convert for the screen like built-in materials
        #include <colorspace_fragment>
    }
`;

/**
 * FSD-style ground for the minimal (no ocean) scene: a flat neutral plane
 * that dissolves into the background at the horizon, with a world-anchored
 * grid that moves with the boat.
 */
const SeaGround = ({ y = -0.32 }) => {
    const { scene } = useTheme();
    const { heading, offset } = useOwnTrack();

    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uGround: { value: new THREE.Color() },
            uLine: { value: new THREE.Color() },
            uBackground: { value: new THREE.Color() },
            uOffset: { value: new THREE.Vector2() },
            uSpacing: { value: GRID_METERS * sceneScale() },
            uFadeNear: { value: 220 },
            uFadeFar: { value: 1100 },
        },
        vertexShader,
        fragmentShader,
        // Keel and rudders stay visible below it, drawn as seen through water
        depthWrite: false,
    }), []);

    useEffect(() => {
        material.uniforms.uGround.value.set(scene.ground);
        material.uniforms.uLine.value.set(scene.grid);
        material.uniforms.uBackground.value.set(scene.background);
    }, [material, scene]);

    useEffect(() => {
        // Keep the offset small (modulo the grid) for float precision
        const spacing = material.uniforms.uSpacing.value;
        const s = sceneScale();
        material.uniforms.uOffset.value.set((offset.x * s) % spacing, (offset.y * s) % spacing);
    }, [material, offset]);

    useEffect(() => () => material.dispose(), [material]);

    return (
        <group rotation={[0, heading, 0]} position={[0, y, 0]}>
            {/* Plane in XY, laid flat: local +Y becomes scene -Z (north in the north-up layer) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} material={material} renderOrder={-1}>
                <circleGeometry args={[RADIUS, 64]} />
            </mesh>
        </group>
    );
};

export default SeaGround;
