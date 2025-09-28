/**
 * Utility functions for motor/engine related data handling in the Ocearo UI
 */

/**
 * Convert Hz to RPM (Revolutions Per Minute)
 * @param {number} hz - Frequency in Hz
 * @returns {number} - RPM value or null if input is invalid
 */
export const hzToRPM = (hz) => {
  if (hz === null || hz === undefined) return null;
  return hz * 60;
};

/**
 * Convert seconds to hours:minutes format
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time as "HH:MM" or null if input is invalid
 */
export const secondsToHoursMinutes = (seconds) => {
  if (seconds === null || seconds === undefined) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Format engine hours for display
 * @param {number} seconds - Engine runtime in seconds
 * @returns {string} - Formatted engine hours (e.g., "1234.5 h") or null if input is invalid
 */
export const formatEngineHours = (seconds) => {
  if (seconds === null || seconds === undefined) return null;
  const hours = (seconds / 3600).toFixed(1);
  return `${hours} h`;
};

/**
 * Convert cubic meters per second to liters per hour for fuel consumption
 * @param {number} m3s - Fuel rate in cubic meters per second
 * @returns {number} - Fuel consumption in liters per hour (rounded) or null if input is invalid
 */
export const m3sToLitersPerHour = (m3s) => {
  if (m3s === null || m3s === undefined) return null;
  // 1 cubic meter = 1000 liters, 1 hour = 3600 seconds
  return Math.round(m3s * 1000 * 3600);
};

/**
 * Convert cubic meters to liters
 * @param {number} m3 - Volume in cubic meters
 * @returns {number} - Volume in liters or null if input is invalid
 */
export const m3ToLiters = (m3) => {
  if (m3 === null || m3 === undefined) return null;
  return m3 * 1000;
};

/**
 * Convert pascals to bar
 * @param {number} pascals - Pressure in pascals
 * @returns {number} - Pressure in bar (fixed to 1 decimal place) or null if input is invalid
 */
export const pascalsToBar = (pascals) => {
  if (pascals === null || pascals === undefined) return null;
  return (pascals / 100000).toFixed(1);
};

/**
 * Convert pascals to psi (pounds per square inch)
 * @param {number} pascals - Pressure in pascals
 * @returns {number} - Pressure in psi (rounded) or null if input is invalid
 */
export const pascalsToPsi = (pascals) => {
  if (pascals === null || pascals === undefined) return null;
  return Math.round(pascals * 0.000145038);
};

/**
 * Format ratio as percentage
 * @param {number} ratio - Value between 0.0 and 1.0
 * @returns {number} - Percentage value (0-100) or null if input is invalid
 */
export const ratioToPercent = (ratio) => {
  if (ratio === null || ratio === undefined) return null;
  return Math.round(ratio * 100);
};

/**
 * Get color class based on engine temperature
 * @param {number} temperatureKelvin - Temperature in Kelvin
 * @param {number} warningThreshold - Warning threshold in Celsius (default: 90)
 * @param {number} criticalThreshold - Critical threshold in Celsius (default: 100)
 * @returns {string} - CSS class for color indication
 */
export const getTemperatureColorClass = (temperatureKelvin, warningThreshold = 90, criticalThreshold = 100) => {
  if (temperatureKelvin === null || temperatureKelvin === undefined) return 'text-gray-400';
  
  const tempCelsius = temperatureKelvin - 273.15;
  
  if (tempCelsius >= criticalThreshold) return 'text-red-500';
  if (tempCelsius >= warningThreshold) return 'text-yellow-500';
  return 'text-green-500';
};

/**
 * Get color class based on pressure value
 * @param {number} pressure - Pressure in pascals
 * @param {number} minThreshold - Minimum safe threshold in pascals
 * @param {number} maxThreshold - Maximum safe threshold in pascals
 * @returns {string} - CSS class for color indication
 */
export const getPressureColorClass = (pressure, minThreshold, maxThreshold) => {
  if (pressure === null || pressure === undefined) return 'text-gray-400';
  
  if (pressure < minThreshold) return 'text-red-500';
  if (pressure > maxThreshold) return 'text-red-500';
  return 'text-green-500';
};

/**
 * Mapping of transmission gear values to display text
 */
export const GEAR_DISPLAY = {
  '-1': 'Reverse',
  '0': 'Neutral',
  '1': 'Forward',
  '2': 'Forward 2',
  '3': 'Forward 3',
};

/**
 * Determine the status of an engine from notification paths
 * @param {Object} notifications - Object of notification values from SignalK
 * @param {string} instance - Engine instance
 * @returns {Object} - Object with status information { hasWarning, hasAlarm, messages[] }
 */
export const getEngineStatus = (notifications, instance) => {
  const status = {
    hasWarning: false,
    hasAlarm: false,
    messages: []
  };

  const notificationPaths = [
    `notifications.propulsion.${instance}.checkEngine`,
    `notifications.propulsion.${instance}.overTemperature`,
    `notifications.propulsion.${instance}.lowOilPressure`,
    `notifications.propulsion.${instance}.lowOilLevel`,
    `notifications.propulsion.${instance}.lowFuelPressure`,
    `notifications.propulsion.${instance}.lowSystemVoltage`,
    `notifications.propulsion.${instance}.lowCoolantLevel`,
    `notifications.propulsion.${instance}.waterInFuel`,
    `notifications.propulsion.${instance}.transmission.overTemperature`,
    `notifications.propulsion.${instance}.transmission.lowOilPressure`,
  ];

  notificationPaths.forEach(path => {
    const notification = notifications[path];
    if (notification) {
      if (notification.state === 'alarm') {
        status.hasAlarm = true;
      } else if (notification.state === 'warning') {
        status.hasWarning = true;
      }
      
      if (notification.message) {
        status.messages.push(notification.message);
      }
    }
  });

  return status;
};

/**
 * Oil pressure thresholds for different engine states (in pascals)
 */
export const OIL_PRESSURE_THRESHOLDS = {
  idle: {
    min: 100000, // 1 bar
    max: 500000, // 5 bar
  },
  running: {
    min: 200000, // 2 bar
    max: 600000, // 6 bar
  }
};

/**
 * Coolant temperature thresholds (in Celsius)
 */
export const COOLANT_TEMPERATURE_THRESHOLDS = {
  warning: 90, // °C
  critical: 100, // °C
};

/**
 * Convert Kelvin to Celsius
 * @param {number} kelvin - Temperature in Kelvin
 * @returns {number} - Temperature in Celsius (rounded to 1 decimal place) or null if input is invalid
 */
export const kelvinToCelsius = (kelvin) => {
  if (kelvin === null || kelvin === undefined) return null;
  return Math.round((kelvin - 273.15) * 10) / 10;
};

/**
 * Convert meters per second to knots
 * @param {number} ms - Speed in meters per second
 * @returns {number} - Speed in knots (rounded to 1 decimal place) or null if input is invalid
 */
export const msToKnots = (ms) => {
  if (ms === null || ms === undefined) return null;
  const MS_TO_KNOTS = 1.94384; // Conversion factor
  return Math.round(ms * MS_TO_KNOTS * 10) / 10;
};

/**
 * Convert radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} - Angle in degrees (rounded to 1 decimal place) or null if input is invalid
 */
export const radiansToDegrees = (radians) => {
  if (radians === null || radians === undefined) return null;
  return Math.round((radians * 180 / Math.PI) * 10) / 10;
};


