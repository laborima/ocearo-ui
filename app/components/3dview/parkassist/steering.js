/**
 * Short-range track prediction for manoeuvring under engine, integrated over
 * time: a kinematic "bicycle" model with the rudder as steering angle, plus
 * the drift from the current and from the wind on the topsides (windage).
 * Good enough to see where the boat goes in the next 20 seconds and how much
 * wind and current set it off — not a hydrodynamic model.
 */

// Distance between the rudder and the hull's pivot point, metres (10-11 m boat)
const PIVOT_TO_RUDDER = 4.2;
// Rudder deflection beyond which the boat stops turning tighter (stall)
const MAX_EFFECTIVE_RUDDER = 35 * Math.PI / 180;
// Windage drift as a share of the true wind speed, at manoeuvring speeds
const WINDAGE = 0.035;

/**
 * @param {Object} p
 * @param {number} p.rudder - rudder angle, rad (+ = to starboard)
 * @param {number} p.speed - speed through the water, m/s (negative astern)
 * @param {number} [p.seconds=20] - time ahead
 * @param {{set: number, drift: number}} [p.current] - set relative to the bow
 *        (rad, where the water goes) and drift (m/s)
 * @param {{angle: number, speed: number}} [p.wind] - true wind angle off the bow
 *        (rad, + = from starboard, where it comes from) and speed (m/s)
 * @returns {Array<[number, number]>} points in the boat frame, metres:
 *   x to starboard, z towards the stern (bow = -z)
 */
export const predictTrack = ({ rudder = 0, speed = 0, seconds = 20, current = null, wind = null, steps = 48 }) => {
    const delta = Math.max(-MAX_EFFECTIVE_RUDDER, Math.min(MAX_EFFECTIVE_RUDDER, rudder || 0));
    const yawPerMetre = Math.tan(delta) / PIVOT_TO_RUDDER;

    // Drift in the starting boat frame (it does not turn with the boat)
    let dx = 0;
    let dz = 0;
    if (current && Number.isFinite(current.set) && Number.isFinite(current.drift)) {
        dx += current.drift * Math.sin(current.set);
        dz -= current.drift * Math.cos(current.set);
    }
    if (wind && Number.isFinite(wind.angle) && Number.isFinite(wind.speed)) {
        // Pushed away from where the wind comes from
        const w = WINDAGE * wind.speed;
        dx -= w * Math.sin(wind.angle);
        dz += w * Math.cos(wind.angle);
    }

    const dt = seconds / steps;
    let x = 0;
    let z = 0;
    let psi = 0; // heading change, rad (+ = to starboard)
    const points = [[0, 0]];
    for (let i = 0; i < steps; i++) {
        x += (speed * Math.sin(psi) + dx) * dt;
        z += (-speed * Math.cos(psi) + dz) * dt;
        psi += speed * yawPerMetre * dt;
        points.push([x, z]);
    }
    return points;
};
