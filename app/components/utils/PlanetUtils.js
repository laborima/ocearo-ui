/**
 * The Moon and the four navigational planets (Venus, Mars, Jupiter, Saturn)
 * in the local sky.
 *
 * Low-precision orbital elements and the main perturbations of the Moon,
 * Jupiter and Saturn (Paul Schlyter, "How to compute planetary positions"):
 * a few arc minutes, plenty for the sky of the 3D view, not for a sextant.
 * The Moon is topocentric (its parallax reaches a degree).
 */

import { observerFrame, localDirection } from './StarUtils';

const DEG = Math.PI / 180;
const sind = (d) => Math.sin(d * DEG);
const cosd = (d) => Math.cos(d * DEG);
const rev = (d) => ((d % 360) + 360) % 360;

// Orbital elements as functions of d, days since 2000 Jan 0.0 UT:
// N longitude of the ascending node, i inclination, w argument of
// perihelion, a semi-major axis (AU; Earth radii for the Moon),
// e eccentricity, M mean anomaly (degrees)
const ELEMENTS = {
    sun: (d) => ({ N: 0, i: 0, w: 282.9404 + 4.70935e-5 * d, a: 1, e: 0.016709 - 1.151e-9 * d, M: 356.0470 + 0.9856002585 * d }),
    moon: (d) => ({ N: 125.1228 - 0.0529538083 * d, i: 5.1454, w: 318.0634 + 0.1643573223 * d, a: 60.2666, e: 0.0549, M: 115.3654 + 13.0649929509 * d }),
    venus: (d) => ({ N: 76.6799 + 2.4659e-5 * d, i: 3.3946 + 2.75e-8 * d, w: 54.891 + 1.38374e-5 * d, a: 0.72333, e: 0.006773 - 1.302e-9 * d, M: 48.0052 + 1.6021302244 * d }),
    mars: (d) => ({ N: 49.5574 + 2.11081e-5 * d, i: 1.8497 - 1.78e-8 * d, w: 286.5016 + 2.92961e-5 * d, a: 1.523688, e: 0.093405 + 2.516e-9 * d, M: 18.6021 + 0.5240207766 * d }),
    jupiter: (d) => ({ N: 100.4542 + 2.76854e-5 * d, i: 1.303 - 1.557e-7 * d, w: 273.8777 + 1.64505e-5 * d, a: 5.20256, e: 0.048498 + 4.469e-9 * d, M: 19.895 + 0.0830853001 * d }),
    saturn: (d) => ({ N: 113.6634 + 2.3898e-5 * d, i: 2.4886 - 1.081e-7 * d, w: 339.3939 + 2.97661e-5 * d, a: 9.55475, e: 0.055546 - 9.499e-9 * d, M: 316.967 + 0.0334442282 * d }),
};

// Visual magnitude at 1 AU from the Sun and the Earth, and the phase
// angle coefficients (Saturn's rings are added from their tilt)
const MAGNITUDE = {
    venus: (fv) => -4.34 + 0.013 * fv + 4.2e-7 * fv * fv * fv,
    mars: (fv) => -1.51 + 0.016 * fv,
    jupiter: (fv) => -9.25 + 0.014 * fv,
    saturn: (fv) => -9.0 + 0.044 * fv,
};

export const PLANETS = ['venus', 'mars', 'jupiter', 'saturn'];

/** Position in the orbit's ecliptic frame: [x, y, z] and the true longitude */
const orbit = ({ N, i, w, a, e, M }) => {
    const m = rev(M);
    let E = m + (e / DEG) * sind(m) * (1 + e * cosd(m));
    for (let k = 0; k < 8; k++) {
        const dE = (E - (e / DEG) * sind(E) - m) / (1 - e * cosd(E));
        E -= dE;
        if (Math.abs(dE) < 1e-6) break;
    }
    const xv = a * (cosd(E) - e);
    const yv = a * Math.sqrt(1 - e * e) * sind(E);
    const v = Math.atan2(yv, xv) / DEG;
    const r = Math.hypot(xv, yv);
    const u = v + w;
    return [
        r * (cosd(N) * cosd(u) - sind(N) * sind(u) * cosd(i)),
        r * (sind(N) * cosd(u) + cosd(N) * sind(u) * cosd(i)),
        r * sind(u) * sind(i),
    ];
};

/** Rewrites an ecliptic vector from its longitude, latitude and distance */
const fromSpherical = (lon, lat, r) => [r * cosd(lon) * cosd(lat), r * sind(lon) * cosd(lat), r * sind(lat)];
const toSpherical = ([x, y, z]) => {
    const r = Math.hypot(x, y, z);
    return { lon: Math.atan2(y, x) / DEG, lat: Math.asin(z / r) / DEG, r };
};

/** Ecliptic of date to equatorial of date */
const toEquatorial = ([x, y, z], ecl) => [x, y * cosd(ecl) - z * sind(ecl), y * sind(ecl) + z * cosd(ecl)];

/** Heliocentric ecliptic position of a planet, AU, with Jupiter and Saturn's mutual perturbations */
const heliocentric = (name, d) => {
    const p = orbit(ELEMENTS[name](d));
    if (name !== 'jupiter' && name !== 'saturn') return p;
    const Mj = ELEMENTS.jupiter(d).M;
    const Ms = ELEMENTS.saturn(d).M;
    let { lon, lat, r } = toSpherical(p);
    if (name === 'jupiter') {
        lon += -0.332 * sind(2 * Mj - 5 * Ms - 67.6) - 0.056 * sind(2 * Mj - 2 * Ms + 21)
            + 0.042 * sind(3 * Mj - 5 * Ms + 21) - 0.036 * sind(Mj - 2 * Ms)
            + 0.022 * cosd(Mj - Ms) + 0.023 * sind(2 * Mj - 3 * Ms + 52)
            - 0.016 * sind(Mj - 5 * Ms - 69);
    } else {
        lon += 0.812 * sind(2 * Mj - 5 * Ms - 67.6) - 0.229 * cosd(2 * Mj - 4 * Ms - 2)
            + 0.119 * sind(Mj - 2 * Ms - 3) + 0.046 * sind(2 * Mj - 6 * Ms - 69)
            + 0.014 * sind(Mj - 3 * Ms + 32);
        lat += -0.02 * cosd(2 * Mj - 4 * Ms - 2) + 0.018 * sind(2 * Mj - 6 * Ms - 49);
    }
    return fromSpherical(lon, lat, r);
};

/** Geocentric ecliptic position of the Moon, Earth radii, with its main perturbations */
const moonGeocentric = (d) => {
    const moon = ELEMENTS.moon(d);
    const sun = ELEMENTS.sun(d);
    let { lon, lat, r } = toSpherical(orbit(moon));
    const Ms = sun.M;
    const Mm = moon.M;
    const D = Mm + moon.w + moon.N - (Ms + sun.w);
    const F = Mm + moon.w;
    lon += -1.274 * sind(Mm - 2 * D) + 0.658 * sind(2 * D) - 0.186 * sind(Ms)
        - 0.059 * sind(2 * Mm - 2 * D) - 0.057 * sind(Mm - 2 * D + Ms)
        + 0.053 * sind(Mm + 2 * D) + 0.046 * sind(2 * D - Ms) + 0.041 * sind(Mm - Ms)
        - 0.035 * sind(D) - 0.031 * sind(Mm + Ms) - 0.015 * sind(2 * F - 2 * D)
        + 0.011 * sind(Mm - 4 * D);
    lat += -0.173 * sind(F - 2 * D) - 0.055 * sind(Mm - F - 2 * D)
        - 0.046 * sind(Mm + F - 2 * D) + 0.033 * sind(F + 2 * D) + 0.017 * sind(2 * Mm + F);
    r += -0.58 * cosd(Mm - 2 * D) - 0.46 * cosd(2 * D);
    return fromSpherical(lon, lat, r);
};

/**
 * The Sun, the Moon and the four navigational planets seen from a position.
 * @param {number} latitude - degrees
 * @param {number} longitude - degrees, east positive
 * @param {Date} date
 * @returns {{sun: object, moon: object, planets: object[]}|null} each body
 *   with altitude, azimuth and enu (see localDirection); the Moon also has
 *   its illuminated fraction (0 new, 1 full), the planets their name and
 *   visual magnitude. Null without a position.
 */
export const skyBodies = (latitude, longitude, date) => {
    const frame = observerFrame(latitude, longitude, date);
    if (!frame) return null;
    const d = date.getTime() / 86400000 + 2440587.5 - 2451543.5;
    const ecl = 23.4393 - 3.563e-7 * d;

    // The Earth seen from the Sun is the opposite of the Sun seen from the Earth
    const sunGeo = orbit(ELEMENTS.sun(d));
    const sunEq = toEquatorial(sunGeo, ecl);

    const planets = PLANETS.map((name) => {
        const helio = heliocentric(name, d);
        const geo = [helio[0] + sunGeo[0], helio[1] + sunGeo[1], helio[2] + sunGeo[2]];
        const r = Math.hypot(...helio);
        const R = Math.hypot(...geo);
        const s = Math.hypot(...sunGeo);
        // Phase angle: Sun – planet – Earth
        const fv = Math.acos(Math.max(-1, Math.min(1, (r * r + R * R - s * s) / (2 * r * R)))) / DEG;
        let magnitude = MAGNITUDE[name](fv) + 5 * Math.log10(r * R);
        if (name === 'saturn') {
            // Rings: brighter the more they open towards us (tilt B)
            const { lon, lat } = toSpherical(geo);
            const sinB = sind(28.06) * cosd(lat) * sind(lon - 169.51 - 3.82e-5 * d) - cosd(28.06) * sind(lat);
            magnitude += -2.6 * Math.abs(sinB) + 1.2 * sinB * sinB;
        }
        return {
            name,
            magnitude,
            ...localDirection(...toEquatorial(geo, ecl), frame),
        };
    });

    // Topocentric Moon: from the observer on the Earth's surface, not its centre
    const [mx, my, mz] = toEquatorial(moonGeocentric(d), ecl);
    const moonEq = [
        mx - frame.cosLat * Math.cos(frame.lst),
        my - frame.cosLat * Math.sin(frame.lst),
        mz - frame.sinLat,
    ];
    const elongation = Math.acos(Math.max(-1, Math.min(1,
        (moonEq[0] * sunEq[0] + moonEq[1] * sunEq[1] + moonEq[2] * sunEq[2])
        / (Math.hypot(...moonEq) * Math.hypot(...sunEq)))));

    return {
        sun: localDirection(...sunEq, frame),
        moon: { illuminated: (1 - Math.cos(elongation)) / 2, ...localDirection(...moonEq, frame) },
        planets,
    };
};
