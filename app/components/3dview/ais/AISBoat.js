import React from 'react';
import * as THREE from 'three';
import { fleetModel, FLEET_LENGTH, sailingModelCode } from './fleetGeometry';

// Fleet models are FLEET_LENGTH long; AISBoat scales them to the vessel's
// real length (metres).
const BASE_MODEL_LENGTH = FLEET_LENGTH;
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

// AIS ship type (ITU-R M.1371 tens digit) -> fleet model code (see fleetGeometry)
// Unknown types (0, WIG, 90-99 — very common on class B transponders) are
// picked by size instead, so a 9 m yacht without a type isn't drawn as a freighter.
export const determineAisModelCode = (shipType, length, beam) => {
    const t = Number(shipType);
    if (t === 30) return 30;            // fishing
    if (t >= 31 && t <= 32) return 31;  // towing -> tug
    if (t >= 33 && t <= 35) return 35;  // dredging/diving/military -> military
    if (t === 36) return sailingModelCode(length, beam); // sailing, by size / hulls
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

// Two materials shared by the whole fleet: one per proximity state. Sharing
// them keeps a single shader program and avoids material clones per target.
// Double-sided for the sails of the sailing yacht.
export const AIS_MATERIALS = {
    // Colours are set from the theme by AISView
    normal: new THREE.MeshStandardMaterial({ color: 0x8a9097, roughness: 0.5, metalness: 0.05, side: THREE.DoubleSide }),
    alert: new THREE.MeshStandardMaterial({ color: 0xd2504f, roughness: 0.6, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.88 }),
    selected: new THREE.MeshStandardMaterial({ color: 0x09bfff, roughness: 0.5, metalness: 0.05, side: THREE.DoubleSide }),
    yields: new THREE.MeshStandardMaterial({ color: 0x8f86c9, roughness: 0.6, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.88 }),
    close: new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.6, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0.88 }),
};

// Glazing, boot top and funnel tops: dark whatever the state colour
const DETAIL_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x262c33, roughness: 0.6, metalness: 0 });

// Accept a reported beam only within this fraction of length; anything else is
// a bad AIS entry (beam and length swapped, zero, 1 m placeholder...).
const MIN_BEAM_RATIO = 0.08;
const MAX_BEAM_RATIO = 0.6;

/**
 * Procedural fleet model for the type, stretched to the reported beam. The
 * detail mesh is marked `fixed` so AISView leaves its material alone.
 */
function AISModel({ code, scaleFactor, beamRatio }) {
    const model = fleetModel(code);
    const widthFactor = beamRatio ? beamRatio / model.beamRatio : 1;
    return (
        <group scale={[scaleFactor * widthFactor, scaleFactor, scaleFactor]}>
            <mesh geometry={model.body} material={AIS_MATERIALS.normal} />
            <mesh geometry={model.dark} material={DETAIL_MATERIAL} userData={{ fixed: true }} />
        </group>
    );
}

/**
 * Target length in scene units for a vessel, given its AIS length in metres.
 */
export const aisTargetSceneLength = (lengthMeters) =>
    Math.max(lengthMeters || BASE_MODEL_LENGTH, MIN_BOAT_LENGTH) * TARGET_SIZE_PER_METRE;

/**
 * AISBoat — renders one AIS vessel as its procedural fleet model.
 * The outer group is the ref the parent moves every frame; position and
 * rotation are therefore not React props (re-renders would snap the boat).
 */
const AISBoat = ({ boatData, onClick, ref }) => {
    const { length, beam } = boatData;
    const code = determineAisModelCode(boatData.shipType, length, beam);
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
            <AISModel code={code} scaleFactor={scaleFactor} beamRatio={beamRatio} />
        </group>
    );
};

export default AISBoat;
