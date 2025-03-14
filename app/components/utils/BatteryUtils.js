/**
 * BatteryUtils.js
 * Utility functions for battery monitoring and state of charge estimation
 * 
 * This file contains functions and configurations specific to battery monitoring
 * in marine applications, with particular focus on the LFD75 12V 64Ah battery.
 */

/**
 * Battery configuration parameters
 * 
 * - WARNING_THRESHOLD: SoC percentage below which battery status is considered warning level
 * - DANGER_THRESHOLD: SoC percentage below which battery status is considered critical
 * - CHARGING_THRESHOLD: Voltage level above which battery is considered to be charging
 * - MIN_VOLTAGE: Minimum safe voltage level for the battery (complete discharge)
 * - MAX_VOLTAGE: Maximum expected voltage when fully charged
 */
export const BATTERY_CONFIG = {
  WARNING_THRESHOLD: 50,  // Show warning when below 50% charge
  DANGER_THRESHOLD: 20,   // Show critical warning when below 20% charge
  CHARGING_THRESHOLD: 13.2, // Voltage threshold to determine if battery is charging
  MIN_VOLTAGE: 10.5,      // Minimum safe voltage for LFD75 battery
  MAX_VOLTAGE: 14.4       // Maximum expected voltage when fully charged
};

/**
 * Enhanced function to estimate State of Charge (SoC) based on battery voltage
 * 
 * This function is specifically calibrated for LFD75 12V 64Ah(C5) batteries with:
 * - RC 141Min 
 * - CCA (Env) 650A 
 * - MCA 813A
 * 
 * The voltage measurements are assumed to be from an INA219 IC, which provides
 * more accurate readings than basic voltage measurement circuits.
 * 
 * The voltage-to-SoC mapping is based on resting voltage levels for a 12V lead-acid
 * battery, with adjustments for the specific characteristics of the LFD75 battery.
 * Linear interpolation is used between points to provide smooth transitions.
 * 
 * Note: For maximum accuracy, voltage readings should be taken:
 * - After the battery has rested for at least 1 hour (no charging/discharging)
 * - At a stable temperature (ideally 25°C/77°F)
 * - With a calibrated measurement device
 * 
 * @param {number} voltage - Battery voltage in volts
 * @returns {number} - Estimated state of charge as percentage (0-100)
 */
export const estimateStateOfCharge = (voltage) => {
  // Special cases handling
  if (!voltage || typeof voltage !== 'number') return 0;  // Handle invalid inputs
  if (voltage >= 13.0) return 100;  // Fully charged or charging
  if (voltage <= BATTERY_CONFIG.MIN_VOLTAGE) return 0;  // Critically low
  
  // Detailed voltage-to-SoC mapping table for LFD75 12V battery
  // These points create a discharge curve specific to this battery type
  // Values are for resting voltage (not under load or charging)
  const voltageMap = [
    { voltage: 12.85, soc: 100 }, // Full charge resting voltage
    { voltage: 12.75, soc: 90 },  // 90% charge
    { voltage: 12.65, soc: 80 },  // 80% charge
    { voltage: 12.55, soc: 70 },  // 70% charge
    { voltage: 12.45, soc: 60 },  // 60% charge
    { voltage: 12.35, soc: 50 },  // 50% charge - starting point for warnings
    { voltage: 12.25, soc: 40 },  // 40% charge
    { voltage: 12.15, soc: 30 },  // 30% charge
    { voltage: 12.05, soc: 20 },  // 20% charge - starting point for critical warnings
    { voltage: 11.95, soc: 15 },  // 15% charge
    { voltage: 11.80, soc: 10 },  // 10% charge - very low
    { voltage: 11.60, soc: 5 },   // 5% charge - extremely low
    { voltage: 10.50, soc: 0 }    // Effectively empty - system should shut down
  ];
  
  // Find the appropriate voltage range in the map and interpolate
  for (let i = 0; i < voltageMap.length - 1; i++) {
    if (voltage >= voltageMap[i + 1].voltage) {
      const higherVoltage = voltageMap[i].voltage;
      const lowerVoltage = voltageMap[i + 1].voltage;
      const higherSoC = voltageMap[i].soc;
      const lowerSoC = voltageMap[i + 1].soc;
      
      // Linear interpolation between voltage points for smoother transitions
      // Formula: soc = lowerSoC + (voltage - lowerVoltage) / (higherVoltage - lowerVoltage) * (higherSoC - lowerSoC)
      const soc = lowerSoC + 
        ((voltage - lowerVoltage) / (higherVoltage - lowerVoltage)) * 
        (higherSoC - lowerSoC);
      
      // Round to nearest integer for cleaner display
      return Math.round(soc);
    }
  }
  
  // Fallback (should not reach here due to edge case handling above)
  return 0;
};

/**
 * Determines if the battery is currently charging
 * 
 * @param {number} voltage - Battery voltage in volts
 * @returns {boolean} - True if the battery is charging, false otherwise
 */
export const isBatteryCharging = (voltage) => {
  return voltage > BATTERY_CONFIG.CHARGING_THRESHOLD;
};

/**
 * Gets the appropriate CSS color class based on battery state of charge
 * 
 * @param {number} percentage - Battery state of charge percentage (0-100) 
 * @returns {string} - CSS class name for the appropriate color
 */
export const getBatteryColorClass = (percentage) => {
  if (percentage > BATTERY_CONFIG.WARNING_THRESHOLD) return 'bg-oGreen';
  if (percentage > BATTERY_CONFIG.DANGER_THRESHOLD) return 'bg-oYellow';
  return 'bg-oRed';
};