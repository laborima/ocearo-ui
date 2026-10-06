/**
 * Buoys and beacons from OpenSeaMap (OpenStreetMap `seamark:*` tags),
 * downloaded through the Overpass API and kept in the offline cache in
 * cells of 0.1°: a cell is downloaded once, then served from the cache
 * (clearing the offline cache in the settings refreshes it). The missing
 * cells of an area are fetched in a single query, polite to a free service.
 */

import { readCached, storeCached } from '../../utils/offlineCache';

// Main Overpass instance, then a mirror when it is busy (it answers 504 or
// 429 at peak times). Both send CORS headers.
const ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
const CELL = 0.1;
// After a failure, leave the servers alone for a while
const RETRY_MS = 2 * 60 * 1000;

const KINDS = ['cardinal', 'lateral', 'isolated_danger', 'safe_water', 'special_purpose'];
const TYPE_RE = `^(buoy|beacon)_(${KINDS.join('|')})$`;

const round = (v) => Math.round(v * 10) / 10;

/** Cells (south-west corners) covering a disc of radiusM around a position */
export const cellsAround = (lat, lon, radiusM) => {
    const dLat = radiusM / 111320;
    const dLon = radiusM / (111320 * Math.max(0.1, Math.cos(lat * Math.PI / 180)));
    const cells = [];
    for (let s = Math.floor((lat - dLat) / CELL); s <= Math.floor((lat + dLat) / CELL); s++) {
        for (let w = Math.floor((lon - dLon) / CELL); w <= Math.floor((lon + dLon) / CELL); w++) {
            cells.push({ s: round(s * CELL), w: round(w * CELL), key: `${s}:${w}` });
        }
    }
    return cells;
};

/** Where a cell is kept in the offline cache (the query it stands for) */
const cellKey = ({ s, w }) => `${ENDPOINTS[0]}?data=${encodeURIComponent(
    `[out:json];node["seamark:type"~"${TYPE_RE}"](${s},${w},${round(s + CELL)},${round(w + CELL)});out body;`
)}`;

const list = (v) => (v ? String(v).split(';').map((s) => s.trim().toLowerCase()).filter(Boolean) : []);
const num = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
};

/**
 * One OSM node as a seamark: kind (cardinal, lateral, isolated_danger,
 * safe_water, special_purpose), buoy or beacon, category, shape, colours
 * (top to bottom) and their pattern, topmark, height, light.
 */
export const parseSeamark = (node) => {
    const t = node.tags || {};
    const type = t['seamark:type'] || '';
    const [structure, ...rest] = type.split('_');
    const kind = rest.join('_');
    const tag = (k) => t[`seamark:${type}:${k}`];
    const light = t['seamark:light:character'] ? {
        character: t['seamark:light:character'],
        group: t['seamark:light:group'] || '',
        period: num(t['seamark:light:period']),
        colour: list(t['seamark:light:colour'])[0] || 'white',
    } : null;
    return {
        id: node.id,
        lat: node.lat,
        lon: node.lon,
        name: t['seamark:name'] || t.name || '',
        kind,
        beacon: structure === 'beacon',
        category: (tag('category') || '').toLowerCase(),
        shape: (tag('shape') || '').toLowerCase(),
        colours: list(tag('colour')),
        pattern: (tag('colour_pattern') || '').toLowerCase(),
        system: (tag('system') || '').toLowerCase(),
        height: num(tag('height')),
        topmark: t['seamark:topmark:shape'] ? {
            shape: t['seamark:topmark:shape'].toLowerCase(),
            colours: list(t['seamark:topmark:colour']),
        } : null,
        light,
    };
};

let blockedUntil = 0;

const toMarks = (elements) => elements
    .filter((e) => e.type === 'node' && Number.isFinite(e.lat) && Number.isFinite(e.lon))
    .map(parseSeamark)
    .filter((m) => KINDS.includes(m.kind));

/**
 * Downloads cells in one Overpass query over their bounding box and keeps
 * each cell's share in the offline cache.
 * @returns {Promise<Object<string, object[]>>} raw OSM nodes by cell key
 */
const downloadCells = async (cells, timeout = 25) => {
    const s = Math.min(...cells.map((c) => c.s));
    const w = Math.min(...cells.map((c) => c.w));
    const n = round(Math.max(...cells.map((c) => c.s)) + CELL);
    const e = round(Math.max(...cells.map((c) => c.w)) + CELL);
    const query = `[out:json][timeout:${timeout}];node["seamark:type"~"${TYPE_RE}"](${s},${w},${n},${e});out body;`;
    for (const endpoint of ENDPOINTS) {
        try {
            const res = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, { referrerPolicy: 'strict-origin-when-cross-origin' });
            if (!res.ok) continue;
            const json = await res.json();
            // A query cut short by the server says so in `remark`: do not keep it
            if (json.remark && /error|timeout|runtime/i.test(json.remark)) continue;
            const elements = json.elements || [];
            const byCell = {};
            await Promise.all(cells.map((cell) => {
                byCell[cell.key] = elements.filter((el) => el.lat >= cell.s && el.lat < cell.s + CELL
                    && el.lon >= cell.w && el.lon < cell.w + CELL);
                const body = JSON.stringify({ elements: byCell[cell.key] });
                return storeCached(cellKey(cell), new Response(body, { headers: { 'Content-Type': 'application/json' } }));
            }));
            return byCell;
        } catch {
            // Busy or unreachable: try the mirror
        }
    }
    throw new Error('Overpass unreachable');
};

/**
 * Seamarks of cells: from the offline cache, the missing ones downloaded
 * together. Cells that could not be had are left out (try again later).
 * @returns {Promise<Object<string, object[]>>} seamarks by cell key
 */
export const loadCells = async (cells) => {
    const out = {};
    const missing = [];
    for (const cell of cells) {
        const hit = await readCached(cellKey(cell)).catch(() => null);
        if (hit) out[cell.key] = toMarks((await hit.json()).elements || []);
        else missing.push(cell);
    }
    if (missing.length && Date.now() >= blockedUntil) {
        try {
            const byCell = await downloadCells(missing);
            Object.entries(byCell).forEach(([key, elements]) => { out[key] = toMarks(elements); });
        } catch {
            // Leave the servers alone for a while
            blockedUntil = Date.now() + RETRY_MS;
        }
    }
    return out;
};

/**
 * Downloads the seamarks of an area for offline use, in one query.
 * @returns {Promise<number>} number of cells stored
 */
export const prefetchSeamarks = async (lat, lon, radiusM) => {
    const cells = cellsAround(lat, lon, radiusM);
    if (!cells.length) return 0;
    return Object.keys(await downloadCells(cells, 90)).length;
};
