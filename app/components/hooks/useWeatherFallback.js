/**
 * useWeatherFallback - Hook for using weather forecast data as fallback
 * 
 * This hook provides a simple way for widgets to get SignalK data
 * with automatic fallback to weather forecast data when sensor data
 * is not available.
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useOcearoContext } from '../context/OcearoContext';
import { useSignalKPath, useSignalKPaths } from './useSignalK';
import signalKService from '../services/SignalKService';

/**
 * Mapping of SignalK paths to forecast data properties
 */
const FORECAST_MAPPINGS = {
    'environment.outside.temperature': {
        forecastPath: 'temperature',
        transform: (value) => value !== null ? value + 273.15 : null // Convert Celsius to Kelvin
    },
    'environment.outside.humidity': {
        forecastPath: 'humidity',
        transform: (value) => value !== null ? value / 100 : null // Convert percentage to ratio
    },
    'environment.outside.pressure': {
        forecastPath: 'pressure',
        transform: (value) => value // Already in Pa
    },
    'environment.wind.speedTrue': {
        forecastPath: 'wind.speed',
        transform: (value) => value !== null ? value / 1.94384 : null // Convert knots to m/s
    },
    'environment.wind.directionTrue': {
        forecastPath: 'wind.direction',
        transform: (value) => value !== null ? value * Math.PI / 180 : null // Convert degrees to radians
    },
    'environment.wind.gust': {
        forecastPath: 'wind.gust',
        transform: (value) => value !== null ? value / 1.94384 : null // Convert knots to m/s
    }
};

/**
 * Get a nested property from an object using dot notation
 * @param {Object} obj - Object to get property from
 * @param {string} path - Dot-notation path (e.g., 'wind.speed')
 * @returns {*} Property value or null
 */
const getNestedProperty = (obj, path) => {
    if (!obj || !path) return null;
    return path.split('.').reduce((acc, part) => acc?.[part], obj) ?? null;
};

/**
 * Hook to get SignalK value with weather forecast fallback
 * 
 * @param {string} signalkPath - SignalK data path
 * @returns {Object} { value, source, isLoading }
 */
export const useWeatherFallback = (signalkPath) => {
    const sensorValue = useSignalKPath(signalkPath);
    const position = useSignalKPath('navigation.position');
    const [forecastData, setForecastData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch forecast data on mount or when position changes
    useEffect(() => {
        const fetchForecast = async () => {
            try {
                const isAvailable = await signalKService.checkWeatherApiAvailability();
                if (!isAvailable) return;

                if (!position?.latitude || !position?.longitude) return;

                setIsLoading(true);
                const rawForecast = await signalKService.getWeatherForecast(
                    position.latitude,
                    position.longitude
                );
                const parsed = signalKService.parseWeatherForecast(rawForecast);
                if (parsed.length > 0) {
                    setForecastData(parsed[0]);
                }
            } catch (error) {
                console.warn('useWeatherFallback: Failed to fetch forecast:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchForecast();
    }, [position]);

    return useMemo(() => {
        if (sensorValue !== null) {
            return {
                value: sensorValue,
                source: 'sensors',
                isLoading: false
            };
        }

        // Try to get forecast data as fallback
        const mapping = FORECAST_MAPPINGS[signalkPath];
        if (mapping && forecastData) {
            const forecastValue = getNestedProperty(forecastData, mapping.forecastPath);
            const transformedValue = mapping.transform(forecastValue);
            
            if (transformedValue !== null) {
                return {
                    value: transformedValue,
                    source: 'forecast',
                    isLoading
                };
            }
        }

        return {
            value: null,
            source: null,
            isLoading
        };
    }, [sensorValue, signalkPath, forecastData, isLoading]);
};

/**
 * Hook to get multiple SignalK values with weather forecast fallback
 * 
 * @param {Array<string>} signalkPaths - Array of SignalK data paths
 * @returns {Object} { values: { [path]: { value, source } }, isLoading, hasAnyData }
 */
export const useMultipleWeatherFallback = (signalkPaths) => {
    const sensorValues = useSignalKPaths(signalkPaths);
    const position = useSignalKPath('navigation.position');
    const [forecastData, setForecastData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch forecast data on mount or when position changes
    useEffect(() => {
        const fetchForecast = async () => {
            try {
                const isAvailable = await signalKService.checkWeatherApiAvailability();
                if (!isAvailable) return;

                if (!position?.latitude || !position?.longitude) return;

                setIsLoading(true);
                const rawForecast = await signalKService.getWeatherForecast(
                    position.latitude,
                    position.longitude
                );
                const parsed = signalKService.parseWeatherForecast(rawForecast);
                if (parsed.length > 0) {
                    setForecastData(parsed[0]);
                }
            } catch (error) {
                console.warn('useMultipleWeatherFallback: Failed to fetch forecast:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchForecast();
    }, [position]);

    return useMemo(() => {
        const values = {};
        let hasAnyData = false;

        for (const path of signalkPaths) {
            // First try sensor data
            const sensorValue = sensorValues[path];
            
            if (sensorValue !== null && sensorValue !== undefined) {
                values[path] = { value: sensorValue, source: 'sensors' };
                hasAnyData = true;
                continue;
            }

            // Try forecast data as fallback
            const mapping = FORECAST_MAPPINGS[path];
            if (mapping && forecastData) {
                const forecastValue = getNestedProperty(forecastData, mapping.forecastPath);
                const transformedValue = mapping.transform(forecastValue);
                
                if (transformedValue !== null) {
                    values[path] = { value: transformedValue, source: 'forecast' };
                    hasAnyData = true;
                    continue;
                }
            }

            values[path] = { value: null, source: null };
        }

        return { values, isLoading, hasAnyData };
    }, [sensorValues, signalkPaths, forecastData, isLoading]);
};

export default useWeatherFallback;
