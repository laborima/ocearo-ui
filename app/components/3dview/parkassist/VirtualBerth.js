import React, { useEffect, useMemo } from 'react';
import { Line } from '@react-three/drei';
import useTheme from '../../theme/useTheme';
import useOwnTrack from '../fsd/useOwnTrack';
import { useBerth, getBerth, placeVirtualBerth } from './parkingStore';

// Boat footprint (10.8 m cruiser-racer), metres
export const BOAT = { length: 10.8, beam: 3.9 };
const HALF_L = BOAT.length / 2;
const HALF_B = BOAT.beam / 2;

/** Boat outline (wide transom, pointed bow towards -Z) for the target footprint */
const footprint = () => {
    const shoulder = -HALF_L + 3.5;
    const pts = [[-HALF_B, HALF_L], [HALF_B, HALF_L], [HALF_B, shoulder]];
    // Starboard side curving into the stem, then back down the port side
    for (let i = 1; i <= 8; i++) {
        const t = i / 8;
        pts.push([HALF_B * (1 - t) ** 1.6, shoulder - (shoulder + HALF_L) * Math.sin(t * Math.PI / 2)]);
    }
    for (let i = 7; i >= 0; i--) {
        const t = i / 8;
        pts.push([-HALF_B * (1 - t) ** 1.6, shoulder - (shoulder + HALF_L) * Math.sin(t * Math.PI / 2)]);
    }
    pts.push([-HALF_B, HALF_L]);
    return pts.map(([x, z]) => [x, 0.06, z]);
};

/** Flat box on the water (pontoon, finger, neighbour) */
const Slab = ({ size, position, color, opacity = 1 }) => (
    <mesh position={position}>
        <boxGeometry args={size} />
        <meshLambertMaterial color={color} transparent={opacity < 1} opacity={opacity} />
    </mesh>
);

/** Flat arrow on the water pointing along local -Z */
const Arrow = ({ position, rotation = 0, color, length = 4 }) => (
    <group position={position} rotation={[0, rotation, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, length / 2 - 0.6]}>
            <planeGeometry args={[0.7, length - 1.2]} />
            <meshBasicMaterial color={color} transparent opacity={0.85} depthWrite={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, -0.6]}>
            <circleGeometry args={[1.2, 3, Math.PI / 2]} />
            <meshBasicMaterial color={color} transparent opacity={0.85} depthWrite={false} />
        </mesh>
    </group>
);

/**
 * Berth layout in its own frame (metres): origin = where our boat's centre
 * ends up, -Z = the direction the boat points once moored.
 */
const BerthLayout = ({ type, side, colors }) => {
    const outline = useMemo(() => footprint(), []);
    const sideSign = side === 'port' ? -1 : 1;
    const gap = 0.45;

    return (
        <group>
            {/* Where our boat must end up */}
            <Line points={outline} color={colors.target} lineWidth={2.5} dashed dashSize={0.8} gapSize={0.5} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0.3]}>
                <planeGeometry args={[BOAT.beam * 0.9, BOAT.length - 1.6]} />
                <meshBasicMaterial color={colors.target} transparent opacity={0.12} depthWrite={false} />
            </mesh>

            {(type === 'bow' || type === 'stern') && (() => {
                // Main pontoon across the bow (bow-in) or the stern (stern-in)
                const end = type === 'bow' ? -1 : 1;
                const pontoonZ = end * (HALF_L + gap + 1.1);
                return (
                    <group>
                        <Slab size={[32, 0.35, 2.2]} position={[0, 0.17, pontoonZ]} color={colors.pontoon} />
                        {/* Finger on the starboard side, neighbour's boat to port */}
                        <Slab size={[0.8, 0.3, 9]} position={[HALF_B + gap + 0.4, 0.15, end * (HALF_L - 4.5 + gap)]} color={colors.pontoon} />
                        <Slab size={[BOAT.beam * 0.95, 1, BOAT.length * 0.95]} position={[-(BOAT.beam + gap * 2), 0.5, 0]} color={colors.neighbour} opacity={0.45} />
                        {/* Entry: bow first, or astern for a stern-in berth */}
                        <Arrow position={[0, 0, -end * (HALF_L + 7)]} rotation={type === 'bow' ? 0 : Math.PI} color={colors.target} />
                    </group>
                );
            })()}

            {type === 'side' && (
                <group>
                    <Slab size={[2.4, 0.35, 26]} position={[sideSign * (HALF_B + gap + 1.2), 0.17, 0]} color={colors.pontoon} />
                    <Arrow position={[-sideSign * 2.5, 0, HALF_L + 6]} rotation={sideSign * 0.25} color={colors.target} />
                </group>
            )}

            {type === 'buoy' && (
                <group>
                    <mesh position={[0, 0.5, -(HALF_L + 2.5)]}>
                        <sphereGeometry args={[0.6, 20, 14]} />
                        <meshLambertMaterial color={colors.buoy} />
                    </mesh>
                    <Line points={[[0, 0.3, -(HALF_L + 2.5)], [0, 0.3, -HALF_L]]} color={colors.pontoon} lineWidth={2} />
                    <Arrow position={[0, 0, HALF_L + 6]} color={colors.target} />
                </group>
            )}
        </group>
    );
};

/**
 * Virtual berth anchored to the sea (it stays put while we manoeuvre), drawn
 * at `scale` scene units per metre. Placed ahead of the boat the first time.
 */
const VirtualBerth = ({ scale = 0.5 }) => {
    const { scene, accent } = useTheme();
    const { heading, offset, hasFix, hasHeading } = useOwnTrack();
    const berth = useBerth();

    // First use: put a berth 22 m ahead, once we know where we are
    useEffect(() => {
        if (hasFix && hasHeading && !getBerth().pose) placeVirtualBerth(offset, heading);
    }, [offset, heading, hasFix, hasHeading]);

    const colors = useMemo(() => ({
        target: accent,
        pontoon: scene.rigging,
        neighbour: scene.vessel,
        buoy: scene.target,
    }), [scene, accent]);

    if (!berth.pose) return null;
    const { x, y, heading: berthHeading } = berth.pose;

    return (
        // North-up layer turned into the boat frame, then the berth at its pose
        <group rotation={[0, heading, 0]}>
            <group position={[(x - offset.x) * scale, 0, -(y - offset.y) * scale]} rotation={[0, -berthHeading, 0]} scale={[scale, scale, scale]}>
                <BerthLayout type={berth.type} side={berth.side} colors={colors} />
            </group>
        </group>
    );
};

export default VirtualBerth;
