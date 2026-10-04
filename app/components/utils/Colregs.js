/**
 * Right of way between two vessels on a collision course (COLREG / RIPAM,
 * rules 12 to 18), from what AIS and our instruments tell us.
 *
 * Simplified on purpose: it ignores restricted visibility (rule 19), narrow
 * channels and traffic separation schemes (rules 9-10), and vessels whose
 * status AIS does not report. It is a display aid, never a decision.
 *
 * Angles in radians from true north, positions in East/North metres with our
 * boat at the origin, speeds in m/s.
 */
import { wrapPi } from './Polar';

const DEG = Math.PI / 180;

// Rule 18 hierarchy: a vessel keeps out of the way of any vessel ranked above it
export const CATEGORY_RANK = { power: 1, sail: 2, fishing: 3, restricted: 4 };

/**
 * Category of an AIS target from its navigation status (most reliable) or its
 * ship type. Pleasure craft (37) report no propulsion: treated as power
 * unless the status says sailing.
 */
export const targetCategory = (target) => {
    const state = String(target.navState || '').toLowerCase();
    if (/not under command|restricted|constrained/.test(state)) return 'restricted';
    if (/fishing/.test(state)) return 'fishing';
    if (/sailing/.test(state)) return 'sail';
    if (/motoring|engine/.test(state)) return 'power';
    const type = Number(target.shipType);
    if (type === 36) return 'sail';
    if (type === 30) return 'fishing';
    if (type === 33) return 'restricted'; // dredging / underwater operations
    return 'power';
};

/** Relative bearing of `to` seen from a vessel at `from` heading `course` (-PI..PI) */
const relativeBearing = (from, to, course) => wrapPi(Math.atan2(to.x - from.x, to.y - from.y) - course);

/**
 * Who gives way between us and one target.
 *
 * @param {Object} own - { course, speed, category: 'sail'|'power', twa? }
 * @param {Object} target - { x, y, course, speed, category }
 * @param {number|null} twd - true wind direction (from), for sailing vessels
 * @returns {{ ownRole: 'give-way'|'stand-on'|'both', rule: string,
 *            reason: string, targetTurn: number }}
 *   reason: i18n key suffix; targetTurn: suggested alteration side for the
 *   give-way target (+1 starboard, -1 port, 0 none)
 */
export const rightOfWay = (own, target, twd) => {
    const origin = { x: 0, y: 0 };
    const targetFromOwn = relativeBearing(origin, target, own.course);
    const ownFromTarget = relativeBearing(target, origin, target.course);
    // A give-way target passes astern of us by turning towards our side
    const passAstern = Math.sign(ownFromTarget) || 1;

    // Rule 13: overtaking — coming up from more than 22.5° abaft the beam
    const abaft = (b) => Math.abs(b) > 112.5 * DEG;
    if (abaft(targetFromOwn) && target.speed > own.speed) {
        return { ownRole: 'stand-on', rule: '13', reason: 'overtakenByTarget', targetTurn: 0 };
    }
    if (abaft(ownFromTarget) && own.speed > target.speed) {
        return { ownRole: 'give-way', rule: '13', reason: 'overtaking', targetTurn: 0 };
    }

    // Rule 18: different categories
    const ownRank = CATEGORY_RANK[own.category] ?? 1;
    const targetRank = CATEGORY_RANK[target.category] ?? 1;
    if (ownRank !== targetRank) {
        return ownRank < targetRank
            ? { ownRole: 'give-way', rule: '18', reason: `giveWayTo_${target.category}`, targetTurn: 0 }
            : { ownRole: 'stand-on', rule: '18', reason: `standOnFrom_${target.category}`, targetTurn: passAstern };
    }

    // Rule 12: two sailing vessels
    if (own.category === 'sail' && Number.isFinite(twd)) {
        // Wind on the port side (TWA < 0) = port tack
        const ownTack = wrapPi(twd - own.course) >= 0 ? 'starboard' : 'port';
        const targetTack = wrapPi(twd - target.course) >= 0 ? 'starboard' : 'port';
        if (ownTack !== targetTack) {
            return ownTack === 'port'
                ? { ownRole: 'give-way', rule: '12a-i', reason: 'portTack', targetTurn: 0 }
                : { ownRole: 'stand-on', rule: '12a-i', reason: 'targetPortTack', targetTurn: passAstern };
        }
        // Same tack: the windward boat is the one further towards the wind
        const windward = target.x * Math.sin(twd) + target.y * Math.cos(twd); // > 0: target upwind of us
        return windward > 0
            ? { ownRole: 'stand-on', rule: '12a-ii', reason: 'targetWindward', targetTurn: passAstern }
            : { ownRole: 'give-way', rule: '12a-ii', reason: 'ownWindward', targetTurn: 0 };
    }

    // Rule 14: head-on (power) — each sees the other dead ahead, reciprocal courses
    const reciprocal = Math.abs(wrapPi(target.course - own.course - Math.PI)) < 10 * DEG;
    if (reciprocal && Math.abs(targetFromOwn) < 6 * DEG) {
        return { ownRole: 'both', rule: '14', reason: 'headOn', targetTurn: 1 };
    }

    // Rule 15: crossing — the vessel with the other on her starboard side gives way
    return targetFromOwn > 0
        ? { ownRole: 'give-way', rule: '15', reason: 'crossingStarboard', targetTurn: 0 }
        : { ownRole: 'stand-on', rule: '15', reason: 'crossingPort', targetTurn: passAstern };
};
