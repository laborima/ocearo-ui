/**
 * Voyage recorder storage: own-boat samples kept in the browser (IndexedDB),
 * grouped into voyages, for replaying a sortie in the 3D view.
 *
 * A sample is { t, lat, lon, hdg, cog, sog, stw, tws, twa, twd, aws, awa,
 * rud, roll, depth } in Signal K units (ms epoch, degrees for lat/lon,
 * radians, m/s, m). A voyage starts after a gap of more than VOYAGE_GAP_MS
 * without moving samples; voyages shorter than MIN_VOYAGE_MS are not listed.
 */

const DB_NAME = 'ocearo-voyages';
const STORE = 'samples';
export const VOYAGE_GAP_MS = 30 * 60 * 1000;
const MIN_VOYAGE_MS = 5 * 60 * 1000;
// Keep about 90 days of sailing at one sample every 5 s at most
const MAX_SAMPLES = 400000;

let dbPromise = null;

const openDb = () => {
    if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB unavailable'));
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 't' });
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => { dbPromise = null; reject(req.error); };
        });
    }
    return dbPromise;
};

const tx = async (mode, fn) => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);
        let result;
        Promise.resolve(fn(store)).then((r) => { result = r; });
        t.oncomplete = () => resolve(result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
    });
};

const requestAll = (req) => new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
});

/** Adds one sample (keyed by its time) */
export const addSample = (sample) => tx('readwrite', (store) => { store.put(sample); });

/** Samples between two times (inclusive), in time order */
export const getSamples = (from, to) => tx('readonly', (store) => requestAll(store.getAll(IDBKeyRange.bound(from, to))));

/** Drops the oldest samples beyond MAX_SAMPLES */
export const trimSamples = () => tx('readwrite', async (store) => {
    const count = await requestAll(store.count());
    if (count <= MAX_SAMPLES) return;
    const keys = await requestAll(store.getAllKeys(null, count - MAX_SAMPLES));
    keys.forEach((k) => store.delete(k));
});

const R = 6371000;
const toRad = (d) => d * Math.PI / 180;
const distanceM = (a, b) => {
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon) * Math.cos(toRad((a.lat + b.lat) / 2));
    return R * Math.hypot(dLat, dLon);
};

/**
 * Voyages found in the recorded samples, newest first:
 * [{ id, start, end, distanceM, maxSog, samples }]
 */
export const listVoyages = async () => {
    const samples = await tx('readonly', (store) => requestAll(store.getAll()));
    const voyages = [];
    let current = null;
    for (const s of samples) {
        if (!current || s.t - current.end > VOYAGE_GAP_MS) {
            current = { id: s.t, start: s.t, end: s.t, distanceM: 0, maxSog: 0, samples: 0, last: s };
            voyages.push(current);
        } else {
            current.distanceM += distanceM(current.last, s);
        }
        current.end = s.t;
        current.samples += 1;
        current.maxSog = Math.max(current.maxSog, s.sog || 0);
        current.last = s;
    }
    return voyages
        .filter(v => v.end - v.start >= MIN_VOYAGE_MS && v.distanceM > 100)
        .map(({ last, ...v }) => v)
        .reverse();
};

/** The voyage that contains a given time, if any (for a logbook entry) */
export const voyageAt = async (time) => {
    const voyages = await listVoyages();
    return voyages.find(v => time >= v.start - 60000 && time <= v.end + 60000) || null;
};
