/**
 * WeatherContext - Centralized weather data management
 * 
 * This context provides:
 * - Weather forecast data from SignalK Weather API
 * - Current weather observations
 * - Fallback data for widgets when sensor data is unavailable
 */

import React, { createContext, useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import signalKService from '../services/SignalKService';
import { useOcearoContext } from './OcearoContext';
import { useSignalKPaths } from '../hooks/useSignalK';

const WeatherContext = createContext();

/**
 * Weather data refresh interval (30 minutes)
 */
const WEATHER_REFRESH_INTERVAL = 30 * 60 * 1000;

/**
 * Initial delay before first weather fetch (5 seconds)
 * Allows time for position data to be available
 */
const INITIAL_FETCH_DELAY = 5000;

export const WeatherContextProvider = ({ children }) => {
    // Define paths for subscription
    const weatherPaths = useMemo(() => [
        'navigation.position',
        'environment.outside.temperature',
        'environment.outside.humidity',
        'environment.outside.pressure',
        'environment.wind.speedTrue',
        'environment.wind.directionTrue',
        'environment.wind.gust'
    ], []);

    const skValues = useSignalKPaths(weatherPaths);
    
    // Weather forecast state
    const [forecasts, setForecasts] = useState([]);
    const [currentForecast, setCurrentForecast] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [weatherApiAvailable, setWeatherApiAvailable] = useState(null);
    const [lastFetchTime, setLastFetchTime] = useState(null);
    
    // Refs for cleanup
    const fetchTimeoutRef = useRef(null);
    const refreshIntervalRef = useRef(null);

    /**
     * Fetch weather forecast from SignalK Weather API
     */
    const fetchWeatherForecast = useCallback(async () => {
        const position = skValues['navigation.position'];
        
        if (!position?.latitude || !position?.longitude) {
            console.warn('WeatherContext: No position available for weather forecast');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Check if weather API is available
            const isAvailable = await signalKService.checkWeatherApiAvailability();
            setWeatherApiAvailable(isAvailable);

            if (!isAvailable) {
                setError('Weather API not available on SignalK server');
                return;
            }

            // Fetch forecast
            const rawForecast = await signalKService.getWeatherForecast(
                position.latitude,
                position.longitude
            );

            // Parse forecast data
            const parsedForecasts = signalKService.parseWeatherForecast(rawForecast);
            setForecasts(parsedForecasts);
            
            // Set current forecast (first item)
            if (parsedForecasts.length > 0) {
                setCurrentForecast(parsedForecasts[0]);
            }
            
            setLastFetchTime(new Date());
        } catch (err) {
            console.error('WeatherContext: Failed to fetch forecast:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [skValues]);

    /**
     * Get weather data for a specific time offset (hours from now)
     * @param {number} hoursFromNow - Hours from current time
     * @returns {Object|null} Forecast data for that time
     */
    const getForecastForTime = useCallback((hoursFromNow) => {
        if (!forecasts || forecasts.length === 0) {
            return null;
        }
        
        // Assuming forecasts are hourly, find the closest one
        const index = Math.min(Math.floor(hoursFromNow), forecasts.length - 1);
        return forecasts[index] || null;
    }, [forecasts]);

    /**
     * Get current weather data with fallback to forecast
     * @returns {Object} Current weather data
     */
    const getCurrentWeather = useCallback(() => {
        // First try to get sensor data from subscribed values
        const sensorData = {
            temperature: skValues['environment.outside.temperature'],
            humidity: skValues['environment.outside.humidity'],
            pressure: skValues['environment.outside.pressure'],
            windSpeed: skValues['environment.wind.speedTrue'],
            windDirection: skValues['environment.wind.directionTrue']
        };

        const hasSensorData = Object.values(sensorData).some(v => v !== null);

        if (hasSensorData) {
            return {
                source: 'sensors',
                temperature: sensorData.temperature,
                humidity: sensorData.humidity,
                pressure: sensorData.pressure,
                windSpeed: sensorData.windSpeed,
                windDirection: sensorData.windDirection,
                description: null
            };
        }

        // Fall back to forecast data
        if (currentForecast) {
            return {
                source: 'forecast',
                temperature: currentForecast.temperature !== null 
                    ? currentForecast.temperature + 273.15 // Convert back to Kelvin
                    : null,
                humidity: currentForecast.humidity !== null 
                    ? currentForecast.humidity / 100 // Convert to ratio
                    : null,
                pressure: currentForecast.pressure,
                windSpeed: currentForecast.wind?.speed !== null 
                    ? currentForecast.wind.speed / 1.94384 // Convert knots to m/s
                    : null,
                windDirection: currentForecast.wind?.direction !== null 
                    ? currentForecast.wind.direction * Math.PI / 180 // Convert to radians
                    : null,
                description: currentForecast.description
            };
        }

        return {
            source: null,
            temperature: null,
            humidity: null,
            pressure: null,
            windSpeed: null,
            windDirection: null,
            description: null
        };
    }, [skValues, currentForecast]);

    /**
     * Get wind data with fallback to forecast
     * @returns {Object} Wind data
     */
    const getWindData = useCallback(() => {
        const sensorSpeed = skValues['environment.wind.speedTrue'];
        const sensorDirection = skValues['environment.wind.directionTrue'];
        const sensorGust = skValues['environment.wind.gust'];

        if (sensorSpeed !== null || sensorDirection !== null) {
            return {
                source: 'sensors',
                speed: sensorSpeed,
                direction: sensorDirection,
                gust: sensorGust
            };
        }

        if (currentForecast?.wind) {
            return {
                source: 'forecast',
                speed: currentForecast.wind.speed !== null 
                    ? currentForecast.wind.speed / 1.94384 
                    : null,
                direction: currentForecast.wind.direction !== null 
                    ? currentForecast.wind.direction * Math.PI / 180 
                    : null,
                gust: currentForecast.wind.gust !== null 
                    ? currentForecast.wind.gust / 1.94384 
                    : null
            };
        }

        return {
            source: null,
            speed: null,
            direction: null,
            gust: null
        };
    }, [skValues, currentForecast]);

    // Initialize weather data fetch
    useEffect(() => {
        // Initial fetch after delay
        fetchTimeoutRef.current = setTimeout(() => {
            fetchWeatherForecast();
        }, INITIAL_FETCH_DELAY);

        // Set up periodic refresh
        refreshIntervalRef.current = setInterval(() => {
            fetchWeatherForecast();
        }, WEATHER_REFRESH_INTERVAL);

        return () => {
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [fetchWeatherForecast]);

    const contextValue = {
        // State
        forecasts,
        currentForecast,
        isLoading,
        error,
        weatherApiAvailable,
        lastFetchTime,
        
        // Methods
        fetchWeatherForecast,
        getForecastForTime,
        getCurrentWeather,
        getWindData
    };

    return (
        <WeatherContext.Provider value={contextValue}>
            {children}
        </WeatherContext.Provider>
    );
};

/**
 * Hook to access weather context
 * @returns {Object} Weather context value
 */
export const useWeather = () => {
    const context = useContext(WeatherContext);
    if (!context) {
        throw new Error('useWeather must be used within a WeatherContextProvider');
    }
    return context;
};

export default WeatherContext;
