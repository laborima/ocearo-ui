/**
 * Replay of a recorded voyage: while active, live own-boat data is ignored
 * (see OcearoContext) and the recorded samples are fed into the same Signal K
 * store, interpolated, at an accelerated rate. Every view (3D, HUD, wake,
 * sails, isochrones) then shows the voyage as if it were live.
 *
 * Module-level state with a tiny subscription API, so the Signal K delta
 * handler can check `isReplaying()` without React.
 */

const listeners = new Set();
let state = { active: false, playing: false, speed: 30, time: 0, start: 0, end: 0, voyage: null };
let samples = [];
let timer = null;
let lastTick = 0;
let push = null; // updateSignalKData from OcearoContext

const emit = () => listeners.forEach((l) => l(state));
const set = (patch) => { state = { ...state, ...patch }; emit(); };

export const getReplayState = () => state;
export const isReplaying = () => state.active;
export const subscribeReplay = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

/** Registers the store writer (OcearoContext's updateSignalKData) */
export const setReplaySink = (fn) => { push = fn; };

const lerp = (a, b, k) => a + (b - a) * k;
const lerpAngle = (a, b, k) => {
    const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
    return a + d * k;
};
const ANGLES = new Set(['hdg', 'cog', 'twa', 'twd', 'awa', 'rud', 'roll']);

/** Sample at time t, interpolated between its neighbours */
const sampleAt = (t) => {
    if (!samples.length) return null;
    let lo = 0;
    let hi = samples.length - 1;
    if (t <= samples[0].t) return samples[0];
    if (t >= samples[hi].t) return samples[hi];
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (samples[mid].t <= t) lo = mid; else hi = mid;
    }
    const a = samples[lo];
    const b = samples[hi];
    const k = (t - a.t) / Math.max(1, b.t - a.t);
    const out = { t };
    for (const key of Object.keys(a)) {
        if (key === 't') continue;
        const va = a[key];
        const vb = b[key];
        if (!Number.isFinite(va) || !Number.isFinite(vb)) { out[key] = va ?? vb; continue; }
        out[key] = ANGLES.has(key) ? lerpAngle(va, vb, k) : lerp(va, vb, k);
    }
    return out;
};

/** Signal K paths for a sample */
export const sampleToPaths = (s) => {
    const p = {};
    const put = (path, v) => { if (v !== undefined && v !== null && (typeof v !== 'number' || Number.isFinite(v))) p[path] = v; };
    if (Number.isFinite(s.lat) && Number.isFinite(s.lon)) p['navigation.position'] = { latitude: s.lat, longitude: s.lon };
    put('navigation.headingTrue', s.hdg);
    put('navigation.courseOverGroundTrue', s.cog ?? s.hdg);
    put('navigation.speedOverGround', s.sog);
    put('navigation.speedThroughWater', s.stw ?? s.sog);
    put('environment.wind.speedTrue', s.tws);
    put('environment.wind.angleTrueWater', s.twa);
    put('environment.wind.directionTrue', s.twd);
    put('environment.wind.speedApparent', s.aws);
    put('environment.wind.angleApparent', s.awa);
    put('steering.rudderAngle', s.rud);
    put('environment.depth.belowKeel', s.depth);
    if (Number.isFinite(s.roll)) p['navigation.attitude'] = { roll: s.roll, pitch: 0, yaw: s.hdg ?? 0 };
    return p;
};

const TICK_MS = 100;

const tick = () => {
    const now = Date.now();
    const dt = now - lastTick;
    lastTick = now;
    if (!state.playing) return;
    let time = state.time + dt * state.speed;
    if (time >= state.end) {
        time = state.end;
        set({ playing: false });
    }
    state = { ...state, time };
    const s = sampleAt(time);
    if (s && push) push(sampleToPaths(s));
    emit();
};

/**
 * Starts replaying a voyage.
 *
 * @param {{ start: number, end: number }} voyage
 * @param {Array<Object>} voyageSamples - recorded samples, time order
 */
export const startReplay = (voyage, voyageSamples) => {
    stopReplay();
    samples = voyageSamples;
    set({ active: true, playing: true, time: voyage.start, start: voyage.start, end: voyage.end, voyage });
    const first = sampleAt(voyage.start);
    if (first && push) push(sampleToPaths(first));
    lastTick = Date.now();
    timer = setInterval(tick, TICK_MS);
};

export const stopReplay = () => {
    if (timer) clearInterval(timer);
    timer = null;
    samples = [];
    set({ active: false, playing: false, voyage: null });
};

export const togglePlay = () => {
    if (!state.active) return;
    lastTick = Date.now();
    set({ playing: !state.playing, time: state.time >= state.end ? state.start : state.time });
};

export const setReplaySpeed = (speed) => set({ speed });

export const seekReplay = (time) => {
    if (!state.active) return;
    const t = Math.max(state.start, Math.min(state.end, time));
    set({ time: t });
    const s = sampleAt(t);
    if (s && push) push(sampleToPaths(s));
};

/** Recorded track of the voyage being replayed: [{ t, lat, lon }] */
export const replayTrack = () => samples;
