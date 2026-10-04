import React, { useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useTheme from '../../theme/useTheme';
import configService from '../../settings/ConfigService';
import { useSignalKPaths } from '../../hooks/useSignalK';
import useOwnTrack from './useOwnTrack';

const PATHS = [
    'navigation.courseGreatCircle.nextPoint.bearingTrue',
    'navigation.courseGreatCircle.nextPoint.distance',
    'navigation.courseRhumbline.nextPoint.bearingTrue',
    'navigation.courseRhumbline.nextPoint.distance',
];

const WIDTH = 3.2;           // scene units, about a hull's beam
const MAX_LENGTH = 1600;     // beyond this the fog hides it anyway
const CHEVRON_ZONE = 45;     // chevrons only near the bow, like FSD

const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// vUv.x across the ribbon (0..1), vUv.y along it (0 at the boat, 1 at the end)
const fragmentShader = `
    uniform vec3 uColor;
    uniform vec3 uGlow;
    uniform float uLength;
    uniform float uTime;
    uniform float uChevronZone;
    varying vec2 vUv;

    void main() {
        float along = vUv.y * uLength;
        float across = abs(vUv.x - 0.5) * 2.0;

        // Soft edges and a fade towards the far end
        float edge = 1.0 - smoothstep(0.75, 1.0, across);
        float farFade = 1.0 - smoothstep(0.55, 1.0, vUv.y);
        float alpha = 0.32 * edge * farFade;

        // Chevrons streaming forward near the bow
        float chevronCoord = along * 0.35 - across * 1.2 - uTime * 1.6;
        float chevron = smoothstep(0.55, 0.62, fract(chevronCoord)) * (1.0 - smoothstep(0.82, 0.9, fract(chevronCoord)));
        float zone = 1.0 - smoothstep(uChevronZone * 0.6, uChevronZone, along);
        vec3 color = mix(uColor, uGlow, chevron * zone);
        alpha += chevron * zone * 0.45 * edge;

        // Bright rim lines along both edges
        alpha += smoothstep(0.86, 0.94, across) * (1.0 - smoothstep(0.94, 1.0, across)) * 0.35 * farFade;

        gl_FragColor = vec4(color, alpha);
    }
`;

/**
 * Planned route to the next waypoint as a translucent ribbon laid on the water,
 * with animated chevrons near the bow (Tesla FSD path). Uses the Course API
 * values the server derives (bearing / distance to the next point).
 */
const RouteRibbon = ({ y = -0.2 }) => {
    const { scene } = useTheme();
    const { heading } = useOwnTrack();
    const values = useSignalKPaths(PATHS);

    const bearing = values['navigation.courseGreatCircle.nextPoint.bearingTrue']
        ?? values['navigation.courseRhumbline.nextPoint.bearingTrue'];
    const distance = values['navigation.courseGreatCircle.nextPoint.distance']
        ?? values['navigation.courseRhumbline.nextPoint.distance'];

    const scale = configService.get('aisLengthScalingFactor') || 0.7;
    const length = Number.isFinite(distance) ? Math.min(distance * scale, MAX_LENGTH) : 0;
    const reachesWaypoint = Number.isFinite(distance) && distance * scale <= MAX_LENGTH;

    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uColor: { value: new THREE.Color() },
            uGlow: { value: new THREE.Color() },
            uLength: { value: 1 },
            uTime: { value: 0 },
            uChevronZone: { value: CHEVRON_ZONE },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
    }), []);

    useEffect(() => {
        material.uniforms.uColor.value.set(scene.route);
        material.uniforms.uGlow.value.set(scene.routeGlow);
    }, [material, scene]);

    useEffect(() => {
        material.uniforms.uLength.value = Math.max(length, 1);
    }, [material, length]);

    useEffect(() => () => material.dispose(), [material]);

    useFrame((_, delta) => {
        material.uniforms.uTime.value += delta;
    });

    if (!Number.isFinite(bearing) || length < 1) return null;

    return (
        // North-up layer turned into the boat frame, then turned to the bearing
        <group rotation={[0, heading, 0]} position={[0, y, 0]}>
            <group rotation={[0, -bearing, 0]}>
                {/* Plane centred on the ribbon, starting at the bow, towards -Z */}
                <mesh position={[0, 0, -length / 2]} rotation={[-Math.PI / 2, 0, 0]} material={material} renderOrder={1}>
                    <planeGeometry args={[WIDTH, length, 1, 1]} />
                </mesh>
                {reachesWaypoint && (
                    <group position={[0, 0, -length]}>
                        <mesh position={[0, 4, 0]}>
                            <cylinderGeometry args={[0.12, 0.12, 8, 8]} />
                            <meshBasicMaterial color={scene.route} />
                        </mesh>
                        <mesh position={[0, 8.6, 0]}>
                            <sphereGeometry args={[0.9, 16, 16]} />
                            <meshBasicMaterial color={scene.route} />
                        </mesh>
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                            <ringGeometry args={[2.4, 3.2, 40]} />
                            <meshBasicMaterial color={scene.route} transparent opacity={0.7} depthWrite={false} />
                        </mesh>
                    </group>
                )}
            </group>
        </group>
    );
};

export default RouteRibbon;
