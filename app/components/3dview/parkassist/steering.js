/**
 * Short-range path prediction for manoeuvring under engine: a kinematic
 * "bicycle" model with the rudder as the steering angle. Good enough to show
 * where the boat is going in the next few boat lengths; wind and current
 * drift are left out on purpose (the arrows show them).
 */

// Distance between the rudder and the hull's pivot point, metres (10-11 m boat)
const PIVOT_TO_RUDDER = 4.2;
// Rudder deflection beyond which the boat stops turning tighter (stall)
const MAX_EFFECTIVE_RUDDER = 35 * Math.PI / 180;

/**
 * @param {number} rudder - rudder angle, rad (+ = to starboard)
 * @param {number} length - path length, metres
 * @param {boolean} reverse - going astern
 * @returns {Array<[number, number]>} points in the boat frame, metres:
 *   x to starboard, z towards the stern (bow = -z)
 */
export const predictPath = (rudder, length, reverse = false, steps = 40) => {
    const delta = Math.max(-MAX_EFFECTIVE_RUDDER, Math.min(MAX_EFFECTIVE_RUDDER, rudder || 0));
    const dir = reverse ? 1 : -1;
    const points = [];
    if (Math.abs(delta) < 0.01) {
        for (let i = 0; i <= steps; i++) points.push([0, dir * (length * i) / steps]);
        return points;
    }
    const radius = PIVOT_TO_RUDDER / Math.tan(Math.abs(delta));
    const side = Math.sign(delta);
    for (let i = 0; i <= steps; i++) {
        const theta = (length * i) / steps / radius;
        // Forward or astern, rudder to starboard swings the track to starboard
        points.push([side * radius * (1 - Math.cos(theta)), dir * radius * Math.sin(theta)]);
    }
    return points;
};
