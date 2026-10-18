/**
 * Surface current around the boat for the current layer: a GRID×GRID
 * forecast grid (hourly, 48 h) from the Open-Meteo marine API, which serves
 * Mercator Ocean's SMOC model (1/12°, ~8 km: tides, wind drift and the
 * large-scale circulation). A smoothed field: in a narrow pass the real
 * tidal stream runs much faster than the model says.
 *
 * Same shape as the wind field (u, v towards +east / +north, m/s), so the
 * same sampler serves both. Offline, the layer falls back to a uniform field
 * from the current the boat's instruments publish, if any.
 */

import { cachedFetch } from '../../utils/offlineCache';

export const CURRENT_GRID = 9;
// Half-width of the grid, metres: the seabed is drawn over ±3 km, the model
// resolves ~8 km, a bit more around keeps the bilinear field smooth
export const CURRENT_HALF_M = 12000;
const HOURS = 48;
const CACHE_MS = 30 * 60 * 1000;
const R = 6371000;

let cache = { key: null, at: 0, field: null };

// Top of the colour scale in use (m/s), shared by the 3D layer and its legend
const MIN_SCALE = 0.5 / 1.943844; // half a knot
let scaleTop = null;
const listeners = new Set();
export const getCurrentScale = () => scaleTop;
export const subscribeCurrentScale = (l) => { listeners.add(l); return () => listeners.delete(l); };
/** Scale for a field: its strongest current, rounded up to a quarter knot */
export const setCurrentScale = (field) => {
    const kn = Math.max(MIN_SCALE, field?.max || 0) * 1.943844;
    scaleTop = field ? Math.ceil(kn * 4) / 4 / 1.943844 : null;
    listeners.forEach((l) => l(scaleTop));
    return scaleTop;
};

const nodeLatLon = (lat, lon, i, j) => {
    const dx = (i / (CURRENT_GRID - 1) * 2 - 1) * CURRENT_HALF_M;
    const dy = (j / (CURRENT_GRID - 1) * 2 - 1) * CURRENT_HALF_M;
    return {
        lat: lat + (dy / R) * 180 / Math.PI,
        lon: lon + (dx / (R * Math.cos(lat * Math.PI / 180))) * 180 / Math.PI,
    };
};

export const currentFieldUrl = (lat, lon) => {
    const lats = [];
    const lons = [];
    for (let j = 0; j < CURRENT_GRID; j++) {
        for (let i = 0; i < CURRENT_GRID; i++) {
            const p = nodeLatLon(lat, lon, i, j);
            lats.push(p.lat.toFixed(4));
            lons.push(p.lon.toFixed(4));
        }
    }
    return `https://marine-api.open-meteo.com/v1/marine?latitude=${lats.join(',')}&longitude=${lons.join(',')}`
        + `&hourly=ocean_current_velocity,ocean_current_direction&forecast_hours=${HOURS}&timezone=GMT`;
};

/**
 * Forecast field: { origin, start, hours, grid, half, u, v, max } (m/s,
 * flowing towards +east / +north; max: the strongest over the forecast).
 * Land cells, without a value, are still water.
 */
export const fetchCurrentField = async (lat, lon) => {
    const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
    if (cache.field && cache.key === key && Date.now() - cache.at < CACHE_MS) return cache.field;
    const res = await cachedFetch(currentFieldUrl(lat, lon), { kind: 'forecast' });
    if (!res.ok) throw new Error(`Open-Meteo marine ${res.status}`);
    const data = await res.json();
    const points = Array.isArray(data) ? data : [data];
    const times = points[0]?.hourly?.time || [];
    const hours = times.length;
    const u = [];
    const v = [];
    for (let h = 0; h < hours; h++) {
        const uh = new Float32Array(CURRENT_GRID * CURRENT_GRID);
        const vh = new Float32Array(CURRENT_GRID * CURRENT_GRID);
        points.forEach((p, k) => {
            // km/h; the direction is where the current flows TO
            const speed = (p.hourly.ocean_current_velocity[h] ?? 0) / 3.6;
            const to = (p.hourly.ocean_current_direction[h] ?? 0) * Math.PI / 180;
            uh[k] = speed * Math.sin(to);
            vh[k] = speed * Math.cos(to);
        });
        u.push(uh);
        v.push(vh);
    }
    // Strongest current of the next two days around: the top of the colour
    // scale, so a weak tidal stream still spans the colours
    let max = 0;
    u.forEach((uh, h) => uh.forEach((x, k) => { max = Math.max(max, Math.hypot(x, v[h][k])); }));
    const field = { origin: { lat, lon }, start: Date.parse(`${times[0]}Z`), hours, grid: CURRENT_GRID, half: CURRENT_HALF_M, u, v, max, source: 'open-meteo' };
    cache = { key, at: Date.now(), field };
    return field;
};

/** Uniform field from the boat's measured current (drift m/s, set true rad, towards) */
export const uniformCurrent = (lat, lon, drift, set) => {
    const uh = new Float32Array(CURRENT_GRID * CURRENT_GRID).fill(drift * Math.sin(set));
    const vh = new Float32Array(CURRENT_GRID * CURRENT_GRID).fill(drift * Math.cos(set));
    return { origin: { lat, lon }, start: Date.now(), hours: 1, grid: CURRENT_GRID, half: CURRENT_HALF_M, u: [uh], v: [vh], max: drift, source: 'boat' };
};
