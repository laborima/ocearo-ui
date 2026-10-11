/**
 * Small shared state between the 3D scene and the HUD buttons over it:
 * whether the crew has moved the camera (the recenter button shows), the
 * recenter requests, and the "tap the sea to set the destination" mode.
 */
let state = { moved: false, placingWaypoint: false, message: null };
const listeners = new Set();
const recenterListeners = new Set();

const emit = () => listeners.forEach((l) => l());

export const getViewState = () => state;
export const subscribeView = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};
const set = (patch) => {
    state = { ...state, ...patch };
    emit();
};

export const setCameraMoved = (moved) => { if (state.moved !== moved) set({ moved }); };
export const setPlacingWaypoint = (placingWaypoint) => set({ placingWaypoint, message: null });
export const setViewMessage = (message) => set({ message });

export const requestRecenter = () => {
    recenterListeners.forEach((l) => l());
    setCameraMoved(false);
};
export const onRecenter = (listener) => {
    recenterListeners.add(listener);
    return () => recenterListeners.delete(listener);
};
