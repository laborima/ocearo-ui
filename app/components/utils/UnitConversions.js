/**
 * UnitConversions.js - Centralized unit conversion utilities for Ocearo UI
 *
 * All SignalK values are in SI units. This module provides conversion functions
 * to display-friendly units used in maritime navigation.
 */

/**
 * Coerce a SignalK value to a finite number, or null.
 *
 * The whole display pipeline used to guard with `x === null || x === undefined`,
 * which lets NaN and Infinity straight through (`NaN !== null` is true) — that is
 * how "NaN kn" reached the wind widgets. Numeric strings are still accepted so
 * existing callers keep working; everything else collapses to null.
 *
 * @param {*} v - Raw value
 * @returns {number|null} A finite number, or null
 */
const toFinite = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
};

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
    rad = toFinite(rad);
    if (rad === null) return null;
    return rad * (180 / Math.PI);
};

/**
 * Convert radians to degrees, rounded and normalized to 0-360 range
 * @param {number} rad - Angle in radians
 * @returns {number|null} Angle in degrees (0-360), or null if input is invalid
 */
export const toDegrees = (rad) => {
    rad = toFinite(rad);
    if (rad === null) return null;
    return Math.round((rad * 180 / Math.PI + 360) % 360);
};

/**
 * Convert radians to degrees, rounded to 1 decimal place
 * @param {number} radians - Angle in radians
 * @returns {number|null} Angle in degrees (1 decimal), or null if input is invalid
 */
export const radiansToDegrees = (radians) => {
    radians = toFinite(radians);
    if (radians === null) return null;
    return Math.round((radians * 180 / Math.PI) * 10) / 10;
};

/**
 * Convert degrees to radians
 * @param {number} deg - Angle in degrees
 * @returns {number|null} Angle in radians, or null if input is invalid
 */
export const degToRad = (deg) => {
    deg = toFinite(deg);
    if (deg === null) return null;
    return deg * (Math.PI / 180);
};

/**
 * Convert meters per second to knots, formatted to 1 decimal place (string)
 * @param {number} mps - Speed in meters per second
 * @returns {string|null} Speed in knots as string, or null if input is invalid
 */
export const toKnots = (mps) => {
    mps = toFinite(mps);
    if (mps === null) return null;
    return (mps * MS_TO_KNOTS).toFixed(1);
};

/**
 * Convert meters per second to knots, rounded to 1 decimal place (number)
 * @param {number} ms - Speed in meters per second
 * @returns {number|null} Speed in knots, or null if input is invalid
 */
export const msToKnots = (ms) => {
    ms = toFinite(ms);
    if (ms === null) return null;
    return Math.round(ms * MS_TO_KNOTS * 10) / 10;
};

/**
 * Convert meters per second to knots (alias for msToKnots)
 * @param {number} mps - Speed in meters per second
 * @returns {number|null} Speed in knots, or null if input is invalid
 */
export const convertWindSpeed = (mps) => {
    mps = toFinite(mps);
    if (mps === null) return null;
    return Math.round((mps * MS_TO_KNOTS) * 10) / 10;
};

/**
 * Alias for convertWindSpeed
 */
export const convertSpeed = convertWindSpeed;

/**
 * Convert knots back to meters per second (SI).
 * @param {number} knots - Speed in knots
 * @returns {number|null} Speed in m/s, or null if input is invalid
 */
export const knotsToMs = (knots) => {
    knots = toFinite(knots);
    if (knots === null) return null;
    return knots / MS_TO_KNOTS;
};

/**
 * Narrow any value to a finite number, or null.
 *
 * Exported so consumers can guard values that never went through a conversion
 * (raw SignalK deltas, forecast payloads) with the same semantics used here.
 * @param {*} v - Raw value
 * @returns {number|null} A finite number, or null
 */
export const finite = toFinite;

/**
 * Convert Kelvin to Celsius, rounded to 1 decimal place
 * @param {number} kelvin - Temperature in Kelvin
 * @returns {number|null} Temperature in Celsius, or null if input is invalid
 */
export const kelvinToCelsius = (kelvin) => {
    kelvin = toFinite(kelvin);
    if (kelvin === null) return null;
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
export const toKelvin = (degrees) => {
    const d = toFinite(degrees);
    return d === null ? null : d + 273.15;
};

/**
 * Convert Pascals to hectopascals (mbar), rounded to 1 decimal place
 * @param {number} pa - Pressure in Pascals
 * @returns {number|null} Pressure in hPa/mbar, or null if input is invalid
 */
export const convertPressure = (pa) => {
    pa = toFinite(pa);
    if (pa === null) return null;
    return Math.round((pa / 100) * 10) / 10;
};

// ---------------------------------------------------------------------------
// Config-aware conversion helpers
// ---------------------------------------------------------------------------

let _configService = null;

/**
 * Lazily loads ConfigService to avoid circular dependency issues.
 * @returns {Object} The configService singleton
 */
const getConfigService = () => {
    if (!_configService) {
        _configService = require('../settings/ConfigService').default;
    }
    return _configService;
};

/**
 * Convert speed from m/s to the user-configured unit.
 * @param {number} mps - Speed in meters per second (SI)
 * @returns {number|null} Converted speed, or null if input is invalid
 */
export const convertSpeedUnit = (mps) => {
    mps = toFinite(mps);
    if (mps === null) return null;
    const unit = getConfigService().get('speedUnits') || 'kn';
    switch (unit) {
        case 'km/h': return Math.round(mps * 3.6 * 10) / 10;
        case 'mph': return Math.round(mps * 2.23694 * 10) / 10;
        case 'm/s':  return Math.round(mps * 10) / 10;
        default:     return Math.round(mps * MS_TO_KNOTS * 10) / 10;
    }
};

/**
 * Returns the display label for the current speed unit setting.
 * @returns {string} Unit abbreviation (e.g. "kn", "km/h")
 */
export const getSpeedUnitLabel = () => {
    return getConfigService().get('speedUnits') || 'kn';
};

/**
 * Convert depth from metres to the user-configured unit.
 * @param {number} metres - Depth in metres (SI)
 * @returns {number|null} Converted depth, or null if input is invalid
 */
export const convertDepthUnit = (metres) => {
    metres = toFinite(metres);
    if (metres === null) return null;
    const unit = getConfigService().get('depthUnits') || 'm';
    switch (unit) {
        case 'ft': return Math.round(metres * 3.28084 * 10) / 10;
        case 'fa': return Math.round(metres * 0.546807 * 10) / 10;
        default:   return Math.round(metres * 10) / 10;
    }
};

/**
 * Returns the display label for the current depth unit setting.
 * @returns {string} Unit abbreviation (e.g. "m", "ft", "fa")
 */
export const getDepthUnitLabel = () => {
    return getConfigService().get('depthUnits') || 'm';
};

/**
 * Convert temperature from Kelvin to the user-configured unit.
 * @param {number} kelvin - Temperature in Kelvin (SI)
 * @returns {number|null} Converted temperature, or null if input is invalid
 */
export const convertTemperatureUnit = (kelvin) => {
    kelvin = toFinite(kelvin);
    if (kelvin === null) return null;
    const unit = getConfigService().get('temperatureUnits') || 'C';
    if (unit === 'F') {
        return Math.round(((kelvin - 273.15) * 9 / 5 + 32) * 10) / 10;
    }
    return Math.round((kelvin - 273.15) * 10) / 10;
};

/**
 * Returns the display label for the current temperature unit setting.
 * @returns {string} Unit symbol (e.g. "°C", "°F")
 */
export const getTemperatureUnitLabel = () => {
    const unit = getConfigService().get('temperatureUnits') || 'C';
    return unit === 'F' ? '°F' : '°C';
};

/**
 * Convert distance from metres to the user-configured unit.
 * @param {number} metres - Distance in metres (SI)
 * @returns {number|null} Converted distance, or null if input is invalid
 */
export const convertDistanceUnit = (metres) => {
    metres = toFinite(metres);
    if (metres === null) return null;
    const unit = getConfigService().get('distanceUnits') || 'nm';
    switch (unit) {
        case 'km': return Math.round(metres / 1000 * 100) / 100;
        case 'mi': return Math.round(metres / 1609.344 * 100) / 100;
        default:   return Math.round(metres / 1852 * 100) / 100;
    }
};

/**
 * Returns the display label for the current distance unit setting.
 * @returns {string} Unit abbreviation (e.g. "nm", "km", "mi")
 */
export const getDistanceUnitLabel = () => {
    return getConfigService().get('distanceUnits') || 'nm';
};
