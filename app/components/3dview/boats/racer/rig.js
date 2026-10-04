/**
 * Rig and deck hardware of the procedural 10.8 m cruiser-racer, in the boat
 * frame (metres, bow towards -Z, starboard +X, waterline at y = 0).
 * Fractional rig, swept spreaders, bowsprit, twin rudders, tiller.
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
    // Deck hardware for the trim indicators: traveller across the cockpit
    // floor (~0.62 m), forward of the tiller; jib tracks on the side decks
    traveller: { z: 2.9, y: 0.7, halfWidth: 1.15 },
    jibTrack: { x: 1.38, y: 1.5, zFwd: -1.9, zAft: 0.3 },
    // Mainsheet attachment on the boom, metres from the gooseneck (above the traveller)
    mainsheetOnBoom: 3.5,
    // Rudder stocks: pivot (top of the blade) and axis (twin rudders are toed out ~12°)
    rudders: {
        port: { pivot: [-1.06, 0.03, 4.72], axis: [-0.21, -0.98, 0] },
        starboard: { pivot: [1.06, 0.03, 4.72], axis: [0.21, -0.98, 0] },
        centre: { pivot: [0, -0.1, 4.26], axis: [0, -1, 0] },
    },
    // Tiller: from the rudder linkage at the transom forward over the cockpit
    tiller: { pivot: [0, 0.95, 4.95], length: 1.75 },
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
