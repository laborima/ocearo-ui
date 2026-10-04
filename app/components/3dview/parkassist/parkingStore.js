/**
 * Berth used by the harbour view: what kind of mooring, and where it is.
 *
 * Today the berth is virtual: placed ahead of the boat when the harbour view
 * opens (or on demand). A berth detector (camera) will later call setBerth()
 * with the measured pose; nothing else has to change.
 *
 * Pose in sea-anchored East/North metres (same origin as useOwnTrack) and a
 * heading (rad): the direction the boat must point once moored.
 */
import { useSyncExternalStore } from 'react';

export const BERTH_TYPES = ['bow', 'stern', 'side', 'buoy'];

let state = {
    type: 'bow',          // bow-in finger berth, stern-in, alongside, mooring buoy
    side: 'starboard',    // alongside: which side goes to the pontoon
    pose: null,           // { x, y, heading } or null until placed
    source: 'virtual',    // 'virtual' | 'camera'
};
const listeners = new Set();
const emit = () => listeners.forEach(l => l());

export const getBerth = () => state;
export const setBerth = (patch) => {
    state = { ...state, ...patch };
    emit();
};
const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

/** React hook: the current berth */
export const useBerth = () => useSyncExternalStore(subscribe, getBerth, getBerth);

/**
 * Place a virtual berth `distance` metres ahead of the boat, its entrance
 * facing us. A stern-in berth faces us (pontoon on the far side): come in,
 * turn round, back in.
 * @param {{x:number,y:number}} position - own East/North metres
 * @param {number} heading - own heading (rad)
 * @param {string} [type] - berth type, defaults to the current one
 */
export const placeVirtualBerth = (position, heading, type = state.type, distance = 22) => {
    setBerth({
        type,
        pose: {
            x: position.x + Math.sin(heading) * distance,
            y: position.y + Math.cos(heading) * distance,
            heading: type === 'stern' ? heading + Math.PI : heading,
        },
        source: 'virtual',
    });
};
