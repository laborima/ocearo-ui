/**
 * Procedural 3D seamarks, in metres, standing on the water at y = 0: the
 * body of the buoy or beacon painted with its colours (horizontal bands or
 * vertical stripes), the topmark on a short staff, and where the light sits.
 * One geometry with vertex colours per look, shared by every mark that
 * looks the same.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const PAINT = {
    red: '#c8102e',
    green: '#00843d',
    yellow: '#f2c200',
    black: '#1b1b1b',
    white: '#f0f0f0',
    orange: '#f07c00',
    blue: '#1f4fa0',
    grey: '#8a8a8a',
    brown: '#6b4a2b',
};

// Colours and topmarks a mark wears when OpenSeaMap does not say
const CARDINAL = {
    north: { colours: ['black', 'yellow'], topmark: '2 cones up' },
    south: { colours: ['yellow', 'black'], topmark: '2 cones down' },
    east: { colours: ['black', 'yellow', 'black'], topmark: '2 cones base together' },
    west: { colours: ['yellow', 'black', 'yellow'], topmark: '2 cones point together' },
};

/** Lateral colour of a side in the buoyage region (IALA A by default) */
const lateralColour = (category, system) => {
    const port = system === 'iala-b' ? 'green' : 'red';
    const starboard = system === 'iala-b' ? 'red' : 'green';
    if (category.startsWith('preferred_channel_port')) return [starboard, port, starboard];
    if (category.startsWith('preferred_channel_starboard')) return [port, starboard, port];
    return [category === 'starboard' ? starboard : port];
};

/** The look of a mark with every gap filled from the IALA rules */
export const markStyle = (mark) => {
    const { kind, category, system } = mark;
    let colours = mark.colours;
    let pattern = mark.pattern || 'horizontal';
    let topmark = mark.topmark?.shape || '';
    let topColours = mark.topmark?.colours || [];
    let shape = mark.shape;

    if (kind === 'cardinal') {
        const c = CARDINAL[category] || CARDINAL.north;
        if (!colours.length) colours = c.colours;
        if (!topmark) topmark = c.topmark;
        if (!topColours.length) topColours = ['black'];
        shape = shape || 'pillar';
    } else if (kind === 'lateral') {
        const port = !category.includes('starboard') || category.startsWith('preferred_channel_port');
        if (!colours.length) colours = lateralColour(category, system);
        if (!topmark) topmark = port ? 'cylinder' : 'cone, point up';
        if (!topColours.length) topColours = [colours[0]];
        shape = shape || (port ? 'can' : 'conical');
    } else if (kind === 'isolated_danger') {
        if (!colours.length) colours = ['black', 'red', 'black'];
        if (!topmark) topmark = '2 spheres';
        if (!topColours.length) topColours = ['black'];
        shape = shape || 'pillar';
    } else if (kind === 'safe_water') {
        if (!colours.length) { colours = ['red', 'white']; pattern = 'vertical'; }
        if (!topmark) topmark = 'sphere';
        if (!topColours.length) topColours = ['red'];
        shape = shape || 'pillar';
    } else {
        if (!colours.length) colours = ['yellow'];
        if (!topmark) topmark = 'x-shape';
        if (!topColours.length) topColours = ['yellow'];
        shape = shape || 'pillar';
    }
    return { beacon: mark.beacon, shape, colours, pattern, topmark, topColours, height: mark.height };
};

/** A paint colour, or its brightness in red for the night theme */
const paint = (name, night) => {
    const c = new THREE.Color(PAINT[name] || PAINT.grey);
    if (!night) return c;
    const l = 0.25 + 0.75 * (0.299 * c.r + 0.587 * c.g + 0.114 * c.b);
    return new THREE.Color(l, l * 0.36, l * 0.28);
};

/**
 * Non-indexed copy with a colour per triangle, picked from where it sits:
 * `pick(heightFraction, angle)` returns the colour.
 */
const coloured = (geometry, pick, y0, y1) => {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    g.deleteAttribute('uv');
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i += 3) {
        const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
        // Middle of the triangle's height span: both triangles of a quad
        // get the same colour, so band edges stay straight
        const ys = [pos.getY(i), pos.getY(i + 1), pos.getY(i + 2)];
        const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
        const cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
        const t = THREE.MathUtils.clamp((cy - y0) / Math.max(1e-6, y1 - y0), 0, 0.9999);
        const c = pick(t, Math.atan2(cz, cx) + Math.PI);
        for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], (i + k) * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
};

const at = (geometry, y, rotX = 0, rotZ = 0) => {
    if (rotX) geometry.rotateX(rotX);
    if (rotZ) geometry.rotateZ(rotZ);
    geometry.translate(0, y, 0);
    return geometry;
};

// Height segments of a body: the colour bands are painted per triangle, and
// 12 splits evenly into 2, 3 or 4 bands
const BANDS = 12;

/** Body parts of a buoy or beacon (y from 0) and its height */
const bodyParts = ({ beacon, shape, height }) => {
    if (beacon) {
        const h = THREE.MathUtils.clamp(height || 0, 0, 12) || (shape === 'tower' ? 8 : 5);
        if (shape === 'tower' || shape === 'lattice') {
            return { parts: [at(new THREE.CylinderGeometry(0.9, 1.3, h, 16, BANDS), h / 2)], top: h };
        }
        if (shape === 'cairn') return { parts: [at(new THREE.ConeGeometry(1.6, 2.6, 12, BANDS), 1.3)], top: 2.6 };
        const r = shape === 'pile' ? 0.35 : 0.14;
        return { parts: [at(new THREE.CylinderGeometry(r, r, h, 10, BANDS), h / 2)], top: h };
    }
    switch (shape) {
        case 'can':
            return { parts: [at(new THREE.CylinderGeometry(0.75, 0.75, 1.5, 20, BANDS), 0.75)], top: 1.5 };
        case 'conical':
            return { parts: [at(new THREE.CylinderGeometry(0.9, 0.9, 0.3, 20, BANDS), 0.15), at(new THREE.ConeGeometry(0.9, 1.7, 20, BANDS), 1.15)], top: 2.0 };
        case 'spherical':
            return { parts: [at(new THREE.SphereGeometry(0.85, 20, 12), 0.6)], top: 1.45 };
        case 'spar':
            return { parts: [at(new THREE.CylinderGeometry(0.22, 0.22, 4, 10, BANDS), 2)], top: 4 };
        case 'barrel':
            return { parts: [at(new THREE.CylinderGeometry(0.6, 0.6, 1.6, 16, BANDS), 0.45, 0, Math.PI / 2)], top: 1.05 };
        case 'super-buoy':
            return { parts: [at(new THREE.CylinderGeometry(2, 2, 1.2, 24, BANDS), 0.6)], top: 1.2 };
        default: // pillar
            return {
                parts: [
                    at(new THREE.CylinderGeometry(1.0, 1.0, 0.5, 20, BANDS), 0.25),
                    at(new THREE.CylinderGeometry(0.3, 0.45, 2.8, 14, BANDS), 1.9),
                ],
                top: 3.3,
            };
    }
};

const CONE_R = 0.42;
const CONE_H = 0.62;
const cone = (y, up) => at(new THREE.ConeGeometry(CONE_R, CONE_H, 16), y + CONE_H / 2, up ? 0 : Math.PI);
const ball = (y) => at(new THREE.SphereGeometry(0.32, 14, 10), y + 0.32);

/** Topmark parts above y0 and their top */
const topmarkParts = (shape, y0) => {
    const g = 0.12;
    if (shape.includes('2 cones')) {
        if (shape.includes('up')) return [[cone(y0, true), cone(y0 + CONE_H + g, true)], y0 + 2 * CONE_H + g];
        if (shape.includes('down')) return [[cone(y0, false), cone(y0 + CONE_H + g, false)], y0 + 2 * CONE_H + g];
        if (shape.includes('base')) return [[cone(y0, false), cone(y0 + CONE_H, true)], y0 + 2 * CONE_H];
        // point together
        return [[cone(y0, true), cone(y0 + CONE_H, false)], y0 + 2 * CONE_H];
    }
    if (shape.includes('cone')) return [[cone(y0, !shape.includes('down'))], y0 + CONE_H];
    if (shape.includes('2 spheres')) return [[ball(y0), ball(y0 + 0.64 + g)], y0 + 1.28 + g];
    if (shape.includes('sphere')) return [[ball(y0)], y0 + 0.64];
    if (shape.includes('cylinder') || shape === 'can') {
        return [[at(new THREE.CylinderGeometry(0.32, 0.32, 0.6, 14), y0 + 0.3)], y0 + 0.6];
    }
    if (shape.includes('x') || shape.includes('cross') || shape.includes('saltire')) {
        const bar = (a) => at(new THREE.BoxGeometry(0.9, 0.14, 0.14), y0 + 0.4, 0, a);
        return [[bar(Math.PI / 4), bar(-Math.PI / 4)], y0 + 0.8];
    }
    if (shape.includes('square') || shape.includes('board') || shape.includes('rectangle') || shape.includes('cube')) {
        return [[at(new THREE.BoxGeometry(0.6, 0.6, 0.6), y0 + 0.3)], y0 + 0.6];
    }
    return [[], y0];
};

const cache = new Map();

/**
 * Geometry of a seamark look (cached) with the height of its light.
 * @param {object} style - from markStyle
 * @param {boolean} night - night theme: brightness in red
 * @returns {{geometry: THREE.BufferGeometry, lightY: number}}
 */
export const seamarkGeometry = (style, night) => {
    const key = JSON.stringify([style, night]);
    if (cache.has(key)) return cache.get(key);

    const { parts, top } = bodyParts(style);
    const bands = style.colours.map((c) => paint(c, night));
    const stripes = style.pattern === 'vertical' && bands.length > 1;
    // Bands from the top down, as OpenSeaMap lists them
    const pickBody = (t, angle) => (stripes
        ? bands[Math.floor(angle / (2 * Math.PI) * bands.length * 2) % bands.length]
        : bands[Math.min(bands.length - 1, Math.floor((1 - t) * bands.length))]);
    const body = parts.map((p) => coloured(p, pickBody, 0, top));

    const staff = 0.35;
    const [tops, topY] = topmarkParts(style.topmark, top + staff);
    const topPaint = paint(style.topColours[0] || 'black', night);
    const pieces = [...body, ...tops.map((p) => coloured(p, () => topPaint, 0, 1))];
    if (tops.length) {
        pieces.push(coloured(at(new THREE.CylinderGeometry(0.05, 0.05, staff + 0.1, 6), top + staff / 2), () => topPaint, 0, 1));
    }
    const geometry = mergeGeometries(pieces);
    pieces.forEach((p) => p.dispose());
    const result = { geometry, lightY: Math.max(topY, top) + 0.25 };
    cache.set(key, result);
    return result;
};
