// From the Ride game (laborima/chatel-apps-repository, about-matthieu/site/src/game/armIK.js).
// Runtime limb IK (arms and legs): after the animation mixer has blended the clips, pull each hand onto its grip (an empty animated
// with the rig: wishbone, mast or wing handle) with an analytic two-bone solve, keeping the elbow on the side the
// animation put it. All the maths happen in the model root's frame (the root may be mirrored with scale.x = -1).
import * as THREE from 'three';

const _m = new THREE.Matrix4(), _inv = new THREE.Matrix4(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const _q = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _qd = new THREE.Quaternion();
const S = new THREE.Vector3(), E = new THREE.Vector3(), W = new THREE.Vector3(), T = new THREE.Vector3(), E2 = new THREE.Vector3();
const u = new THREE.Vector3(), pole = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();

/** Position and rotation of obj in the frame of root (root's own scale removed). */
const inRoot = (root, obj, pos, quat) => {
    _inv.copy(root.matrixWorld).invert();
    _m.multiplyMatrices(_inv, obj.matrixWorld).decompose(pos || _p, quat || _q, _s);
};
/** Set obj's local rotation so that its rotation in the root frame becomes q. */
const setRootQuat = (root, obj, q) => {
    inRoot(root, obj.parent, null, _qp);
    obj.quaternion.copy(_qp.invert().multiply(q));
    obj.updateMatrixWorld(true);
};
/** Rotate obj (in the root frame) by the rotation taking direction from -> to. */
const turn = (root, obj, from, to) => {
    _qd.setFromUnitVectors(from.normalize(), to.normalize());
    const cur = new THREE.Quaternion(); inRoot(root, obj, null, cur);
    setRootQuat(root, obj, _qd.multiply(cur));
};

export const makeArmIK = (root) => {
    const get = (n) => root.getObjectByName(n);
    // arms onto the grips on the rig, legs onto the foot targets on the board (feet in the straps, flat on the deck)
    const arms = [['Arm', 'ForeArm', 'Hand', 'GripL', 'GripR'], ['UpLeg', 'Leg', 'Foot', 'FootL', 'FootR']].flatMap(([u1, f1, h1, gl, gr]) =>
        [['Left', gl], ['Right', gr]].map(([sd, g]) => ({
            upper: get(`${sd}${u1}`), fore: get(`${sd}${f1}`), hand: get(`${sd}${h1}`), grip: get(g), fix: null, isArm: u1 === 'Arm',
        }))).filter((x) => x.upper && x.fore && x.hand && x.grip);
    const hips = get('Hips'), chest = get('Spine2') || get('Spine1') || get('Spine');
    const H = new THREE.Vector3(), C = new THREE.Vector3(), out = new THREE.Vector3();
    const gq = new THREE.Quaternion();
    /** weight: 0..1 (blend between the animation and the IK) */
    return (weight = 1) => {
        if (!arms.length || weight <= 0) return;
        root.updateMatrixWorld(true);
        for (const arm of arms) {
            const { upper, fore, hand, grip } = arm;
            inRoot(root, upper, S); inRoot(root, fore, E); inRoot(root, hand, W); inRoot(root, grip, T, gq);
            // glTF converts the axes of objects (the grips) but not of joints: the hand's rotation in its grip's frame
            // is a constant (90 deg), measured once on the first frame, where the animation has the hand on the grip
            if (!arm.fix) { const hq = new THREE.Quaternion(); inRoot(root, hand, null, hq); arm.fix = gq.clone().invert().multiply(hq); }
            gq.multiply(arm.fix);
            const la = S.distanceTo(E), lb = E.distanceTo(W);
            if (weight < 1) T.lerpVectors(W, T, weight);
            const d = Math.min(Math.max(S.distanceTo(T), 1e-4), (la + lb) * 0.999);
            u.subVectors(T, S).normalize();
            if (arm.isArm && hips && chest) {
                // elbows down towards the hip and a little outwards: a stable bend, whatever the blend
                inRoot(root, hips, H); inRoot(root, chest, C);
                out.subVectors(S, C); out.y = 0; if (out.lengthSq() > 1e-8) out.normalize();
                pole.subVectors(H, S).normalize().addScaledVector(out, 0.45);
            } else pole.subVectors(E, S);                          // knees: where the animation put them
            pole.addScaledVector(u, -pole.dot(u));
            if (pole.lengthSq() < 1e-8) pole.set(0, -1, 0).addScaledVector(u, -u.y);
            pole.normalize();
            const cosA = Math.min(1, Math.max(-1, (la * la + d * d - lb * lb) / (2 * la * d)));
            E2.copy(S).addScaledVector(u, la * cosA).addScaledVector(pole, la * Math.sqrt(1 - cosA * cosA));
            turn(root, upper, a.subVectors(E, S), b.subVectors(E2, S));
            inRoot(root, fore, E); inRoot(root, hand, W);
            turn(root, fore, a.subVectors(W, E), b.subVectors(T, E));
            if (weight >= 1) setRootQuat(root, hand, gq);
            else { inRoot(root, hand, null, _q); setRootQuat(root, hand, _q.slerp(gq, weight)); }
        }
    };
};
