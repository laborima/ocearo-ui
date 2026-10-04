'use client';
import { useMemo } from 'react';
import { useSignalKPaths } from './useSignalK';
import { polarSpeedSi, optimalUpwind, optimalDownwind, bestVmcHeading, vmcForHeading, wrapPi } from '../utils/Polar';

const KN_PER_MS = 1.943844;
const DEG = 180 / Math.PI;

const PATHS = [
    'navigation.speedThroughWater',
    'navigation.speedOverGround',
    'navigation.headingTrue',
    'navigation.courseOverGroundTrue',
    'environment.wind.speedTrue',
    'environment.wind.angleTrueWater',
    'environment.wind.directionTrue',
    'performance.polarSpeed',
    'performance.polarSpeedRatio',
    'navigation.courseGreatCircle.nextPoint.bearingTrue',
];

/**
 * Speed against the polar, and the angles the polar recommends.
 *
 * Prefers the server's own performance values (signalk-polar / derived-data)
 * and falls back to the bundled polar. All outputs in Signal K units (m/s,
 * rad) unless the name says otherwise.
 *
 * @returns {{
 *   ratio: number|null,        // boat speed / polar speed (0.92 = 92 %)
 *   polarSpeed: number|null,   // m/s
 *   boatSpeed: number|null,    // m/s (STW, else SOG)
 *   deltaKn: number|null,      // boat - polar, knots
 *   heading: number|null, twd: number|null, tws: number|null, twa: number|null,
 *   targetTwa: number|null,    // optimal |TWA| for the current point of sail
 *   targetHeading: number|null,// heading that sails targetTwa on this tack
 *   upwind: boolean,
 *   vmc: { bearing, best, current }|null  // velocity made good to the waypoint
 * }}
 */
const usePolarPerformance = () => {
    const v = useSignalKPaths(PATHS);

    return useMemo(() => {
        const boatSpeed = v['navigation.speedThroughWater'] ?? v['navigation.speedOverGround'] ?? null;
        const heading = v['navigation.headingTrue'] ?? v['navigation.courseOverGroundTrue'] ?? null;
        const tws = v['environment.wind.speedTrue'] ?? null;
        const twa = v['environment.wind.angleTrueWater'] ?? null;
        let twd = v['environment.wind.directionTrue'] ?? null;
        if (twd === null && Number.isFinite(twa) && Number.isFinite(heading)) twd = wrapPi(heading + twa);

        const polarSpeed = v['performance.polarSpeed'] ?? (Number.isFinite(tws) && Number.isFinite(twa) ? polarSpeedSi(tws, twa) : null);
        let ratio = v['performance.polarSpeedRatio'] ?? null;
        if (ratio === null && Number.isFinite(boatSpeed) && Number.isFinite(polarSpeed) && polarSpeed > 0.2) {
            ratio = boatSpeed / polarSpeed;
        }
        const deltaKn = Number.isFinite(boatSpeed) && Number.isFinite(polarSpeed) ? (boatSpeed - polarSpeed) * KN_PER_MS : null;

        // Optimal angle for the current point of sail (beat or run)
        let targetTwa = null;
        let targetHeading = null;
        const upwind = Number.isFinite(twa) ? Math.abs(twa) < Math.PI / 2 : true;
        if (Number.isFinite(tws)) {
            const opt = upwind ? optimalUpwind(tws * KN_PER_MS) : optimalDownwind(tws * KN_PER_MS);
            if (opt) {
                targetTwa = opt.twa / DEG;
                if (Number.isFinite(twd) && Number.isFinite(twa)) {
                    // Same tack: TWA keeps its sign (positive = wind on starboard)
                    targetHeading = wrapPi(twd - Math.sign(twa || 1) * targetTwa);
                }
            }
        }

        const bearing = v['navigation.courseGreatCircle.nextPoint.bearingTrue'];
        let vmc = null;
        if (Number.isFinite(bearing) && Number.isFinite(twd) && Number.isFinite(tws)) {
            const best = bestVmcHeading({ twd, tws, bearing });
            const current = Number.isFinite(heading) ? vmcForHeading({ twd, tws, bearing, heading }) : null;
            vmc = best ? { bearing, best, current } : null;
        }

        return { ratio, polarSpeed, boatSpeed, deltaKn, heading, twd, tws, twa, targetTwa, targetHeading, upwind, vmc };
    }, [v]);
};

export default usePolarPerformance;
