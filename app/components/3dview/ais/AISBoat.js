import React, { useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import configService from '../../settings/ConfigService';

const ASSET_PREFIX = process.env.ASSET_PREFIX || './';

// Models are normalized so their length == BASE_MODEL_LENGTH; AISView/AISBoat then
// scales by the vessel's real length (metres).
const BASE_MODEL_LENGTH = 10;
const MIN_BOAT_LENGTH = 4; // floor so tiny craft stay visible

// AIS ship type (ITU-R M.1371 tens digit) -> fleet model code in /boats/ais/ais-<code>.glb
const determineAisModelCode = (shipType) => {
    const t = Number(shipType);
    if (!Number.isFinite(t)) return 70;
    if (t === 30) return 30;            // fishing
    if (t >= 31 && t <= 32) return 31;  // towing -> tug
    if (t >= 33 && t <= 35) return 35;  // dredging/diving/military -> military
    if (t === 36) return 36;            // sailing
    if (t === 37) return 37;            // pleasure
    if (t >= 40 && t <= 49) return 40;  // high-speed craft
    if (t >= 50 && t <= 59) return 50;  // pilot / special craft
    if (t >= 60 && t <= 69) return 60;  // passenger
    if (t >= 70 && t <= 79) return 70;  // cargo
    if (t >= 80 && t <= 89) return 80;  // tanker
    return 70;                          // 0-29 (incl. WIG) & 90-99 -> generic
};

// Per-code yaw correction (radians) if a model's bow points the wrong way after
// auto-orientation. Tune visually in the running AIS view; 0 = as imported.
const AIS_YAW = {
    // e.g. 31: Math.PI,
};

// Visual draft as a fraction of hull LENGTH. Sinks the model below the
// waterline (y=0) so hulls sit IN the water instead of resting keel-tip on it.
// Values are calibrated per model from the GLB geometry (where each author put
// the waterline relative to the hull bottom); the ocean/map planes sitting
// slightly below y=0 are also absorbed here.
const AIS_SINK = {
    30: 0.10, // fishing: waterline mid-hull
    31: 0.14, // tug: sits deep
    36: 0.23, // sailing: model authored with waterline at origin, keel -1.5
    37: 0.07, // pleasure: origin at deck level, shallow draft
    50: 0.03, // pilot: hull already cut at waterline
    70: 0.10, // cargo: loaded waterline
    80: 0.12, // tanker: origin mid-hull
};
const DEFAULT_SINK = 0.06;

const modelUrl = (code) => `${ASSET_PREFIX}/boats/ais/ais-${code}.glb`;
const dracoPath = `${ASSET_PREFIX}/draco/`;

/**
 * Loads a fleet GLB and returns a normalized THREE.Group:
 *  - uniform white material (matches the app "ship" style),
 *  - upright, centred on X/Z with the hull bottom on y=0,
 *  - longest horizontal axis aligned to Z and scaled so length == BASE_MODEL_LENGTH.
 * One clone per instance (geometry is shared via clone()).
 */
function AISModel({ code, scaleFactor }) {
    const { scene } = useGLTF(modelUrl(code), dracoPath);

    const model = useMemo(() => {
        const obj = scene.clone(true);
        obj.traverse((o) => {
            if (o.isMesh) {
                // Fresh material per clone — AISView clones this again for the proximity red/white swap.
                o.material = new THREE.MeshStandardMaterial({ color: 0xeef2f5, roughness: 0.7, metalness: 0.1 });
                o.castShadow = false;
                o.receiveShadow = false;
            }
        });

        // These models are all glTF Y-up. Keep Y as up (a mast/superstructure can make
        // the height the *largest* extent, so an auto "shortest axis = up" guess would
        // wrongly lay the boat down). We only align the longest HORIZONTAL axis to Z.
        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const lengthAlongX = size.x >= size.z;
        const len = Math.max(size.x, size.z) || 1;
        const s = BASE_MODEL_LENGTH / len;

        // Centre on X/Z, drop the hull bottom onto y=0 then sink by the visual
        // draft so the waterline crosses the hull instead of the keel tip.
        // Draft is a fraction of hull length (len is in pre-scale model units).
        const sink = len * (AIS_SINK[code] ?? DEFAULT_SINK);
        obj.position.set(-center.x, -box.min.y - sink, -center.z);

        const oriented = new THREE.Group();
        oriented.add(obj);
        oriented.scale.setScalar(s);
        // Rotate length to Z if it was along X; per-code yaw lets you flip bow direction.
        oriented.rotation.y = (lengthAlongX ? Math.PI / 2 : 0) + (AIS_YAW[code] || 0);
        return oriented;
    }, [scene, code]);

    return (
        <group scale={scaleFactor}>
            <primitive object={model} />
        </group>
    );
}

/**
 * AISBoat — renders one AIS vessel as a normalized white low-poly model.
 * The outer group is the ref the parent manipulates each frame (position/rotation/colour).
 */
const AISBoat = ({ position, visible, boatData, onClick, ref }) => {
    const code = determineAisModelCode(boatData.shipType);

    const providedLength = boatData.length || BASE_MODEL_LENGTH;
    const desiredLength = Math.max(providedLength, MIN_BOAT_LENGTH);
    // Scene positions are metres * aisLengthScalingFactor, so boat sizes must
    // apply the same factor or every vessel renders ~1/factor too large.
    const sceneScale = configService.get('aisLengthScalingFactor') || 0.7;
    const scaleFactor = (desiredLength * sceneScale) / BASE_MODEL_LENGTH;

    return (
        <group
            ref={ref}
            position={position}
            visible={visible}
            onClick={(e) => {
                e.stopPropagation();
                onClick && onClick(boatData);
            }}
        >
            {/* Per-boat Suspense so a not-yet-loaded model never blanks the whole scene */}
            <Suspense fallback={null}>
                <AISModel code={code} scaleFactor={scaleFactor} />
            </Suspense>
        </group>
    );
};

export default AISBoat;
