/**
 * Procedural 10.8 m cruiser-racer: generated in code, so the app ships no
 * third-party model. Lines of a modern French racer-cruiser: plumb bow, beam
 * carried all the way aft, hard chine, open transom, wide coachroof with a
 * raked windscreen, long hull window, fractional rig with bowsprit, T-bulb
 * keel and twin rudders. Matches RIG in ./rig.js.
 *
 * Frame: metres, bow towards -Z, starboard +X, waterline at y = 0.
 * Returns { part: { geometry } } like a loaded glTF's `nodes`, so the boat
 * component treats both the same way.
 */
import * as THREE from 'three';
import { RIG } from './rig';
import { bothSides, cap, clamp01, foil, loft, merge, resample, smooth, splitAt, table, tube } from '../kit';

const LOA = 10.8;

// Hull lines as functions of t: 0 at the stem, 1 at the transom
const zAt = (t) => -LOA / 2 + LOA * t;
// Half-beam at the sheer: fine entry, maximum beam carried to the transom
const halfBeam = table([[0, 0.05], [0.05, 0.34], [0.1, 0.62], [0.15, 0.87], [0.2, 1.08], [0.3, 1.42], [0.4, 1.66],
    [0.5, 1.83], [0.6, 1.94], [0.7, 1.99], [0.8, 2.0], [0.9, 1.98], [1, 1.92]]);
// Canoe body depth on the centreline (plumb stem, flat run aft)
const keelLine = table([[0, 0.08], [0.05, -0.01], [0.1, -0.11], [0.15, -0.2], [0.2, -0.28], [0.3, -0.39], [0.4, -0.45],
    [0.5, -0.47], [0.6, -0.45], [0.7, -0.38], [0.8, -0.28], [0.9, -0.14], [0.95, -0.06], [1, 0.02]]);
const sheer = (t) => 1.48 - 0.12 * t - 0.32 * t * t;
const chineY = (t) => 0.25 + 0.15 * t * t;
// Bottom from the keel to the chine, as (height fraction, beam fraction)
const BOTTOM = [[0, 0], [0.1, 0.53], [0.25, 0.68], [0.45, 0.77], [0.7, 0.87], [1, 0.95]];
const WATERLINE = 0.12;

// Reverse bow: the stem head sits aft of the forefoot, IMOCA style. Applied
// as a warp of the finished bow geometry (nothing changes below the waterline)
const REVERSE_BOW = 0.22;
const REVERSE_LENGTH = 0.18;
const bowSetback = (z, y) => {
    const t = (z + LOA / 2) / LOA;
    if (t >= REVERSE_LENGTH) return 0;
    return REVERSE_BOW * clamp01((y - 0.1) / 1.38) * (1 - t / REVERSE_LENGTH) ** 2;
};
const warpBow = (geo) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + bowSetback(p.getZ(i), p.getY(i)));
    p.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
};

/** Starboard half-section from the keel to the sheer: [[x, y], ...] */
const halfSection = (t) => {
    const hb = halfBeam(t);
    const d = keelLine(t);
    const c = Math.max(chineY(t), d + 0.1);
    const pts = BOTTOM.map(([u, w]) => [w * hb, d + u * (c - d)]);
    // Flared topsides: slightly convex up to the sheer
    pts.push([0.985 * hb, c + 0.45 * (sheer(t) - c)], [hb, sheer(t)]);
    return pts;
};

/** Topsides beam at height y (between the chine and the sheer) */
const topsideX = (t, y) => {
    const pts = halfSection(t).slice(BOTTOM.length - 1);
    for (let i = 1; i < pts.length; i++) {
        if (y <= pts[i][1]) {
            const [x0, y0] = pts[i - 1];
            const [x1, y1] = pts[i];
            return x0 + (x1 - x0) * clamp01((y - y0) / (y1 - y0));
        }
    }
    return pts[pts.length - 1][0];
};

// Stations: denser at the bow, where the lines change fastest
const STATIONS = Array.from({ length: 49 }, (_, i) => smooth(i / 48) * 0.35 + (i / 48) * 0.65);

// Hull in three bands, so the chine stays crisp and the boot top is sharp:
// underbody (antifouling), bottom above the waterline, topsides
const buildHull = () => {
    const under = [];
    const bottom = [];
    const sides = [];
    for (const t of STATIONS) {
        const z = zAt(t);
        const pts = halfSection(t);
        const lower = pts.slice(0, BOTTOM.length);
        const upper = pts.slice(BOTTOM.length - 1);
        const [below, above] = splitAt(lower, WATERLINE);
        under.push({ z, pts: resample(below, 7) });
        bottom.push({ z, pts: resample(above, 3) });
        sides.push({ z, pts: resample(upper, 4) });
    }
    // Transom: from the bottom up to the open cockpit floor in the middle
    const tr = halfSection(1);
    const [trBelow] = splitAt(tr, WATERLINE);
    const s1 = sheer(1);
    const hb1 = halfBeam(1);
    const cx = coamingX(1);
    const transomTop = [[hb1, s1], [cx + 0.1, s1 + 0.04], [cx, cockpitFloor(1) + 0.04], [0, cockpitFloor(1)]];
    const half = [...tr, ...transomTop.slice(1)];
    const outline = [...half, ...half.slice(0, -1).reverse().map(([x, y]) => [-x, y])];
    const trUnder = [...trBelow, ...trBelow.slice(0, -1).reverse().map(([x, y]) => [-x, y])];
    return {
        hull: merge([bothSides(loft(bottom)), bothSides(loft(sides)), cap(outline, zAt(1))]),
        bottom: merge([bothSides(loft(under)), cap(trUnder, zAt(1) + 0.002)]),
    };
};

// Deck: cambered foredeck and side decks; long open cockpit (one floor out
// to the open transom), its coamings sweeping down from the coachroof
const COCKPIT = { from: 0.6 };
const cockpitFloor = (t) => 0.66 - 0.06 * clamp01((t - COCKPIT.from) / (1 - COCKPIT.from));
const coamingX = (t) => 1.4 + 0.15 * clamp01((t - COCKPIT.from) / 0.4);
const deckHalf = (t) => {
    const hb = halfBeam(t) * 0.998;
    const s = sheer(t);
    const camber = (x) => s + 0.06 * (1 - (x / Math.max(hb, 0.01)) ** 2);
    if (t < COCKPIT.from) {
        // Eight points on the cambered deck
        return [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.88, 1].map(f => [f * hb, camber(f * hb)]);
    }
    const f = cockpitFloor(t);
    const cx = coamingX(t);
    const lip = s + 0.12 + 0.26 * smooth(clamp01((1 - t) / (1 - COCKPIT.from)));
    return [[0, f], [0.5, f + 0.01], [1.0, f + 0.04], [cx - 0.06, f + 0.1],
        [cx - 0.02, lip], [cx + 0.08, lip - 0.02], [cx + 0.14, s + 0.04], [hb, s]];
};
const buildDeck = () => {
    const ts = [...new Set([...STATIONS.filter(t => t < COCKPIT.from), COCKPIT.from - 0.004, COCKPIT.from,
        ...STATIONS.filter(t => t > COCKPIT.from)])].sort((x, y) => x - y);
    const sections = ts.map(t => ({ z: zAt(t), pts: deckHalf(t) }));
    return bothSides(loft(sections, true));
};

// Coachroof: long raked windscreen, wide flat top, chamfered sides
const ROOF = { from: 0.28, to: COCKPIT.from };
const roofTop = table([[0.28, 1.45], [0.32, 1.58], [0.37, 1.69], [0.43, 1.76], [0.5, 1.77], [0.6, 1.74]]);
const roofHalf = table([[0.28, 0.85], [0.38, 1.12], [0.48, 1.28], [0.6, 1.4]]);
const roofHalfSection = (t) => {
    const w = roofHalf(t);
    const base = sheer(t) + 0.03;
    const top = Math.max(base, roofTop(t));
    const h = top - base;
    return [[0, top + 0.02], [0.45 * w, top + 0.01], [w - 0.32, top - 0.05 * h], [w - 0.12, top - 0.35 * h], [w, base]];
};
const roofTs = Array.from({ length: 25 }, (_, i) => ROOF.from + (ROOF.to - ROOF.from) * (i / 24));
const buildRoof = () => {
    const roof = bothSides(loft(roofTs.map(t => ({ z: zAt(t), pts: roofHalfSection(t) })), true));
    // Aft face (companionway bulkhead)
    const half = roofHalfSection(ROOF.to);
    const outline = [...half.slice().reverse().map(([x, y]) => [-x, y]), ...half.slice(1)];
    return merge([roof, cap(outline, zAt(ROOF.to))]);
};

/** Point on the roof at section fraction f (0 centre .. 4 base), raised by `lift` */
const onRoof = (t, f, lift = 0.012) => {
    const pts = roofHalfSection(t);
    const i = Math.min(Math.floor(f), pts.length - 2);
    const k = f - i;
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    // Offset along the section normal (outwards / upwards)
    const nx = y1 - y0;
    const ny = -(x1 - x0);
    const n = Math.hypot(nx, ny) || 1;
    return [x0 + (x1 - x0) * k - (nx / n) * lift, y0 + (y1 - y0) * k - (ny / n) * lift];
};

// Dark glazing: windscreen across the raked front, side windows on the chamfer,
// and the long hull window band
const buildGlass = () => {
    const screenTs = Array.from({ length: 9 }, (_, i) => 0.298 + (0.41 - 0.298) * (i / 8));
    const screen = loft(screenTs.map((t) => {
        const fs = [0, 1, 1.8, 2.5];
        return { z: zAt(t), pts: fs.map(f => onRoof(t, f)) };
    }), true);
    const sideTs = Array.from({ length: 9 }, (_, i) => 0.42 + (0.585 - 0.42) * (i / 8));
    const side = loft(sideTs.map((t, i) => {
        const taper = Math.min(1, i / 2, (8 - i) / 2) * 0.35;
        return { z: zAt(t), pts: [onRoof(t, 3.5 - taper), onRoof(t, 3.05 + taper * 0.4)] };
    }), true);
    const bandTs = Array.from({ length: 21 }, (_, i) => 0.26 + (0.74 - 0.26) * (i / 20));
    const band = loft(bandTs.map((t, i) => {
        const end = Math.min(1, i / 1.5, (20 - i) / 1.5);
        const lo = 0.8 + 0.1 * (1 - end);
        const hi = 1.0 - 0.1 * (1 - end);
        return { z: zAt(t), pts: [[topsideX(t, lo) + 0.012, lo], [topsideX(t, hi) + 0.012, hi]] };
    }));
    return merge([bothSides(screen), bothSides(side), bothSides(band)]);
};

// Lighter port lights set in the hull window band
const buildPorts = () => {
    const parts = [];
    for (const [t0, t1] of [[0.36, 0.43], [0.5, 0.6]]) {
        const ts = Array.from({ length: 6 }, (_, i) => t0 + (t1 - t0) * (i / 5));
        parts.push(loft(ts.map(t => ({ z: zAt(t), pts: [[topsideX(t, 0.86) + 0.02, 0.86], [topsideX(t, 0.94) + 0.02, 0.94]] }))));
    }
    return bothSides(merge(parts));
};

// Thin dark lines: along the sheer and the boot top
const buildStripes = () => {
    const sheerLine = STATIONS.slice(1).map((t) => {
        const s = sheer(t);
        return { z: zAt(t), pts: [[topsideX(t, s - 0.09) + 0.006, s - 0.09], [topsideX(t, s - 0.035) + 0.006, s - 0.035]] };
    });
    const boot = STATIONS.slice(1).map((t) => {
        const [, above] = splitAt(halfSection(t).slice(0, BOTTOM.length), WATERLINE);
        const [x0, y0] = above[0];
        const [x1, y1] = above[1];
        const k = 0.06 / Math.max(0.01, y1 - y0);
        return { z: zAt(t), pts: [[x0 + 0.006, y0], [x0 + (x1 - x0) * Math.min(1, k) + 0.006, y0 + (y1 - y0) * Math.min(1, k)]] };
    });
    return bothSides(merge([loft(sheerLine), loft(boot)]));
};

const buildRig = () => {
    const foot = RIG.mastFoot;
    const head = RIG.masthead;
    const parts = [tube(foot, head, 0.11, 0.06, 14)];
    const mastAt = (y) => {
        const k = (y - foot[1]) / (head[1] - foot[1]);
        return [0, y, foot[2] + (head[2] - foot[2]) * k];
    };
    // Two sets of swept spreaders, shrouds over their tips to chainplates at the sheer
    const chainT = 0.53;
    const chain = [halfBeam(chainT) - 0.08, sheer(chainT) + 0.02, zAt(chainT)];
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
    // Forestay and bowsprit
    parts.push(tube(RIG.forestayTack, RIG.hounds, 0.012));
    parts.push(tube([0, 1.47, -4.2], RIG.bowsprit, 0.06, 0.04));
    return merge(parts);
};

const buildBoom = () => tube(RIG.gooseneck, [RIG.gooseneck[0], RIG.gooseneck[1], RIG.gooseneck[2] + RIG.boomLength], 0.085, 0.06, 12);

// T-bulb fin keel, ~2.05 m draft
const buildKeel = () => {
    const fin = foil({ y: -0.3, lead: -0.2, chord: 0.82 }, { y: -1.9, lead: -0.07, chord: 0.7 }, 0.12);
    const profile = [];
    const L = 2.3;
    for (let i = 0; i <= 16; i++) {
        const u = i / 16;
        const r = 0.21 * Math.sin(Math.PI * Math.min(1, u ** 0.8)) ** 0.8;
        profile.push(new THREE.Vector2(Math.max(r, 0.001), -L * u));
    }
    const bulb = new THREE.LatheGeometry(profile, 18);
    bulb.rotateX(-Math.PI / 2);
    bulb.scale(1, 0.75, 1);
    bulb.translate(0, -1.93, -0.85);
    return merge([fin, bulb]);
};

/** Rudder blade hung from its stock: pivot on top, canted along `axis` */
const buildRudder = ({ pivot, axis }) => {
    const span = 1.28;
    // Stock at 25 % of the root chord
    const blade = foil({ y: 0, lead: -0.09, chord: 0.36 }, { y: -span, lead: -0.04, chord: 0.24 }, 0.11);
    blade.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(...axis).normalize()));
    blade.translate(...pivot);
    return blade;
};

/** Closed outline along the sheer (deck edge), for a crisp silhouette from above */
export const sheerOutline = () => {
    const stbd = STATIONS.map((t) => {
        const y = sheer(t) + 0.02;
        return [halfBeam(t) + 0.01, y, zAt(t) + bowSetback(zAt(t), y)];
    });
    const port = stbd.map(([x, y, z]) => [-x, y, z]).reverse();
    return [...stbd, ...port, stbd[0]];
};

/** Half-beam of the deck edge at z, for laying hardware along the sheer */
export const deckEdgeAt = (z) => halfBeam(clamp01((z + LOA / 2) / LOA));

/** Deck height (top of the deck or roof) at a point, for placing hardware */
export const deckHeightAt = (x, z) => {
    const t = clamp01((z + LOA / 2) / LOA);
    const pts = deckHalf(t);
    const ax = Math.abs(x);
    for (let i = 1; i < pts.length; i++) {
        if (ax <= pts[i][0]) {
            const [x0, y0] = pts[i - 1];
            const [x1, y1] = pts[i];
            return y0 + (y1 - y0) * clamp01((ax - x0) / ((x1 - x0) || 1));
        }
    }
    return sheer(t);
};

let cache = null;

/** Geometry for every part, built once */
export const buildRacerParts = () => {
    if (cache) return cache;
    const geo = (g) => ({ geometry: g });
    const { hull, bottom } = buildHull();
    cache = {
        hull: geo(warpBow(hull)),
        bottom: geo(bottom),
        deck: geo(warpBow(buildDeck())),
        roof: geo(buildRoof()),
        glass: geo(buildGlass()),
        ports: geo(buildPorts()),
        stripes: geo(warpBow(buildStripes())),
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
