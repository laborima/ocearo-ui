import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import useTheme from '../../theme/useTheme';
import usePolarPerformance from '../../hooks/usePolarPerformance';
import configService from '../../settings/ConfigService';

const ASSET_PREFIX = process.env.ASSET_PREFIX || './';
const MODEL = `${ASSET_PREFIX}/boats/default/assets/scene-transformed.glb`;

// Exponential window: the ghost shows the distance lost or gained over about
// the last minute, so it drifts back alongside once the speed recovers
const WINDOW_S = 60;
const MAX_LEAD = 70; // scene units (~100 m)

/**
 * Ghost boat sailing at the polar speed. Its lead is the distance a boat at
 * the polar would have gained on us over the last minute: ahead means we are
 * under the polar, astern means we beat it.
 */
const GhostBoat = ({ scale = 0.7 }) => {
    const { scene } = useTheme();
    const { polarSpeed, boatSpeed } = usePolarPerformance();
    const { nodes } = useGLTF(MODEL, `${ASSET_PREFIX}/draco/`);
    const groupRef = useRef();
    const leadRef = useRef(0);
    const speedsRef = useRef({ polarSpeed, boatSpeed });
    const sceneScale = configService.get('aisLengthScalingFactor') || 0.7;

    useEffect(() => { speedsRef.current = { polarSpeed, boatSpeed }; }, [polarSpeed, boatSpeed]);

    const material = useMemo(() => new THREE.MeshLambertMaterial({
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
    }), []);
    useEffect(() => { material.color.set(scene.ghost); }, [material, scene]);
    useEffect(() => () => material.dispose(), [material]);

    useFrame((_, delta) => {
        const { polarSpeed: vp, boatSpeed: v } = speedsRef.current;
        const dt = Math.min(delta, 0.5);
        const decay = Math.exp(-dt / WINDOW_S);
        const gain = Number.isFinite(vp) && Number.isFinite(v) ? (vp - v) * dt * sceneScale : 0;
        leadRef.current = THREE.MathUtils.clamp(leadRef.current * decay + gain, -MAX_LEAD, MAX_LEAD);
        if (groupRef.current) {
            groupRef.current.position.z = -leadRef.current;
            // Hide when it would sit inside our own hull
            groupRef.current.visible = Math.abs(leadRef.current) > 2;
        }
    });

    if (!Number.isFinite(polarSpeed)) return null;

    // Hull, deck, keel and mast of the default model: enough to read as a boat
    const parts = [
        ['govde_fiberglass_0', [0, 0.32, -0.897], [0, Math.PI / 2, 0], [5.11, 0.454, 1.212]],
        ['govde_fiberglass2_0', [0, 0.32, -0.897], [0, Math.PI / 2, 0], [5.11, 0.454, 1.212]],
        ['ustgovde_fiberglass_0', [0, 0.832, -2.741], [-Math.PI / 2, 0, 0], [0.566, 0.7, 1.212]],
        ['salma_fiberglass_0', [0, -1.953, -0.739], [0, 0, 0], [0.149, 0.108, 0.756]],
        ['direk_fiberglass_0', [0, 4.315, -1.056], [Math.PI / 2, 0, Math.PI], [-0.113, 0.113, 5.203]],
    ];

    return (
        <group ref={groupRef} scale={[scale, scale, scale]} visible={false}>
            {parts.map(([name, position, rotation, s]) => nodes[name] && (
                <mesh key={name} geometry={nodes[name].geometry} material={material}
                    position={position} rotation={rotation} scale={s} renderOrder={2} />
            ))}
        </group>
    );
};

export default GhostBoat;
