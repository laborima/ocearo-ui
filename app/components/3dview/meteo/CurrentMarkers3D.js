import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import configService from '../../settings/ConfigService';
import useOwnTrack from '../fsd/useOwnTrack';
import FlowMarkers from './FlowMarkers';
import { sameMarkers, onScreenTest } from './markerLattice';
import { useCurrentField, currentMarkers, DEFAULT_CURRENT_MAP, CURRENT_ARROW_WIDTH } from './useCurrentField';

const R = 6371000;

/**
 * The current layer over the bases without a seabed (the sea, the grid):
 * the arrows alone, on the water around the boat. The 3D chart draws the
 * water column coloured by the current as well (CurrentVolume).
 *
 * @param {number} y - water level in the scene
 */
const CurrentMarkers3D = ({ y = 0 }) => {
    const { field, hour, top, lat, lon } = useCurrentField();
    const { heading } = useOwnTrack();
    const scale = configService.get('aisLengthScalingFactor') || 0.7;
    const mapName = configService.get('currentColorMap') || DEFAULT_CURRENT_MAP;
    const layerRef = useRef();
    const cam = useMemo(() => new THREE.Vector3(), []);
    const [markers, setMarkers] = useState([]);
    const tick = useRef(1);

    useFrame(({ camera, gl }, delta) => {
        tick.current += delta;
        const layer = layerRef.current;
        if (tick.current < 1 || !field || !layer || !Number.isFinite(lat)) return;
        tick.current = 0;
        // The boat in the field frame (metres east / north of its origin)
        const refE = (lon - field.origin.lon) * Math.PI / 180 * R * Math.cos(field.origin.lat * Math.PI / 180);
        const refN = (lat - field.origin.lat) * Math.PI / 180 * R;
        layer.updateWorldMatrix(true, false);
        const camLocal = layer.worldToLocal(cam.copy(camera.position));
        const next = currentMarkers({
            field, hour, top, mapName, refE, refN, scale, radius: 1500, z: 0.3,
            onScreen: onScreenTest(layer, camera, gl.domElement),
            cx: refE + camLocal.x / scale, cy: refN + camLocal.y / scale, heightM: Math.max(5, camLocal.z / scale),
        });
        setMarkers((prev) => (sameMarkers(prev, next) ? prev : next));
    });

    if (!field) return null;
    return (
        // North-up layer turned into the boat frame; local x east, y north
        <group rotation={[0, heading, 0]} position={[0, y, 0]}>
            <group ref={layerRef} rotation={[-Math.PI / 2, 0, 0]}>
                <FlowMarkers items={markers} width={CURRENT_ARROW_WIDTH} screen={1} />
            </group>
        </group>
    );
};

export default CurrentMarkers3D;
