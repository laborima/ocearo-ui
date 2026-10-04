import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import useTheme from '../../../theme/useTheme';
import { RIG } from './rig';
import { deckHeightAt, deckEdgeAt } from './racerGeometry';

const TRACK_RADIUS = 0.03;
const TICK_EVERY = 0.25; // m between graduations

// Jib tracks run parallel to the sheer, this far inboard of the deck edge
const JIB_INSET = 0.45;

const layouts = new WeakMap();

/**
 * Where the trim hardware runs on a given boat. Paths map f (0..1) to a
 * point on the deck: the traveller crosses straight (port -> starboard);
 * each jib track (forward -> aft) runs at a fixed `x` when the rig gives
 * one, else along the curve of the deck edge.
 *
 * @param {Object} rig - rig geometry (traveller, jibTrack)
 * @param {{ edgeAt: (z) => number, heightAt: (x, z) => number }} deck
 */
export const trimLayout = (rig = RIG, deck = { edgeAt: deckEdgeAt, heightAt: deckHeightAt }) => {
    if (layouts.has(rig)) return layouts.get(rig);
    const onDeck = (x, z) => new THREE.Vector3(x, deck.heightAt(x, z), z);
    const t = rig.traveller;
    const j = rig.jibTrack;
    const jib = (side) => (f) => {
        const z = j.zFwd + (j.zAft - j.zFwd) * f;
        const x = Number.isFinite(j.x) ? j.x : deck.edgeAt(z) - (j.inset ?? JIB_INSET);
        return onDeck(side * x, z);
    };
    const layout = {
        traveller: (f) => onDeck((f * 2 - 1) * t.halfWidth, t.z),
        jib: { 1: jib(1), [-1]: jib(-1) },
    };
    layouts.set(rig, layout);
    return layout;
};

/** Point on a track at fraction f, raised by `lift` */
const along = (path, f, lift) => path(f).add(new THREE.Vector3(0, lift, 0));

/** Direction of a track at f, as a yaw angle */
const yawAt = (path, f) => {
    const a = path(Math.max(0, f - 0.01));
    const b = path(Math.min(1, f + 0.01));
    return Math.atan2(b.x - a.x, b.z - a.z);
};

/** Track (a slim rail) laid on the deck along its path, following the camber */
const useTrack = (path, lift) => {
    const geometry = useMemo(() => {
        const pts = Array.from({ length: 17 }, (_, i) => along(path, i / 16, lift));
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, TRACK_RADIUS, 8, false);
    }, [path, lift]);
    useEffect(() => () => geometry.dispose(), [geometry]);
    return geometry;
};

const Track = ({ path, color, tickColor }) => {
    const geometry = useTrack(path, TRACK_RADIUS);
    const length = along(path, 0, 0).distanceTo(along(path, 1, 0));
    const ticks = Math.floor(length / TICK_EVERY);
    return (
        <group>
            <mesh geometry={geometry}>
                <meshStandardMaterial color={color} roughness={0.35} metalness={0.6} />
            </mesh>
            {/* End stops */}
            {[0, 1].map(f => (
                <mesh key={f} position={along(path, f, TRACK_RADIUS)}>
                    <sphereGeometry args={[TRACK_RADIUS * 1.8, 12, 8]} />
                    <meshStandardMaterial color={color} roughness={0.35} metalness={0.6} />
                </mesh>
            ))}
            {/* Graduations across the rail, the middle one longer */}
            {Array.from({ length: ticks + 1 }, (_, i) => {
                const f = ticks ? i / ticks : 0;
                const mid = Math.abs(f - 0.5) < 1e-6;
                return (
                    <mesh key={i} position={along(path, f, 0.012)} rotation={[0, yawAt(path, f), 0]}>
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
const DeckTrim = ({ mainCar = 0.5, jibCar = 0.5, leeward = -1, layout = trimLayout() }) => {
    const { scene, accent } = useTheme();

    return (
        <group>
            <Track path={layout.traveller} color={scene.rigging} tickColor={scene.compass} />
            <Car position={along(layout.traveller, mainCar ?? 0.5, TRACK_RADIUS)} yaw={Math.PI / 2}
                size={[0.42, 0.13, 0.26]} color={accent} />
            {[1, -1].map((side) => {
                const path = layout.jib[side];
                const active = side === leeward;
                const f = jibCar ?? 0.5;
                return (
                    <group key={side}>
                        <Track path={path} color={scene.rigging} tickColor={scene.compass} />
                        <Car position={along(path, f, TRACK_RADIUS)} yaw={yawAt(path, f)}
                            size={[0.2, 0.12, 0.4]} color={active ? accent : scene.markerDim} opacity={active ? 1 : 0.7} />
                    </group>
                );
            })}
        </group>
    );
};

/** Top of the sheave of the mainsheet car, for drawing the sheet */
export const mainCarSheave = (f, layout = trimLayout()) => along(layout.traveller, f, TRACK_RADIUS + 0.19).toArray();
/** Top of the sheave of a jib car (side +1 starboard / -1 port), for drawing the sheet */
export const jibCarSheave = (side, f, layout = trimLayout()) => along(layout.jib[side], f, TRACK_RADIUS + 0.19).toArray();

export default DeckTrim;
