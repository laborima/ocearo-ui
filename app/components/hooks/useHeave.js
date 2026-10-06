import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSignalKPaths } from './useSignalK';

// Signal K spec path, then the one the Bareboat Necessities image maps the
// ocean-imu XDR sentences to (xdr-parser-plugin, DRT1)
const PATHS = ['environment.heave', 'navigation.heave.heave'];
// Smoothing time constant: hides the steps of a 1 Hz feed, follows a 10 Hz IMU
const TAU = 0.15;
// A heave sensor reads a few metres at most; anything beyond is a bad value
const MAX_HEAVE = 6;

/**
 * Vertical displacement of the vessel by the waves, metres, positive up,
 * eased frame by frame. Returns a ref read inside useFrame (0 without a
 * sensor). Every caller eases the same signal the same way, so the boat and
 * the water under it move together.
 */
const useHeave = () => {
    const v = useSignalKPaths(PATHS);
    const raw = v['environment.heave'] ?? v['navigation.heave.heave'];
    const target = Number.isFinite(raw) ? Math.max(-MAX_HEAVE, Math.min(MAX_HEAVE, raw)) : 0;
    const heave = useRef(0);
    useFrame((_, delta) => {
        heave.current += (target - heave.current) * (1 - Math.exp(-Math.min(delta, 0.1) / TAU));
    });
    return heave;
};

export default useHeave;
