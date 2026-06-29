import React, { useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

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

        // 1) Reorient robustly for any source authoring (Y-up, Z-up, lying down…):
        //    shortest extent -> up (Y), longest -> length (Z), middle -> beam (X).
        const size0 = new THREE.Vector3();
        new THREE.Box3().setFromObject(obj).getSize(size0);
        const unit = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
        const sorted = [['x', size0.x], ['y', size0.y], ['z', size0.z]].sort((a, b) => a[1] - b[1]);
        const upAxis = sorted[0][0];      // shortest
        const lengthAxis = sorted[2][0];  // longest
        const zc = unit[lengthAxis].clone();
        const yc = unit[upAxis].clone();
        const xc = new THREE.Vector3().crossVectors(yc, zc); // right-handed (no mirror)
        const basis = new THREE.Matrix4().makeBasis(xc, yc, zc).transpose();
        obj.applyMatrix4(basis); // now length->Z, up->Y

        // 2) Centre on X/Z, drop the hull bottom onto y=0, scale so length == BASE_MODEL_LENGTH
        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        obj.position.set(-center.x, -box.min.y, -center.z);
        const s = BASE_MODEL_LENGTH / (size.z || 1);

        const oriented = new THREE.Group();
        oriented.add(obj);
        oriented.scale.setScalar(s);
        oriented.rotation.y = AIS_YAW[code] || 0;
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
    const scaleFactor = desiredLength / BASE_MODEL_LENGTH;

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
