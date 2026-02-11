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
import { useSignalKPath, useSignalKPaths } from '../hooks/useSignalK';

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
    // Subscribe to position separately — only used for forecast fetch trigger
    const position = useSignalKPath('navigation.position');

    // Subscribe to weather sensor paths
    const weatherSensorPaths = useMemo(() => [
        'environment.outside.temperature',
        'environment.outside.humidity',
        'environment.outside.pressure',
        'environment.wind.speedTrue',
        'environment.wind.directionTrue',
        'environment.wind.gust'
    ], []);

    const sensorValues = useSignalKPaths(weatherSensorPaths);
    
    // Weather forecast state
    const [forecasts, setForecasts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [weatherApiAvailable, setWeatherApiAvailable] = useState(null);
    const [lastFetchTime, setLastFetchTime] = useState(null);
    
    // Refs for cleanup and stable position access
    const fetchTimeoutRef = useRef(null);
    const refreshIntervalRef = useRef(null);
    const positionRef = useRef(position);
    positionRef.current = position;

    /**
     * Fetch weather forecast from SignalK Weather API
     */
    const fetchWeatherForecast = useCallback(async () => {
        const pos = positionRef.current;
        
        if (!pos?.latitude || !pos?.longitude) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            let isAvailable = signalKService.isWeatherApiAvailable();
            if (isAvailable === null) {
                isAvailable = await signalKService.checkWeatherApiAvailability();
            }
            setWeatherApiAvailable(isAvailable);

            if (!isAvailable) {
                setError('Weather API not available on SignalK server');
                return;
            }

            const rawForecast = await signalKService.getWeatherForecast(
                pos.latitude,
                pos.longitude
            );

            const parsedForecasts = signalKService.parseWeatherForecast(rawForecast);
            setForecasts(parsedForecasts);
            setLastFetchTime(new Date());
        } catch (err) {
            if (err.message && err.message.includes('400')) {
                console.warn('WeatherContext: Weather forecast not supported by this server');
                setWeatherApiAvailable(false);
            } else {
                console.warn('WeatherContext: Failed to fetch forecast:', err.message);
            }
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Get weather data for a specific time offset (hours from now)
     * @param {number} hoursFromNow - Hours from current time
     * @returns {Object|null} Forecast data for that time
     */
    const getForecastForTime = useCallback((hoursFromNow) => {
        if (!forecasts || forecasts.length === 0) {
            return null;
        }
        const index = Math.min(Math.floor(hoursFromNow), forecasts.length - 1);
        return forecasts[index] || null;
    }, [forecasts]);

    /**
     * Get current weather data with per-field merge (sensor first, then forecast fallback).
     * Returns values in SignalK raw units (Kelvin, ratio, Pa, m/s, radians).
     * @returns {Object} Current weather data
     */
    const getCurrentWeather = useCallback(() => {
        const currentForecast = forecasts.length > 0 ? forecasts[0] : null;

        // Per-field merge: sensor value first, then forecast fallback
        // Forecast values need conversion back to SignalK units
        const temperature = sensorValues['environment.outside.temperature']
            ?? (currentForecast?.temperature != null ? currentForecast.temperature + 273.15 : null);
        const humidity = sensorValues['environment.outside.humidity']
            ?? (currentForecast?.humidity ?? null);
        const pressure = sensorValues['environment.outside.pressure']
            ?? (currentForecast?.pressure ?? null);
        const windSpeed = sensorValues['environment.wind.speedTrue']
            ?? (currentForecast?.wind?.speed != null ? currentForecast.wind.speed / 1.94384 : null);
        const windDirection = sensorValues['environment.wind.directionTrue']
            ?? (currentForecast?.wind?.direction != null ? currentForecast.wind.direction * Math.PI / 180 : null);

        const hasAny = temperature !== null || humidity !== null || pressure !== null || windSpeed !== null;
        const hasSensor = Object.values(sensorValues).some(v => v !== null);

        return {
            source: hasAny ? (hasSensor ? 'sensors' : 'forecast') : null,
            temperature,
            humidity,
            pressure,
            windSpeed,
            windDirection,
            description: currentForecast?.description || null
        };
    }, [sensorValues, forecasts]);

    /**
     * Get wind data with per-field fallback to forecast
     * @returns {Object} Wind data in SignalK units (m/s, radians)
     */
    const getWindData = useCallback(() => {
        const currentForecast = forecasts.length > 0 ? forecasts[0] : null;

        const speed = sensorValues['environment.wind.speedTrue']
            ?? (currentForecast?.wind?.speed != null ? currentForecast.wind.speed / 1.94384 : null);
        const direction = sensorValues['environment.wind.directionTrue']
            ?? (currentForecast?.wind?.direction != null ? currentForecast.wind.direction * Math.PI / 180 : null);
        const gust = sensorValues['environment.wind.gust']
            ?? (currentForecast?.wind?.gust != null ? currentForecast.wind.gust / 1.94384 : null);

        const hasSensor = sensorValues['environment.wind.speedTrue'] !== null || sensorValues['environment.wind.directionTrue'] !== null;

        return {
            source: (speed !== null || direction !== null) ? (hasSensor ? 'sensors' : 'forecast') : null,
            speed,
            direction,
            gust
        };
    }, [sensorValues, forecasts]);

    // Initialize weather data fetch — stable callback, no re-trigger on sensor changes
    useEffect(() => {
        fetchTimeoutRef.current = setTimeout(() => {
            fetchWeatherForecast();
        }, INITIAL_FETCH_DELAY);

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

    const contextValue = useMemo(() => ({
        forecasts,
        isLoading,
        error,
        weatherApiAvailable,
        lastFetchTime,
        fetchWeatherForecast,
        getForecastForTime,
        getCurrentWeather,
        getWindData
    }), [forecasts, isLoading, error, weatherApiAvailable, lastFetchTime,
         fetchWeatherForecast, getForecastForTime, getCurrentWeather, getWindData]);

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
