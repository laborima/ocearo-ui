import { useFrame } from '@react-three/fiber';

// Near plane as a share of the camera distance to the boat
const NEAR_RATIO = 0.05;
const MIN_NEAR = 5;

/**
 * Keeps the depth buffer precise when the camera pulls out. The sea, the
 * chart, the wind sheet and the wake lie a few centimetres apart; with a
 * fixed near plane the depth resolution at 2 km is coarser than that gap and
 * those layers flicker in bands (meteo and chart views zoomed out). The near
 * plane follows the camera distance instead: nothing is ever closer to the
 * camera than a fraction of its distance to the boat it orbits.
 */
const DepthRange = () => {
    useFrame(({ camera }) => {
        const near = Math.max(MIN_NEAR, camera.position.length() * NEAR_RATIO);
        // Only re-project on a real change (> 10 %)
        if (Math.abs(near - camera.near) > camera.near * 0.1) {
            camera.near = near;
            camera.updateProjectionMatrix();
        }
    });
    return null;
};

export default DepthRange;
