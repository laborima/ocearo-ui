/**
 * Sunrise / sunset helpers shared by the dashboard widgets.
 *
 * Positions are Signal K `navigation.position` values: decimal degrees.
 */

const SUN_ZENITH = 90.833; // official zenith, includes refraction
const DEGREES_PER_HOUR = 15;

const toRadians = (degrees) => degrees * (Math.PI / 180);
const toDegrees = (radians) => radians * (180 / Math.PI);

const normalize = (value, period) => {
  const remainder = value % period;
  return remainder < 0 ? remainder + period : remainder;
};

const dayOfYearUTC = (date) => {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const current = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((current - start) / 86400000) + 1;
};

/**
 * Sunrise or sunset in UT hours (0-24) for the UTC day of `date`
 * (Almanac for Computers algorithm). Null when the sun doesn't cross the
 * horizon that day (polar day / night).
 */
const sunEventUTHours = (latitude, longitude, date, isSunrise) => {
  const day = dayOfYearUTC(date);
  const longitudeHour = longitude / DEGREES_PER_HOUR;
  const approximateTime = day + ((isSunrise ? 6 : 18) - longitudeHour) / 24;
  const meanAnomaly = 0.9856 * approximateTime - 3.289;
  const sunLongitude = normalize(
    meanAnomaly + 1.916 * Math.sin(toRadians(meanAnomaly)) + 0.020 * Math.sin(2 * toRadians(meanAnomaly)) + 282.634,
    360
  );

  let rightAscension = normalize(toDegrees(Math.atan(0.91764 * Math.tan(toRadians(sunLongitude)))), 360);
  rightAscension += Math.floor(sunLongitude / 90) * 90 - Math.floor(rightAscension / 90) * 90;
  rightAscension /= DEGREES_PER_HOUR;

  const sinDeclination = 0.39782 * Math.sin(toRadians(sunLongitude));
  const cosDeclination = Math.cos(Math.asin(sinDeclination));
  const cosHourAngle = (Math.cos(toRadians(SUN_ZENITH)) - sinDeclination * Math.sin(toRadians(latitude)))
    / (cosDeclination * Math.cos(toRadians(latitude)));
  if (cosHourAngle > 1 || cosHourAngle < -1) return null;

  const hourAngle = (isSunrise ? 360 - toDegrees(Math.acos(cosHourAngle)) : toDegrees(Math.acos(cosHourAngle))) / DEGREES_PER_HOUR;
  const localMeanTime = hourAngle + rightAscension - 0.06571 * approximateTime - 6.622;
  return normalize(localMeanTime - longitudeHour, 24);
};

/**
 * UT hours -> Date on the same local solar day as `solarDay` (a Date whose UTC
 * calendar date is that day). Far east/west longitudes put sunrise or sunset on
 * the neighbouring UTC day, so pick the occurrence within 12 h of solar noon.
 */
const utHoursToDate = (solarDay, longitude, hours) => {
  if (hours === null) return null;
  const dayStart = Date.UTC(solarDay.getUTCFullYear(), solarDay.getUTCMonth(), solarDay.getUTCDate());
  const solarNoon = dayStart + (12 - longitude / DEGREES_PER_HOUR) * 3600000;
  let event = dayStart + hours * 3600000;
  while (event - solarNoon > 12 * 3600000) event -= 86400000;
  while (solarNoon - event > 12 * 3600000) event += 86400000;
  return new Date(event);
};

/**
 * @param {number} latitude - degrees
 * @param {number} longitude - degrees
 * @param {Date} date - any instant of the wanted day
 * @returns {{sunrise: Date|null, sunset: Date|null}|null} null without a position
 */
export const computeSunEvents = (latitude, longitude, date) => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !(date instanceof Date)) return null;
  // Calendar day as seen at this longitude (local mean solar time)
  const solarDay = new Date(date.getTime() + (longitude / DEGREES_PER_HOUR) * 3600000);
  return {
    sunrise: utHoursToDate(solarDay, longitude, sunEventUTHours(latitude, longitude, solarDay, true)),
    sunset: utHoursToDate(solarDay, longitude, sunEventUTHours(latitude, longitude, solarDay, false)),
  };
};

/**
 * Signal K sun values (from derived-data plugins) are ISO timestamps; older
 * setups publish "HH:MM". Returns a Date, or null.
 */
export const parseSunTime = (value, reference) => {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{1,2}:\d{2}$/.test(value)) {
    const [h, m] = value.split(':').map(Number);
    const d = new Date(reference);
    d.setHours(h, m, 0, 0);
    return d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** HH:MM in the display's local time zone */
export const formatClockTime = (date) =>
  date ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : null;

/**
 * Sun elevation above the horizon and azimuth from true north, in degrees
 * (NOAA general solar position, ~0.5° accuracy — plenty for lighting and
 * day/night decisions). Works from UTC, so the display's time zone is irrelevant.
 * @param {number} latitude - degrees
 * @param {number} longitude - degrees
 * @param {Date} date
 * @returns {{elevation: number, azimuth: number}|null} null without a position
 */
export const sunPosition = (latitude, longitude, date) => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !(date instanceof Date)) return null;

  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
  const dayOfYear = (date.getTime() - startOfYear) / 86400000 + 1;
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const gamma = 2 * Math.PI / 365 * (dayOfYear - 1 + (utcHours - 12) / 24);

  const eqTime = 229.18 * (
    0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma)
  );
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);

  const trueSolarMinutes = normalize(utcHours * 60 + eqTime + 4 * longitude, 1440);
  const hourAngle = toRadians(trueSolarMinutes / 4 - 180);
  const lat = toRadians(latitude);

  const cosZenith = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(hourAngle);
  const zenith = Math.acos(Math.min(Math.max(cosZenith, -1), 1));
  const azimuth = normalize(toDegrees(Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat)
  )) + 180, 360);

  return { elevation: 90 - toDegrees(zenith), azimuth };
};
