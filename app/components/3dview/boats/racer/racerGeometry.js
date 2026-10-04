/**
 * Procedural 10.8 m cruiser-racer: generated in code, so the app ships no
 * third-party model. Proportions of a modern wide-transom design (fine bow,
 * hard chine aft, open transom, fractional rig with bowsprit, twin rudders),
 * matching RIG in ./rig.js.
 *
 * Frame: metres, bow towards -Z, starboard +X, waterline at y = 0.
 * Returns { part: { geometry } } like a loaded glTF's `nodes`, so the boat
 * component treats both the same way.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RIG } from './rig';

const LOA = 10.8;
const HALF_BEAM = 1.95;
const STATIONS = 44;

const smooth = (x) => x * x * (3 - 2 * x);

// Hull lines as functions of t: 0 at the stem, 1 at the transom
const zAt = (t) => -LOA / 2 + LOA * t;
const halfBeam = (t) => {
    const fwd = 1 - (1 - Math.min(t / 0.72, 1)) ** 2.1;
    const aft = Math.max(0, (t - 0.72) / 0.28);
    return HALF_BEAM * fwd * (1 - 0.07 * aft * aft);
};
const sheer = (t) => 1.48 - 0.36 * t;
const chine = (t) => 0.95 - 0.75 * smooth(t);       // hard chine, low aft
const keelLine = (t) => -0.48 * Math.sin(Math.PI * Math.min(1, (t + 0.05) / 1.0)) ** 0.75;

/** One hull section, port sheer -> keel -> starboard sheer: [x, y] */
const section = (t) => {
    const hb = halfBeam(t);
    const d = keelLine(t);
    const c = Math.max(chine(t), d + 0.15);
    const half = [
        [0, d],
        [hb * 0.42, d * 0.92],
        [hb * 0.78, d * 0.55 + c * 0.1],
        [hb * 0.97, c],
        [hb, sheer(t)],
    ];
    const port = half.slice(1).reverse().map(([x, y]) => [-x, y]);
    return [...port, ...half];
};

/** Quad strip between successive sections; `color(y)` per vertex */
const loft = (sections, color) => {
    const pos = [];
    const col = [];
    const rows = sections.length;
    const cols = sections[0].pts.length;
    for (const s of sections) {
        for (const [x, y] of s.pts) {
            pos.push(x, y, s.z);
            const c = color ? color(y) : 1;
            col.push(c, c, c);
        }
    }
    const idx = [];
    for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
            const a = r * cols + c;
            const b = a + cols;
            idx.push(a, a + 1, b, a + 1, b + 1, b);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
};

const ts = Array.from({ length: STATIONS + 1 }, (_, i) => i / STATIONS);

const buildHull = () => {
    // Bottom paint as a darker shade of the hull colour (vertex colours)
    const hull = loft(ts.map(t => ({ z: zAt(t), pts: section(t) })), (y) => (y < 0.04 ? 0.22 : 1));
    // Transom: fan from its centre
    const tr = section(1);
    const cz = zAt(1);
    const pos = [0, 0.6, cz];
    for (const [x, y] of tr) pos.push(x, y, cz);
    const idx = [];
    for (let i = 1; i < tr.length; i++) idx.push(0, i + 1, i);
    const transom = new THREE.BufferGeometry();
    transom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    transom.setAttribute('color', new THREE.Float32BufferAttribute(new Array(pos.length).fill(1), 3));
    transom.setIndex(idx);
    transom.computeVertexNormals();
    return mergeGeometries([hull, transom]);
};

// Deck: cambered, with the cockpit well (floor ~0.62 m) open to the transom
const COCKPIT_FROM = 0.68;
const COCKPIT_HALF = 1.25;
const buildDeck = () => {
    const sections = ts.map((t) => {
        const hb = halfBeam(t) * 0.995;
        const s = sheer(t);
        const camber = (x) => s + 0.07 * (1 - (x / Math.max(hb, 0.01)) ** 2);
        let xs;
        if (t >= COCKPIT_FROM && hb > COCKPIT_HALF + 0.15) {
            const floor = 0.62;
            const pts = [[-hb, s], [-(COCKPIT_HALF + 0.05), camber(COCKPIT_HALF + 0.05)], [-COCKPIT_HALF, floor], [0, floor], [COCKPIT_HALF, floor], [COCKPIT_HALF + 0.05, camber(COCKPIT_HALF + 0.05)], [hb, s]];
            return { z: zAt(t), pts };
        }
        xs = [-1, -0.68, -0.64, 0, 0.64, 0.68, 1].map(f => f * hb);
        return { z: zAt(t), pts: xs.map(x => [x, camber(x)]) };
    });
    return loft(sections);
};

// Coachroof with a sloped front, and its side windows
const ROOF = { from: -3.2, to: 1.9, halfWidth: 1.05, height: 0.42 };
const buildRoof = () => {
    const n = 16;
    const sections = [];
    for (let i = 0; i <= n; i++) {
        const z = ROOF.from + (ROOF.to - ROOF.from) * (i / n);
        const t = (z + LOA / 2) / LOA;
        const base = sheer(t) + 0.05;
        const rise = Math.min(1, (z - ROOF.from) / 0.9);   // sloped front
        const hw = ROOF.halfWidth * (0.78 + 0.22 * Math.min(1, (z - ROOF.from) / 2.5));
        const top = base + ROOF.height * smooth(rise);
        sections.push({ z, pts: [[-hw, base], [-(hw - 0.12), top], [0, top + 0.04], [hw - 0.12, top], [hw, base]] });
    }
    return loft(sections);
};
const buildWindows = () => {
    const parts = [];
    for (const side of [-1, 1]) {
        const g = new THREE.PlaneGeometry(2.6, 0.13);
        g.rotateY(side * Math.PI / 2);
        // Lean with the roof side
        g.rotateZ(side * 0.27);
        g.translate(side * (ROOF.halfWidth - 0.055), sheer(0.45) + 0.29, -0.6);
        parts.push(g);
    }
    return mergeGeometries(parts);
};

// Dark band along the sheer: the racer's signature line
const buildStripes = () => {
    const sections = ts.slice(1).map((t) => {
        const hb = halfBeam(t) + 0.004;
        const s = sheer(t);
        return { z: zAt(t), pts: [[-hb, s - 0.16], [-hb, s - 0.06]] };
    });
    const port = loft(sections);
    const stbd = loft(sections.map(sec => ({ z: sec.z, pts: sec.pts.map(([x, y]) => [-x, y]).reverse() })));
    return mergeGeometries([port, stbd]);
};

/** Tapered tube between two points */
const tube = (a, b, r1, r2 = r1, seg = 10) => {
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

const buildRig = () => {
    const foot = RIG.mastFoot;
    const head = RIG.masthead;
    const parts = [tube(foot, head, 0.11, 0.06, 14)];
    const mastAt = (y) => {
        const k = (y - foot[1]) / (head[1] - foot[1]);
        return [0, y, foot[2] + (head[2] - foot[2]) * k];
    };
    // Two sets of swept spreaders, shrouds over their tips
    const chain = [1.62, 1.42, -0.1];
    for (const side of [-1, 1]) {
        const s1 = mastAt(6.0);
        const s2 = mastAt(10.1);
        const tip1 = [side * 0.95, 6.0, s1[2] + 0.35];
        const tip2 = [side * 0.6, 10.1, s2[2] + 0.22];
        parts.push(tube(s1, tip1, 0.035), tube(s2, tip2, 0.03));
        const plate = [side * chain[0], chain[1], chain[2]];
        parts.push(tube(plate, tip1, 0.012), tube(tip1, tip2, 0.012), tube(tip2, RIG.hounds, 0.012));
        parts.push(tube(plate, mastAt(6.0), 0.01));
    }
    // Forestay, inner stay and bowsprit
    parts.push(tube(RIG.forestayTack, RIG.hounds, 0.012));
    parts.push(tube([0, 1.45, -5.2], RIG.bowsprit, 0.05, 0.035));
    return mergeGeometries(parts);
};

const buildBoom = () => tube(RIG.gooseneck, [RIG.gooseneck[0], RIG.gooseneck[1], RIG.gooseneck[2] + RIG.boomLength], 0.085, 0.06, 12);

// Fin keel with a bulb (draft ~2.0 m)
const buildKeel = () => {
    const fin = new THREE.BoxGeometry(0.11, 1.5, 0.85);
    fin.translate(0, -1.1, -0.85);
    const bulb = new THREE.CapsuleGeometry(0.24, 1.7, 6, 14);
    bulb.rotateX(Math.PI / 2);
    bulb.translate(0, -1.88, -0.75);
    return mergeGeometries([fin, bulb].map(g => g.toNonIndexed()));
};

/** Rudder blade hung from its stock: pivot on top, canted along `axis` */
const buildRudder = ({ pivot, axis }) => {
    const span = 1.25;
    const blade = new THREE.BoxGeometry(0.05, span, 0.46);
    // Stock at 25 % of the chord: leading edge 0.12 m forward of it
    blade.translate(0, -span / 2, 0.11);
    blade.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(...axis).normalize()));
    blade.translate(...pivot);
    return blade;
};

let cache = null;

/** Geometry for every part, built once */
export const buildRacerParts = () => {
    if (cache) return cache;
    const geo = (g) => ({ geometry: g });
    cache = {
        hull: geo(buildHull()),
        deck: geo(buildDeck()),
        roof: geo(buildRoof()),
        glass: geo(buildWindows()),
        stripes: geo(buildStripes()),
        rig: geo(buildRig()),
        boom: geo(buildBoom()),
        keel_single_twinrudder: geo(buildKeel()),
        keel_single_twinrudder_rudder_port: geo(buildRudder(RIG.rudders.port)),
        keel_single_twinrudder_rudder_starboard: geo(buildRudder(RIG.rudders.starboard)),
        keel_single_singlerudder: geo(buildKeel()),
        keel_single_singlerudder_rudder_centre: geo(buildRudder(RIG.rudders.centre)),
    };
    return cache;
};
