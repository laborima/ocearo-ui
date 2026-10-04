/**
 * RM 1080 rig geometry, in the boat's model frame (metres, bow towards -Z,
 * starboard +X, waterline at y = 0), measured on the builder's model by
 * models/rm1080/build.mjs. Fractional rig, swept spreaders, bowsprit.
 */
export const RIG = {
    mastFoot: [0, 1.85, -0.56],
    masthead: [0, 17.0, 0.45],      // ~1 m of rake aft
    hounds: [0, 16.2, 0.38],        // forestay attachment
    innerHounds: [0, 12.6, 0.2],    // staysail stay
    gooseneck: [0, 2.65, -0.62],
    boomLength: 4.95,
    forestayTack: [0, 1.45, -5.95],
    innerStayTack: [0, 1.5, -4.3],
    bowsprit: [0, 1.5, -6.5],
    // Deck hardware for the trim indicators
    traveller: { z: 3.1, y: 0.95, halfWidth: 1.25 },
    jibTrack: { x: 1.38, y: 1.5, zFwd: -1.9, zAft: 0.3 },
};

export const HEADSAILS = ['J1', 'J2', 'J3', 'staysail', 'spi'];

const KN = 1.9438444924574;
const DEG = 180 / Math.PI;

/**
 * Sails to set for the wind, unless forced in settings (`sailPlanOverride`:
 * { headsail, reef }). Thresholds are typical for a 10–11 m cruiser-racer.
 *
 * @param {number} tws - true wind speed, m/s
 * @param {number} twa - true wind angle, rad (either side)
 * @returns {{ headsail: string, reef: number }}
 */
export const chooseSails = (tws, twa, override = null) => {
    const kn = Number.isFinite(tws) ? tws * KN : 0;
    const angle = Number.isFinite(twa) ? Math.abs(twa * DEG) : 45;
    let headsail;
    if (angle >= 105 && kn < 20) headsail = 'spi';
    else if (kn < 10) headsail = 'J1';
    else if (kn < 16) headsail = 'J2';
    else if (kn < 23) headsail = 'J3';
    else headsail = 'staysail';
    const reef = kn < 17 ? 0 : kn < 22 ? 1 : kn < 28 ? 2 : 3;
    return {
        headsail: override?.headsail && HEADSAILS.includes(override.headsail) ? override.headsail : headsail,
        reef: Number.isInteger(override?.reef) ? Math.max(0, Math.min(3, override.reef)) : reef,
    };
};
