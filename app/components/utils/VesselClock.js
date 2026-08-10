'use client';
/**
 * VesselClock.js — GPS-backed wall clock.
 *
 * The Raspberry Pi has no battery on its RTC: after a power cut it boots at
 * 1970 and `fake-hwclock` restores whatever date it last saw, which can be days
 * stale. Without internet nothing corrects it, and every `new Date()` in the UI
 * inherits the error — tides look up a file named after the wrong month and
 * silently return nothing, the day/night rendering flips, logbook entries sort
 * wrong.
 *
 * The GPS already carries exact UTC on the NMEA2000 bus (PGN 129029), published
 * as `navigation.datetime`. This module keeps the offset between that reference
 * and the local clock, so the whole UI can read a correct time even when the
 * system clock is not.
 *
 * `@signalk/set-system-time` also disciplines the OS clock from the same source,
 * but only once Signal K is up; this covers the UI in the meantime and stays
 * correct if that plugin is ever disabled.
 */

import { useEffect, useMemo } from 'react';
import { useSignalKPath } from '../hooks/useSignalK';

/**
 * Milliseconds to add to the local clock to get vessel time.
 * Zero means "no reference yet" — the local clock is used as-is.
 */
let _offsetMs = 0;

/** Whether a GPS reference has ever been applied. */
let _corrected = false;

/**
 * Ignore sub-minute differences. The GPS delta arrives at ~1 Hz with its own
 * transport latency; correcting for a few seconds would make the clock jitter
 * without making it more accurate for anything the UI does with it.
 */
const MIN_SIGNIFICANT_OFFSET_MS = 60000;

/**
 * Feed a UTC reference from the GPS.
 * @param {string|number|Date} datetime value of `navigation.datetime`
 * @returns {boolean} true if the offset changed
 */
export const setVesselTimeReference = (datetime) => {
    if (datetime === null || datetime === undefined) return false;

    const ref = datetime instanceof Date ? datetime.getTime() : new Date(datetime).getTime();
    if (!Number.isFinite(ref)) return false;

    const delta = ref - Date.now();
    const significant = Math.abs(delta) >= MIN_SIGNIFICANT_OFFSET_MS;
    const next = significant ? delta : 0;

    if (next === _offsetMs && _corrected === significant) return false;

    _offsetMs = next;
    _corrected = significant;
    return true;
};

/**
 * Current vessel time.
 * @returns {Date}
 */
export const vesselNow = () => new Date(Date.now() + _offsetMs);

/**
 * Offset currently applied to the local clock, in milliseconds.
 * @returns {number}
 */
export const getClockOffsetMs = () => _offsetMs;

/**
 * Whether the local clock is being corrected from GPS.
 * @returns {boolean}
 */
export const isClockCorrected = () => _corrected;

/**
 * Subscribe to `navigation.datetime` and keep the module offset fresh.
 *
 * Mount it anywhere that needs vessel time; it is safe to use in several
 * components at once since they all feed the same singleton.
 *
 * @returns {{ now: () => Date, offsetMs: number, corrected: boolean }}
 */
export const useVesselClock = () => {
    const datetime = useSignalKPath('navigation.datetime');

    // Publish to the singleton for the non-React consumers (tide file lookup).
    useEffect(() => {
        setVesselTimeReference(datetime);
    }, [datetime]);

    // Derived here rather than read back from the singleton: the effect above
    // runs after render, so reading module state would return the previous
    // value on the render that first receives a reference.
    return useMemo(() => {
        const ref = datetime == null ? NaN : new Date(datetime).getTime();
        const delta = Number.isFinite(ref) ? ref - Date.now() : 0;
        const corrected = Math.abs(delta) >= MIN_SIGNIFICANT_OFFSET_MS;
        const offsetMs = corrected ? delta : 0;
        return {
            now: () => new Date(Date.now() + offsetMs),
            offsetMs,
            corrected
        };
    }, [datetime]);
};
