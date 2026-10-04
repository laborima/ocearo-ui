/**
 * Procedural AIS fleet, in the clean style of the own boat (FSD-like: one
 * matte material, simple readable volumes). One generator per AIS model code
 * (see determineAisModelCode): fishing, tug, military, sailing, pleasure,
 * high-speed craft, pilot, passenger, cargo, tanker.
 *
 * Every model is 10 units long (z from -5 at the bow to +5 at the stern),
 * starboard +X, waterline at y = 0; AISBoat scales it to the real length.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { bothSides, cap, clamp01, loft, merge, tube } from '../boats/kit';

export const FLEET_LENGTH = 10;
const HALF = FLEET_LENGTH / 2;
const zAt = (t) => -HALF + FLEET_LENGTH * t;
const STATIONS = Array.from({ length: 33 }, (_, i) => i / 32);

/**
 * Displacement hull: plan shape from `beam`, `entry` (share of the length
 * over which the bow widens: small = fine, large = blunt) and `transom`
 * (stern width as a share of the beam); sections from `draft`, `freeboard`,
 * a bow sheer rise and `deadrise` (0 = flat-bottomed ship, 1 = deep V).
 *
 * @returns {{ geometry: THREE.BufferGeometry, deckAt: (t) => number, beamAt: (t) => number }}
 */
const hull = ({ beam, draft, freeboard, entry = 0.3, run = 0.15, transom = 0.85, bowRise = 0.25, deadrise = 0.15, bilge = 0.25 }) => {
    const beamAt = (t) => {
        const fwd = 1 - (1 - Math.min(t / entry, 1)) ** 2;
        const aft = t > 1 - run ? 1 - (1 - transom) * ((t - (1 - run)) / run) ** 1.5 : 1;
        return Math.max(0.02, (beam / 2) * fwd * aft);
    };
    const deckAt = (t) => freeboard + bowRise * Math.max(0, 1 - t / 0.35) ** 2;
    // Forefoot cut away at the stem, run rising slightly to the transom
    const depthAt = (t) => draft * Math.min(1, 0.25 + t / 0.12) * (t > 0.85 ? 1 - 0.35 * (t - 0.85) / 0.15 : 1);
    const section = (t) => {
        const hb = beamAt(t);
        const d = depthAt(t);
        const b = Math.min(bilge, d * 0.9, hb * 0.6);
        // Keel -> flat or V bottom -> round bilge -> slightly flared side -> deck edge
        return [[0, -d], [hb * 0.55, -d + d * deadrise * 0.6], [hb - b * 0.3, -d + b * 0.7 + d * deadrise * 0.3],
            [hb, -d + b * 1.4 + d * deadrise * 0.3], [hb * 1.0, deckAt(t) * 0.5], [hb * 1.02, deckAt(t)]];
    };
    const sides = bothSides(loft(STATIONS.map(t => ({ z: zAt(t), pts: section(t) }))));
    const deck = bothSides(loft(STATIONS.map(t => ({ z: zAt(t), pts: [[0, deckAt(t) + 0.01], [beamAt(t) * 1.02, deckAt(t)]] })), true));
    const tr = section(1);
    const outline = [...tr.slice().reverse().map(([x, y]) => [-x, y]), ...tr.slice(1)];
    return { geometry: merge([sides, deck, cap(outline, zAt(1))]), deckAt, beamAt };
};

/** Rounded block centred on (x, z), standing on height y0 */
const block = (w, h, d, [x, y0, z], radius = 0.08) => {
    const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 2, h / 2, d / 2) * 0.99);
    g.translate(x, y0 + h / 2, z);
    return g;
};

/**
 * Side profile (points [z, y]) extruded across the width, for raked
 * superstructures and wheelhouses.
 */
const prism = (profile, width, x = 0) => {
    const shape = new THREE.Shape(profile.map(([z, y]) => new THREE.Vector2(-z, y)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
    g.rotateY(Math.PI / 2);
    g.translate(x - width / 2, 0, 0);
    return g;
};

const cylinder = (r, h, [x, y0, z], seg = 14) => {
    const g = new THREE.CylinderGeometry(r, r, h, seg);
    g.translate(x, y0 + h / 2, z);
    return g;
};

/** Flat sail between three points, visible from both sides */
const sail = (a, b, c) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...b], 3));
    g.computeVertexNormals();
    return g;
};

// Container ship: long flat hull, stacks of boxes, accommodation and funnel aft
const cargo = () => {
    const h = hull({ beam: 1.55, draft: 0.45, freeboard: 0.55, entry: 0.18, run: 0.12, transom: 0.8, bowRise: 0.15, deadrise: 0, bilge: 0.12 });
    const deck = h.deckAt(0.5);
    const parts = [h.geometry];
    // Container bays with gaps, lower towards the bow
    for (let i = 0; i < 6; i++) {
        const z = -3.4 + i * 1.05;
        const t = (z + HALF) / FLEET_LENGTH;
        const width = Math.min(1.4, h.beamAt(t) * 2 - 0.08);
        parts.push(block(width, i === 0 ? 0.35 : 0.5, 0.92, [0, deck, z], 0.04));
    }
    parts.push(block(1.45, 1.15, 0.7, [0, deck, 3.45], 0.08));    // accommodation
    parts.push(block(1.65, 0.12, 0.45, [0, deck + 1.15, 3.35], 0.04)); // bridge wings
    parts.push(block(0.4, 0.55, 0.45, [0, deck + 0.5, 4.25], 0.12));   // funnel
    parts.push(block(1.0, 0.18, 0.5, [0, h.deckAt(0.02) - 0.02, -4.45], 0.06)); // forecastle
    return parts;
};

// Tanker: low deck with the pipe run, tall accommodation aft
const tanker = () => {
    const h = hull({ beam: 1.75, draft: 0.5, freeboard: 0.42, entry: 0.2, run: 0.12, transom: 0.82, bowRise: 0.12, deadrise: 0, bilge: 0.12 });
    const deck = h.deckAt(0.5);
    return [
        h.geometry,
        block(0.3, 0.1, 6.4, [0, deck, -0.6], 0.04),              // pipe run
        block(1.2, 0.12, 0.25, [0, deck, -0.2], 0.04),            // manifold
        block(1.55, 1.05, 0.9, [0, deck, 3.6], 0.1),              // accommodation
        block(1.75, 0.1, 0.4, [0, deck + 1.05, 3.45], 0.04),      // bridge wings
        block(0.45, 0.5, 0.4, [0, deck + 0.55, 4.35], 0.12),      // funnel
        cylinder(0.04, 0.6, [0, h.deckAt(0.05), -4.2]),           // fore mast
    ];
};

// Passenger ship / ferry: tiered superstructure along most of the length
const passenger = () => {
    const h = hull({ beam: 1.5, draft: 0.32, freeboard: 0.55, entry: 0.25, run: 0.12, transom: 0.85, bowRise: 0.1, deadrise: 0.05, bilge: 0.15 });
    const deck = h.deckAt(0.5);
    return [
        h.geometry,
        prism([[-3.3, 0], [-3.0, 0.5], [4.4, 0.5], [4.4, 0]], 1.4).translate(0, deck, 0),
        prism([[-2.6, 0], [-2.35, 0.45], [4.0, 0.45], [4.0, 0]], 1.32).translate(0, deck + 0.5, 0),
        prism([[-1.8, 0], [-1.55, 0.4], [3.4, 0.4], [3.4, 0]], 1.15).translate(0, deck + 0.95, 0),
        block(1.5, 0.08, 0.5, [0, deck + 1.35, -1.6], 0.03),      // bridge wings
        block(0.45, 0.55, 0.7, [0, deck + 1.35, 2.3], 0.2),       // funnel
    ];
};

// Trawler: high bow, wheelhouse forward, gantry and outriggers aft
const fishing = () => {
    const h = hull({ beam: 2.9, draft: 0.65, freeboard: 0.75, entry: 0.4, run: 0.18, transom: 0.8, bowRise: 0.5, deadrise: 0.35, bilge: 0.4 });
    const deck = h.deckAt(0.4);
    return [
        h.geometry,
        prism([[-2.0, 0], [-1.85, 1.1], [0.2, 1.15], [0.3, 0]], 1.7).translate(0, deck, 0),   // wheelhouse
        cylinder(0.06, 1.9, [0, deck + 1.1, -1.0]),                                        // mast
        tube([-1.15, deck, 3.9], [-1.0, deck + 1.6, 3.9], 0.07),                           // gantry
        tube([1.15, deck, 3.9], [1.0, deck + 1.6, 3.9], 0.07),
        tube([-1.0, deck + 1.6, 3.9], [1.0, deck + 1.6, 3.9], 0.07),
        tube([0, deck + 2.6, -1.0], [-2.4, deck + 1.0, -0.6], 0.035),                     // outriggers
        tube([0, deck + 2.6, -1.0], [2.4, deck + 1.0, -0.6], 0.035),
    ];
};

// Tug: short, beamy, blunt fendered bow, tall wheelhouse amidships
const tug = () => {
    const h = hull({ beam: 3.6, draft: 0.75, freeboard: 0.7, entry: 0.45, run: 0.25, transom: 0.75, bowRise: 0.35, deadrise: 0.3, bilge: 0.5 });
    const deck = h.deckAt(0.4);
    const fender = new THREE.TorusGeometry(1.5, 0.12, 8, 24, Math.PI);
    fender.rotateX(Math.PI / 2);
    fender.scale(1.15, 1, 1.4);
    fender.translate(0, h.deckAt(0.05) - 0.15, -2.8);
    return [
        h.geometry,
        block(2.4, 0.7, 3.2, [0, deck, -0.2], 0.12),              // deckhouse
        prism([[-1.0, 0], [-0.75, 0.75], [0.9, 0.75], [1.0, 0]], 2.0).translate(0, deck + 0.7, -0.4), // wheelhouse
        cylinder(0.05, 1.1, [0, deck + 1.45, 0.2]),               // mast
        block(0.9, 0.45, 0.5, [0, deck, 3.4], 0.1),               // towing winch
        fender,
    ];
};

// Naval vessel: fine bow, angular superstructure, mast and gun
const military = () => {
    const h = hull({ beam: 1.35, draft: 0.35, freeboard: 0.6, entry: 0.4, run: 0.12, transom: 0.9, bowRise: 0.2, deadrise: 0.3, bilge: 0.15 });
    const deck = h.deckAt(0.5);
    const mast = new THREE.ConeGeometry(0.25, 1.4, 4);
    mast.rotateY(Math.PI / 4);
    mast.translate(0, deck + 1.55, 0.3);
    return [
        h.geometry,
        prism([[-1.6, 0], [-1.1, 0.85], [1.6, 0.85], [2.6, 0]], 1.05).translate(0, deck, 0),
        mast,
        cylinder(0.22, 0.18, [0, deck, -2.8], 12),                // gun mount
        tube([0, deck + 0.12, -2.8], [0, deck + 0.18, -3.7], 0.035),
        block(0.9, 0.2, 1.4, [0, deck, 3.6], 0.06),               // helideck edge
    ];
};

// Sailing yacht: hull, low coachroof, fin keel, rig with main and jib
const sailing = () => {
    const h = hull({ beam: 3.3, draft: 0.25, freeboard: 0.55, entry: 0.55, run: 0.3, transom: 0.85, bowRise: 0.08, deadrise: 0.5, bilge: 0.2 });
    const deck = h.deckAt(0.5);
    const mastZ = -1.0;
    const top = deck + 13.5;
    return [
        h.geometry,
        prism([[-2.4, 0], [-1.6, 0.4], [1.3, 0.42], [1.4, 0]], 2.0).translate(0, deck, 0),   // coachroof
        block(0.12, 1.4, 0.8, [0, -1.65, -0.6], 0.05),            // fin
        block(0.3, 0.25, 1.6, [0, -1.85, -0.5], 0.12),            // bulb
        cylinder(0.08, 13.5, [0, deck, mastZ], 10),               // mast
        tube([0, deck + 1.0, mastZ], [0, deck + 1.0, mastZ + 4.0], 0.07), // boom
        sail([0, deck + 1.1, mastZ + 0.1], [0, top - 0.3, mastZ + 0.1], [0, deck + 1.1, mastZ + 3.9]),
        sail([0, deck + 0.1, -4.9], [0, top - 2.0, mastZ - 0.05], [0, deck + 0.6, mastZ + 1.0]),
    ];
};

// Motor yacht: deep V, cabin with raked windscreen, flybridge
const pleasure = () => {
    const h = hull({ beam: 3.2, draft: 0.4, freeboard: 0.85, entry: 0.45, run: 0.1, transom: 0.95, bowRise: 0.25, deadrise: 0.8, bilge: 0.15 });
    const deck = h.deckAt(0.5);
    return [
        h.geometry,
        prism([[-1.8, 0], [-0.4, 0.75], [2.6, 0.78], [2.8, 0]], 2.5).translate(0, deck, 0),  // saloon
        prism([[0.2, 0], [0.5, 0.35], [2.2, 0.35], [2.3, 0]], 2.0).translate(0, deck + 0.78, 0), // flybridge
        tube([-0.9, deck + 1.1, 1.6], [0, deck + 1.7, 1.7], 0.06),  // radar arch
        tube([0.9, deck + 1.1, 1.6], [0, deck + 1.7, 1.7], 0.06),
    ];
};

// High-speed craft: catamaran ferry with a long raked superstructure
const highSpeed = () => {
    const demi = hull({ beam: 0.75, draft: 0.3, freeboard: 0.75, entry: 0.5, run: 0.1, transom: 0.9, bowRise: 0.1, deadrise: 0.6, bilge: 0.1 });
    const port = demi.geometry.clone().translate(-1.25, 0, 0);
    const stbd = demi.geometry.clone().translate(1.25, 0, 0);
    const deck = 0.75;
    return [
        port, stbd,
        block(3.2, 0.25, 8.6, [0, deck - 0.2, 0.4], 0.08),        // bridging deck
        prism([[-3.6, 0], [-2.2, 0.9], [4.2, 0.9], [4.4, 0]], 2.9).translate(0, deck + 0.05, 0),
        prism([[-1.8, 0], [-1.2, 0.4], [0.2, 0.4], [0.3, 0]], 1.6).translate(0, deck + 0.95, 0), // bridge
    ];
};

// Pilot / patrol launch: wheelhouse aft of amidships, mast with lights
const pilot = () => {
    const h = hull({ beam: 3.1, draft: 0.45, freeboard: 0.8, entry: 0.45, run: 0.12, transom: 0.9, bowRise: 0.3, deadrise: 0.7, bilge: 0.2 });
    const deck = h.deckAt(0.5);
    return [
        h.geometry,
        prism([[-1.2, 0], [-0.8, 1.05], [1.6, 1.05], [1.8, 0]], 2.1).translate(0, deck, 0),
        cylinder(0.05, 1.2, [0, deck + 1.05, 0.6]),
        block(1.0, 0.12, 0.15, [0, deck + 2.0, 0.6], 0.03),       // light bar
    ];
};

const GENERATORS = {
    30: fishing, 31: tug, 35: military, 36: sailing, 37: pleasure,
    40: highSpeed, 50: pilot, 60: passenger, 70: cargo, 80: tanker,
};

const cache = new Map();

/**
 * Geometry of one fleet model, built once and shared by every target of
 * that type, with its beam / length ratio (for stretching to the AIS beam).
 */
export const fleetModel = (code) => {
    if (!cache.has(code)) {
        const geometry = merge((GENERATORS[code] || GENERATORS[70])());
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        cache.set(code, { geometry, beamRatio: clamp01((box.max.x - box.min.x) / FLEET_LENGTH) || 0.25 });
    }
    return cache.get(code);
};

export const FLEET_CODES = Object.keys(GENERATORS).map(Number);
