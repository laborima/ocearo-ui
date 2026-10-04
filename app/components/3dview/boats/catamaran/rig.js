/**
 * Rig and deck hardware of the procedural 14 m catamaran, in the boat frame
 * (metres, bow towards -Z, starboard +X, waterline at y = 0). Same keys as
 * the racer's RIG so the sail plan and trim hardware work on both.
 */
export const CAT_RIG = {
    mastFoot: [0, 1.5, -1.85],      // stepped at the front of the bridgedeck
    masthead: [0, 22.5, -1.5],
    hounds: [0, 21.6, -1.52],
    innerHounds: [0, 17.0, -1.6],
    gooseneck: [0, 2.95, -1.75],      // boom clears the deckhouse roof
    boomLength: 6.4,
    forestayTack: [0, 1.5, -5.5],     // centre of the forward crossbeam
    innerStayTack: [0, 1.6, -3.8],
    bowsprit: [0, 1.45, -7.8],
    // Wide traveller across the aft edge of the hardtop; jib tracks on the
    // inboard side of the hull decks
    traveller: { z: 4.15, y: 2.7, halfWidth: 2.4 },
    jibTrack: { x: 2.45, zFwd: -4.6, zAft: -2.2 },
    mainsheetOnBoom: 5.9,
    spiClew: { out: 6.5, y: 3.2, z: 4.5 },
    // One rudder per hull, stocks vertical
    rudders: {
        port: { pivot: [-2.9, 0.05, 6.35], axis: [0, -1, 0] },
        starboard: { pivot: [2.9, 0.05, 6.35], axis: [0, -1, 0] },
    },
};
