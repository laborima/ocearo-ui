/**
 * StaleData.js — expiry of own-vessel sensor values.
 *
 * When a sensor or gateway stops sending, Signal K simply stops sending deltas:
 * nothing says the last value is no longer live. On (re)connect the server also
 * replays its whole stored model, including the last value of sources that died
 * long ago. Without an expiry the UI would show those values forever.
 *
 * Only fast, continuously broadcast sensor paths expire. Everything else is sent
 * once or on change only (design.*, notifications.*, anchor, course, tanks,
 * batteries, tides…) and stays valid until it is replaced.
 */

/** Default time without an update before a live value is cleared */
export const DEFAULT_STALE_TIMEOUT_MS = 30000;

/** How often the store looks for expired values */
export const STALE_CHECK_INTERVAL_MS = 5000;

const LIVE_PATH_PATTERNS = [
    /^navigation\.(position|speedOverGround|speedThroughWater|courseOverGround(True|Magnetic)|heading(True|Magnetic)|attitude|rateOfTurn|leewayAngle)$/,
    /^environment\.wind\./,
    /^environment\.depth\./,
    /^steering\.rudderAngle$/,
    /^propulsion\.[^.]+\.revolutions$/,
    /^performance\./,
];

/** Whether a path is a continuously broadcast sensor value that should expire */
export const isLivePath = (path) => LIVE_PATH_PATTERNS.some((re) => re.test(path));

/**
 * Timeout from the `staleDataTimeout` setting, in seconds.
 * 0 (or a negative number) disables the expiry.
 */
export const staleTimeoutMs = (seconds) => {
    if (seconds === undefined || seconds === null || seconds === '') return DEFAULT_STALE_TIMEOUT_MS;
    const value = Number(seconds);
    if (!Number.isFinite(value)) return DEFAULT_STALE_TIMEOUT_MS;
    return value > 0 ? value * 1000 : 0;
};

/**
 * Tracks when each live path was last refreshed.
 *
 * Source timestamps come from the server's clock, which may not agree with the
 * browser's (a Pi without RTC, a tablet without NTP). The server's hello message
 * carries its current time, which gives that skew. Live deltas arrive within a
 * fraction of a second, so the smallest (local time − source timestamp) seen
 * since the connection opened also bounds it. Readings are kept in source time
 * and aged against the current estimate: an old value replayed before the first
 * live one still expires at the next check.
 */
export const createStaleTracker = (timeoutMs = DEFAULT_STALE_TIMEOUT_MS) => {
    const lastSeen = new Map(); // path -> reading time, in source clock
    let skew = Infinity;

    const currentSkew = () => (Number.isFinite(skew) ? skew : 0);
    const age = (sourceTime, now) => now - currentSkew() - sourceTime;

    return {
        get timeoutMs() { return timeoutMs; },

        /** A new connection: the skew estimate starts over */
        reset() {
            skew = Infinity;
        },

        /**
         * Server clock reference (timestamp of the hello message)
         * @param {string|number|undefined} timestamp
         * @param {number} now local Date.now()
         */
        syncClock(timestamp, now) {
            const ts = timestamp ? new Date(timestamp).getTime() : NaN;
            if (Number.isFinite(ts)) skew = now - ts;
        },

        /**
         * Records a reading. Returns false when it is already older than the
         * timeout (a value replayed from the server's model) and must not be shown.
         * @param {string} path
         * @param {string|number|undefined} timestamp update.timestamp from the delta
         * @param {number} now local Date.now()
         */
        seen(path, timestamp, now) {
            if (!timeoutMs || !isLivePath(path)) return true;
            const ts = timestamp ? new Date(timestamp).getTime() : NaN;
            let sourceTime;
            if (Number.isFinite(ts)) {
                skew = Math.min(skew, now - ts);
                sourceTime = ts;
            } else {
                sourceTime = now - currentSkew();
            }
            if (age(sourceTime, now) > timeoutMs) return false;
            if (sourceTime >= (lastSeen.get(path) ?? -Infinity)) lastSeen.set(path, sourceTime);
            return true;
        },

        /** Stops tracking a path (its value now comes from somewhere else) */
        forget(path) {
            lastSeen.delete(path);
        },

        /** Treats every tracked value as just refreshed (expiry paused) */
        touchAll(now) {
            for (const path of lastSeen.keys()) lastSeen.set(path, now - currentSkew());
        },

        /** Removes and returns the paths not refreshed within the timeout */
        expire(now) {
            const expired = [];
            if (!timeoutMs) return expired;
            for (const [path, sourceTime] of lastSeen) {
                if (age(sourceTime, now) > timeoutMs) {
                    lastSeen.delete(path);
                    expired.push(path);
                }
            }
            return expired;
        },

        /** Removes and returns every tracked path (connection lost) */
        clear() {
            const paths = [...lastSeen.keys()];
            lastSeen.clear();
            return paths;
        },
    };
};
