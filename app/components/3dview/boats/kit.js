/**
 * Procedural modelling kit shared by the generated boats (own boat models and
 * the AIS fleet): lookup tables, lofted surfaces from cross-sections,
 * mirroring, flat caps, tubes and foils. Units are metres (or model units);
 * the convention is bow towards -Z, starboard +X, up +Y.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Merges parts with different attributes / indexing (drops uvs) */
export const merge = (parts) => mergeGeometries(parts.map((g) => {
    const flat = g.index ? g.toNonIndexed() : g;
    if (flat.attributes.uv) flat.deleteAttribute('uv');
    return flat;
}));

export const smooth = (x) => x * x * (3 - 2 * x);
export const clamp01 = (x) => Math.max(0, Math.min(1, x));

/** Piecewise-linear lookup in a [[t, value], ...] table */
export const table = (rows) => (t) => {
    if (t <= rows[0][0]) return rows[0][1];
    for (let i = 1; i < rows.length; i++) {
        const [t1, v1] = rows[i];
        if (t <= t1) {
            const [t0, v0] = rows[i - 1];
            return v0 + (v1 - v0) * (t - t0) / (t1 - t0);
        }
    }
    return rows[rows.length - 1][1];
};


/** Cuts a polyline at height `y`: [below, above], each with the cut point */
export const splitAt = (pts, y) => {
    for (let i = 1; i < pts.length; i++) {
        if (pts[i][1] >= y) {
            const [x0, y0] = pts[i - 1];
            const [x1, y1] = pts[i];
            const k = clamp01((y - y0) / ((y1 - y0) || 1));
            const cut = [x0 + (x1 - x0) * k, y];
            return [[...pts.slice(0, i), cut], [cut, ...pts.slice(i)]];
        }
    }
    return [pts, [pts[pts.length - 1], pts[pts.length - 1]]];
};

/** Resamples a polyline to n points evenly spaced along its length */
export const resample = (pts, n) => {
    const acc = [0];
    for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = acc[acc.length - 1] || 1;
    const out = [];
    let j = 1;
    for (let k = 0; k < n; k++) {
        const s = total * k / (n - 1);
        while (j < pts.length - 1 && acc[j] < s) j++;
        const f = clamp01((s - acc[j - 1]) / ((acc[j] - acc[j - 1]) || 1));
        out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f]);
    }
    return out;
};

/**
 * Quad strip between successive sections ({ z, pts: [[x, y], ...] }).
 * Starboard surfaces ordered inside -> outside / bottom -> top face out;
 * `flip` reverses the winding (surfaces whose outside faces up: deck, roof).
 */
export const loft = (sections, flip = false) => {
    const pos = [];
    const rows = sections.length;
    const cols = sections[0].pts.length;
    for (const s of sections) {
        for (const p of s.pts) pos.push(p[0], p[1], p[2] ?? s.z);
    }
    const idx = [];
    for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
            const a = r * cols + c;
            const b = a + cols;
            if (flip) idx.push(a, b, a + 1, a + 1, b, b + 1);
            else idx.push(a, a + 1, b, a + 1, b + 1, b);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
};

/** Port copy of a starboard surface (mirrored, winding reversed) */
export const mirrorX = (geo) => {
    const m = geo.index ? geo.clone() : geo.clone().setIndex(Array.from({ length: geo.attributes.position.count }, (_, i) => i));
    m.scale(-1, 1, 1);
    const idx = m.getIndex().array.slice();
    for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
    m.setIndex(Array.from(idx));
    m.computeVertexNormals();
    return m;
};
export const bothSides = (geo) => merge([geo, mirrorX(geo)]);

/** Flat polygon (outline in x, y) at depth z, facing +Z (or -Z with `back`) */
export const cap = (outline, z, back = false) => {
    const g = new THREE.ShapeGeometry(new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y))));
    if (back) g.scale(1, 1, -1);
    g.translate(0, 0, z);
    if (back) {
        const idx = g.getIndex().array.slice();
        for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
        g.setIndex(Array.from(idx));
    }
    g.deleteAttribute('uv');
    g.computeVertexNormals();
    return g;
};


/** Tapered tube between two points */
export const tube = (a, b, r1, r2 = r1, seg = 10) => {
    const from = new THREE.Vector3(...a);
    const to = new THREE.Vector3(...b);
    const len = from.distanceTo(to);
    const g = new THREE.CylinderGeometry(r2, r1, len, seg);
    g.translate(0, len / 2, 0);
    const dir = to.clone().sub(from).normalize();
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir));
    g.translate(from.x, from.y, from.z);
    return g;
};


/** Symmetric foil section (NACA 00xx), `n` points per side, chord along +Z */
export const foilOutline = (chord, thickness, n = 12) => {
    const top = [];
    for (let i = 0; i <= n; i++) {
        const x = (1 - Math.cos(Math.PI * i / n)) / 2;
        const yt = 5 * thickness * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
        top.push([yt * chord, x * chord]);
    }
    return [...top, ...top.slice(1, -1).reverse().map(([y, x]) => [-y, x])];
};

/** Straight tapered foil between a root and a tip section (each { y, lead, chord, x }) */
export const foil = (root, tip, thickness) => {
    const a = foilOutline(root.chord, thickness);
    const b = foilOutline(tip.chord, thickness);
    const pos = [];
    for (const [s, sec] of [[a, root], [b, tip]]) {
        for (const [w, c] of s) pos.push((sec.x ?? 0) + w, sec.y, sec.lead + c);
    }
    const n = a.length;
    const idx = [];
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        idx.push(i, n + i, j, j, n + i, n + j);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
};
