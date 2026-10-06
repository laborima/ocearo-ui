import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three'; // Import THREE for Color

import { useOcearoContext } from '../../context/OcearoContext';
import { useSignalKPaths } from '../../hooks/useSignalK';
import { useAIS, predictScenePosition } from './AISContext';
import useColregs from '../../hooks/useColregs';
import AISBoat, { AIS_MATERIALS } from './AISBoat';
import useTheme from '../../theme/useTheme';
import ColregMarkers from './ColregMarkers';

// Hard cap on simultaneously rendered AIS vessels. Each vessel is a full GLTF
// model, so on a RPi5 we only ever draw the closest N to keep the GPU happy.
const MAX_RENDERED_VESSELS = 50;

// Scratch objects reused every frame to avoid per-boat allocations (GC pressure
// is a major source of jank on low-power devices).
const _scratchVec = new THREE.Vector3();
const _scratchQuatTarget = new THREE.Quaternion();
const _scratchEuler = new THREE.Euler();

// Collision-risk targets drawn with their CPA geometry (closest first)
const MAX_CPA_LINES = 5;
// Exponential smoothing rate (1/s): ~95% of a position jump is absorbed in 0.75 s,
// independent of the frame rate.
const SMOOTHING_RATE = 4;
// Height of the sea surface in the boat-view group: the water plane sits at
// -0.3 and the chart/meteo map plane at -0.1 (see Ocean3D / MapPlane3D).
const WATER_LEVEL = { chart: -0.1, meteo: -0.1 };
const DEFAULT_WATER_LEVEL = -0.3;

const collectMeshes = (obj) => {
    const meshes = [];
    // Fixed-colour details (glazing, boot top) keep their own material
    obj.traverse((o) => { if (o.isMesh && !o.userData.fixed) meshes.push(o); });
    return meshes;
};

/**
 * Moves a boat towards its target pose. `alpha` = 1 snaps.
 */
const updateBoatTransform = (boat, data, alpha, motion, now) => {
    // Dead reckoning between AIS reports, then a light smoothing for the
    // correction when a new report lands
    const { x, z } = predictScenePosition(data, motion, now);
    _scratchVec.set(x, 0, z);
    boat.position.lerp(_scratchVec, alpha);

    // Shortest-path yaw interpolation
    _scratchEuler.set(0, -data.rotationAngleY, 0);
    _scratchQuatTarget.setFromEuler(_scratchEuler);
    boat.quaternion.slerp(_scratchQuatTarget, alpha);
};

/**
 * Dotted lines to the closest point of approach of each risky target: the
 * target's predicted track to that point and ours, with a ring where the two
 * boats will be closest. Refreshed with the AIS snapshot (4 Hz).
 */
const CpaLines = ({ targets, statuses, colors }) => {
    // Targets are mutated in place by the AIS store: copy what we draw
    const risky = useMemo(() => targets
        .filter(t => t.risk === 'danger' && t.cpaScene && t.visible)
        .slice(0, MAX_CPA_LINES)
        .map(t => ({ mmsi: t.mmsi, sceneX: t.sceneX, sceneZ: t.sceneZ, cpaScene: { ...t.cpaScene } })), [targets]);

    return risky.map((t) => {
        const c = t.cpaScene;
        // Same colour as the target: red we keep clear, violet it keeps clear
        const color = statuses[t.mmsi] === 'yields' ? colors.yields : colors.giveWay;
        return (
            <group key={t.mmsi}>
                <Line points={[[t.sceneX, 0.3, t.sceneZ], [c.targetX, 0.3, c.targetZ]]}
                    color={color} lineWidth={2} dashed dashSize={3} gapSize={2.5} transparent opacity={0.9} />
                <Line points={[[0, 0.3, 0], [c.ownX, 0.3, c.ownZ]]}
                    color={color} lineWidth={1.5} dashed dashSize={2} gapSize={3} transparent opacity={0.6} />
                <mesh position={[c.targetX, 0.25, c.targetZ]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[2.2, 3, 32]} />
                    <meshBasicMaterial color={color} transparent opacity={0.8} depthWrite={false} />
                </mesh>
            </group>
        );
    });
};

/**
 * `selectedMmsi` comes from the 3D view, which owns the selection (tapped
 * vessel) and shows its card; a tap here toggles it through `onUpdateInfoPanel`.
 */
const AISView = ({ onUpdateInfoPanel, selectedMmsi = null }) => {
    const { aisData, vesselIds, targets, targetsRef, motionRef } = useAIS();
    const { states } = useOcearoContext();
    const waterLevel = WATER_LEVEL[states.oceanMode] ?? DEFAULT_WATER_LEVEL;
    const boatRefs = useRef({}); // mmsi -> THREE.Group, moved directly every frame
    const meshCache = useRef({}); // mmsi -> meshes, resolved once the model has loaded


    // Fleet materials are shared module-wide: recolour them with the theme
    const { scene } = useTheme();
    useEffect(() => {
        AIS_MATERIALS.normal.color.set(scene.vessel);
        AIS_MATERIALS.alert.color.set(scene.vesselDanger);
        AIS_MATERIALS.yields.color.set(scene.vesselYields);
        AIS_MATERIALS.close.color.set(scene.vesselClose);
        AIS_MATERIALS.selected.color.set(scene.route);
    }, [scene]);
    const selectedRef = useRef(null);
    const { statuses } = useColregs();
    const statusesRef = useRef({});
    useEffect(() => { statusesRef.current = statuses; }, [statuses]);
    useEffect(() => { selectedRef.current = selectedMmsi; }, [selectedMmsi]);

    // Own heading: the AIS layer is laid out north-up, rotate it into the boat frame
    const headingPaths = useMemo(() => [
        'navigation.headingTrue',
        'navigation.headingMagnetic',
        'navigation.courseOverGroundTrue',
        'navigation.courseOverGroundMagnetic'
    ], []);
    const skHeadingValues = useSignalKPaths(headingPaths);
    const rotationAngle = useMemo(() => {
        const heading = skHeadingValues['navigation.headingTrue'] ?? skHeadingValues['navigation.headingMagnetic'];
        const cog = skHeadingValues['navigation.courseOverGroundTrue'] ?? skHeadingValues['navigation.courseOverGroundMagnetic'];
        return heading ?? cog ?? 0;
    }, [skHeadingValues]);

    useFrame((_, delta) => {
        const alpha = 1 - Math.exp(-SMOOTHING_RATE * Math.min(delta, 0.5));
        const store = targetsRef.current;
        const motion = motionRef.current;
        const now = Date.now();

        for (const mmsi in boatRefs.current) {
            const boat = boatRefs.current[mmsi];
            const data = store[mmsi];
            if (!boat) continue;
            if (!data || !data.visible) {
                boat.visible = false;
                continue;
            }
            boat.visible = true;
            updateBoatTransform(boat, data, alpha, motion, now);

            // Colour by what the target means for us: red we must keep clear,
            // violet it must keep clear of us, orange near without risk,
            // accent when selected, grey otherwise
            const status = statusesRef.current[mmsi];
            const look = status === 'giveWay' ? 'alert' : status === 'yields' ? 'yields'
                : selectedRef.current === mmsi ? 'selected' : status === 'close' ? 'close' : 'normal';

            let meshes = meshCache.current[mmsi];
            if (!meshes || meshes.length === 0) {
                // The model may still be loading (Suspense): retry next frame
                meshes = collectMeshes(boat);
                if (meshes.length === 0) continue;
                meshCache.current[mmsi] = meshes;
                boat.userData.look = undefined; // force material assignment
            }

            if (look !== boat.userData.look) {
                const material = AIS_MATERIALS[look];
                for (const mesh of meshes) mesh.material = material;
                boat.userData.look = look;
            }
        }
    });

    const handleBoatClick = useCallback((mmsi) => {
        onUpdateInfoPanel?.(prev => (prev?.kind === 'ais' && prev.mmsi === mmsi ? null : { kind: 'ais', mmsi }));
    }, [onUpdateInfoPanel]);

    // One stable ref callback per vessel, so a list update doesn't detach and
    // re-attach boats that are still displayed
    const refCallbacks = useRef({});
    const getBoatRef = useCallback((mmsi) => {
        if (!refCallbacks.current[mmsi]) {
            refCallbacks.current[mmsi] = (el) => {
                if (el) {
                    // First placement: snap to the live pose instead of sliding in from the origin
                    const live = targetsRef.current[mmsi];
                    el.userData.mmsi = mmsi;
                    el.position.set(live?.sceneX ?? 0, 0, live?.sceneZ ?? 0);
                    el.rotation.set(0, -(live?.rotationAngleY ?? 0), 0);
                    boatRefs.current[mmsi] = el;
                } else {
                    delete boatRefs.current[mmsi];
                    delete meshCache.current[mmsi];
                    delete refCallbacks.current[mmsi];
                }
            };
        }
        return refCallbacks.current[mmsi];
    }, [targetsRef]);

    // Render only the closest N vessels (list is already sorted by distance)
    const boats = useMemo(() => vesselIds.slice(0, MAX_RENDERED_VESSELS).map(vessel => (
        <AISBoat
            key={vessel.mmsi}
            ref={getBoatRef(vessel.mmsi)}
            boatData={vessel}
            onClick={handleBoatClick}
        />
    )), [vesselIds, handleBoatClick, getBoatRef]);

    // Model swaps (type/length update) remount the inner mesh: drop stale caches
    useEffect(() => { meshCache.current = {}; }, [vesselIds]);

    // --- Component Return ---
    return (
        <>
            {/* North-up AIS layer rotated into the boat frame, hulls on the sea surface */}
            <group rotation={[0, rotationAngle, 0]} position={[0, waterLevel, 0]}>
                {boats}
                <CpaLines targets={targets} statuses={statuses} colors={{ giveWay: scene.vesselDanger, yields: scene.vesselYields }} />
                <ColregMarkers />
            </group>
        </>
    );
};

export default AISView;