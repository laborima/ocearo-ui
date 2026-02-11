/**
 * UnitConversions.js - Centralized unit conversion utilities for Ocearo UI
 *
 * All SignalK values are in SI units. This module provides conversion functions
 * to display-friendly units used in maritime navigation.
 */

/**
 * Conversion factor from m/s to knots (1 m/s = 1.94384 knots)
 * @constant {number}
 */
export const MS_TO_KNOTS = 1.94384;

/**
 * Conversion factor from knots to m/s
 * @constant {number}
 */
export const KNOTS_TO_MPS = 0.51444;

/**
 * Earth radius in meters (mean)
 * @constant {number}
 */
export const EARTH_RADIUS_METERS = 6371000;

/**
 * Convert radians to degrees (raw, no rounding)
 * @param {number} rad - Angle in radians
 * @returns {number|null} Angle in degrees, or null if input is invalid
 */
export const radToDeg = (rad) => {
    if (rad === null || rad === undefined) return null;
    return rad * (180 / Math.PI);
};

/**
 * Convert radians to degrees, rounded and normalized to 0-360 range
 * @param {number} rad - Angle in radians
 * @returns {number|null} Angle in degrees (0-360), or null if input is invalid
 */
export const toDegrees = (rad) => {
    if (rad === null || rad === undefined) return null;
    return Math.round((rad * 180 / Math.PI + 360) % 360);
};

/**
 * Convert radians to degrees, rounded to 1 decimal place
 * @param {number} radians - Angle in radians
 * @returns {number|null} Angle in degrees (1 decimal), or null if input is invalid
 */
export const radiansToDegrees = (radians) => {
    if (radians === null || radians === undefined) return null;
    return Math.round((radians * 180 / Math.PI) * 10) / 10;
};

/**
 * Convert degrees to radians
 * @param {number} deg - Angle in degrees
 * @returns {number|null} Angle in radians, or null if input is invalid
 */
export const degToRad = (deg) => {
    if (deg === null || deg === undefined) return null;
    return deg * (Math.PI / 180);
};

/**
 * Convert meters per second to knots, formatted to 1 decimal place (string)
 * @param {number} mps - Speed in meters per second
 * @returns {string|null} Speed in knots as string, or null if input is invalid
 */
export const toKnots = (mps) => {
    if (mps === null || mps === undefined) return null;
    return (mps * MS_TO_KNOTS).toFixed(1);
};

/**
 * Convert meters per second to knots, rounded to 1 decimal place (number)
 * @param {number} ms - Speed in meters per second
 * @returns {number|null} Speed in knots, or null if input is invalid
 */
export const msToKnots = (ms) => {
    if (ms === null || ms === undefined) return null;
    return Math.round(ms * MS_TO_KNOTS * 10) / 10;
};

/**
 * Convert meters per second to knots (alias for msToKnots)
 * @param {number} mps - Speed in meters per second
 * @returns {number|null} Speed in knots, or null if input is invalid
 */
export const convertWindSpeed = (mps) => {
    if (mps === null || mps === undefined) return null;
    return Math.round((mps * MS_TO_KNOTS) * 10) / 10;
};

/**
 * Alias for convertWindSpeed
 */
export const convertSpeed = convertWindSpeed;

/**
 * Convert Kelvin to Celsius, rounded to 1 decimal place
 * @param {number} kelvin - Temperature in Kelvin
 * @returns {number|null} Temperature in Celsius, or null if input is invalid
 */
export const kelvinToCelsius = (kelvin) => {
    if (kelvin === null || kelvin === undefined) return null;
    return Math.round((kelvin - 273.15) * 10) / 10;
};

/**
 * Alias for kelvinToCelsius
 */
export const convertTemperature = kelvinToCelsius;

/**
 * Convert Celsius to Kelvin
 * @param {number} degrees - Temperature in Celsius
 * @returns {number} Temperature in Kelvin
 */
export const toKelvin = (degrees) => degrees + 273.15;

/**
 * Convert Pascals to hectopascals (mbar), rounded to 1 decimal place
 * @param {number} pa - Pressure in Pascals
 * @returns {number|null} Pressure in hPa/mbar, or null if input is invalid
 */
export const convertPressure = (pa) => {
    if (pa === null || pa === undefined) return null;
    return Math.round((pa / 100) * 10) / 10;
};
