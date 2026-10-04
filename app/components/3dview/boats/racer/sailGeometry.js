import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Cambered sail between a luff (bottom -> top) and a leech (clew -> head),
 * with draft stripes (the chord lines a trimmer reads camber from) and the
 * frame of each stripe for placing telltales.
 *
 * @param {Object} p
 * @param {THREE.Vector3} p.tack / p.head - luff ends
 * @param {THREE.Vector3} p.clew
 * @param {number} p.headWidth - chord at the head (square-top main), m
 * @param {number} p.camber - depth / chord
 * @param {number} p.draft - position of the deepest point along the chord (0..1)
 * @param {number} p.twist - leech opening at the head, rad
 * @param {number} p.leeward - +1 bulges to starboard, -1 to port
 * @param {number[]} p.stripes - heights (0..1 up the luff) of the draft stripes
 * @param {number} p.leechRound - leech curved out of the straight clew-head line, m (spinnaker shoulders)
 * @param {number} p.footRound - foot curved down below the straight tack-clew line, m
 */
export const makeSailGeometry = ({ tack, head, clew, headWidth = 0, camber = 0.1, draft = 0.4, twist = 0.1, leeward = 1, rows = 16, cols = 14, stripes = [], leechRound = 0, footRound = 0 }) => {
    const footChord = clew.clone().sub(tack);
    const headDir = footChord.clone().setY(0).normalize();
    const headClew = head.clone().addScaledVector(headDir, headWidth);
    // Exponent so that sin(PI * u^k) peaks at u = draft
    const k = Math.log(0.5) / Math.log(draft);
    // Depth shrinks towards the head, as on a real sail
    const depthAt = (v) => camber * (1 - 0.35 * v);

    /** Chord at height v: luff point, chord vector, normal to leeward */
    const frame = (v) => {
        const luff = tack.clone().lerp(head, v);
        const leech = clew.clone().lerp(headClew, v);
        // Round leech: pushed out along the chord, most at mid height
        if (leechRound) leech.addScaledVector(leech.clone().sub(luff).normalize(), leechRound * Math.sin(Math.PI * v));
        const chord = leech.clone().sub(luff);
        // Twist: the leech opens to leeward with height
        chord.applyAxisAngle(UP, -leeward * twist * v);
        const normal = new THREE.Vector3().crossVectors(UP, chord).normalize();
        if (Math.sign(normal.x || 1) !== Math.sign(leeward)) normal.negate();
        return { luff, chord, normal, len: chord.length() };
    };
    const point = (f, u) => f.luff.clone().addScaledVector(f.chord, u)
        .addScaledVector(f.normal, depthAt(f.v) * f.len * Math.sin(Math.PI * u ** k))
        .addScaledVector(UP, -footRound * Math.sin(Math.PI * u) * (1 - f.v) ** 3);

    const positions = [];
    const uvs = [];
    for (let r = 0; r <= rows; r++) {
        const f = { ...frame(r / rows), v: r / rows };
        for (let c = 0; c <= cols; c++) {
            const p = point(f, c / cols);
            positions.push(p.x, p.y, p.z);
            uvs.push(c / cols, r / rows);
        }
    }
    const index = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const a = r * (cols + 1) + c;
            const b = a + cols + 1;
            index.push(a, b, a + 1, a + 1, b, b + 1);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(index);
    geo.computeVertexNormals();

    // Outline (foot, leech, luff) so a light sail still reads on a light scene
    const at = (r, c) => { const i = (r * (cols + 1) + c) * 3; return [positions[i], positions[i + 1], positions[i + 2]]; };
    const outline = [];
    for (let c = 0; c <= cols; c++) outline.push(at(0, c));
    for (let r = 1; r <= rows; r++) outline.push(at(r, cols));
    for (let c = cols - 1; c >= 0; c--) outline.push(at(rows, c));
    for (let r = rows - 1; r >= 0; r--) outline.push(at(r, 0));
    geo.userData.outline = outline;

    // Draft stripes, drawn just off both faces so they read from either side
    geo.userData.stripes = stripes.map((v) => {
        const f = { ...frame(v), v };
        const line = (side) => Array.from({ length: 21 }, (_, i) => point(f, i / 20).addScaledVector(f.normal, side * 0.03).toArray());
        return {
            v,
            frame: f,
            lee: line(1),
            windward: line(-1),
            deepest: point(f, draft).addScaledVector(f.normal, 0.04),
            point: (u) => point(f, u),
        };
    });
    return geo;
};
