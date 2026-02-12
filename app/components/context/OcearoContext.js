import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import Client from '@signalk/client';
import configService from '../settings/ConfigService';
import signalKService from '../services/SignalKService';
import { updateOcearoCoreMode, isOcearoCoreEnabled, handleOcearoCoreError } from '../utils/OcearoCoreUtils';
import { MathUtils } from 'three';

export {
    radToDeg, toDegrees, degToRad, toKnots, toKelvin,
    convertTemperature, convertWindSpeed, convertSpeed, convertPressure,
    MS_TO_KNOTS, KNOTS_TO_MPS, EARTH_RADIUS_METERS
} from '../utils/UnitConversions';

import { MS_TO_KNOTS } from '../utils/UnitConversions';
import { SAMPLE_DATA, SAMPLE_DATA_INTERVAL } from './SampleData';

const OcearoContext = createContext();


export const oBlue = '#09bfff';
export const oRed = '#cc000c';
export const oYellow = '#ffbe00';
export const oGreen = '#0fcd4f';
export const oNight = '#ef4444';   
export const oGray = '#989898';
export const oGray2 = '#424242';

const INITIAL_STATES = {
    autopilot: true,
    anchorWatch: false,
    parkingMode: false,
    mob: false,
    showOcean: false,
    ais: false,
    showPolar: true,
    showLaylines3D: false
};



export const OcearoContextProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => configService.get('theme') || 'dark');
    const [nightMode, setNightMode] = useState(false); // Night mode state (separate from theme, for red HUD)
    const [states, setStates] = useState(INITIAL_STATES);
    
    // Apply theme and night mode to document root
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }, [theme]);

    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-night', nightMode ? 'true' : 'false');
        }
    }, [nightMode]);

    // Listen for config changes from other components (like ConfigPage)
    useEffect(() => {
        const handleConfigChange = (newConfig) => {
            if (newConfig.theme && newConfig.theme !== theme) {
                setTheme(newConfig.theme);
            }
        };
        
        // We might need a way to listen to config changes if ConfigService doesn't emit events
        // For now, since ConfigPage calls onSave, we can assume it works if we wrap the app correctly
        // Or we can just use the theme from config directly if we use it in a hook
    }, [theme]);
    
    // Store subscribers for each path
    const subscribersRef = useRef({});
    // Store current data in a ref for immediate access without triggering re-renders of the context itself
    const signalkDataRef = useRef({});

    /**
     * Subscribe to a specific SignalK path
     */
    const subscribe = useCallback((path, callback) => {
        if (!subscribersRef.current[path]) {
            subscribersRef.current[path] = new Set();
        }
        subscribersRef.current[path].add(callback);
    }, []);

    /**
     * Unsubscribe from a specific SignalK path
     */
    const unsubscribe = useCallback((path, callback) => {
        if (subscribersRef.current[path]) {
            subscribersRef.current[path].delete(callback);
            if (subscribersRef.current[path].size === 0) {
                delete subscribersRef.current[path];
            }
        }
    }, []);

    /**
     * Notify subscribers of a data change
     */
    const notifySubscribers = useCallback((path, value) => {
        if (subscribersRef.current[path]) {
            subscribersRef.current[path].forEach(callback => callback(value));
        }
    }, []);

    /**
     * Update SignalK data and notify subscribers only when values actually change.
     * This prevents unnecessary re-renders when demo/sample data is re-pushed
     * with identical values.
     */
    const updateSignalKData = useCallback((updates) => {
        const current = signalkDataRef.current;
        let hasChanges = false;

        for (const [path, value] of Object.entries(updates)) {
            const prev = current[path];
            if (prev === value) continue;
            if (typeof prev === 'object' && typeof value === 'object' &&
                prev !== null && value !== null &&
                JSON.stringify(prev) === JSON.stringify(value)) {
                continue;
            }
            current[path] = value;
            hasChanges = true;
            notifySubscribers(path, value);
        }

        if (hasChanges) {
            signalkDataRef.current = current;
        }
    }, [notifySubscribers]);

    /**
     * Get the value of a SignalK data path
     * @param {string} path - The SignalK data path
     * @returns {*} - The value at the specified path, or null if not found
     */
    const getSignalKValue = useCallback((path) => {
        if (Object.prototype.hasOwnProperty.call(signalkDataRef.current, path)) {
            return signalkDataRef.current[path];
        }
        return null;
    }, []);
    
    /**
     * Get the user's boat rotation angle in radians
     * @deprecated Use useSignalKPaths in components instead for reactive updates
     * @returns {number} - Rotation angle in radian
     */
    const getBoatRotationAngle = useCallback(() => {
        const data = signalkDataRef.current;
        const heading = data['navigation.headingTrue'] || data['navigation.headingMagnetic'];
        const courseOverGroundAngle = data['navigation.courseOverGroundTrue']
        || data['navigation.courseOverGroundMagnetic'];

        return courseOverGroundAngle || heading || 0;
    }, []);
    
    /**
     * Convert latitude/longitude coordinates to X/Y coordinates relative to a reference position
     * @param {Object} position - Position with lat and lon properties
     * @param {Object} referencePosition - Reference position with lat and lon properties
     * @returns {Object} - {x, y} coordinates in meters { x: Easting, y: Northing }
     */
    const convertLatLonToXY = (position, referencePosition) => {
        // Define Earth radius if not defined elsewhere
        const EARTH_RADIUS_METERS = 6371000;

        if (!position?.lat || !position?.lon || !referencePosition?.lat || !referencePosition?.lon) {
            console.warn("Invalid input to convertLatLonToXY", position, referencePosition);
            return { x: 0, y: 0 };
        }

        // Convert latitude and longitude from degrees to radians
        const lat1 = referencePosition.lat * Math.PI / 180;
        const lon1 = referencePosition.lon * Math.PI / 180;
        const lat2 = position.lat * Math.PI / 180;
        const lon2 = position.lon * Math.PI / 180;

        // Calculate differences
        const dLon = lon2 - lon1;
        const dLat = lat2 - lat1; // Needed for Haversine

        // Calculate bearing in radians (needed for Cartesian conversion)
        // Note: atan2(y, x) gives angle from +X axis, bearing needs angle from +Y (North)
        const y_bear = Math.sin(dLon) * Math.cos(lat2);
        const x_bear = Math.cos(lat1) * Math.sin(lat2) -
                       Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        const bearing = Math.atan2(y_bear, x_bear); // Bearing relative to North, clockwise

        // Calculate distance using Haversine formula
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = EARTH_RADIUS_METERS * c;


                // Convert polar (distance, bearing) to cartesian (x, y)
                // Standard convention: X = Easting, Y = Northing
                const easting = distance * Math.sin(bearing);  // X axis (East component)
                const northing = distance * Math.cos(bearing); // Y axis (North component) <-- REMOVED NEGATION

                // Optional: Update or remove the internal comment if it was confusing
                // e.g., // Returns Easting (x) and Northing (y) in meters

                return { x: easting, y: northing }; // Return Easting, Northing
            };


    
    // Function to get sail visibility state based on navigation mode
    const getSailVisibility = useCallback(() => {
        const data = signalkDataRef.current;
        const navigationState = data['navigation.state'];
        // Hide sails when in motoring mode
        return navigationState !== 'motoring';
    }, []);
   
    // Method to toggle any state (e.g., autopilot, anchorWatch)
    const toggleState = async (key, value = undefined) => {
        const newValue = value !== undefined ? value : !states[key];

        setStates((prevState) => ({
            ...prevState,
            [key]: newValue,
        }));

        // Handle anchorWatch specific logic
        if (key === 'anchorWatch') {
            try {
                if (newValue) {
                    // Set anchored mode in OcearoCore
                    if (isOcearoCoreEnabled()) {
                        await updateOcearoCoreMode('anchored');
                    }
                } else {
                    // Determine navigation mode based on engine state
                    const data = signalkDataRef.current;
                    const engineState = data['propulsion.main.state'] || data['propulsion.main.revolutions'];
                    const navigationMode = (engineState === 'running' || (typeof engineState === 'number' && engineState > 0)) ? 'motoring' : 'sailing';
                    
                    if (isOcearoCoreEnabled()) {
                        await updateOcearoCoreMode(navigationMode);
                    }
                }
            } catch (error) {
                if (error.name === 'NetworkError') {
                    console.warn('OcearoCore unreachable for anchorWatch update');
                } else {
                    console.error('Failed to update OcearoCore mode for anchorWatch:', handleOcearoCoreError(error));
                }
            }
        }

        // Handle parkingMode specific logic
        if (key === 'parkingMode') {
            try {
                if (newValue) {
                    // When activating parkingMode, set docking mode in OcearoCore
                    if (isOcearoCoreEnabled()) {
                        await updateOcearoCoreMode('moored');
                    }
                }
            } catch (error) {
                if (error.name === 'NetworkError') {
                    console.warn('OcearoCore unreachable for parkingMode update');
                } else {
                    console.error('Failed to update OcearoCore mode for parkingMode:', handleOcearoCoreError(error));
                }
            }
        }

        // Handle racing mode logic
        if (key === 'racing') {
            try {
                if (newValue) {
                    // When activating racing mode, set racing mode in OcearoCore
                    if (isOcearoCoreEnabled()) {
                        await updateOcearoCoreMode('racing');
                    }
                } else {
                    // When deactivating racing mode, return to navigation mode
                    if (isOcearoCoreEnabled()) {
                        await updateOcearoCoreMode('sailing');
                    }
                }
            } catch (error) {
                if (error.name === 'NetworkError') {
                    console.warn('OcearoCore unreachable for racing update');
                } else {
                    console.error('Failed to update OcearoCore mode for racing:', handleOcearoCoreError(error));
                }
            }
        }
    };

    /**
     * Toggles a state exclusively, turning off other exclusive states
     * Exclusive states are: autopilot, anchorWatch, parkingMode
     */
    const toggleExclusiveMode = async (key) => {
        const exclusiveKeys = ['autopilot', 'anchorWatch', 'parkingMode'];
        if (!exclusiveKeys.includes(key)) {
            return toggleState(key);
        }

        const newValue = !states[key];
        
        // If we're turning it ON, we turn OFF all others
        if (newValue) {
            setStates((prevState) => {
                const newState = { ...prevState };
                exclusiveKeys.forEach(k => {
                    newState[k] = (k === key);
                });
                return newState;
            });

            // Handle OcearoCore mode updates for the new state
            try {
                if (isOcearoCoreEnabled()) {
                    if (key === 'anchorWatch') await updateOcearoCoreMode('anchored');
                    else if (key === 'parkingMode') await updateOcearoCoreMode('moored');
                    else if (key === 'autopilot') {
                         const data = signalkDataRef.current;
                         const engineState = data['propulsion.main.state'] || data['propulsion.main.revolutions'];
                         const navigationMode = (engineState === 'running' || (typeof engineState === 'number' && engineState > 0)) ? 'motoring' : 'sailing';
                         await updateOcearoCoreMode(navigationMode);
                    }
                }
            } catch (error) {
                if (error.name === 'NetworkError') {
                    console.warn(`OcearoCore unreachable for exclusive mode update: ${key}`);
                } else {
                    console.error(`Failed to update OcearoCore mode for ${key}:`, handleOcearoCoreError(error));
                }
            }
        } else {
            // If we're turning it OFF, we just toggle it
            return toggleState(key, false);
        }
    };

    // Use useRef to persist client between renders
    const clientRef = useRef(null);
    const sampleDataIntervalRef = useRef(null);

    // Initialize SignalK client connection
    useEffect(() => {
        let isMounted = true;

        /**
         * Connects to the SignalK server and sets up data handling
         * Ensures debug data is available even if the connection fails
         */
        const connectSignalKClient = async () => {
         
            const config = configService.getAll(); // Load config from the service
            const { signalkUrl, debugMode } = config;
            
            // Setup debug data interval function - extracted to be reusable
            const setupDebugDataInterval = () => {
                // Clear any existing interval
                if (sampleDataIntervalRef.current) {
                    clearInterval(sampleDataIntervalRef.current);
                }

                // Track angles for smooth incremental changes
                let currentWindAngle = 0;
                let currentRudderAngle = 0;
                let rudderDirection = 1;

                // Push initial sample data immediately (only once)
                updateSignalKData({
                    'steering.rudderAngle': MathUtils.degToRad(currentRudderAngle),
                    ...SAMPLE_DATA.wind,
                    ...SAMPLE_DATA.temperature,
                    ...SAMPLE_DATA.environment,
                    ...SAMPLE_DATA.performance,
                    ...SAMPLE_DATA.navigation,
                    ...SAMPLE_DATA.racing,
                    ...SAMPLE_DATA.electrical,
                    ...SAMPLE_DATA.propulsion,
                    ...SAMPLE_DATA.tanks,
                });

                // Create interval that only updates values that actually change
                sampleDataIntervalRef.current = setInterval(() => {
                    // Smooth rudder oscillation instead of random jumps
                    currentRudderAngle += rudderDirection * 2;
                    if (currentRudderAngle >= 15 || currentRudderAngle <= -15) {
                        rudderDirection *= -1;
                    }

                    // Increment the wind angle by 5 degrees each interval
                    currentWindAngle = (currentWindAngle + 5) % 360;

                    // Only push values that actually vary over time
                    updateSignalKData({
                        'steering.rudderAngle': MathUtils.degToRad(currentRudderAngle),
                        'environment.wind.angleTrueWater': MathUtils.degToRad(currentWindAngle),
                        'environment.wind.angleApparent': MathUtils.degToRad(currentWindAngle),
                    });
                }, SAMPLE_DATA_INTERVAL);
            };
            
            try {
                // Use SignalKService to create client with proper authentication
                const client = signalKService.createClient({
                    deltaStreamBehaviour: 'self',
                    sendMeta: 'all'
                });

            clientRef.current = client; // Store client in ref

            // Connect to the client
            await client.connect();

            // Listen for delta updates from SignalK server
            client.on('delta', (delta) => {
                        if (!isMounted) return;
                        delta.updates.forEach((update) => {
                    if (update.values) {
                        update.values.forEach((value) => {
                    // Update SignalK data state and notify subscribers
                    updateSignalKData({
                        [value.path]: value.value,
                    });
                        });
                    }
                });
            });


                // Set up interval for sample data if debugMode is enabled
                if (debugMode) {
                    setupDebugDataInterval();
                }
            } catch (error) {
                console.error('Failed to connect to SignalK:', error);
                
                // Only enable debug data if debugMode is configured
                if (debugMode) {
                    setupDebugDataInterval();
                }
            }
        };


        // Initialize SignalK client connection
        connectSignalKClient();


            // Cleanup function to disconnect from SignalK and clear interval on unmount
            return () => {
                isMounted = false;
                if (clientRef.current) {
                    clientRef.current.disconnect();
                }
                if (sampleDataIntervalRef.current) {
                    clearInterval(sampleDataIntervalRef.current);
                }
            };
        }, []); // Empty dependency array means this runs once on mount


        // General method to retrieve SignalK values

        return (
            <OcearoContext.Provider
                value={{
                    getSignalKValue,
                    subscribe,
                    unsubscribe,
                    updateSignalKData,
                    getBoatRotationAngle,
                    convertLatLonToXY,
                    theme,
                    setTheme,
                    nightMode,
                    setNightMode,
                    states,
                    toggleState,
                    toggleExclusiveMode,
                }}
            >
                {children}
            </OcearoContext.Provider>
        );
    };

// Hook to access the Ocearo context throughout the application
export const useOcearoContext = () => useContext(OcearoContext);

export { calculateTideHeightUsingTwelfths } from './TideContext';
