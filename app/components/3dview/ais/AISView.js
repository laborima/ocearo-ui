import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three'; // Import THREE for Color

import { toKnots, toDegrees, useOcearoContext } from '../../context/OcearoContext';
import { useSignalKPaths } from '../../hooks/useSignalK';
import { useAIS } from './AISContext';
import AISBoat, { AIS_MATERIALS } from './AISBoat';
import useTheme from '../../theme/useTheme';

// Hard cap on simultaneously rendered AIS vessels. Each vessel is a full GLTF
// model, so on a RPi5 we only ever draw the closest N to keep the GPU happy.
const MAX_RENDERED_VESSELS = 50;

// Scratch objects reused every frame to avoid per-boat allocations (GC pressure
// is a major source of jank on low-power devices).
const _scratchVec = new THREE.Vector3();
const _scratchQuatTarget = new THREE.Quaternion();
const _scratchEuler = new THREE.Euler();

// Proximity alert with hysteresis (metres)
const ALERT_ON_DISTANCE = 500;
const ALERT_OFF_DISTANCE = 550;
// Exponential smoothing rate (1/s): ~95% of a position jump is absorbed in 0.75 s,
// independent of the frame rate.
const SMOOTHING_RATE = 4;
// Height of the sea surface in the boat-view group: the water plane sits at
// -0.3 and the chart/meteo map plane at -0.1 (see Ocean3D / MapPlane3D).
const WATER_LEVEL = { chart: -0.1, meteo: -0.1 };
const DEFAULT_WATER_LEVEL = -0.3;

const collectMeshes = (obj) => {
    const meshes = [];
    obj.traverse((o) => { if (o.isMesh) meshes.push(o); });
    return meshes;
};

/**
 * Moves a boat towards its target pose. `alpha` = 1 snaps.
 */
const updateBoatTransform = (boat, data, alpha) => {
    _scratchVec.set(data.sceneX, 0, data.sceneZ);
    boat.position.lerp(_scratchVec, alpha);

    // Shortest-path yaw interpolation
    _scratchEuler.set(0, -data.rotationAngleY, 0);
    _scratchQuatTarget.setFromEuler(_scratchEuler);
    boat.quaternion.slerp(_scratchQuatTarget, alpha);
};

const AISView = ({ onUpdateInfoPanel }) => {
    const { aisData, vesselIds, targetsRef } = useAIS();
    const { states } = useOcearoContext();
    const waterLevel = WATER_LEVEL[states.oceanMode] ?? DEFAULT_WATER_LEVEL;
    const boatRefs = useRef({}); // mmsi -> THREE.Group, moved directly every frame
    const meshCache = useRef({}); // mmsi -> meshes, resolved once the model has loaded

    const [selectedMmsi, setSelectedMmsi] = useState(null);

    // Fleet materials are shared module-wide: recolour them with the theme
    const { scene } = useTheme();
    useEffect(() => {
        AIS_MATERIALS.normal.color.set(scene.vessel);
        AIS_MATERIALS.alert.color.set(scene.vesselDanger);
    }, [scene]);

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

        for (const mmsi in boatRefs.current) {
            const boat = boatRefs.current[mmsi];
            const data = store[mmsi];
            if (!boat) continue;
            if (!data || !data.visible) {
                boat.visible = false;
                continue;
            }
            boat.visible = true;
            updateBoatTransform(boat, data, alpha);

            // Proximity colour, with hysteresis so a target on the edge doesn't flicker
            const alerted = boat.userData.alert === true;
            const shouldAlert = alerted
                ? data.distanceMeters <= ALERT_OFF_DISTANCE
                : data.distanceMeters < ALERT_ON_DISTANCE;

            let meshes = meshCache.current[mmsi];
            if (!meshes || meshes.length === 0) {
                // The model may still be loading (Suspense): retry next frame
                meshes = collectMeshes(boat);
                if (meshes.length === 0) continue;
                meshCache.current[mmsi] = meshes;
                boat.userData.alert = undefined; // force material assignment
            }

            if (shouldAlert !== boat.userData.alert) {
                const material = shouldAlert ? AIS_MATERIALS.alert : AIS_MATERIALS.normal;
                for (const mesh of meshes) mesh.material = material;
                boat.userData.alert = shouldAlert;
            }
        }
    });

    const handleBoatClick = useCallback((mmsi) => {
        setSelectedMmsi(prev => (prev === mmsi ? null : mmsi));
    }, []);

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

    const selectedBoat = selectedMmsi ? aisData[selectedMmsi] : null;

    // --- Data Formatting Utilities ---
    const formatBoatData = (label, value, unit = '', isAngle = false, isSpeed = false) => {
        // If value is undefined, null, empty string, or 0 length string, return null
        if (value === undefined || value === null || value === '' ||
            (typeof value === 'string' && value.trim().length === 0)) {
            return null;
        }


        // If it's an angle value (COG or heading) and in radians, convert to degrees
        if (isAngle && value !== null) {
            // SignalK provides angles in radians, always convert to degrees
            value = toDegrees(value);
        }

        // If it's a speed value in m/s, convert to knots for display
        if (isSpeed && value !== null) {
            // SignalK provides speeds in m/s, convert to knots
            value = toKnots(value);
        }

        return `${label}: ${value}${unit}`;

    }

    const formatMMSI = (mmsi) => {
        if (!mmsi) return null;
        const prefixes = ['urn:mrn:imo:mmsi:', 'urn:mrn:signalk:uuid:'];
        let formattedMMSI = String(mmsi); // Ensure it's a string
        for (const prefix of prefixes) {
            if (formattedMMSI.startsWith(prefix)) {
                formattedMMSI = formattedMMSI.substring(prefix.length);
                break;
            }
        }
        return formattedMMSI;
    };


    // --- Prepare Info Panel Content ---
    const infoPanelContent = selectedBoat ? [
        formatBoatData('Vessel', selectedBoat.name),
        formatBoatData('MMSI', formatMMSI(selectedBoat.mmsi)),
        formatBoatData('RNG', selectedBoat.distanceMeters ? selectedBoat.distanceMeters.toFixed(0) : 0, ' m'),
        formatBoatData('LOA', selectedBoat.length, ' m'),
        formatBoatData('Type', selectedBoat.shipType),
        formatBoatData('SOG', selectedBoat.sog, ' kn', false, true),
        formatBoatData('COG', selectedBoat.cog, '°', true),
        formatBoatData('HDG', selectedBoat.heading, '°', true),
        formatBoatData('Beam', selectedBoat.beam, ' m'),
        formatBoatData('Draft', selectedBoat.draft, ' m'),
        formatBoatData('Call', selectedBoat.callsign),
        formatBoatData('Dest', selectedBoat.destination)
    ]
        .filter(item => item !== null) // Remove any unavailable information
        .join('\n') : ''; // Format with newlines for display

    // --- Update Parent Info Panel ---
    useEffect(() => {
        if (onUpdateInfoPanel) {
            onUpdateInfoPanel(infoPanelContent);
        }
        // Depend only on the generated content and the callback itself
    }, [infoPanelContent, onUpdateInfoPanel]);


    // --- Component Return ---
    return (
        <>
            {/* North-up AIS layer rotated into the boat frame, hulls on the sea surface */}
            <group rotation={[0, rotationAngle, 0]} position={[0, waterLevel, 0]}>
                {boats}
            </group>
        </>
    );
};

export default AISView;