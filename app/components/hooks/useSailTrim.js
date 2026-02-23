'use client';
import { useState, useCallback, useRef, useMemo } from 'react';
import { useSignalKPath, useSignalKPaths } from './useSignalK';
import configService from '../settings/ConfigService';

/**
 * Default sail trim state values.
 * @type {Object}
 */
const DEFAULT_SAIL_TRIM = {
    mainCar: 0.5,
    jibCar: 0.5,
    tension: 0.5,
    reefLevel: 0,
};

/**
 * Hook providing sail trim state management and wind data integration.
 *
 * Exposes slider-controlled trim values (mainCar, jibCar, tension),
 * computed reef level based on true wind speed, and live SignalK wind data.
 *
 * @returns {Object} Sail trim state, setters, and derived wind/reef data
 */
const useSailTrim = () => {
    const [trimState, setTrimState] = useState(DEFAULT_SAIL_TRIM);

    const preferredSpeed = configService.get('preferredWindSpeedPath') || 'speedTrue';
    const preferredDir = configService.get('preferredWindDirectionPath') || 'angleTrueWater';

    const windPaths = useMemo(() => [
        `environment.wind.${preferredSpeed}`,
        `environment.wind.${preferredDir}`,
        'environment.wind.speedTrue',
        'environment.wind.angleTrueWater',
        'environment.wind.angleApparent',
        'environment.wind.speedApparent'
    ], [preferredSpeed, preferredDir]);

    const skWind = useSignalKPaths(windPaths);

    const trueWindSpeed = skWind[`environment.wind.${preferredSpeed}`]
        ?? skWind['environment.wind.speedTrue'] ?? 0;
    const trueWindAngle = (preferredDir === 'directionTrue' || preferredDir === 'angleTrueGround')
        ? (skWind[`environment.wind.${preferredDir}`] ?? skWind['environment.wind.angleTrueWater'] ?? 0)
        : (skWind[`environment.wind.${preferredDir}`] ?? skWind['environment.wind.angleTrueWater'] ?? 0);
    const appWindAngle = skWind['environment.wind.angleApparent'] ?? 0;
    const appWindSpeed = skWind['environment.wind.speedApparent'] ?? 0;

    /**
     * Updates a single trim parameter by key.
     *
     * @param {string} key - The trim parameter name (mainCar, jibCar, tension)
     * @param {number} value - The new value (0 to 1)
     */
    const setTrimValue = useCallback((key, value) => {
        setTrimState(prev => ({ ...prev, [key]: value }));
    }, []);

    /**
     * Convenience setter for the mainsail car position.
     *
     * @param {number} value - Position from 0 (inboard) to 1 (outboard)
     */
    const setMainCar = useCallback((value) => {
        setTrimValue('mainCar', value);
    }, [setTrimValue]);

    /**
     * Convenience setter for the jib car position.
     *
     * @param {number} value - Position from 0 (forward) to 1 (aft)
     */
    const setJibCar = useCallback((value) => {
        setTrimValue('jibCar', value);
    }, [setTrimValue]);

    /**
     * Convenience setter for the general tension level.
     *
     * @param {number} value - Tension from 0 (loose) to 1 (maximum)
     */
    const setTension = useCallback((value) => {
        setTrimValue('tension', value);
    }, [setTrimValue]);

    /**
     * Computes the recommended reef level from true wind speed in m/s.
     * TWS > 25 kt (~12.86 m/s) => 2 reefs
     * TWS > 18 kt (~9.26 m/s)  => 1 reef
     * Otherwise                 => 0 reefs
     *
     * @param {number} tws - True wind speed in m/s
     * @returns {number} Reef level (0, 1, or 2)
     */
    const computeReefLevel = useCallback((tws) => {
        const twsKnots = tws * 1.9438444924574;
        if (twsKnots > 25) return 2;
        if (twsKnots > 18) return 1;
        return 0;
    }, []);

    const reefLevel = useMemo(
        () => computeReefLevel(trueWindSpeed),
        [trueWindSpeed, computeReefLevel]
    );

    /**
     * Aggregated wind data object for downstream consumers.
     */
    const windData = useMemo(() => ({
        tws: trueWindSpeed,
        twa: trueWindAngle,
        awa: appWindAngle,
        aws: appWindSpeed,
    }), [trueWindSpeed, trueWindAngle, appWindAngle, appWindSpeed]);

    /**
     * Complete sail trim parameters combining slider state and computed values.
     */
    const sailTrimParams = useMemo(() => ({
        ...trimState,
        reefLevel,
        ...windData,
    }), [trimState, reefLevel, windData]);

    return {
        trimState,
        windData,
        reefLevel,
        sailTrimParams,
        setMainCar,
        setJibCar,
        setTension,
        setTrimValue,
    };
};

export default useSailTrim;
