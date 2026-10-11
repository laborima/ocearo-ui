'use client';
import React, { useRef, useSyncExternalStore } from 'react';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';
import configService from '../settings/ConfigService';
import signalKService from '../services/SignalKService';
import { useSignalKPath } from '../hooks/useSignalK';
import useOwnTrack from './fsd/useOwnTrack';
import { getViewState, subscribeView, setPlacingWaypoint, setViewMessage } from './hud/viewStore';

const R = 6371000;
// A tap moving more than this (pixels) is a camera drag, not a pick
const MAX_TAP_DRAG = 8;
const PICK_MATERIAL = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false, side: THREE.DoubleSide });

/**
 * While the "set destination" mode is on, a tap on the sea creates a Signal K
 * waypoint there and makes it the active destination (course API): the
 * route ribbon and the laylines follow from it.
 *
 * Lives in the boat's group (sea level), in a north-up layer turned by the
 * heading like the AIS and the laylines: east = x / scale, north = -z / scale.
 */
const WaypointPicker = ({ y = -0.3 }) => {
    const { t } = useTranslation();
    const { placingWaypoint } = useSyncExternalStore(subscribeView, getViewState, getViewState);
    const position = useSignalKPath('navigation.position');
    const { heading } = useOwnTrack();
    // A ref, not state: a quick double tap must not create two waypoints
    const busy = useRef(false);
    const scale = configService.get('aisLengthScalingFactor') || 0.7;

    if (!placingWaypoint || !Number.isFinite(position?.latitude)) return null;

    const pick = async (e) => {
        if (busy.current || e.delta > MAX_TAP_DRAG) return;
        e.stopPropagation();
        const local = e.object.worldToLocal(e.point.clone());
        // Plane rotated -90° about X: local x = east, local y = north
        const east = local.x / scale;
        const north = local.y / scale;
        const lat0 = position.latitude;
        const lat = lat0 + (north / R) * 180 / Math.PI;
        const lon = position.longitude + (east / (R * Math.cos(lat0 * Math.PI / 180))) * 180 / Math.PI;
        const now = new Date();
        const name = `WPT ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        busy.current = true;
        try {
            const id = signalKService.generateUUID();
            await signalKService.saveWaypoint(id, signalKService.createWaypointFeature(lon, lat, name, t('waypointPicker.description')));
            await signalKService.setDestinationWaypoint(id);
            setPlacingWaypoint(false);
            setViewMessage(t('waypointPicker.set', { name, distance: (Math.hypot(east, north) / 1852).toFixed(2) }));
        } catch (error) {
            setViewMessage(t('waypointPicker.failed', { error: error.message }));
        } finally {
            busy.current = false;
        }
    };

    return (
        <group rotation={[0, heading, 0]} position={[0, y, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} material={PICK_MATERIAL} onClick={pick}>
                <planeGeometry args={[20000, 20000]} />
            </mesh>
        </group>
    );
};

export default WaypointPicker;
