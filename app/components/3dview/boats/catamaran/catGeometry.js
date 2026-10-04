/**
 * Procedural 14 m performance cruising catamaran (Gunboat-like): slender
 * plumb-bowed hulls, high bridgedeck with a low deckhouse wrapped in dark
 * glass, hardtop over the aft cockpit, trampoline forward between the bows,
 * daggerboards, a rudder per hull and a tall carbon rig. Same style and
 * conventions as the racer: metres, bow towards -Z, starboard +X, waterline
 * at y = 0, parts returned as { part: { geometry } }.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { bothSides, cap, clamp01, foil, loft, merge, table, tube } from '../kit';
import { CAT_RIG } from './rig';

export const CAT = {
    loa: 14,
    hullX: 2.9,          // hull centreline offset
    bridgeFrom: -1.9,    // bridgedeck forward edge (z)
    bridgeUnder: 1.05,   // wet-deck clearance
    deckY: 1.5,          // bridgedeck / cockpit floor level
};

const L = CAT.loa;
const zAt = (t) => -L / 2 + L * t;
const STATIONS = Array.from({ length: 41 }, (_, i) => i / 40);

// One hull: fine entry, nearly parallel aft, wide transom
const halfBeam = table([[0, 0.04], [0.06, 0.3], [0.15, 0.52], [0.3, 0.66], [0.5, 0.72], [0.8, 0.72], [1, 0.68]]);
const keelDepth = table([[0, 0.05], [0.05, -0.2], [0.15, -0.45], [0.4, -0.6], [0.7, -0.55], [0.9, -0.35], [1, -0.12]]);
const sheer = (t) => 1.6 - 0.15 * t;

/** Half-section of a hull, from the keel to the deck edge (rounded V, slight flare) */
const section = (t) => {
    const hb = halfBeam(t);
    const d = keelDepth(t);
    const s = sheer(t);
    return [[0, d], [hb * 0.45, d + 0.12], [hb * 0.8, d + 0.38], [hb * 0.93, Math.min(0.2, s)], [hb * 0.98, s * 0.6], [hb, s]];
};

const buildHull = () => {
    const side = bothSides(loft(STATIONS.map(t => ({ z: zAt(t), pts: section(t) }))));
    const tr = section(1);
    const transom = cap([...tr.slice().reverse().map(([x, y]) => [-x, y]), ...tr.slice(1)], zAt(1));
    const one = merge([side, transom]);
    return merge([one.clone().translate(-CAT.hullX, 0, 0), one.clone().translate(CAT.hullX, 0, 0)]);
};

const prism = (profile, width) => {
    const shape = new THREE.Shape(profile.map(([z, y]) => new THREE.Vector2(-z, y)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
    g.rotateY(Math.PI / 2);
    g.translate(-width / 2, 0, 0);
    return g;
};

// Hull decks (flat tops of the hulls) and the bridgedeck between them
const buildDeck = () => {
    const hullDeck = bothSides(loft(STATIONS.map(t => ({ z: zAt(t), pts: [[0, sheer(t) + 0.02], [halfBeam(t), sheer(t)]] })), true));
    const decks = [hullDeck.clone().translate(-CAT.hullX, 0, 0), hullDeck.clone().translate(CAT.hullX, 0, 0)];
    const inner = CAT.hullX - 0.55;
    const length = zAt(1) - 0.3 - CAT.bridgeFrom;
    const bridge = new RoundedBoxGeometry(inner * 2, CAT.deckY - CAT.bridgeUnder, length, 2, 0.12);
    bridge.translate(0, (CAT.deckY + CAT.bridgeUnder) / 2, CAT.bridgeFrom + length / 2);
    // Nacelle: the bridgedeck front sloped down and forward, Gunboat style
    const nose = prism([[CAT.bridgeFrom - 0.9, CAT.deckY - 0.05], [CAT.bridgeFrom + 0.1, CAT.deckY], [CAT.bridgeFrom + 0.1, CAT.bridgeUnder - 0.15]], inner * 2 - 0.1);
    return merge([...decks, bridge, nose]);
};

// Deckhouse with a raked front and the hardtop over the aft cockpit
const HOUSE = { from: -1.75, to: 2.6, height: 1.1, width: 5.0, roofTo: 5.9 };
const buildHouse = () => {
    const h = HOUSE;
    const house = prism([[h.from, 0], [h.from + 1.3, h.height], [h.to, h.height], [h.to, 0]], h.width);
    house.translate(0, CAT.deckY, 0);
    // Hardtop: thin roof carried aft over the cockpit, on two slim posts
    const roof = new RoundedBoxGeometry(h.width + 0.3, 0.1, h.roofTo - h.to + 1.4, 2, 0.04);
    roof.translate(0, CAT.deckY + h.height + 0.05, (h.roofTo + h.to - 1.4) / 2 + 0.35);
    const posts = [-1, 1].map(s => tube([s * (h.width / 2 - 0.1), CAT.deckY, h.roofTo - 0.2], [s * (h.width / 2 - 0.1), CAT.deckY + h.height, h.roofTo - 0.2], 0.05));
    return merge([house, roof, ...posts]);
};

// Dark glazing wrapped round the deckhouse front and sides
const buildGlass = () => {
    const h = HOUSE;
    const band = prism([[h.from + 0.14, 0.2], [h.from + 1.18, h.height - 0.15], [h.to - 0.3, h.height - 0.15], [h.to - 0.3, 0.2]], h.width + 0.02);
    band.translate(0, CAT.deckY, 0);
    return band;
};

// Trampoline between the bows, forward crossbeam and the central longeron
const buildNet = () => {
    const inner = CAT.hullX - 0.5;
    const shape = new THREE.Shape([
        new THREE.Vector2(-inner, -CAT.bridgeFrom), new THREE.Vector2(inner, -CAT.bridgeFrom),
        new THREE.Vector2(inner - 0.05, 5.5), new THREE.Vector2(-inner + 0.05, 5.5),
    ]);
    const net = new THREE.ShapeGeometry(shape);
    net.rotateX(-Math.PI / 2);
    net.translate(0, 1.5, 0);
    return net;
};

const buildRig = () => {
    const r = CAT_RIG;
    const parts = [tube(r.mastFoot, r.masthead, 0.13, 0.07, 14)];
    // Diamond-free wing-style mast: shrouds to the hulls, forestay to the beam
    for (const s of [-1, 1]) parts.push(tube([s * (CAT.hullX - 0.1), sheer(0.45), zAt(0.45)], r.hounds, 0.014));
    parts.push(tube(r.forestayTack, r.hounds, 0.014));
    parts.push(tube([-CAT.hullX, 1.5, -5.5], [CAT.hullX, 1.5, -5.5], 0.1));       // forward crossbeam
    parts.push(tube([0, 1.48, CAT.bridgeFrom], r.bowsprit, 0.09, 0.06));            // longeron / bowsprit
    for (const s of [-1, 1]) parts.push(tube([0, 1.48, -5.5], [s * (CAT.hullX - 0.3), 1.5, -6.6], 0.02)); // bridles
    return merge(parts);
};

const buildBoom = () => tube(CAT_RIG.gooseneck, [0, CAT_RIG.gooseneck[1], CAT_RIG.gooseneck[2] + CAT_RIG.boomLength], 0.1, 0.07, 12);

// Daggerboards (half down) and a rudder blade per hull
const buildBoards = () => merge([-1, 1].map(s => foil({ y: 0.2, lead: 0.2, chord: 0.5, x: s * CAT.hullX }, { y: -1.6, lead: 0.3, chord: 0.42, x: s * CAT.hullX }, 0.12)));
const buildRudder = ({ pivot }) => {
    const blade = foil({ y: 0, lead: -0.12, chord: 0.45 }, { y: -1.1, lead: -0.06, chord: 0.3 }, 0.11);
    blade.translate(...pivot);
    return blade;
};

// Long window band on the outer side of each hull and a boot top all round
const outerX = (t, y) => {
    const pts = section(t);
    for (let i = 1; i < pts.length; i++) {
        if (y <= pts[i][1]) {
            const [x0, y0] = pts[i - 1];
            const [x1, y1] = pts[i];
            return x0 + (x1 - x0) * clamp01((y - y0) / ((y1 - y0) || 1));
        }
    }
    return pts[pts.length - 1][0];
};
const buildStripes = () => {
    const band = loft(Array.from({ length: 21 }, (_, i) => {
        const t = 0.28 + 0.47 * (i / 20);
        const end = Math.min(1, i / 1.5, (20 - i) / 1.5);
        const lo = 0.82 + 0.08 * (1 - end);
        const hi = 1.02 - 0.08 * (1 - end);
        return { z: zAt(t), pts: [[outerX(t, lo) + 0.012, lo], [outerX(t, hi) + 0.012, hi]] };
    }));
    const boot = bothSides(loft(STATIONS.slice(1).map(t => ({ z: zAt(t), pts: [[outerX(t, 0.1) + 0.008, 0.1], [outerX(t, 0.16) + 0.008, 0.16]] }))));
    // Window band on the outboard side only (starboard hull: +X side)
    const stbdBand = band.clone().translate(CAT.hullX, 0, 0);
    const portBand = band.clone().scale(-1, 1, 1).translate(-CAT.hullX, 0, 0);
    return merge([stbdBand, portBand, boot.clone().translate(-CAT.hullX, 0, 0), boot.clone().translate(CAT.hullX, 0, 0)]);
};

/** Outline of both hull decks, for a crisp silhouette from above */
export const catOutline = () => [-1, 1].map((s) => {
    const stbd = STATIONS.map(t => [s * CAT.hullX + halfBeam(t) + 0.01, sheer(t) + 0.02, zAt(t)]);
    const port = STATIONS.map(t => [s * CAT.hullX - halfBeam(t) - 0.01, sheer(t) + 0.02, zAt(t)]).reverse();
    return [...stbd, ...port, stbd[0]];
});

/** Inboard edge of the starboard hull deck at z, for the jib tracks */
export const catDeckEdgeAt = (z) => CAT.hullX - halfBeam(clamp01((z + L / 2) / L)) + 0.45;

/** Deck height under a point: hardtop, deckhouse roof, bridgedeck or hull deck */
export const catDeckHeightAt = (x, z) => {
    const h = HOUSE;
    if (Math.abs(x) <= h.width / 2 && z >= h.to && z <= h.roofTo + 0.3) return CAT.deckY + h.height + 0.1;
    if (Math.abs(x) <= h.width / 2 && z >= h.from + 1.3 && z < h.to) return CAT.deckY + h.height;
    const t = clamp01((z + L / 2) / L);
    if (Math.abs(Math.abs(x) - CAT.hullX) <= halfBeam(t)) return sheer(t) + 0.02;
    return z >= CAT.bridgeFrom ? CAT.deckY : 1.5;
};

let cache = null;

/** Geometry for every part, built once */
export const buildCatParts = () => {
    if (cache) return cache;
    const geo = (g) => ({ geometry: g });
    cache = {
        hull: geo(buildHull()),
        deck: geo(buildDeck()),
        roof: geo(buildHouse()),
        glass: geo(buildGlass()),
        stripes: geo(buildStripes()),
        net: geo(buildNet()),
        rig: geo(buildRig()),
        boom: geo(buildBoom()),
        boards: geo(buildBoards()),
        rudder_port: geo(buildRudder(CAT_RIG.rudders.port)),
        rudder_starboard: geo(buildRudder(CAT_RIG.rudders.starboard)),
    };
    return cache;
};
