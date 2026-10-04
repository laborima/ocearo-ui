import React, { useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

const ASSET_PREFIX = process.env.ASSET_PREFIX || './';

// Models are normalized so their length == BASE_MODEL_LENGTH; AISView/AISBoat then
// scales by the vessel's real length (metres).
const BASE_MODEL_LENGTH = 10;
const MIN_BOAT_LENGTH = 4; // floor so tiny craft stay visible

// How large a target is drawn, per metre of real vessel length.
//
// Deliberately NOT aisLengthScalingFactor. That setting scales scene *positions*
// (AISContext), so using it here too made one slider do two jobs: turning it down
// to bring targets closer shrank them by the same amount, which is not a zoom.
// Targets keep a constant size and only their spacing follows the setting — which
// is what the control calls itself ("map target visibility"). The value is the old
// default of that setting, so the default view is unchanged.
//
// Trade-off: vessels are no longer to scale against distances. They are symbols
// whose relative sizes still reflect real length, like a chart plotter.
const TARGET_SIZE_PER_METRE = 0.7;

// AIS ship type (ITU-R M.1371 tens digit) -> fleet model code in /boats/ais/ais-<code>.glb
// Unknown types (0, WIG, 90-99 — very common on class B transponders) are
// picked by size instead, so a 9 m yacht without a type isn't drawn as a freighter.
export const determineAisModelCode = (shipType, length) => {
    const t = Number(shipType);
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
    if (Number.isFinite(length) && length > 0) {
        if (length < 20) return 37;
        if (length < 60) return 50;
    }
    return 70;
};

// Yaw correction (radians) so every model's bow points to -Z (north at
// heading 0) after normalization. Checked one by one against bridge/stem/
// propeller positions in a side + top render of the whole fleet.
const AIS_YAW = {
    31: Math.PI, // tug
    35: Math.PI, // military
    40: Math.PI, // high-speed craft
    50: Math.PI, // pilot
    60: Math.PI, // passenger
    70: Math.PI, // cargo
    80: Math.PI, // tanker
};

// Draft (depth below the waterline) as a fraction of hull length, measured
// from the lowest point of the model (keel, skeg or propeller). Typical
// loaded drafts: sailing yacht 12 m -> 2 m keel, cargo 190 m -> 11 m,
// tanker 250 m -> 17 m, etc.
const AIS_SINK = {
    30: 0.11,  // fishing
    31: 0.12,  // tug
    35: 0.05,  // military
    36: 0.17,  // sailing (keel included)
    37: 0.07,  // pleasure
    40: 0.05,  // high-speed craft
    50: 0.08,  // pilot
    60: 0.045, // passenger
    70: 0.06,  // cargo
    80: 0.07,  // tanker
};
const DEFAULT_SINK = 0.06;

// Accept a reported beam only within this fraction of length; anything else is
// a bad AIS entry (beam and length swapped, zero, 1 m placeholder...).
const MIN_BEAM_RATIO = 0.08;
const MAX_BEAM_RATIO = 0.6;

const modelUrl = (code) => `${ASSET_PREFIX}/boats/ais/ais-${code}.glb`;
const dracoPath = `${ASSET_PREFIX}/draco/`;

// Two materials shared by the whole fleet: one per proximity state. Sharing
// them keeps a single shader program and avoids 3 material clones per target.
export const AIS_MATERIALS = {
    // Colours are set from the theme by AISView
    normal: new THREE.MeshStandardMaterial({ color: 0x8a9097, roughness: 0.9, metalness: 0 }),
    alert: new THREE.MeshStandardMaterial({ color: 0xff2d38, roughness: 0.9, metalness: 0 }),
    selected: new THREE.MeshStandardMaterial({ color: 0x09bfff, roughness: 0.9, metalness: 0 }),
};

// Normalized template per loaded GLB scene; instances clone it (geometry shared).
const templateCache = new WeakMap();

/**
 * Builds the normalized template for a fleet GLB:
 *  - shared white material,
 *  - upright, centred on X/Z, hull sunk to its waterline (y=0),
 *  - longest horizontal axis aligned to Z and scaled so length == BASE_MODEL_LENGTH.
 */
const buildTemplate = (scene, code) => {
    const obj = scene.clone(true);
    obj.traverse((o) => {
        if (o.isMesh) {
            o.material = AIS_MATERIALS.normal;
            o.castShadow = false;
            o.receiveShadow = false;
        }
    });

    // These models are all glTF Y-up. Keep Y as up (a mast/superstructure can make
    // the height the *largest* extent, so an auto "shortest axis = up" guess would
    // wrongly lay the boat down). We only align the longest HORIZONTAL axis to Z.
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const lengthAlongX = size.x >= size.z;
    const len = Math.max(size.x, size.z) || 1;

    // Centre on X/Z, drop the hull bottom onto y=0 then sink by the visual
    // draft so the waterline crosses the hull instead of the keel tip.
    // Draft is a fraction of hull length (len is in pre-scale model units).
    const sink = len * (AIS_SINK[code] ?? DEFAULT_SINK);
    obj.position.set(-center.x, -box.min.y - sink, -center.z);

    const oriented = new THREE.Group();
    oriented.add(obj);
    oriented.scale.setScalar(BASE_MODEL_LENGTH / len);
    // Rotate length to Z if it was along X; per-code yaw puts the bow on -Z.
    oriented.rotation.y = (lengthAlongX ? Math.PI / 2 : 0) + (AIS_YAW[code] || 0);
    // Model's own beam / length, used to stretch it to the AIS-reported beam
    oriented.userData.beamRatio = (Math.min(size.x, size.z) / len) || 0.25;
    return oriented;
};

function AISModel({ code, scaleFactor, beamRatio }) {
    const { scene } = useGLTF(modelUrl(code), dracoPath);

    const model = useMemo(() => {
        let template = templateCache.get(scene);
        if (!template) {
            template = buildTemplate(scene, code);
            templateCache.set(scene, template);
        }
        return template.clone(true);
    }, [scene, code]);

    // Stretch the width to the real beam when the vessel reports a plausible one
    const widthFactor = beamRatio ? beamRatio / model.userData.beamRatio : 1;

    return (
        <group scale={[scaleFactor * widthFactor, scaleFactor, scaleFactor]}>
            <primitive object={model} />
        </group>
    );
}

/**
 * Target length in scene units for a vessel, given its AIS length in metres.
 */
export const aisTargetSceneLength = (lengthMeters) =>
    Math.max(lengthMeters || BASE_MODEL_LENGTH, MIN_BOAT_LENGTH) * TARGET_SIZE_PER_METRE;

/**
 * AISBoat — renders one AIS vessel as a normalized white low-poly model.
 * The outer group is the ref the parent moves every frame; position and
 * rotation are therefore not React props (re-renders would snap the boat).
 */
const AISBoat = ({ boatData, onClick, ref }) => {
    const { length, beam } = boatData;
    const code = determineAisModelCode(boatData.shipType, length);
    const scaleFactor = aisTargetSceneLength(length) / BASE_MODEL_LENGTH;
    const ratio = length > 0 && beam > 0 ? beam / length : null;
    const beamRatio = ratio >= MIN_BEAM_RATIO && ratio <= MAX_BEAM_RATIO ? ratio : null;

    return (
        <group
            ref={ref}
            onClick={(e) => {
                e.stopPropagation();
                onClick && onClick(boatData.mmsi);
            }}
        >
            {/* Per-boat Suspense so a not-yet-loaded model never blanks the whole scene */}
            <Suspense fallback={null}>
                <AISModel code={code} scaleFactor={scaleFactor} beamRatio={beamRatio} />
            </Suspense>
        </group>
    );
};

export default AISBoat;
