import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import useTheme from '../../../theme/useTheme';
import { RIG } from './rig';
import { deckHeightAt } from './racerGeometry';

const TRACK_RADIUS = 0.03;
const TICK_EVERY = 0.25; // m between graduations

/** Track (a slim rail) laid on the deck between two points, following its camber */
const useTrack = (from, to, lift) => {
    const geometry = useMemo(() => {
        const pts = Array.from({ length: 13 }, (_, i) => {
            const p = new THREE.Vector3(...from).lerp(new THREE.Vector3(...to), i / 12);
            p.y = deckHeightAt(p.x, p.z) + lift;
            return p;
        });
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, TRACK_RADIUS, 8, false);
    }, [from, to, lift]);
    useEffect(() => () => geometry.dispose(), [geometry]);
    return geometry;
};

/** Point on a track at fraction f, sitting on the deck */
const along = (from, to, f, lift) => {
    const p = new THREE.Vector3(...from).lerp(new THREE.Vector3(...to), f);
    p.y = deckHeightAt(p.x, p.z) + lift;
    return p;
};

const Track = ({ from, to, color, tickColor }) => {
    const geometry = useTrack(from, to, TRACK_RADIUS);
    const length = new THREE.Vector3(...from).distanceTo(new THREE.Vector3(...to));
    const ticks = Math.floor(length / TICK_EVERY);
    const dir = new THREE.Vector3(...to).sub(new THREE.Vector3(...from)).normalize();
    const yaw = Math.atan2(dir.x, dir.z);
    return (
        <group>
            <mesh geometry={geometry}>
                <meshStandardMaterial color={color} roughness={0.35} metalness={0.6} />
            </mesh>
            {/* End stops */}
            {[0, 1].map(f => (
                <mesh key={f} position={along(from, to, f, TRACK_RADIUS)}>
                    <sphereGeometry args={[TRACK_RADIUS * 1.8, 12, 8]} />
                    <meshStandardMaterial color={color} roughness={0.35} metalness={0.6} />
                </mesh>
            ))}
            {/* Graduations across the rail, the middle one longer */}
            {Array.from({ length: ticks + 1 }, (_, i) => {
                const f = ticks ? i / ticks : 0;
                const mid = Math.abs(f - 0.5) < 1e-6;
                return (
                    <mesh key={i} position={along(from, to, f, 0.012)} rotation={[0, yaw, 0]}>
                        <boxGeometry args={[mid ? 0.34 : 0.2, 0.012, 0.025]} />
                        <meshBasicMaterial color={tickColor} />
                    </mesh>
                );
            })}
        </group>
    );
};

/**
 * Trim car: rounded car on its rail with the sheave the sheet runs through,
 * in the accent colour when in use.
 */
const Car = ({ position, yaw, size, color, opacity = 1 }) => (
    <group position={position} rotation={[0, yaw, 0]}>
        <RoundedBox args={size} radius={Math.min(...size) * 0.35} smoothness={3} position={[0, size[1] / 2, 0]}>
            <meshStandardMaterial color={color} roughness={0.4} transparent={opacity < 1} opacity={opacity} />
        </RoundedBox>
        {/* Sheave: the block the sheet leads through */}
        <mesh position={[0, size[1] + 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.05, 16]} />
            <meshStandardMaterial color={color} roughness={0.4} transparent={opacity < 1} opacity={opacity} />
        </mesh>
    </group>
);

/**
 * Trim indicators on the deck, where the hardware is: the mainsheet traveller
 * across the cockpit floor and the jib car track on each side deck (the
 * leeward one, in use, highlighted), both graduated so positions read at a
 * glance. Values 0..1: traveller port -> starboard, jib car forward -> aft.
 */
const DeckTrim = ({ mainCar = 0.5, jibCar = 0.5, leeward = -1 }) => {
    const { scene, accent } = useTheme();
    const t = RIG.traveller;
    const j = RIG.jibTrack;
    const travFrom = useMemo(() => [-t.halfWidth, 0, t.z], [t.halfWidth, t.z]);
    const travTo = useMemo(() => [t.halfWidth, 0, t.z], [t.halfWidth, t.z]);
    const tracks = useMemo(() => [1, -1].map(side => ({
        side,
        from: [side * j.x, 0, j.zFwd],
        to: [side * j.x, 0, j.zAft],
    })), [j.x, j.zFwd, j.zAft]);

    return (
        <group>
            <Track from={travFrom} to={travTo} color={scene.rigging} tickColor={scene.compass} />
            <Car position={along(travFrom, travTo, mainCar ?? 0.5, TRACK_RADIUS)} yaw={Math.PI / 2}
                size={[0.42, 0.13, 0.26]} color={accent} />
            {tracks.map(({ side, from, to }) => {
                const active = side === leeward;
                return (
                    <group key={side}>
                        <Track from={from} to={to} color={scene.rigging} tickColor={scene.compass} />
                        <Car position={along(from, to, jibCar ?? 0.5, TRACK_RADIUS)} yaw={0}
                            size={[0.2, 0.12, 0.4]} color={active ? accent : scene.markerDim} opacity={active ? 1 : 0.7} />
                    </group>
                );
            })}
        </group>
    );
};

/** Where a sheet meets its car (top of the sheave), for drawing the sheet */
export const carSheave = (from, to, f) => along(from, to, f, TRACK_RADIUS + 0.19).toArray();

export default DeckTrim;
