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
