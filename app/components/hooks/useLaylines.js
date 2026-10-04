'use client';
import { useMemo } from 'react';
import { useSignalKPaths } from './useSignalK';
import usePolarPerformance from './usePolarPerformance';
import { wrapPi, optimalUpwind, optimalDownwind } from '../utils/Polar';

const KN_PER_MS = 1.943844;

const PATHS = [
    'navigation.courseGreatCircle.nextPoint.bearingTrue',
    'navigation.courseGreatCircle.nextPoint.distance',
    'navigation.speedOverGround',
];

const unit = (a) => ({ x: Math.sin(a), y: Math.cos(a) });

/**
 * Laylines to the next waypoint from the polar's optimal angles.
 *
 * Frame: East/North metres, our boat at the origin. A layline is the line
 * through the waypoint that a boat on one tack sails straight into it.
 * Upwind uses the optimal beat angle (tacks), downwind the optimal run angle
 * (gybes).
 *
 * @returns {null|{
 *   waypoint: {x, y}, upwind: boolean,
 *   port: {heading}, starboard: {heading},   // headings sailed along each layline
 *   tack: null|{ point: {x, y}, distance: number, time: number|null, onTack: 'port'|'starboard' }
 * }}  tack: where to tack/gybe from the current course to fetch the waypoint
 *     (distance in m, time in s at the current SOG); null when we are not
 *     heading for the opposite layline (overstood, or wrong tack).
 */
const useLaylines = () => {
    const v = useSignalKPaths(PATHS);
    const perf = usePolarPerformance();

    return useMemo(() => {
        const bearing = v['navigation.courseGreatCircle.nextPoint.bearingTrue'];
        const distance = v['navigation.courseGreatCircle.nextPoint.distance'];
        const { twd, tws, twa, heading } = perf;
        if (![bearing, distance, twd, tws].every(Number.isFinite) || tws <= 0) return null;

        const waypoint = { x: distance * Math.sin(bearing), y: distance * Math.cos(bearing) };
        // Waypoint upwind when it lies within 90° of where the wind comes from
        const upwind = Math.abs(wrapPi(twd - bearing)) < Math.PI / 2;
        const optimal = upwind ? optimalUpwind(tws * KN_PER_MS) : optimalDownwind(tws * KN_PER_MS);
        const angle = optimal.twa * Math.PI / 180;

        // Starboard tack: wind on the starboard side, TWA > 0, heading = TWD - angle
        const starboard = { heading: wrapPi(twd - angle) };
        const port = { heading: wrapPi(twd + angle) };

        // Current tack and the layline we will meet
        let tack = null;
        if (Number.isFinite(heading) && Number.isFinite(twa)) {
            const onTack = twa >= 0 ? 'starboard' : 'port';
            const other = onTack === 'starboard' ? port : starboard;
            // Solve t·u(heading) = W + s·u(other): intersection of our course with the other layline
            const u = unit(heading);
            const w = unit(other.heading);
            const det = u.x * (-w.y) - u.y * (-w.x);
            if (Math.abs(det) > 1e-6) {
                const t = (waypoint.x * (-w.y) - waypoint.y * (-w.x)) / det;
                const s = (u.x * waypoint.y - u.y * waypoint.x) / det;
                // Ahead of us, and on the approach side of the waypoint
                if (t > 0 && s < 0) {
                    const sog = v['navigation.speedOverGround'];
                    tack = {
                        point: { x: u.x * t, y: u.y * t },
                        distance: t,
                        time: Number.isFinite(sog) && sog > 0.2 ? t / sog : null,
                        onTack,
                    };
                }
            }
        }

        return { waypoint, upwind, port, starboard, tack };
    }, [v, perf]);
};

export default useLaylines;
