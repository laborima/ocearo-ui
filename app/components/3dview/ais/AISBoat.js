import React, { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { fleetModel, FLEET_LENGTH, sailingModelCode } from './fleetGeometry';

const ASSET_PREFIX = process.env.ASSET_PREFIX || './';

// Models are normalised to this length; AISBoat scales them to the vessel's
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
    normal: new THREE.MeshStandardMaterial({ color: 0x8a9097, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide }),
    alert: new THREE.MeshStandardMaterial({ color: 0xff2d38, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide }),
    selected: new THREE.MeshStandardMaterial({ color: 0x09bfff, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide }),
};

// Glazing, boot top and funnel tops: dark whatever the state colour
const DETAIL_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x262c33, roughness: 0.6, metalness: 0 });

// Accept a reported beam only within this fraction of length; anything else is
// a bad AIS entry (beam and length swapped, zero, 1 m placeholder...).
const MIN_BEAM_RATIO = 0.08;
const MAX_BEAM_RATIO = 0.6;

// Fleet glTF models (public/boats/ais, see ATTRIBUTION.md), one per AIS code;
// sailing vessels too big or wide for the small yacht model use the
// procedural ketch / superyacht / catamaran (fleetGeometry)
const GLB_CODES = { 30: 30, 31: 31, 35: 35, 37: 37, 40: 40, 50: 50, 60: 60, 70: 70, 80: 80, '36s': 36, '36m': 36 };
const modelUrl = (code) => `${ASSET_PREFIX}/boats/ais/ais-${code}.glb`;
const dracoPath = `${ASSET_PREFIX}/draco/`;

// Yaw correction (radians) so every model's bow points to -Z after
// normalisation, checked against bridge / stem / propeller positions
const AIS_YAW = { 31: Math.PI, 35: Math.PI, 40: Math.PI, 50: Math.PI, 60: Math.PI, 70: Math.PI, 80: Math.PI };
// Draft as a fraction of hull length, from the lowest point of the model
const AIS_SINK = { 30: 0.11, 31: 0.12, 35: 0.05, 36: 0.17, 37: 0.07, 40: 0.05, 50: 0.08, 60: 0.045, 70: 0.06, 80: 0.07 };
const DEFAULT_SINK = 0.06;
// FSD look: smooth shading over the low-poly facets, hard edges kept
const CREASE_ANGLE = 35 * Math.PI / 180;

const templateCache = new WeakMap();

/**
 * Normalised template for a fleet glTF: one geometry with creased normals
 * per mesh and the shared state material, upright, centred, hull sunk to
 * its waterline, length along Z with the bow at -Z, BASE_MODEL_LENGTH long.
 */
const buildTemplate = (scene, code) => {
    const obj = scene.clone(true);
    obj.traverse((o) => {
        if (o.isMesh) {
            o.geometry = toCreasedNormals(o.geometry, CREASE_ANGLE);
            o.material = AIS_MATERIALS.normal;
            o.castShadow = false;
            o.receiveShadow = false;
        }
    });
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const lengthAlongX = size.x >= size.z;
    const len = Math.max(size.x, size.z) || 1;
    const sink = len * (AIS_SINK[code] ?? DEFAULT_SINK);
    obj.position.set(-center.x, -box.min.y - sink, -center.z);
    const oriented = new THREE.Group();
    oriented.add(obj);
    oriented.scale.setScalar(BASE_MODEL_LENGTH / len);
    oriented.rotation.y = (lengthAlongX ? Math.PI / 2 : 0) + (AIS_YAW[code] || 0);
    oriented.userData.beamRatio = (Math.min(size.x, size.z) / len) || 0.25;
    return oriented;
};

function GltfModel({ glbCode, scaleFactor, beamRatio }) {
    const { scene } = useGLTF(modelUrl(glbCode), dracoPath);
    const model = useMemo(() => {
        let template = templateCache.get(scene);
        if (!template) {
            template = buildTemplate(scene, glbCode);
            templateCache.set(scene, template);
        }
        return template.clone(true);
    }, [scene, glbCode]);
    const widthFactor = beamRatio ? beamRatio / model.userData.beamRatio : 1;
    return (
        <group scale={[scaleFactor * widthFactor, scaleFactor, scaleFactor]}>
            <primitive object={model} />
        </group>
    );
}

/**
 * Procedural model (larger sailing yachts, catamarans), stretched to the
 * reported beam. The detail mesh is marked `fixed` so AISView leaves its
 * material alone.
 */
function ProceduralModel({ code, scaleFactor, beamRatio }) {
    const model = fleetModel(code);
    const widthFactor = beamRatio ? beamRatio / model.beamRatio : 1;
    return (
        <group scale={[scaleFactor * widthFactor, scaleFactor, scaleFactor]}>
            <mesh geometry={model.body} material={AIS_MATERIALS.normal} />
            <mesh geometry={model.dark} material={DETAIL_MATERIAL} userData={{ fixed: true }} />
        </group>
    );
}

const AISModel = ({ code, scaleFactor, beamRatio }) => (GLB_CODES[code] !== undefined
    ? <GltfModel glbCode={GLB_CODES[code]} scaleFactor={scaleFactor} beamRatio={beamRatio} />
    : <ProceduralModel code={code} scaleFactor={scaleFactor} beamRatio={beamRatio} />);

/**
 * Target length in scene units for a vessel, given its AIS length in metres.
 */
export const aisTargetSceneLength = (lengthMeters) =>
    Math.max(lengthMeters || BASE_MODEL_LENGTH, MIN_BOAT_LENGTH) * TARGET_SIZE_PER_METRE;

/**
 * AISBoat — renders one AIS vessel as its fleet model.
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
            {/* Per-boat Suspense so a model still loading never blanks the scene */}
            <Suspense fallback={null}>
                <AISModel code={code} scaleFactor={scaleFactor} beamRatio={beamRatio} />
            </Suspense>
        </group>
    );
};

export default AISBoat;
