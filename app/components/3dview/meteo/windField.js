/**
 * Wind field around the boat for the meteo layer: a GRID×GRID forecast grid
 * (10 m wind, hourly, 48 h) from Open-Meteo, and helpers to sample it.
 *
 * Open-Meteo is free for non-commercial use without a key and answers many
 * points in one request. Offline (no internet at sea), the layer falls back
 * to a uniform field from the boat's own true wind.
 */

import { cachedFetch } from '../../utils/offlineCache';

export const GRID = 9;
// Half-width of the grid, metres: wide enough to see the weather around the
// route when the camera is pulled out
export const HALF_EXTENT_M = 40000;
const HOURS = 48;
const CACHE_MS = 30 * 60 * 1000;
const R = 6371000;

let cache = { key: null, at: 0, field: null };

/** Lat/lon of grid node (i east, j north), i, j in 0..GRID-1 */
const nodeLatLon = (lat, lon, i, j) => {
    const dx = (i / (GRID - 1) * 2 - 1) * HALF_EXTENT_M;
    const dy = (j / (GRID - 1) * 2 - 1) * HALF_EXTENT_M;
    return {
        lat: lat + (dy / R) * 180 / Math.PI,
        lon: lon + (dx / (R * Math.cos(lat * Math.PI / 180))) * 180 / Math.PI,
    };
};

/** Open-Meteo request for the grid around a (rounded) position */
export const windFieldUrl = (lat, lon) => {
    const lats = [];
    const lons = [];
    for (let j = 0; j < GRID; j++) {
        for (let i = 0; i < GRID; i++) {
            const p = nodeLatLon(lat, lon, i, j);
            lats.push(p.lat.toFixed(4));
            lons.push(p.lon.toFixed(4));
        }
    }
    return `https://api.open-meteo.com/v1/forecast?latitude=${lats.join(',')}&longitude=${lons.join(',')}`
        + `&hourly=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&forecast_hours=${HOURS}&timezone=GMT`;
};

/**
 * Forecast field: { origin: {lat, lon}, start (ms, first hour), hours,
 * u, v: Float32Array[hours][GRID*GRID] (m/s, wind blowing towards +east / +north) }
 */
export const fetchWindField = async (lat, lon) => {
    // Re-fetch when the boat has moved ~10 km or the data is 30 min old
    const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
    if (cache.field && cache.key === key && Date.now() - cache.at < CACHE_MS) return cache.field;
    const url = windFieldUrl(lat, lon);
    // Kept for offline use: at sea the last forecast downloaded is shown
    const res = await cachedFetch(url, { kind: 'forecast' });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const data = await res.json();
    const points = Array.isArray(data) ? data : [data];
    const times = points[0]?.hourly?.time || [];
    const hours = times.length;
    const u = [];
    const v = [];
    for (let h = 0; h < hours; h++) {
        const uh = new Float32Array(GRID * GRID);
        const vh = new Float32Array(GRID * GRID);
        points.forEach((p, k) => {
            const speed = p.hourly.wind_speed_10m[h] ?? 0;
            // Direction the wind comes FROM; it blows towards the opposite
            const from = (p.hourly.wind_direction_10m[h] ?? 0) * Math.PI / 180;
            uh[k] = -speed * Math.sin(from);
            vh[k] = -speed * Math.cos(from);
        });
        u.push(uh);
        v.push(vh);
    }
    const field = { origin: { lat, lon }, start: Date.parse(`${times[0]}Z`), hours, u, v, source: 'open-meteo' };
    cache = { key, at: Date.now(), field };
    return field;
};

/** Uniform field from one true wind (speed m/s, direction FROM, rad) */
export const uniformField = (lat, lon, speed, directionFrom) => {
    const uh = new Float32Array(GRID * GRID).fill(-speed * Math.sin(directionFrom));
    const vh = new Float32Array(GRID * GRID).fill(-speed * Math.cos(directionFrom));
    return { origin: { lat, lon }, start: Date.now(), hours: 1, u: [uh], v: [vh], source: 'boat' };
};

/**
 * Wind (u, v) at a point east / north of the field origin (metres), at an
 * hour offset (fractional), bilinear in space and linear in time. Outside
 * the grid the edge value is kept.
 */
export const sampleWind = (field, east, north, hour = 0) => {
    const fx = Math.min(GRID - 1.001, Math.max(0, (east / HALF_EXTENT_M + 1) / 2 * (GRID - 1)));
    const fy = Math.min(GRID - 1.001, Math.max(0, (north / HALF_EXTENT_M + 1) / 2 * (GRID - 1)));
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const tx = fx - i;
    const ty = fy - j;
    const h0 = Math.min(field.hours - 1, Math.max(0, Math.floor(hour)));
    const h1 = Math.min(field.hours - 1, h0 + 1);
    const th = Math.min(1, Math.max(0, hour - h0));
    const at = (arr, h) => {
        const a = arr[h];
        const k = j * GRID + i;
        const top = a[k] * (1 - tx) + a[k + 1] * tx;
        const bottom = a[k + GRID] * (1 - tx) + a[k + GRID + 1] * tx;
        return top * (1 - ty) + bottom * ty;
    };
    return {
        u: at(field.u, h0) * (1 - th) + at(field.u, h1) * th,
        v: at(field.v, h0) * (1 - th) + at(field.v, h1) * th,
    };
};

/**
 * Windy's wind colour scale (m/s -> RGB 0..255), as published in its
 * legend: violet calm, blues and greens, yellow, red, purple in a storm.
 */
export const WINDY_SCALE = [
    [0, [98, 113, 183]], [1, [57, 97, 159]], [3, [74, 148, 169]], [5, [77, 141, 123]],
    [7, [83, 165, 83]], [9, [53, 159, 53]], [11, [167, 157, 81]], [13, [159, 127, 58]],
    [15, [161, 108, 92]], [17, [129, 58, 78]], [19, [175, 80, 136]], [21, [117, 74, 147]],
    [24, [109, 97, 163]], [27, [68, 105, 141]], [29, [92, 144, 152]], [36, [125, 68, 165]],
];

export const windColor = (speed) => {
    const s = WINDY_SCALE;
    if (speed <= s[0][0]) return s[0][1];
    for (let k = 1; k < s.length; k++) {
        if (speed <= s[k][0]) {
            const [a, ca] = s[k - 1];
            const [b, cb] = s[k];
            const f = (speed - a) / (b - a);
            return ca.map((c, n) => c + (cb[n] - c) * f);
        }
    }
    return s[s.length - 1][1];
};
