/**
 * Boat polar: theoretical boat speed for a true wind speed and angle, optimal
 * upwind / downwind angles, and the heading that best closes on a waypoint.
 *
 * Source: an ORC-style VPP table (public/boats/default/polar/polar.json):
 *   speeds: TWS columns (kn); angles: TWA rows (deg) with boat speed (kn);
 *   beat_angle / beat_vmg, run_angle / run_vmg: optimal VMG angles and the VMG
 *   itself (not the boat speed: speed = vmg / |cos(angle)|).
 *
 * Units: knots and degrees inside this module; helpers ending in `Si` take
 * Signal K units (m/s, radians).
 */
import polarData from '@/public/boats/default/polar/polar.json';

const KN_PER_MS = 1.943844;
const DEG = 180 / Math.PI;
const VPP = polarData.vpp;

const lerp = (a, b, t) => a + (b - a) * t;

/** Index and ratio of `x` in the ascending array `xs`, clamped to its ends */
const locate = (xs, x) => {
    if (x <= xs[0]) return [0, 0];
    const last = xs.length - 1;
    if (x >= xs[last]) return [last - 1, 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    return [i, (x - xs[i]) / (xs[i + 1] - xs[i])];
};

/** Speed curve (angle -> speed) for TWS column `col` */
const curveForColumn = (col) => {
    const beatAngle = VPP.beat_angle[col];
    const runAngle = VPP.run_angle[col];
    const beatSpeed = VPP.beat_vmg[col] / Math.cos(beatAngle / DEG);
    const runSpeed = VPP.run_vmg[col] / Math.abs(Math.cos(runAngle / DEG));
    const points = [[0, 0], [beatAngle * 0.7, beatSpeed * 0.55], [beatAngle, beatSpeed]];
    for (const angle of VPP.angles) {
        if (angle > beatAngle && angle < runAngle) points.push([angle, VPP[String(angle)][col]]);
    }
    points.push([runAngle, runSpeed]);
    if (runAngle < 180) points.push([180, VPP.run_vmg[col]]);
    return points;
};

const CURVES = VPP.speeds.map((_, col) => curveForColumn(col));

const speedOnCurve = (curve, twa) => {
    const angles = curve.map(p => p[0]);
    const [i, t] = locate(angles, twa);
    return lerp(curve[i][1], curve[i + 1][1], t);
};

/**
 * Theoretical boat speed (kn) for a true wind speed (kn) and angle (deg,
 * either side). Below the lightest column, speed scales with the wind.
 */
export const polarSpeed = (twsKn, twaDeg) => {
    if (!Number.isFinite(twsKn) || !Number.isFinite(twaDeg) || twsKn <= 0) return null;
    const twa = Math.min(180, Math.abs(((twaDeg + 540) % 360) - 180));
    const speeds = VPP.speeds;
    if (twsKn < speeds[0]) return speedOnCurve(CURVES[0], twa) * (twsKn / speeds[0]);
    const [i, t] = locate(speeds, twsKn);
    return lerp(speedOnCurve(CURVES[i], twa), speedOnCurve(CURVES[i + 1], twa), t);
};

const interpolateColumn = (array, twsKn) => {
    const [i, t] = locate(VPP.speeds, twsKn);
    return lerp(array[i], array[i + 1], t);
};

/** Best upwind angle (deg), its boat speed and VMG (kn) */
export const optimalUpwind = (twsKn) => {
    if (!Number.isFinite(twsKn) || twsKn <= 0) return null;
    const twa = interpolateColumn(VPP.beat_angle, twsKn);
    const speed = polarSpeed(twsKn, twa);
    return { twa, speed, vmg: speed * Math.cos(twa / DEG) };
};

/** Best downwind angle (deg), its boat speed and VMG (kn, positive) */
export const optimalDownwind = (twsKn) => {
    if (!Number.isFinite(twsKn) || twsKn <= 0) return null;
    const twa = interpolateColumn(VPP.run_angle, twsKn);
    const speed = polarSpeed(twsKn, twa);
    return { twa, speed, vmg: -speed * Math.cos(twa / DEG) };
};

/** polarSpeed with Signal K units: m/s and radians in, m/s out */
export const polarSpeedSi = (twsMs, twaRad) => {
    const kn = polarSpeed(twsMs * KN_PER_MS, twaRad * DEG);
    return kn === null ? null : kn / KN_PER_MS;
};

/** Normalise an angle to (-PI, PI] */
export const wrapPi = (a) => {
    let x = (a + Math.PI) % (2 * Math.PI);
    if (x < 0) x += 2 * Math.PI;
    return x - Math.PI;
};

/**
 * Heading that maximises the velocity made good towards a waypoint (VMC),
 * searched every degree within ±100° of the bearing. All Signal K units.
 *
 * @param {Object} p
 * @param {number} p.twd - true wind direction, where it blows FROM (rad)
 * @param {number} p.tws - true wind speed (m/s)
 * @param {number} p.bearing - bearing to the waypoint (rad)
 * @returns {{heading: number, speed: number, vmc: number}|null} m/s, rad
 */
export const bestVmcHeading = ({ twd, tws, bearing }) => {
    if (![twd, tws, bearing].every(Number.isFinite) || tws <= 0) return null;
    let best = null;
    for (let d = -100; d <= 100; d++) {
        const heading = bearing + d / DEG;
        const speed = polarSpeedSi(tws, wrapPi(twd - heading));
        if (speed === null) continue;
        const vmc = speed * Math.cos(heading - bearing);
        if (!best || vmc > best.vmc) best = { heading: wrapPi(heading), speed, vmc };
    }
    return best;
};

/** VMC (m/s) of a given heading, from the polar */
export const vmcForHeading = ({ twd, tws, bearing, heading }) => {
    if (![twd, tws, bearing, heading].every(Number.isFinite)) return null;
    const speed = polarSpeedSi(tws, wrapPi(twd - heading));
    return speed === null ? null : speed * Math.cos(heading - bearing);
};
