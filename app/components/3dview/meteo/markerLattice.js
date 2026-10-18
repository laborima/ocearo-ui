import * as THREE from 'three';

/**
 * Ground-anchored points for flow markers, about evenly spread on screen: a
 * lattice of `step` metres near the camera that keeps every 2nd, 4th, 8th…
 * node further away, so the markers stay put on the ground as the boat moves
 * without crowding at the horizon.
 *
 * @param {number} cx, cy - camera position over the ground, metres in the lattice frame
 * @param {number} radius - metres around (0, 0) covered
 * @param {number} step - spacing near the camera, metres
 * @param {number} near - distance up to which every node is kept, metres
 * @param {number} origin - lattice origin in the same frame (east, north), so it is fixed to the ground
 * @returns {Array<{e:number,n:number,d:number}>} nodes (lattice frame) and distance to the camera
 */
export const markerLattice = ({ cx, cy, radius, step, near, originE = 0, originN = 0, max = 60 }) => {
    const out = [];
    const i0 = Math.ceil((originE - radius) / step);
    const i1 = Math.floor((originE + radius) / step);
    const j0 = Math.ceil((originN - radius) / step);
    const j1 = Math.floor((originN + radius) / step);
    for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
            const e = i * step;
            const n = j * step;
            if (Math.hypot(e - originE, n - originN) > radius) continue;
            const d = Math.hypot(e - cx, n - cy);
            const level = d <= near ? 0 : Math.ceil(Math.log2(d / near));
            const every = 2 ** level;
            if (i % every !== 0 || j % every !== 0) continue;
            out.push({ e, n, d });
        }
    }
    return out.sort((a, b) => a.d - b.d).slice(0, max);
};

/**
 * True when two marker lists show the same thing (same places, speeds to the
 * hundredth, same trend): the layer then keeps the old list and React skips
 * a render.
 */
export const sameMarkers = (a, b) => a.length === b.length && a.every((m, i) => {
    const o = b[i];
    return m.key === o.key && Math.abs(m.speed - o.speed) < 0.005 && Math.sign(Math.round(m.trend * 20)) === Math.sign(Math.round(o.trend * 20))
        && Math.abs(m.len - o.len) < 1e-3 && m.x === o.x && m.y === o.y;
});

/**
 * Test for points of a layer's frame: in front of the camera, inside the view
 * away from its edges (margin, in normalised screen units), and clear of the
 * HUD (anything marked data-hud-solid: values, bars, cards), `pad` pixels
 * around it: an arrow drawn over the speed or the depth curve hid them.
 */
export const onScreenTest = (object, camera, canvas, margin = 0.9, pad = 60) => {
    const v = new THREE.Vector3();
    object.updateWorldMatrix(true, false);
    const view = canvas.getBoundingClientRect();
    const hud = typeof document === 'undefined' ? [] : [...document.querySelectorAll('[data-hud-solid]')]
        .filter((el) => el.offsetParent !== null)
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0);
    return (x, y, z) => {
        v.set(x, y, z);
        object.localToWorld(v).project(camera);
        if (v.z >= 1 || Math.abs(v.x) > margin || Math.abs(v.y) > margin) return false;
        const px = view.left + (v.x + 1) / 2 * view.width;
        const py = view.top + (1 - v.y) / 2 * view.height;
        return !hud.some((r) => px > r.left - pad && px < r.right + pad && py > r.top - pad && py < r.bottom + pad);
    };
};
