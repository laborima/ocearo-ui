/**
 * AIS aids to navigation (message 21) as seamarks: the AIS aid type (1–31,
 * ITU-R M.1371) gives the kind of mark, buoy or beacon, and its category,
 * so it is drawn like an OpenSeaMap mark (seamarkGeometry fills the colours
 * and topmark from the IALA rules). An AIS mark that stands where an
 * OpenSeaMap mark already is, is the same buoy: the OpenSeaMap one, with
 * its richer description, is kept and flagged as transmitting AIS.
 */

const CARDINALS = ['north', 'east', 'south', 'west'];
const LATERALS = ['port', 'starboard', 'preferred_channel_port', 'preferred_channel_starboard'];

/** Kind, structure and category of an AIS aid type */
export const atonKind = (type) => {
    const t = Number(type);
    if (t >= 9 && t <= 12) return { kind: 'cardinal', beacon: true, category: CARDINALS[t - 9] };
    if (t >= 13 && t <= 16) return { kind: 'lateral', beacon: true, category: LATERALS[t - 13] };
    if (t === 17) return { kind: 'isolated_danger', beacon: true };
    if (t === 18) return { kind: 'safe_water', beacon: true };
    if (t === 19) return { kind: 'special_purpose', beacon: true };
    if (t >= 20 && t <= 23) return { kind: 'cardinal', beacon: false, category: CARDINALS[t - 20] };
    if (t >= 24 && t <= 27) return { kind: 'lateral', beacon: false, category: LATERALS[t - 24] };
    if (t === 28) return { kind: 'isolated_danger', beacon: false };
    if (t === 29) return { kind: 'safe_water', beacon: false };
    if (t === 30) return { kind: 'special_purpose', beacon: false };
    // Emergency wreck marking buoy: blue and yellow stripes, yellow cross
    if (t === 4) {
        return {
            kind: 'special_purpose', beacon: false, colours: ['blue', 'yellow'], pattern: 'vertical',
            topmark: { shape: 'cross', colours: ['yellow'] },
        };
    }
    // Reference point, RACON, structure, lights, light vessel: an AIS station
    // whose shape AIS does not tell
    return { kind: 'station', beacon: true };
};

/**
 * An AIS aid to navigation (from the AIS store) as a seamark.
 * @param {object} aton - see AISContext createAton
 */
export const atonToSeamark = (aton) => {
    const k = atonKind(aton.atonType);
    return {
        id: `ais:${aton.id}`,
        lat: aton.latitude,
        lon: aton.longitude,
        name: aton.name || '',
        kind: k.kind,
        beacon: k.beacon,
        category: k.category || '',
        shape: '',
        colours: k.colours || [],
        pattern: k.pattern || '',
        system: '',
        height: null,
        topmark: k.topmark || null,
        light: null,
        ais: true,
        virtual: aton.virtual,
        offPosition: aton.offPosition,
    };
};

// An AIS mark this close to an OpenSeaMap mark is the same one
const SAME_MARK_METRES = 60;

const metresBetween = (a, b) => {
    const dLat = (b.lat - a.lat) * 111320;
    const dLon = (b.lon - a.lon) * 111320 * Math.cos(a.lat * Math.PI / 180);
    return Math.hypot(dLat, dLon);
};

/**
 * OpenSeaMap marks and AIS aids to navigation together: a real (not
 * virtual) AIS mark next to an OpenSeaMap mark of the same kind flags it
 * as transmitting AIS instead of adding a second buoy; the others are added.
 */
export const mergeAtons = (osmMarks, atons) => {
    if (!atons.length) return osmMarks;
    const marks = osmMarks.map((m) => ({ ...m }));
    const extra = [];
    for (const aton of atons) {
        if (!Number.isFinite(aton.latitude) || !Number.isFinite(aton.longitude)) continue;
        const mark = atonToSeamark(aton);
        const twin = !mark.virtual && marks.find((m) => !m.ais
            && (mark.kind === 'station' || m.kind === mark.kind)
            && metresBetween(m, mark) <= SAME_MARK_METRES);
        if (twin) {
            twin.ais = true;
            twin.offPosition = mark.offPosition;
            if (!twin.name) twin.name = mark.name;
        } else {
            extra.push(mark);
        }
    }
    return [...marks, ...extra];
};
