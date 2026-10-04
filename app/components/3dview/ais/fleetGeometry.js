/**
 * Procedural AIS fleet, in the style of the own boat (FSD-like): smooth hulls,
 * simple volumes, one body material that takes the state colour (grey, red
 * at risk, accent when selected) plus fixed dark details (glazing, boot top,
 * funnel tops) that keep the vessel readable whatever its colour.
 *
 * One model per AIS model code (see determineAisModelCode). Sailing vessels
 * get a model per size and kind: small sloop, cruising sloop, ketch,
 * superyacht and catamaran.
 *
 * Every model is 10 units long (z from -5 at the bow to +5 at the stern),
 * starboard +X, waterline at y = 0; AISBoat scales it to the real length.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { bothSides, cap, clamp01, foil, loft, merge, tube } from '../boats/kit';
import { makeSailGeometry } from '../boats/racer/sailGeometry';

export const FLEET_LENGTH = 10;
const HALF = FLEET_LENGTH / 2;
const zAt = (t) => -HALF + FLEET_LENGTH * t;
const STATIONS = Array.from({ length: 49 }, (_, i) => {
    const u = i / 48;
    return u * u * (3 - 2 * u) * 0.3 + u * 0.7; // denser at both ends
});

/**
 * Displacement or planing hull.
 *
 * @param {Object} o
 * @param {number} o.beam - maximum beam (model units)
 * @param {number} o.draft - canoe body depth below the waterline
 * @param {number} o.freeboard - deck height amidships
 * @param {number} [o.entry] - share of the length over which the bow widens (fine < 0.3 < blunt)
 * @param {number} [o.run] - share of the length over which the stern narrows
 * @param {number} [o.transom] - stern width as a share of the beam
 * @param {number} [o.bowRise] - extra sheer height at the stem
 * @param {number} [o.deadrise] - 0 = flat-bottomed ship, 1 = deep V
 * @param {number} [o.bilge] - bilge radius
 * @param {number} [o.flare] - bow flare (topsides leaning out at the bow)
 * @returns {{ body: THREE.BufferGeometry, dark: THREE.BufferGeometry, deckAt: (t) => number, beamAt: (t) => number }}
 */
const hull = ({ beam, draft, freeboard, entry = 0.3, run = 0.15, transom = 0.85, bowRise = 0.25, deadrise = 0.15, bilge = 0.25, flare = 0.15 }) => {
    const beamAt = (t) => {
        const fwd = Math.sin(Math.min(t / entry, 1) * Math.PI / 2) ** 1.4;
        const aft = t > 1 - run ? 1 - (1 - transom) * ((t - (1 - run)) / run) ** 1.6 : 1;
        return Math.max(0.015, (beam / 2) * fwd * aft);
    };
    const deckAt = (t) => freeboard + bowRise * Math.max(0, 1 - t / 0.4) ** 2;
    // Forefoot cut away at the stem, run rising a little to the transom
    const depthAt = (t) => draft * Math.min(1, 0.2 + t / 0.1) * (t > 0.85 ? 1 - 0.3 * (t - 0.85) / 0.15 : 1);
    const section = (t) => {
        const hb = beamAt(t);
        const d = depthAt(t);
        const deck = deckAt(t);
        const r = Math.min(bilge, d * 0.8, hb * 0.55);
        const bottomEnd = hb - r;
        const pts = [[0, -d], [bottomEnd * 0.5, -d + d * deadrise * 0.35], [bottomEnd, -d + d * deadrise * 0.6]];
        // Turn of the bilge, a quarter circle
        const cy = -d + d * deadrise * 0.6 + r;
        for (const a of [0.25, 0.5, 0.75, 1]) {
            const ang = -Math.PI / 2 + a * Math.PI / 2;
            pts.push([bottomEnd + r * Math.cos(ang), cy + r * Math.sin(ang)]);
        }
        // Topsides, flaring out towards the bow
        const flareOut = flare * hb * Math.max(0, 1 - t / 0.35);
        pts.push([hb + flareOut * 0.4, (cy + deck) / 2], [hb + flareOut, deck]);
        return pts;
    };
    const sides = bothSides(loft(STATIONS.map(t => ({ z: zAt(t), pts: section(t) }))));
    const deck = bothSides(loft(STATIONS.map((t) => {
        const edge = section(t)[section(t).length - 1][0];
        return { z: zAt(t), pts: [[0, deckAt(t) + 0.015], [edge * 0.6, deckAt(t) + 0.01], [edge, deckAt(t)]] };
    }), true));
    const tr = section(1);
    const transomCap = cap([...tr.slice().reverse().map(([x, y]) => [-x, y]), ...tr.slice(1)], zAt(1));
    // Dark boot top just above the waterline
    const sideX = (t, y) => {
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
    const boot = bothSides(loft(STATIONS.slice(1).map(t => ({ z: zAt(t), pts: [[sideX(t, -0.02) + 0.006, -0.02], [sideX(t, 0.06) + 0.006, 0.06]] }))));
    return { body: merge([sides, deck, transomCap]), dark: boot, deckAt, beamAt, sideX };
};

/** Rounded block centred on (x, z), standing on height y0 */
const block = (w, h, d, [x, y0, z], radius = 0.06) => {
    const g = new RoundedBoxGeometry(w, h, d, 2, Math.max(0.001, Math.min(radius, w / 2, h / 2, d / 2) * 0.99));
    g.translate(x, y0 + h / 2, z);
    return g;
};

/** Glazing band wrapped round a block: a dark ring slightly proud of its faces */
const windows = (w, d, [x, y, z], h = 0.12) => block(w + 0.02, h, d + 0.02, [x, y, z], 0.02);

/**
 * Side profile (points [z, y]) extruded across the width, for raked
 * superstructures and wheelhouses.
 */
const prism = (profile, width, x = 0) => {
    const shape = new THREE.Shape(profile.map(([z, y]) => new THREE.Vector2(-z, y)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 });
    g.rotateY(Math.PI / 2);
    g.translate(x - width / 2, 0, 0);
    return g;
};

const cylinder = (r, h, [x, y0, z], seg = 16, rTop = r) => {
    const g = new THREE.CylinderGeometry(rTop, r, h, seg);
    g.translate(x, y0 + h / 2, z);
    return g;
};

/** Radar mast: pole, cross-arm and a scanner bar on top */
const radarMast = ([x, y0, z], height = 0.6) => [
    cylinder(0.03, height, [x, y0, z], 8, 0.022),
    block(0.34, 0.03, 0.05, [x, y0 + height * 0.7, z], 0.01),
    block(0.26, 0.035, 0.07, [x, y0 + height + 0.02, z], 0.015),
];

/** Deck crane: pedestal and jib slewed outboard */
const crane = ([x, y0, z], side = 1) => [
    cylinder(0.07, 0.35, [x, y0, z], 12, 0.06),
    block(0.14, 0.1, 0.16, [x, y0 + 0.35, z], 0.03),
    tube([x, y0 + 0.4, z], [x + side * 0.55, y0 + 0.75, z + 0.25], 0.025, 0.018, 8),
];

/** Lifeboat (capsule) slung along the side */
const lifeboat = ([x, y, z], length = 0.32, radius = 0.07, tilt = 0) => {
    const g = new THREE.CapsuleGeometry(radius, length, 4, 10);
    g.rotateX(Math.PI / 2 + tilt);
    g.translate(x, y, z);
    return g;
};

/** Row of tyre fenders hung along both sides at height y */
const fenders = (h, y, from, to, count) => {
    const parts = [];
    for (let i = 0; i < count; i++) {
        const t = from + (to - from) * (i / Math.max(1, count - 1));
        for (const side of [-1, 1]) {
            const tyre = new THREE.TorusGeometry(0.09, 0.035, 6, 12);
            tyre.rotateY(Math.PI / 2);
            tyre.translate(side * (h.sideX(t, y) + 0.03), y, zAt(t));
            parts.push(tyre);
        }
    }
    return parts;
};

/** Thin hull-side band (dark) between two heights over a stretch of length */
const hullBand = (h, from, to, lo, hi) => bothSides(loft(Array.from({ length: 13 }, (_, i) => {
    const t = from + (to - from) * (i / 12);
    return { z: zAt(t), pts: [[h.sideX(t, lo) + 0.01, lo], [h.sideX(t, hi) + 0.01, hi]] };
})));

const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** Cambered sail, set on the centreline (no wind data for targets) */
const sail = (tack, head, clew, opts = {}) => {
    const g = makeSailGeometry({ tack, head, clew, camber: 0.07, draft: 0.4, twist: 0.08, leeward: 1, rows: 8, cols: 6, ...opts });
    g.deleteAttribute('uv');
    return g;
};

// --- Commercial ---------------------------------------------------------------

// Container ship: stacks of boxes in bays, accommodation and funnel aft
const cargo = () => {
    const h = hull({ beam: 1.5, draft: 0.45, freeboard: 0.55, entry: 0.22, run: 0.14, transom: 0.82, bowRise: 0.18, deadrise: 0, bilge: 0.12, flare: 0.12 });
    const deck = h.deckAt(0.5);
    const body = [h.body];
    for (let bay = 0; bay < 7; bay++) {
        const z = -3.45 + bay * 0.93;
        const t = (z + HALF) / FLEET_LENGTH;
        const width = Math.min(1.36, h.beamAt(t) * 2 - 0.12);
        const tiers = [2, 3, 4, 4, 4, 4, 3][bay];
        const rows = Math.max(2, Math.round(width / 0.27));
        for (let r = 0; r < rows; r++) {
            const tier = tiers - ((r + bay) % 3 === 0 ? 1 : 0);
            const x = -width / 2 + (r + 0.5) * (width / rows);
            body.push(block(width / rows - 0.025, tier * 0.12, 0.84, [x, deck, z], 0.015));
        }
    }
    body.push(block(1.4, 1.05, 0.62, [0, deck, 3.55], 0.06));        // accommodation
    body.push(block(1.62, 0.1, 0.36, [0, deck + 1.05, 3.4], 0.03));  // bridge wings
    body.push(block(0.36, 0.5, 0.42, [0, deck + 0.75, 4.3], 0.1));   // funnel
    body.push(block(1.0, 0.16, 0.55, [0, h.deckAt(0.03) - 0.02, -4.4], 0.05)); // forecastle
    body.push(...radarMast([0, deck + 1.15, 3.55], 0.45));
    body.push(cylinder(0.025, 0.55, [0, h.deckAt(0.03) + 0.14, -4.3], 8)); // fore mast
    body.push(...crane([0.55, deck + 0.5, -1.2], 1), ...crane([-0.55, deck + 0.5, 1.6], -1));
    body.push(lifeboat([0.62, deck + 0.45, 3.9]), lifeboat([-0.62, deck + 0.45, 3.9]));
    const dark = [h.dark, hullBand(h, 0.05, 0.95, 0.42, 0.47),
        windows(1.64, 0.38, [0, deck + 1.06, 3.4], 0.07),
        windows(1.4, 0.62, [0, deck + 0.9, 3.55]),
        windows(1.4, 0.62, [0, deck + 0.62, 3.55], 0.06),
        windows(1.4, 0.62, [0, deck + 0.38, 3.55], 0.06),
        block(0.38, 0.1, 0.44, [0, deck + 1.2, 4.3], 0.05),          // funnel top
    ];
    return { body, dark };
};

// Tanker: low deck with pipe runs and catwalk, tall accommodation aft
const tanker = () => {
    const h = hull({ beam: 1.7, draft: 0.5, freeboard: 0.42, entry: 0.24, run: 0.12, transom: 0.84, bowRise: 0.14, deadrise: 0, bilge: 0.12, flare: 0.1 });
    const deck = h.deckAt(0.5);
    const body = [h.body,
        block(0.9, 0.12, 6.4, [0, deck, -0.7], 0.04),                // trunk deck
        block(1.5, 1.0, 0.85, [0, deck, 3.65], 0.08),                // accommodation
        block(1.72, 0.08, 0.35, [0, deck + 1.0, 3.5], 0.03),         // bridge wings
        block(0.42, 0.5, 0.38, [0, deck + 0.6, 4.4], 0.1),           // funnel
        block(0.9, 0.14, 0.6, [0, h.deckAt(0.03) - 0.02, -4.35], 0.05),
        cylinder(0.035, 0.7, [0, deck + 0.12, -0.6]),                // manifold crane
        tube([0, deck + 0.8, -0.6], [0.6, deck + 0.55, -0.2], 0.025),
    ];
    for (const x of [-0.25, 0, 0.25]) body.push(tube([x, deck + 0.17, -3.8], [x, deck + 0.17, 2.9], 0.03, 0.03, 8));
    for (let i = 0; i < 6; i++) body.push(block(0.06, 0.06, 0.06, [0.42, deck + 0.12, -3.5 + i * 1.2], 0.02)); // valves
    body.push(block(0.12, 0.05, 6.6, [-0.45, deck + 0.3, -0.6], 0.02));  // catwalk
    for (let i = 0; i < 7; i++) body.push(cylinder(0.012, 0.18, [-0.45, deck + 0.12, -3.6 + i * 1.1], 6));
    body.push(...radarMast([0, deck + 1.08, 3.6], 0.5));
    body.push(...crane([0.6, deck + 0.12, -0.2], 1));
    // Free-fall lifeboat on its ramp over the stern
    body.push(lifeboat([0, deck + 0.55, 4.7], 0.3, 0.08, -0.35));
    for (const z of [-4.0, 4.2]) for (const sx of [-1, 1]) body.push(cylinder(0.05, 0.08, [sx * 0.45, h.deckAt((z + HALF) / FLEET_LENGTH), z], 10)); // winches
    const dark = [h.dark, hullBand(h, 0.05, 0.95, 0.32, 0.37),
        windows(1.74, 0.37, [0, deck + 1.0, 3.5], 0.06),
        windows(1.5, 0.85, [0, deck + 0.85, 3.65]),
        windows(1.5, 0.85, [0, deck + 0.58, 3.65], 0.06),
        windows(1.5, 0.85, [0, deck + 0.34, 3.65], 0.06),
        block(0.44, 0.1, 0.4, [0, deck + 1.1, 4.4], 0.05),
    ];
    return { body, dark };
};

// Passenger ship / ferry: tiered superstructure with glazing and lifeboats
const passenger = () => {
    const h = hull({ beam: 1.45, draft: 0.32, freeboard: 0.6, entry: 0.3, run: 0.12, transom: 0.86, bowRise: 0.12, deadrise: 0.05, bilge: 0.15, flare: 0.2 });
    const deck = h.deckAt(0.5);
    const tiers = [
        { profile: [[-3.4, 0], [-3.05, 0.42], [4.45, 0.42], [4.45, 0]], width: 1.42 },
        { profile: [[-2.9, 0], [-2.55, 0.4], [4.2, 0.4], [4.2, 0]], width: 1.36 },
        { profile: [[-2.2, 0], [-1.9, 0.38], [3.7, 0.38], [3.7, 0]], width: 1.24 },
        { profile: [[-1.5, 0], [-1.25, 0.32], [2.6, 0.32], [2.6, 0]], width: 1.0 },
    ];
    const body = [h.body];
    const dark = [h.dark, hullBand(h, 0.12, 0.9, 0.3, 0.4)];
    let y = deck;
    for (const tier of tiers) {
        body.push(prism(tier.profile, tier.width).translate(0, y, 0));
        // Window band along each tier
        const [front] = tier.profile[1];
        const back = tier.profile[2][0];
        dark.push(block(tier.width + 0.05, 0.11, back - front - 0.15, [0, y + 0.17, (front + back) / 2 + 0.05], 0.02));
        y += tier.profile[1][1];
    }
    // Lifeboats under the second tier
    for (const side of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
            const boat = new THREE.CapsuleGeometry(0.07, 0.32, 4, 8);
            boat.rotateX(Math.PI / 2);
            boat.translate(side * 0.74, deck + 0.52, -1.0 + i * 0.75);
            body.push(boat);
        }
    }
    body.push(block(0.4, 0.5, 0.7, [0, y, 2.0], 0.18));                // funnel
    body.push(...radarMast([0, y, -0.9], 0.5));
    body.push(cylinder(0.02, 0.35, [0, h.deckAt(0.03), -4.3], 8));     // jackstaff
    dark.push(block(0.42, 0.12, 0.72, [0, y + 0.42, 2.0], 0.06));
    dark.push(block(1.02, 0.1, 0.4, [0, y - 0.22, -1.25], 0.02));       // bridge windows
    // Two rows of cabin ports along the hull
    dark.push(hullBand(h, 0.2, 0.86, 0.47, 0.52));
    return { body, dark };
};

// Trawler: high bow, wheelhouse forward, gantry, net drum, outriggers
const fishing = () => {
    const h = hull({ beam: 2.8, draft: 0.6, freeboard: 0.7, entry: 0.42, run: 0.2, transom: 0.82, bowRise: 0.55, deadrise: 0.35, bilge: 0.35, flare: 0.25 });
    const deck = h.deckAt(0.45);
    const body = [h.body,
        prism([[-2.1, 0], [-1.85, 1.0], [0.1, 1.05], [0.25, 0]], 1.7).translate(0, deck, 0),
        block(1.0, 0.25, 0.8, [0, deck + 1.05, -0.9], 0.06),          // upper wheelhouse
        cylinder(0.05, 1.6, [0, deck + 1.3, -1.2]),
        tube([-1.15, deck, 3.95], [-1.0, deck + 1.55, 3.95], 0.07),   // gantry
        tube([1.15, deck, 3.95], [1.0, deck + 1.55, 3.95], 0.07),
        tube([-1.0, deck + 1.55, 3.95], [1.0, deck + 1.55, 3.95], 0.07),
        tube([0, deck + 2.8, -1.2], [-2.5, deck + 1.0, -0.8], 0.03),  // outriggers
        tube([0, deck + 2.8, -1.2], [2.5, deck + 1.0, -0.8], 0.03),
    ];
    const drum = new THREE.CylinderGeometry(0.35, 0.35, 1.3, 16);
    drum.rotateZ(Math.PI / 2);
    drum.translate(0, deck + 0.45, 2.4);
    body.push(drum);
    body.push(...radarMast([0.35, deck + 1.3, -0.9], 0.35));
    body.push(cylinder(0.12, 0.25, [-0.65, deck + 1.05, -0.5], 10));      // life raft
    body.push(block(2.2, 0.18, 2.6, [0, deck, 2.6], 0.04));               // working deck bulwark
    const dark = [h.dark, hullBand(h, 0.05, 0.95, h.deckAt(0.5) - 0.12, h.deckAt(0.5) - 0.04),
        prism([[-1.98, 0.62], [-1.88, 0.92], [0.05, 0.95], [0.1, 0.62]], 1.74).translate(0, deck, 0),
    ];
    return { body, dark };
};

// Tug: short, beamy, fendered bow, tall all-round wheelhouse
const tug = () => {
    const h = hull({ beam: 3.5, draft: 0.75, freeboard: 0.65, entry: 0.5, run: 0.25, transom: 0.78, bowRise: 0.35, deadrise: 0.3, bilge: 0.5, flare: 0.15 });
    const deck = h.deckAt(0.45);
    const fender = new THREE.TorusGeometry(1.45, 0.14, 10, 28, Math.PI);
    fender.rotateX(Math.PI / 2);
    fender.scale(1.15, 1, 1.35);
    fender.translate(0, h.deckAt(0.05) - 0.18, -2.9);
    const body = [h.body,
        block(2.4, 0.65, 3.0, [0, deck, -0.3], 0.1),                  // deckhouse
        block(1.9, 0.8, 1.5, [0, deck + 0.65, -0.6], 0.1),            // wheelhouse
        cylinder(0.05, 1.0, [0, deck + 1.45, -0.2]),
        block(0.8, 0.45, 0.5, [0, deck, 3.4], 0.08),                  // towing winch
        cylinder(0.12, 0.5, [0, deck, 2.5]),                          // tow hook post
        fender,
        ...radarMast([0, deck + 1.45, -0.2], 0.55),
        ...fenders(h, deck - 0.12, 0.25, 0.92, 7),
        block(2.8, 0.1, 0.12, [0, deck + 0.75, 2.0], 0.03),           // towing bow
    ];
    const dark = [h.dark, windows(1.9, 1.5, [0, deck + 1.05, -0.6], 0.35), windows(2.4, 3.0, [0, deck + 0.3, -0.3], 0.08)];
    return { body, dark };
};

// Naval vessel: fine bow, faceted superstructure, mast and gun
const military = () => {
    const h = hull({ beam: 1.3, draft: 0.35, freeboard: 0.6, entry: 0.42, run: 0.12, transom: 0.92, bowRise: 0.22, deadrise: 0.3, bilge: 0.15, flare: 0.3 });
    const deck = h.deckAt(0.5);
    const mast = new THREE.ConeGeometry(0.24, 1.4, 4);
    mast.rotateY(Math.PI / 4);
    mast.translate(0, deck + 1.5, 0.2);
    const body = [h.body,
        prism([[-1.7, 0], [-1.15, 0.82], [1.5, 0.82], [2.6, 0]], 1.05).translate(0, deck, 0),
        mast,
        cylinder(0.24, 0.2, [0, deck, -2.75], 12, 0.18),
        tube([0, deck + 0.12, -2.75], [0, deck + 0.18, -3.7], 0.035),
        block(1.0, 0.1, 1.3, [0, deck, 3.7], 0.04),                  // flight deck
        new THREE.SphereGeometry(0.16, 14, 10).translate(0, deck + 2.25, 0.2), // radar dome
        block(0.5, 0.08, 0.4, [0, deck, -2.1], 0.02),                // missile cells
        block(0.4, 0.45, 0.5, [0, deck + 0.82, 0.9], 0.04),          // funnel
        cylinder(0.12, 0.2, [0.4, deck + 0.82, 1.4], 10),            // CIWS
    ];
    const dark = [h.dark, prism([[-1.42, 0.55], [-1.24, 0.72], [-0.3, 0.72], [-0.3, 0.55]], 1.07).translate(0, deck, 0)];
    return { body, dark };
};

// Motor yacht: deep V, hull windows, saloon with big glazing, flybridge
const pleasure = () => {
    const h = hull({ beam: 3.1, draft: 0.38, freeboard: 0.85, entry: 0.45, run: 0.1, transom: 0.95, bowRise: 0.28, deadrise: 0.8, bilge: 0.14, flare: 0.3 });
    const deck = h.deckAt(0.5);
    const body = [h.body,
        prism([[-1.9, 0], [-0.5, 0.72], [2.7, 0.75], [2.85, 0]], 2.5).translate(0, deck, 0),
        prism([[0.1, 0], [0.45, 0.32], [2.2, 0.32], [2.3, 0]], 2.0).translate(0, deck + 0.75, 0),
        tube([-0.9, deck + 1.07, 1.7], [0, deck + 1.6, 1.8], 0.05),  // radar arch
        tube([0.9, deck + 1.07, 1.7], [0, deck + 1.6, 1.8], 0.05),
        block(2.6, 0.06, 0.5, [0, 0.12, 4.85], 0.02),                // swim platform
        block(0.6, 0.04, 0.25, [0, deck + 1.62, 1.8], 0.02),         // radar on the arch
    ];
    const dark = [h.dark,
        hullBand(h, 0.3, 0.62, 0.42, 0.55),
        prism([[0.14, 0.1], [0.38, 0.3], [0.7, 0.3], [0.7, 0.1]], 2.03).translate(0, deck + 0.75, 0), // flybridge screen
        prism([[-1.55, 0.2], [-0.62, 0.66], [2.4, 0.68], [2.5, 0.2]], 2.53).translate(0, deck, 0),
    ];
    return { body, dark };
};

// High-speed craft: catamaran ferry with long raked superstructure
const highSpeed = () => {
    const demi = hull({ beam: 0.72, draft: 0.3, freeboard: 0.75, entry: 0.55, run: 0.08, transom: 0.92, bowRise: 0.08, deadrise: 0.6, bilge: 0.1, flare: 0.05 });
    const twin = (g) => merge([g.clone().translate(-1.25, 0, 0), g.clone().translate(1.25, 0, 0)]);
    const deck = 0.75;
    const body = [twin(demi.body),
        block(3.2, 0.25, 8.4, [0, deck - 0.2, 0.5], 0.08),
        prism([[-3.6, 0], [-2.2, 0.85], [4.2, 0.85], [4.45, 0]], 2.9).translate(0, deck + 0.05, 0),
        prism([[-1.6, 0], [-1.1, 0.35], [0.4, 0.35], [0.5, 0]], 1.5).translate(0, deck + 0.9, 0),
        ...radarMast([0, deck + 1.25, -0.2], 0.4),
    ];
    const dark = [twin(demi.dark),
        prism([[-3.2, 0.35], [-2.35, 0.75], [4.0, 0.75], [4.0, 0.35]], 2.93).translate(0, deck + 0.05, 0),
        prism([[-1.45, 0.12], [-1.15, 0.3], [0.3, 0.3], [0.3, 0.12]], 1.53).translate(0, deck + 0.9, 0),
    ];
    return { body, dark };
};

// Pilot / patrol launch: wheelhouse aft of amidships, mast with lights
const pilot = () => {
    const h = hull({ beam: 3.0, draft: 0.45, freeboard: 0.8, entry: 0.45, run: 0.12, transom: 0.9, bowRise: 0.32, deadrise: 0.7, bilge: 0.18, flare: 0.3 });
    const deck = h.deckAt(0.5);
    const body = [h.body,
        prism([[-1.2, 0], [-0.75, 1.0], [1.65, 1.0], [1.8, 0]], 2.1).translate(0, deck, 0),
        cylinder(0.05, 1.1, [0, deck + 1.0, 0.7]),
        block(1.0, 0.1, 0.14, [0, deck + 1.9, 0.7], 0.03),
        block(0.3, 0.035, 0.07, [0, deck + 1.2, 0.2], 0.015),         // radar scanner
    ];
    const dark = [h.dark, hullBand(h, 0.1, 0.95, h.deckAt(0.5) - 0.14, h.deckAt(0.5) - 0.02), prism([[-0.95, 0.55], [-0.8, 0.9], [1.55, 0.92], [1.6, 0.55]], 2.13).translate(0, deck, 0)];
    return { body, dark };
};

// --- Sailing vessels ------------------------------------------------------------

/**
 * Sailing monohull: hull, coachroof with windows, fin keel and bulb, rudder,
 * one or two masts with cambered sails.
 *
 * @param {Object} o
 * @param {number} o.beam
 * @param {number} o.mast - main mast height above the deck (model units, length 10)
 * @param {number} [o.mizzen] - mizzen mast height (ketch)
 * @param {number} [o.roof] - coachroof height
 * @param {boolean} [o.saloon] - raised deck saloon (larger yachts)
 */
const sloop = ({ beam, mast, mizzen = 0, roof = 0.35, saloon = false, freeboard = 0.55, overhang = 0 }) => {
    const h = hull({ beam, draft: 0.25, freeboard, entry: 0.5, run: 0.28, transom: 0.86, bowRise: 0.1, deadrise: 0.55, bilge: 0.25, flare: 0.1 });
    const deck = h.deckAt(0.5);
    const roofW = beam * 0.62;
    const body = [h.body,
        prism([[-2.3, 0], [-1.6, roof], [1.2, roof], [1.35, 0]], roofW).translate(0, deck, 0),
        foil({ y: -0.15, lead: -0.85, chord: 0.8 }, { y: -1.55, lead: -0.6, chord: 0.55 }, 0.12),
        block(0.26, 0.24, 1.1, [0, -1.8, -0.35], 0.11),               // bulb
        foil({ y: 0, lead: 3.85, chord: 0.4 }, { y: -1.0, lead: 3.95, chord: 0.28 }, 0.11),
    ];
    const dark = [h.dark,
        prism([[-2.1, roof * 0.35], [-1.68, roof * 0.82], [1.0, roof * 0.82], [1.05, roof * 0.35]], roofW + 0.03).translate(0, deck, 0),
        hullBand(h, 0.3, 0.62, freeboard * 0.55, freeboard * 0.72),
        prism([[1.2, 0], [1.4, roof * 0.9], [1.9, roof * 0.95], [2.0, 0]], roofW * 0.85).translate(0, deck, 0), // sprayhood
    ];
    if (saloon) {
        body.push(prism([[-0.9, 0], [-0.4, 0.42], [1.1, 0.42], [1.2, 0]], roofW * 0.9).translate(0, deck + roof, 0));
        dark.push(prism([[-0.78, 0.08], [-0.45, 0.34], [1.0, 0.34], [1.05, 0.08]], roofW * 0.9 + 0.03).translate(0, deck + roof, 0));
    }
    // Main mast with mainsail and headsail
    const mz = -0.9;
    const top = deck + mast;
    body.push(cylinder(0.07, mast, [0, deck, mz], 10, 0.045));
    body.push(tube([0, deck + 1.0, mz], [0, deck + 1.0, mz + 3.6], 0.06));
    body.push(sail(V(0, deck + 1.1, mz + 0.08), V(0, top - 0.3, mz + 0.08), V(0, deck + 1.15, mz + 3.5), { headWidth: 0.4 }));
    body.push(sail(V(0, deck + 0.15, -4.9 - overhang), V(0, top - mast * 0.12, mz - 0.05), V(0, deck + 0.6, mz + 1.4)));
    body.push(tube([0, deck + 0.1, -4.95 - overhang], [0, top - mast * 0.12, mz], 0.012));  // forestay
    body.push(tube([0, top, mz], [0, deck + 0.1, 4.9], 0.012));                               // backstay
    if (mizzen) {
        const zz = 3.2;
        body.push(cylinder(0.055, mizzen, [0, deck, zz], 10, 0.035));
        body.push(sail(V(0, deck + 0.8, zz + 0.06), V(0, deck + mizzen - 0.2, zz + 0.06), V(0, deck + 0.85, zz + 1.7)));
    }
    return { body, dark };
};

// Sailing catamaran: two hulls, bridgedeck with saloon, rig in the middle
const sailingCat = () => {
    const demi = hull({ beam: 1.25, draft: 0.2, freeboard: 0.72, entry: 0.5, run: 0.1, transom: 0.92, bowRise: 0.08, deadrise: 0.6, bilge: 0.25, flare: 0.05 });
    const x = 2.0;
    const twin = (g) => merge([g.clone().translate(-x, 0, 0), g.clone().translate(x, 0, 0)]);
    const deck = 0.72;
    const top = deck + 15;
    const body = [twin(demi.body),
        block(x * 2 - 0.4, 0.3, 6.5, [0, deck - 0.25, 1.4], 0.1),
        prism([[-1.8, 0], [-1.0, 0.65], [2.4, 0.68], [2.4, 0]], x * 2 - 0.6).translate(0, deck + 0.05, 0),
        block(x * 2 - 0.4, 0.06, 1.8, [0, deck + 0.75, 3.4], 0.03),    // hardtop over the cockpit
        tube([-x, deck, -3.6], [x, deck, -3.6], 0.07),                  // forward beam
        cylinder(0.08, 15, [0, deck + 0.05, -1.7], 10, 0.05),
        tube([0, deck + 1.0, -1.7], [0, deck + 1.0, 2.6], 0.06),
        sail(V(0, deck + 1.1, -1.62), V(0, top - 0.3, -1.62), V(0, deck + 1.15, 2.5), { headWidth: 0.6 }),
        sail(V(0, deck + 0.1, -3.6), V(0, top - 2.0, -1.75), V(0, deck + 0.7, -0.6)),
    ];
    const dark = [twin(demi.dark),
        prism([[-1.6, 0.18], [-1.05, 0.58], [2.2, 0.6], [2.25, 0.18]], x * 2 - 0.57).translate(0, deck + 0.05, 0),
    ];
    for (const s of [-1, 1]) dark.push(hullBand(demi, 0.3, 0.7, 0.42, 0.55).translate(s * x, 0, 0));
    return { body, dark };
};

const GENERATORS = {
    30: fishing, 31: tug, 35: military, 37: pleasure,
    40: highSpeed, 50: pilot, 60: passenger, 70: cargo, 80: tanker,
    // Sailing, by size / kind (see sailingModelCode)
    '36s': () => sloop({ beam: 3.0, mast: 12.5, roof: 0.3 }),
    '36m': () => sloop({ beam: 3.3, mast: 13.8, roof: 0.36 }),
    '36k': () => sloop({ beam: 2.9, mast: 12.0, mizzen: 8.0, roof: 0.3, saloon: true, freeboard: 0.5, overhang: 0.4 }),
    '36y': () => sloop({ beam: 2.4, mast: 14.5, roof: 0.28, saloon: true, freeboard: 0.5 }),
    '36c': sailingCat,
};

/**
 * Sailing model for a vessel's size and shape: catamaran when the reported
 * beam is over 38 % of the length, else small sloop (< 9 m), cruising sloop
 * (< 15 m), ketch (< 24 m) or superyacht sloop.
 */
export const sailingModelCode = (length, beam) => {
    if (length > 0 && beam > 0 && beam / length > 0.38) return '36c';
    if (!(length > 0) || length < 9) return '36s';
    if (length < 15) return '36m';
    if (length < 24) return '36k';
    return '36y';
};

const cache = new Map();

/**
 * Geometries of one fleet model (body + dark details), built once and shared
 * by every target of that type, with its beam / length ratio (for
 * stretching to the AIS beam).
 */
export const fleetModel = (code) => {
    if (!cache.has(code)) {
        const parts = (GENERATORS[code] || GENERATORS[70])();
        const body = merge(parts.body);
        const dark = merge(parts.dark);
        // Beam from the hull(s) alone (the first body part), not rig or outriggers
        parts.body[0].computeBoundingBox();
        const box = parts.body[0].boundingBox;
        cache.set(code, { body, dark, beamRatio: clamp01((box.max.x - box.min.x) / FLEET_LENGTH) || 0.25 });
    }
    return cache.get(code);
};

export const FLEET_CODES = Object.keys(GENERATORS);
