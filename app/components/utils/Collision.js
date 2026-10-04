/**
 * Collision geometry shared by the AIS radar, the 3D view and the avoidance
 * advisor. Everything works in a local East/North frame in metres centred on
 * our own boat, with SI inputs (m, m/s, radians from true north).
 */

import configService from '../settings/ConfigService';

const NM = 1852;

/** Risk thresholds from settings, with COLREG-minded defaults */
export const getCollisionThresholds = () => ({
    // Closest approach below which a crossing is a risk
    cpaMeters: (Number(configService.get('cpaAlarmNM')) || 0.5) * NM,
    // Only encounters within this horizon matter
    tcpaSeconds: (Number(configService.get('tcpaAlarmMinutes')) || 20) * 60,
});

/** Velocity vector (East, North) of a course/speed */
export const velocity = (sog, cog) => ({ x: sog * Math.sin(cog), y: sog * Math.cos(cog) });

/**
 * Closest point of approach between our boat (at the origin) and a target.
 *
 * @param {Object} p
 * @param {number} p.rx - target East offset (m)
 * @param {number} p.ry - target North offset (m)
 * @param {number} p.ownSog / p.ownCog - our speed (m/s) and course (rad)
 * @param {number} p.targetSog / p.targetCog - target speed and course
 * @returns {{cpa: number, tcpa: number, own: {x,y}, target: {x,y}}|null}
 *   cpa in metres; tcpa in seconds (negative: the closest point is behind
 *   us); own / target: both positions at the closest point. Null when any
 *   input is unknown: an unknown CPA must stay unknown, not become 0.
 */
export const closestApproach = ({ rx, ry, ownSog, ownCog, targetSog, targetCog }) => {
    if (![rx, ry, ownSog, ownCog, targetSog, targetCog].every(Number.isFinite)) return null;

    const own = velocity(ownSog, ownCog);
    const tgt = velocity(targetSog, targetCog);
    const vx = tgt.x - own.x;
    const vy = tgt.y - own.y;
    const vv = vx * vx + vy * vy;

    // Same course and speed: the range never changes
    const tcpa = vv < 1e-9 ? 0 : -(rx * vx + ry * vy) / vv;
    const t = Math.max(0, tcpa);
    return {
        cpa: Math.hypot(rx + vx * t, ry + vy * t),
        tcpa,
        own: { x: own.x * t, y: own.y * t },
        target: { x: rx + tgt.x * t, y: ry + tgt.y * t },
    };
};

/**
 * Risk class of a target:
 * - 'danger': risk of collision — it will pass closer than the CPA threshold
 *   within the TCPA horizon, or it is within 100 m and still closing;
 * - 'close': near us (within 30 % of the CPA threshold, at least 200 m) but
 *   not on a collision course (opening, or passing clear);
 * - 'none' otherwise.
 */
export const collisionRisk = (approach, distance, thresholds = getCollisionThresholds()) => {
    const closing = !approach || approach.tcpa > 0;
    if (approach && approach.tcpa > 0 && approach.tcpa <= thresholds.tcpaSeconds && approach.cpa < thresholds.cpaMeters) {
        return 'danger';
    }
    if (Number.isFinite(distance) && distance < 100 && closing) return 'danger';
    if (Number.isFinite(distance) && distance < Math.max(200, thresholds.cpaMeters * 0.3)) return 'close';
    return 'none';
};
