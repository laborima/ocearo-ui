/**
 * Bomea (the free encyclopedia of boats and owners' logbook, https://bomea.app)
 * seen from Ocearo:
 *  - the catalogue: find a boat model and import its 3D model, dimensions,
 *    rig and polar as the boat shown in the 3D view (no account needed once
 *    Bomea is public);
 *  - the owner's boat: connect once (OAuth 2.1 with PKCE: the owner signs in
 *    on Bomea, with Google for example, and approves Ocearo), then send the
 *    voyages, fuel fills and engine hours recorded on board, read the
 *    maintenance logbook, and open the boat's page on Bomea.
 *
 * Tokens live in this browser only (localStorage), like the rest of the
 * settings. The imported glTF files are kept in the Cache API so the boat
 * still shows without a connection at sea.
 */
import configService from '../settings/ConfigService';
import { listVoyages, getSamples } from '../replay/voyageStore';
import { fetchFuelLogEntries } from '../utils/OcearoCoreUtils';

const DEFAULT_URL = 'https://bomea.app';
const AUTH_KEY = 'ocearoBomeaAuth';
const PKCE_KEY = 'ocearoBomeaPkce';
const MODEL_CACHE = 'ocearo-bomea-models';
const KN = 1.9438444924574;

export const bomeaUrl = () => (configService.get('bomeaUrl') || DEFAULT_URL).replace(/\/$/, '');

// ---------- Session (tokens) ----------

const readAuth = () => {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; }
};
const writeAuth = (a) => {
    try { a ? localStorage.setItem(AUTH_KEY, JSON.stringify(a)) : localStorage.removeItem(AUTH_KEY); } catch { /* private mode */ }
    window.dispatchEvent(new CustomEvent('bomea-auth'));
};
export const isConnected = () => !!readAuth()?.access_token;
export const disconnect = () => writeAuth(null);

/** Where Bomea sends the owner back after approval: this very page (Ocearo is a single-page app). */
const redirectUri = () => `${window.location.origin}${window.location.pathname}`;

const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const randomString = (n = 48) => b64url(crypto.getRandomValues(new Uint8Array(n)));

/** SHA-256 (FIPS 180-4) of a byte array, for PKCE outside a secure context. */
export const sha256 = (msg) => {
    const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
        0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
        0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
        0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const len = msg.length, padded = new Uint8Array(((len + 9 + 63) >> 6) << 6);
    padded.set(msg); padded[len] = 0x80;
    const dv = new DataView(padded.buffer);
    dv.setUint32(padded.length - 4, len * 8); dv.setUint32(padded.length - 8, Math.floor(len / 0x20000000));
    const w = new Uint32Array(64), rot = (x, n) => (x >>> n) | (x << (32 - n));
    for (let o = 0; o < padded.length; o += 64) {
        for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
        for (let i = 16; i < 64; i++) {
            const s0 = rot(w[i - 15], 7) ^ rot(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rot(w[i - 2], 17) ^ rot(w[i - 2], 19) ^ (w[i - 2] >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
        }
        let [a, b, c, d, e, f, g, h] = H;
        for (let i = 0; i < 64; i++) {
            const t1 = (h + (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) >>> 0;
            const t2 = ((rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
            h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
        }
        [a, b, c, d, e, f, g, h].forEach((x, i) => { H[i] = (H[i] + x) >>> 0; });
    }
    const out = new Uint8Array(32), odv = new DataView(out.buffer);
    H.forEach((x, i) => odv.setUint32(i * 4, x));
    return out.buffer;
};

/** Opens Bomea's sign-in and approval page; Bomea comes back to this page with a code (handleCallback). */
export const connect = async () => {
    const base = bomeaUrl();
    const redirect = redirectUri();
    let auth = readAuth();
    // One registration per Ocearo address (RFC 7591), kept with the session
    if (!auth?.client_id || auth.redirect_uri !== redirect || auth.base !== base) {
        const r = await fetch(`${base}/api/oauth/register`, {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ client_name: 'Ocearo', redirect_uris: [redirect] }),
        });
        const c = await r.json();
        if (!r.ok) throw new Error(c.error_description || 'Bomea refused the registration');
        auth = { client_id: c.client_id, redirect_uri: redirect, base };
        writeAuth(auth);
    }
    const verifier = randomString(48), state = randomString(16);
    // crypto.subtle only exists in a secure context: on plain http (the boat's network) the same hash in JavaScript
    const data = new TextEncoder().encode(verifier);
    const challenge = b64url(window.isSecureContext && crypto.subtle ? await crypto.subtle.digest('SHA-256', data) : sha256(data));
    const method = 'S256';
    sessionStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state }));
    const q = new URLSearchParams({ response_type: 'code', client_id: auth.client_id, redirect_uri: redirect, scope: 'read write',
        state, code_challenge: challenge, code_challenge_method: method });
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Bomea's page, on another site
    window.location.href = `${base}/api/oauth/authorize?${q}`;
};

/** On load: finishes the sign-in when Bomea sent the owner back with a code. Returns true when it did. */
export const handleCallback = async () => {
    if (typeof window === 'undefined') return false;
    const q = new URLSearchParams(window.location.search);
    const code = q.get('code'), state = q.get('state');
    let pkce = null;
    try { pkce = JSON.parse(sessionStorage.getItem(PKCE_KEY) || 'null'); } catch { /* ignore */ }
    if (!code || !pkce || state !== pkce.state) return false;
    sessionStorage.removeItem(PKCE_KEY);
    window.history.replaceState(null, '', redirectUri());
    const auth = readAuth();
    const r = await fetch(`${bomeaUrl()}/api/oauth/token`, {
        method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'authorization_code', code, code_verifier: pkce.verifier, client_id: auth.client_id, redirect_uri: auth.redirect_uri }),
    });
    const tk = await r.json();
    if (!r.ok) throw new Error(tk.error_description || 'Bomea sign-in failed');
    writeAuth({ ...auth, access_token: tk.access_token, refresh_token: tk.refresh_token, expires_at: Date.now() + (tk.expires_in || 3600) * 1000 });
    return true;
};

const refreshToken = async () => {
    const auth = readAuth();
    if (!auth?.refresh_token) return null;
    const r = await fetch(`${bomeaUrl()}/api/oauth/token`, {
        method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: auth.refresh_token, client_id: auth.client_id }),
    });
    if (!r.ok) { writeAuth({ ...auth, access_token: null, refresh_token: null }); return null; }
    const tk = await r.json();
    const next = { ...auth, access_token: tk.access_token, refresh_token: tk.refresh_token || auth.refresh_token, expires_at: Date.now() + (tk.expires_in || 3600) * 1000 };
    writeAuth(next);
    return next;
};

/** Calls the Bomea API for Ocearo, with the session's token when there is one (renewed once on 401). */
export const api = async (path, { method = 'GET', body } = {}) => {
    let auth = readAuth();
    if (auth?.access_token && auth.expires_at && auth.expires_at < Date.now() + 30000) auth = await refreshToken();
    const call = (a) => fetch(`${bomeaUrl()}/api/ocearo${path}`, {
        method, headers: { ...(a?.access_token ? { authorization: `Bearer ${a.access_token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    let r = await call(auth);
    if (r.status === 401 && auth?.refresh_token) { auth = await refreshToken(); if (auth) r = await call(auth); }
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(data.error || `Bomea: HTTP ${r.status}`), { status: r.status });
    return data;
};

// ---------- Catalogue: boats for the 3D view ----------

export const searchModels = async (q) => (await api(`/models?q=${encodeURIComponent(q)}`)).models || [];

/** Imports a catalogue model as an Ocearo boat (kept in the settings, its glTF in the cache) and selects it. */
export const importModel = async (slug) => {
    const m = await api(`/models/${encodeURIComponent(slug)}`);
    if (!m.model?.url) throw new Error('This boat has no 3D model on Bomea yet');
    const glb = await fetchModelFile(m.model.url, m.model.version, true);
    if (!glb) throw new Error('The 3D model could not be downloaded');
    const boat = {
        name: m.name, modelPath: 'bomea', source: 'bomea',
        capabilities: ['navigation', 'rudder', ...(m.type === 'motor' ? [] : ['sail']), 'color'],
        bomea: { slug: m.slug, code: m.code, page: m.page, url: m.model.url, version: m.model.version, dimensions: m.dimensions, rig: m.rig, engine: m.engine, multihull: !!m.rig?.multihull },
        polar: m.polar?.vpp || null,
    };
    const list = (configService.get('bomeaBoats') || []).filter((b) => b.name !== boat.name);
    configService.set('bomeaBoats', [...list, boat]);
    configService.set('boatChosen', true);
    configService.set('selectedBoat', boat.name);
    window.dispatchEvent(new CustomEvent('ocearo-boat-changed', { detail: boat.name }));
    return boat;
};

/** The model's glTF as an object URL: from the cache, else downloaded (and cached for the sea). */
export const fetchModelFile = async (url, version, refresh = false) => {
    const key = `${url}?v=${version ?? 0}`;
    let res = null;
    try {
        const cache = await caches.open(MODEL_CACHE);
        res = refresh ? null : await cache.match(key);
        if (!res) {
            const auth = readAuth();
            const r = await fetch(url, { headers: auth?.access_token ? { authorization: `Bearer ${auth.access_token}` } : {} });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            await cache.put(key, r.clone());
            res = r;
        }
    } catch {
        // no Cache API (plain http in some browsers): straight download
        const r = await fetch(url).catch(() => null);
        if (!r?.ok) return null;
        res = r;
    }
    return URL.createObjectURL(await res.blob());
};

// ---------- The owner's boat ----------

export const me = () => api('/me');

/** The Bomea boat linked to this Ocearo (chosen in the settings), or the member's only boat. */
export const linkedBoat = async () => {
    const { boats = [], account } = await me();
    const id = configService.get('bomeaBoatId');
    return { account, boats, boat: boats.find((b) => b.id === id) || (boats.length === 1 ? boats[0] : null) };
};

const r2 = (x) => Math.round(x * 100) / 100;

/** A recorded voyage summarised for Bomea, with a track of at most ~300 points. */
const tripOf = async (v) => {
    const samples = await getSamples(v.start, v.end);
    const step = Math.max(1, Math.ceil(samples.length / 300));
    const track = samples.filter((_, i) => i % step === 0 || i === samples.length - 1)
        .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lon)).map((s) => [s.lon, s.lat, Math.round(s.t / 1000)]);
    const sogs = samples.map((s) => s.sog).filter(Number.isFinite);
    const tws = samples.map((s) => s.tws).filter(Number.isFinite);
    return {
        id: `ocearo:voyage:${v.start}`, started_at: new Date(v.start).toISOString(), ended_at: new Date(v.end).toISOString(),
        distance_nm: r2(v.distanceM / 1852), max_sog_kn: r2((v.maxSog || 0) * KN),
        avg_sog_kn: sogs.length ? r2((sogs.reduce((a, b) => a + b, 0) / sogs.length) * KN) : null,
        max_tws_kn: tws.length ? r2(Math.max(...tws) * KN) : null, track,
    };
};

const fuelOf = (e) => {
    const f = e.fuel || {};
    const t = e.datetime || e.date || e.timestamp;
    const litres = f.liters ?? e.liters;
    if (!t || !litres) return null;
    return { id: `ocearo:fuel:${new Date(t).getTime()}`, date: new Date(t).toISOString(), litres, cost_eur: f.cost ?? null,
        engine_hours: f.engineHoursAtRefill ?? null, full_tank: true };
};

/**
 * Sends what was recorded on board to the linked Bomea boat: voyages, fuel fills,
 * engine hours (seconds of propulsion.*.runTime from Signal K) and Ocearo's own address.
 */
export const syncNow = async ({ engineSeconds = null } = {}) => {
    const { boat } = await linkedBoat();
    if (!boat) throw new Error('Choose your boat in Settings, Bomea');
    const voyages = await listVoyages().catch(() => []);
    const trips = [];
    for (const v of voyages.slice(0, 100)) trips.push(await tripOf(v));
    const fuel = (await fetchFuelLogEntries().catch(() => [])).map(fuelOf).filter(Boolean);
    const res = await api(`/boats/${boat.id}/sync`, { method: 'POST', body: {
        trips, fuel, engine_hours: Number.isFinite(engineSeconds) ? r2(engineSeconds / 3600) : null, ocearo_url: redirectUri(),
    } });
    configService.set('bomeaLastSync', new Date().toISOString());
    return res;
};

/** The boat's maintenance logbook (bomea-logbook/1). */
export const logbook = async () => {
    const { boat } = await linkedBoat();
    if (!boat) throw new Error('Choose your boat in Settings, Bomea');
    return api(`/boats/${boat.id}/logbook`);
};

/** Opens a Bomea page in a new tab: the boat's logbook (with a tab), else the site. */
export const openInBomea = async (tab = '') => {
    let url = bomeaUrl();
    try {
        const { boat } = await linkedBoat();
        if (boat) url = `${boat.logbook_page}${tab ? `?tab=${tab}` : ''}`;
    } catch { /* not connected: the site */ }
    window.open(url, '_blank', 'noopener');
};

const BomeaService = { bomeaUrl, isConnected, connect, disconnect, handleCallback, api, searchModels, importModel, fetchModelFile, me, linkedBoat, syncNow, logbook, openInBomea };
export default BomeaService;
