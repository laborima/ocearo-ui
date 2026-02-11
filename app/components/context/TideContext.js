/**
 * TideContext - Centralized tide data management
 *
 * This context provides:
 * - Tide data from SignalK tides plugin (environment.tide.* paths)
 * - Fallback to local JSON files when the plugin is unavailable
 * - Rule of Twelfths calculation for current tide height
 */

import React, { createContext, useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import signalKService from '../services/SignalKService';
import { useOcearoContext } from './OcearoContext';
import { useSignalKPaths } from '../hooks/useSignalK';

const TideContext = createContext();

/**
 * Tide data refresh interval (10 minutes)
 */
const TIDE_REFRESH_INTERVAL = 10 * 60 * 1000;

/**
 * Initial delay before first tide fetch (3 seconds)
 */
const INITIAL_FETCH_DELAY = 3000;

/**
 * SignalK paths for tide data
 */
const TIDE_PATHS = [
    'environment.tide.heightNow',
    'environment.tide.heightHigh',
    'environment.tide.heightLow',
    'environment.tide.timeLow',
    'environment.tide.timeHigh',
    'environment.tide.coeffNow'
];

/**
 * Calculates the tide height at a specific time using the Rule of Twelfths.
 *
 * The Rule of Twelfths divides the tidal range into 12 equal parts
 * distributed over a 6-hour cycle: 1/12, 2/12, 3/12, 3/12, 2/12, 1/12.
 *
 * @param {number} highTideHeight - Water height at high tide in meters
 * @param {number} lowTideHeight - Water height at low tide in meters
 * @param {string} currentTime - Current time in 24-hour format (HH:MM)
 * @param {string} highTideTime - Time of high tide in 24-hour format (HH:MM)
 * @param {string} lowTideTime - Time of low tide in 24-hour format (HH:MM)
 * @returns {number} Estimated tide height at the current time in meters
 */
export const calculateTideHeightUsingTwelfths = (highTideHeight, lowTideHeight, currentTime, highTideTime, lowTideTime) => {
    if (!currentTime || !highTideTime || !lowTideTime ||
        !/^\d{1,2}:\d{2}$/.test(currentTime) ||
        !/^\d{1,2}:\d{2}$/.test(highTideTime) ||
        !/^\d{1,2}:\d{2}$/.test(lowTideTime)) {
        console.error('Invalid time format provided to calculateTideHeightUsingTwelfths');
        return (highTideHeight + lowTideHeight) / 2;
    }

    const convertTimeToMinutes = (timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const highTideMinutes = convertTimeToMinutes(highTideTime);
    const lowTideMinutes = convertTimeToMinutes(lowTideTime);
    const currentMinutes = convertTimeToMinutes(currentTime);

    let isRising = false;
    let startHeight, endHeight, startMinutes, endMinutes;

    if (lowTideMinutes <= currentMinutes && currentMinutes <= highTideMinutes) {
        isRising = true;
        startHeight = lowTideHeight;
        endHeight = highTideHeight;
        startMinutes = lowTideMinutes;
        endMinutes = highTideMinutes;
    } else {
        startHeight = highTideHeight;
        endHeight = lowTideHeight;
        startMinutes = highTideMinutes;
        endMinutes = lowTideMinutes + (lowTideMinutes < highTideMinutes ? 1440 : 0);
    }

    const tideCycleDuration = Math.abs(endMinutes - startMinutes);
    const tideChange = Math.abs(endHeight - startHeight);

    let elapsedTime = currentMinutes - startMinutes;
    if (elapsedTime < 0) elapsedTime += 1440;

    const twelfth = tideChange / 12;
    let heightChange = 0;

    if (elapsedTime <= tideCycleDuration / 6) {
        heightChange = twelfth * Math.ceil(elapsedTime / (tideCycleDuration / 12));
    } else if (elapsedTime <= 2 * tideCycleDuration / 6) {
        heightChange = twelfth * 2 + twelfth * Math.ceil((elapsedTime - tideCycleDuration / 6) / (tideCycleDuration / 12));
    } else if (elapsedTime <= 3 * tideCycleDuration / 6) {
        heightChange = twelfth * 5;
    } else if (elapsedTime <= 4 * tideCycleDuration / 6) {
        heightChange = twelfth * 8;
    } else if (elapsedTime <= 5 * tideCycleDuration / 6) {
        heightChange = twelfth * 10;
    } else {
        heightChange = tideChange;
    }

    return isRising ? startHeight + heightChange : startHeight - heightChange;
};

/**
 * Fetch tide data from local JSON files (fallback when SignalK plugin is unavailable).
 * Files are expected at /tides/larochelle/MM_YYYY.json.
 *
 * @param {Function} updateSignalKData - Callback to inject tide values into the SignalK data store
 */
const fetchLocalTideData = async (updateSignalKData) => {
    try {
        const date = new Date();
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const filePath = `/tides/larochelle/${month}_${year}.json`;

        const response = await fetch(filePath);
        if (!response.ok) {
            console.warn('TideContext: No local tide data found');
            return;
        }

        const tideData = await response.json();
        const today = date.toISOString().split('T')[0];
        if (!tideData[today]) return;

        const now = new Date();
        const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

        let lastTide = null;
        let nextTide = null;

        const sortedTides = tideData[today].map(([type, time, height, coef]) => {
            const [hours, minutes] = time.split(':').map(Number);
            return {
                type,
                height: parseFloat(height),
                time,
                timeInMinutes: hours * 60 + minutes,
                coef
            };
        }).sort((a, b) => a.timeInMinutes - b.timeInMinutes);

        for (const tide of sortedTides) {
            if (tide.timeInMinutes <= currentTimeInMinutes) {
                lastTide = tide;
            } else {
                nextTide = tide;
                break;
            }
        }

        if (!lastTide || !nextTide) {
            console.warn('TideContext: Cannot determine tide trend from local data');
            return;
        }

        const isRising = lastTide.type === 'tide.low' && nextTide.type === 'tide.high';

        let closestHighTide, closestLowTide;
        if (isRising) {
            closestHighTide = nextTide.type === 'tide.high' ? nextTide : null;
            closestLowTide = lastTide.type === 'tide.low' ? lastTide : null;
        } else {
            closestHighTide = lastTide.type === 'tide.high' ? lastTide : null;
            closestLowTide = nextTide.type === 'tide.low' ? nextTide : null;
        }

        if (closestHighTide && closestLowTide) {
            const nowTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const currentTideHeight = calculateTideHeightUsingTwelfths(
                closestHighTide.height,
                closestLowTide.height,
                nowTime,
                closestHighTide.time,
                closestLowTide.time
            );

            updateSignalKData({
                'environment.tide.heightNow': currentTideHeight,
                'environment.tide.heightHigh': closestHighTide.height,
                'environment.tide.heightLow': closestLowTide.height,
                'environment.tide.timeLow': closestLowTide.time,
                'environment.tide.timeHigh': closestHighTide.time,
                'environment.tide.coeffNow': closestHighTide.coef
            });
        } else {
            console.warn('TideContext: Tide data for today is incomplete');
        }
    } catch (error) {
        console.warn('TideContext: Failed to fetch local tide data:', error.message);
    }
};

export const TideContextProvider = ({ children }) => {
    const { updateSignalKData } = useOcearoContext();

    const skValues = useSignalKPaths(TIDE_PATHS);

    const [tideApiAvailable, setTideApiAvailable] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastFetchTime, setLastFetchTime] = useState(null);
    const [source, setSource] = useState(null);

    const refreshIntervalRef = useRef(null);
    const fetchTimeoutRef = useRef(null);
    const updateSignalKDataRef = useRef(updateSignalKData);
    updateSignalKDataRef.current = updateSignalKData;

    /**
     * Fetch tide data: try SignalK plugin first, then fall back to local JSON.
     * When the SignalK tides plugin is active the delta stream already pushes
     * environment.tide.* values, so we only need to confirm availability.
     * When it is not available we load local JSON and inject the values into
     * the SignalK data store via updateSignalKData.
     */
    const fetchTideData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const isAvailable = await signalKService.checkTideApiAvailability();
            setTideApiAvailable(isAvailable);

            if (isAvailable) {
                setSource('signalk');
                setLastFetchTime(new Date());
            } else {
                setSource('local');
                await fetchLocalTideData(updateSignalKDataRef.current);
                setLastFetchTime(new Date());
            }
        } catch (err) {
            console.warn('TideContext: Failed to fetch tide data:', err.message);
            setError(err.message);
            try {
                setSource('local');
                await fetchLocalTideData(updateSignalKDataRef.current);
                setLastFetchTime(new Date());
            } catch (fallbackErr) {
                console.warn('TideContext: Local fallback also failed:', fallbackErr.message);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTimeoutRef.current = setTimeout(() => {
            fetchTideData();
        }, INITIAL_FETCH_DELAY);

        refreshIntervalRef.current = setInterval(() => {
            fetchTideData();
        }, TIDE_REFRESH_INTERVAL);

        return () => {
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [fetchTideData]);

    const tideData = useMemo(() => ({
        level: skValues['environment.tide.heightNow'],
        high: skValues['environment.tide.heightHigh'],
        low: skValues['environment.tide.heightLow'],
        timeLow: skValues['environment.tide.timeLow'],
        timeHigh: skValues['environment.tide.timeHigh'],
        coefficient: skValues['environment.tide.coeffNow']
    }), [skValues]);

    const contextValue = useMemo(() => ({
        tideData,
        tideApiAvailable,
        source,
        isLoading,
        error,
        lastFetchTime,
        fetchTideData
    }), [tideData, tideApiAvailable, source, isLoading, error, lastFetchTime, fetchTideData]);

    return (
        <TideContext.Provider value={contextValue}>
            {children}
        </TideContext.Provider>
    );
};

/**
 * Hook to access tide context
 * @returns {Object} Tide context value
 */
export const useTide = () => {
    const context = useContext(TideContext);
    if (!context) {
        throw new Error('useTide must be used within a TideContextProvider');
    }
    return context;
};

export default TideContext;
