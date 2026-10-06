/**
 * Navigational stars: the 57 stars of the Nautical Almanac plus Polaris,
 * with their apparent position in the local sky.
 *
 * Catalogue: J2000 right ascension (hours), declination (degrees) and visual
 * magnitude. Positions are precessed to the date (IAU 1976); proper motion,
 * nutation, aberration and refraction are left out — together well under
 * 0.1°, invisible on screen and not meant for a sextant.
 */

const DEG = Math.PI / 180;

// [Almanac number, name, RA h, RA m, RA s, Dec sign, Dec °, Dec ′, Dec ″, magnitude]
const CATALOGUE = [
  [1, 'Alpheratz', 0, 8, 23.3, 1, 29, 5, 26, 2.06],
  [2, 'Ankaa', 0, 26, 17.0, -1, 42, 18, 22, 2.40],
  [3, 'Schedar', 0, 40, 30.4, 1, 56, 32, 14, 2.24],
  [4, 'Diphda', 0, 43, 35.4, -1, 17, 59, 12, 2.04],
  [5, 'Achernar', 1, 37, 42.8, -1, 57, 14, 12, 0.46],
  [6, 'Hamal', 2, 7, 10.4, 1, 23, 27, 45, 2.00],
  [7, 'Acamar', 2, 58, 15.7, -1, 40, 18, 17, 2.88],
  [8, 'Menkar', 3, 2, 16.8, 1, 4, 5, 23, 2.54],
  [9, 'Mirfak', 3, 24, 19.4, 1, 49, 51, 40, 1.79],
  [10, 'Aldebaran', 4, 35, 55.2, 1, 16, 30, 33, 0.86],
  [11, 'Rigel', 5, 14, 32.3, -1, 8, 12, 6, 0.13],
  [12, 'Capella', 5, 16, 41.4, 1, 45, 59, 53, 0.08],
  [13, 'Bellatrix', 5, 25, 7.9, 1, 6, 20, 59, 1.64],
  [14, 'Elnath', 5, 26, 17.5, 1, 28, 36, 27, 1.65],
  [15, 'Alnilam', 5, 36, 12.8, -1, 1, 12, 7, 1.69],
  [16, 'Betelgeuse', 5, 55, 10.3, 1, 7, 24, 25, 0.50],
  [17, 'Canopus', 6, 23, 57.1, -1, 52, 41, 45, -0.74],
  [18, 'Sirius', 6, 45, 8.9, -1, 16, 42, 58, -1.46],
  [19, 'Adhara', 6, 58, 37.5, -1, 28, 58, 20, 1.50],
  [20, 'Procyon', 7, 39, 18.1, 1, 5, 13, 30, 0.34],
  [21, 'Pollux', 7, 45, 18.9, 1, 28, 1, 34, 1.14],
  [22, 'Avior', 8, 22, 30.8, -1, 59, 30, 35, 1.86],
  [23, 'Suhail', 9, 7, 59.8, -1, 43, 25, 57, 2.21],
  [24, 'Miaplacidus', 9, 13, 12.0, -1, 69, 43, 2, 1.67],
  [25, 'Alphard', 9, 27, 35.2, -1, 8, 39, 31, 1.98],
  [26, 'Regulus', 10, 8, 22.3, 1, 11, 58, 2, 1.40],
  [27, 'Dubhe', 11, 3, 43.7, 1, 61, 45, 3, 1.79],
  [28, 'Denebola', 11, 49, 3.6, 1, 14, 34, 19, 2.14],
  [29, 'Gienah', 12, 15, 48.4, -1, 17, 32, 31, 2.59],
  [30, 'Acrux', 12, 26, 35.9, -1, 63, 5, 57, 0.76],
  [31, 'Gacrux', 12, 31, 10.0, -1, 57, 6, 48, 1.64],
  [32, 'Alioth', 12, 54, 1.7, 1, 55, 57, 35, 1.77],
  [33, 'Spica', 13, 25, 11.6, -1, 11, 9, 41, 0.97],
  [34, 'Alkaid', 13, 47, 32.4, 1, 49, 18, 48, 1.86],
  [35, 'Hadar', 14, 3, 49.4, -1, 60, 22, 23, 0.61],
  [36, 'Menkent', 14, 6, 40.9, -1, 36, 22, 12, 2.06],
  [37, 'Arcturus', 14, 15, 39.7, 1, 19, 10, 57, -0.05],
  [38, 'Rigil Kentaurus', 14, 39, 36.5, -1, 60, 50, 2, -0.27],
  [39, 'Zubenelgenubi', 14, 50, 52.7, -1, 16, 2, 30, 2.75],
  [40, 'Kochab', 14, 50, 42.3, 1, 74, 9, 20, 2.08],
  [41, 'Alphecca', 15, 34, 41.3, 1, 26, 42, 53, 2.23],
  [42, 'Antares', 16, 29, 24.5, -1, 26, 25, 55, 1.09],
  [43, 'Atria', 16, 48, 39.9, -1, 69, 1, 40, 1.91],
  [44, 'Sabik', 17, 10, 22.7, -1, 15, 43, 29, 2.43],
  [45, 'Shaula', 17, 33, 36.5, -1, 37, 6, 14, 1.62],
  [46, 'Rasalhague', 17, 34, 56.1, 1, 12, 33, 36, 2.07],
  [47, 'Eltanin', 17, 56, 36.4, 1, 51, 29, 20, 2.23],
  [48, 'Kaus Australis', 18, 24, 10.3, -1, 34, 23, 5, 1.85],
  [49, 'Vega', 18, 36, 56.3, 1, 38, 47, 1, 0.03],
  [50, 'Nunki', 18, 55, 15.9, -1, 26, 17, 48, 2.05],
  [51, 'Altair', 19, 50, 47.0, 1, 8, 52, 6, 0.77],
  [52, 'Peacock', 20, 25, 38.9, -1, 56, 44, 6, 1.94],
  [53, 'Deneb', 20, 41, 25.9, 1, 45, 16, 49, 1.25],
  [54, 'Enif', 21, 44, 11.2, 1, 9, 52, 30, 2.39],
  [55, "Al Na'ir", 22, 8, 14.0, -1, 46, 57, 40, 1.73],
  [56, 'Fomalhaut', 22, 57, 39.0, -1, 29, 37, 20, 1.16],
  [57, 'Markab', 23, 4, 45.7, 1, 15, 12, 19, 2.48],
  [0, 'Polaris', 2, 31, 49.1, 1, 89, 15, 51, 1.98],
];

/** Stars with J2000 equatorial unit vectors */
export const NAV_STARS = CATALOGUE.map(([number, name, h, m, s, sign, d, dm, ds, magnitude]) => {
  const ra = (h + m / 60 + s / 3600) * 15 * DEG;
  const dec = sign * (d + dm / 60 + ds / 3600) * DEG;
  return {
    number,
    name,
    magnitude,
    j2000: [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)],
  };
});

const julianCenturies = (date) => (date.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525;

/**
 * Precession matrix from J2000 to the mean equator of date (IAU 1976
 * angles ζ, z, θ), row-major 3×3.
 */
const precessionMatrix = (T) => {
  const arcsec = DEG / 3600;
  const zeta = (2306.2181 * T + 0.30188 * T * T + 0.017998 * T * T * T) * arcsec;
  const z = (2306.2181 * T + 1.09468 * T * T + 0.018203 * T * T * T) * arcsec;
  const theta = (2004.3109 * T - 0.42665 * T * T - 0.041833 * T * T * T) * arcsec;
  const cz = Math.cos(zeta), sz = Math.sin(zeta);
  const cZ = Math.cos(z), sZ = Math.sin(z);
  const ct = Math.cos(theta), st = Math.sin(theta);
  return [
    cZ * ct * cz - sZ * sz, -cZ * ct * sz - sZ * cz, -cZ * st,
    sZ * ct * cz + cZ * sz, -sZ * ct * sz + cZ * cz, -sZ * st,
    st * cz, -st * sz, ct,
  ];
};

/** Greenwich mean sidereal time, radians */
const gmst = (date) => {
  const days = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
  const T = days / 36525;
  const degrees = 280.46061837 + 360.98564736629 * days + 0.000387933 * T * T;
  return (((degrees % 360) + 360) % 360) * DEG;
};

/**
 * Apparent direction of every navigational star from a position at a time.
 * @param {number} latitude - degrees
 * @param {number} longitude - degrees, east positive
 * @param {Date} date
 * @returns {Array<{number: number, name: string, magnitude: number,
 *   altitude: number, azimuth: number, enu: number[]}>|null} altitude and
 *   azimuth (from true north) in degrees, enu the unit vector (east, north,
 *   up); null without a position
 */
export const starPositions = (latitude, longitude, date) => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !(date instanceof Date)) return null;
  const P = precessionMatrix(julianCenturies(date));
  const lst = gmst(date) + longitude * DEG;
  const lat = latitude * DEG;
  const sinLat = Math.sin(lat), cosLat = Math.cos(lat);

  return NAV_STARS.map(({ number, name, magnitude, j2000: [x0, y0, z0] }) => {
    // Equatorial of date, then turned to the local meridian (hour angle)
    const x = P[0] * x0 + P[1] * y0 + P[2] * z0;
    const y = P[3] * x0 + P[4] * y0 + P[5] * z0;
    const z = P[6] * x0 + P[7] * y0 + P[8] * z0;
    const ha = lst - Math.atan2(y, x);
    const cosDec = Math.hypot(x, y);
    // Local frame: east, north, up
    const east = -cosDec * Math.sin(ha);
    const north = z * cosLat - cosDec * Math.cos(ha) * sinLat;
    const up = z * sinLat + cosDec * Math.cos(ha) * cosLat;
    const azimuth = ((Math.atan2(east, north) / DEG) + 360) % 360;
    return {
      number,
      name,
      magnitude,
      altitude: Math.asin(Math.max(-1, Math.min(1, up))) / DEG,
      azimuth,
      enu: [east, north, up],
    };
  });
};
