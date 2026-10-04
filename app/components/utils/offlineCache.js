/**
 * Offline cache for what the 3D view downloads (chart tiles, seamarks,
 * bathymetry tiles, wind forecast grids): every successful download is kept
 * in the browser's Cache Storage and served from there when there is no
 * internet on board. `prefetchArea` downloads an area ahead of a passage.
 *
 * Cache Storage is per display. A server-side cache in ocearo-core (shared
 * by every screen, filled from the marina) would be the next step; the same
 * URLs can then be pointed at it.
 */

const CACHE = 'ocearo-offline-v1';
// Forecasts go stale: use the cached copy offline only, refresh when online
const FRESH_MS = { forecast: 30 * 60 * 1000 };

const available = () => typeof caches !== 'undefined';

/**
 * fetch() that stores successful responses and falls back to the stored
 * copy when the network fails (or, for `kind: 'tile'`, serves the stored
 * copy first: tiles do not change).
 *
 * @param {string} url
 * @param {{ kind?: 'tile'|'forecast' }} [options]
 * @returns {Promise<Response>}
 */
export const cachedFetch = async (url, { kind = 'tile' } = {}) => {
    if (!available()) return fetch(url);
    const cache = await caches.open(CACHE);
    if (kind === 'tile') {
        const hit = await cache.match(url);
        if (hit) return hit;
    }
    try {
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok) await cache.put(url, res.clone());
        return res;
    } catch (error) {
        const hit = await cache.match(url);
        if (hit) return hit;
        throw error;
    }
};

/** Image from the network or the offline cache (CORS-clean for canvas use) */
export const cachedImage = async (url) => {
    const res = await cachedFetch(url, { kind: 'tile' });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    const blob = await res.blob();
    return createImageBitmap(blob);
};

/** Tiles covering a disc of `radiusM` metres around a position, at zoom z */
export const tilesAround = (lat, lon, radiusM, z) => {
    const n = 2 ** z;
    const toTile = (la, lo) => ({
        x: Math.floor((lo + 180) / 360 * n),
        y: Math.floor((1 - Math.log(Math.tan(la * Math.PI / 180) + 1 / Math.cos(la * Math.PI / 180)) / Math.PI) / 2 * n),
    });
    const dLat = radiusM / 111320;
    const dLon = radiusM / (111320 * Math.cos(lat * Math.PI / 180));
    const a = toTile(lat + dLat, lon - dLon);
    const b = toTile(lat - dLat, lon + dLon);
    const out = [];
    for (let x = a.x; x <= b.x; x++) for (let y = a.y; y <= b.y; y++) out.push({ z, x, y });
    return out;
};

/**
 * Downloads an area for offline use: every tile of each template within
 * `radiusM` at the given zooms, plus the extra URLs (forecast grids).
 *
 * @param {{ lat, lon, radiusM, layers: Array<{ template, zooms: number[] }>, urls?: string[], onProgress? }} p
 * @returns {Promise<{ done: number, failed: number }>}
 */
export const prefetchArea = async ({ lat, lon, radiusM, layers, urls = [], onProgress }) => {
    const jobs = [];
    for (const { template, zooms } of layers) {
        for (const z of zooms) {
            for (const t of tilesAround(lat, lon, radiusM, z)) {
                jobs.push(template.replace('{z}', t.z).replace('{x}', t.x).replace('{y}', t.y));
            }
        }
    }
    jobs.push(...urls);
    let done = 0;
    let failed = 0;
    // A few downloads at a time, polite to the tile servers
    const queue = [...jobs];
    const worker = async () => {
        while (queue.length) {
            const url = queue.shift();
            try {
                const res = await cachedFetch(url, { kind: url.includes('forecast') ? 'forecast' : 'tile' });
                if (!res.ok) failed++;
            } catch {
                failed++;
            }
            done++;
            onProgress?.(done, jobs.length, failed);
        }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
    return { done, failed, total: jobs.length };
};

/** Approximate size of the offline cache, bytes */
export const offlineCacheSize = async () => {
    if (navigator.storage?.estimate) {
        const { usage } = await navigator.storage.estimate();
        return usage;
    }
    return null;
};

export const clearOfflineCache = () => (available() ? caches.delete(CACHE) : Promise.resolve(false));

export { FRESH_MS };
