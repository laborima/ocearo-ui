'use client';
import { useMemo } from 'react';
import { useAIS } from '../3dview/ais/AISContext';
import { useSignalKPaths } from './useSignalK';
import usePolarPerformance from './usePolarPerformance';
import { closestApproach, getCollisionThresholds } from '../utils/Collision';
import { wrapPi } from '../utils/Polar';
import configService from '../settings/ConfigService';
import useColregs from './useColregs';

// Rule 17(b): even the stand-on vessel acts when the give-way one has not and
// collision can no longer be avoided by her alone
const LAST_MOMENT_TCPA_S = 180;

const DEG = Math.PI / 180;
const KN_PER_MS = 1.943844;

// Suggest a VMG change only when it is worth a helm order
const MIN_VMG_GAIN_KN = 0.15;
const MIN_VMG_CHANGE = 3 * DEG;
// Beyond this it is a routing decision (turn round, other side), not a trim tweak
const MAX_VMG_CHANGE = 60 * DEG;
// Avoidance search: 5° steps up to 90°, starboard first (COLREG rule 8/14 habit)
const AVOID_STEP = 5 * DEG;
const AVOID_MAX = 90 * DEG;

const PATHS = ['navigation.speedOverGround', 'navigation.courseOverGroundTrue'];

/**
 * Smallest course change keeping every risky target clear of the CPA limit.
 * @returns {number|null} signed change (rad, + = starboard), null if none found
 */
export const findAvoidance = ({ targets, sog, cog, scale, thresholds, preferSide = 0 }) => {
    const relevant = targets.filter(t => t.distanceMeters !== null && t.sceneX !== null
        && Number.isFinite(t.sog) && Number.isFinite(t.cog ?? t.cogMagnetic));
    const clear = (course) => relevant.every((t) => {
        const a = closestApproach({
            rx: t.sceneX / scale,
            ry: -t.sceneZ / scale,
            ownSog: sog,
            ownCog: course,
            targetSog: t.sog,
            targetCog: t.cog ?? t.cogMagnetic,
        });
        // Not closing (diverging or keeping station): no course change can matter
        return !a || a.tcpa <= 0 || a.tcpa > thresholds.tcpaSeconds || a.cpa >= thresholds.cpaMeters;
    });
    // The preferred side first (pass astern / starboard), all the way, then the other
    const sides = preferSide < 0 ? [-1, 1] : [1, -1];
    const sweep = (side) => {
        for (let change = AVOID_STEP; change <= AVOID_MAX + 1e-9; change += AVOID_STEP) {
            if (clear(cog + side * change)) return side * change;
        }
        return null;
    };
    if (preferSide !== 0) return sweep(sides[0]) ?? sweep(sides[1]);
    for (let change = AVOID_STEP; change <= AVOID_MAX + 1e-9; change += AVOID_STEP) {
        if (clear(cog + change)) return change;
        if (clear(cog - change)) return -change;
    }
    return null;
};

/**
 * Course advice, avoidance first:
 *  - avoid: we must keep clear (COLREG roles from useColregs): the smallest
 *    alteration that clears every target, passing astern / to starboard first
 *  - standOn: we have right of way: hold course and speed (rule 17a), unless
 *    the encounter is so close that rule 17(b) asks us to act
 *  - vmg: the polar finds a heading closing on the waypoint faster
 *
 * Advisory only: the collision rules (who gives way, restricted visibility,
 * narrow channels...) are not modelled.
 *
 * @returns {null|{kind: 'avoid'|'standOn'|'vmg', change: number, heading: number,
 *   gainKn?: number, targetName?: string, rule?: string, reason?: string,
 *   lastMoment?: boolean}} angles in rad, + = starboard
 */
const useCourseAdvice = () => {
    // Passive: avoidance only uses AIS when the AIS layer is shown
    const { targets } = useAIS({ passive: true });
    const perf = usePolarPerformance();
    const v = useSignalKPaths(PATHS);
    const thresholds = useMemo(() => getCollisionThresholds(), []);
    const colregs = useColregs();
    const scale = configService.get('aisLengthScalingFactor') || 0.7;

    return useMemo(() => {
        const sog = v['navigation.speedOverGround'];
        const cog = v['navigation.courseOverGroundTrue'] ?? perf.heading;

        // A vessel we must keep clear of comes first, then the most urgent one
        const primary = colregs.giveWayTo || colregs.primary;
        if (primary && Number.isFinite(sog) && sog > 0.3 && Number.isFinite(cog)) {
            const { target, role } = primary;
            const info = { targetName: target.name, rule: role.rule, reason: role.reason };
            const lastMoment = role.ownRole === 'stand-on'
                && Number.isFinite(target.tcpaSeconds) && target.tcpaSeconds < LAST_MOMENT_TCPA_S
                && Number.isFinite(target.cpaMeters) && target.cpaMeters < thresholds.cpaMeters * 0.3;
            if (role.ownRole === 'stand-on' && !lastMoment) {
                return { kind: 'standOn', change: 0, heading: cog, ...info };
            }
            // Pass astern of the other vessel; power-driven and head-on: starboard
            const targetSide = Math.sign(Math.sin(Math.atan2(target.sceneX, -target.sceneZ) - cog)) || 1;
            const preferSide = role.ownRole === 'both' || colregs.ownCategory === 'power' || lastMoment ? 1 : targetSide;
            const change = findAvoidance({ targets, sog, cog, scale, thresholds, preferSide });
            // No single alteration clears everyone: still say who must act
            return change !== null
                ? { kind: 'avoid', change, heading: wrapPi(cog + change), lastMoment, ...info }
                : { kind: 'avoid', change: null, heading: cog, lastMoment, noSolution: true, ...info };
        }

        const vmc = perf.vmc;
        if (vmc && Number.isFinite(vmc.current) && Number.isFinite(perf.heading)) {
            const change = wrapPi(vmc.best.heading - perf.heading);
            const gainKn = (vmc.best.vmc - vmc.current) * KN_PER_MS;
            if (gainKn >= MIN_VMG_GAIN_KN && Math.abs(change) >= MIN_VMG_CHANGE && Math.abs(change) <= MAX_VMG_CHANGE) {
                return { kind: 'vmg', change, heading: vmc.best.heading, gainKn };
            }
        }
        return null;
    }, [targets, perf, v, scale, thresholds, colregs]);
};

export default useCourseAdvice;
