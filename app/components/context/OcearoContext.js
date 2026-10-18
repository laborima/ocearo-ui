import React, { createContext, useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import configService from '../settings/ConfigService';
import { isReplaying } from '../replay/replayEngine';
import signalKService from '../services/SignalKService';
import { updateOcearoCoreMode, isOcearoCoreEnabled, handleOcearoCoreError, getOcearoCoreStatus } from '../utils/OcearoCoreUtils';
import { MathUtils } from 'three';

export {
    radToDeg, toDegrees, degToRad, toKnots, toKelvin,
    convertTemperature, convertWindSpeed, convertSpeed, convertPressure,
    knotsToMs, finite, msToKnots, radiansToDegrees, kelvinToCelsius,
    MS_TO_KNOTS, KNOTS_TO_MPS, EARTH_RADIUS_METERS,
    convertSpeedUnit, getSpeedUnitLabel,
    convertDepthUnit, getDepthUnitLabel,
    convertTemperatureUnit, getTemperatureUnitLabel,
    convertDistanceUnit, getDistanceUnitLabel
} from '../utils/UnitConversions';

import { SAMPLE_DATA, SAMPLE_DATA_INTERVAL } from './SampleData';
import { createStaleTracker, staleTimeoutMs, STALE_CHECK_INTERVAL_MS } from './StaleData';
import { THEMES, applyThemeTokens, normalizeThemeMode, themeForSunElevation } from '../theme/themes';
import { sunPosition } from '../utils/SunUtils';
import { vesselNow } from '../utils/VesselClock';

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
    // ocearo-core says the boat is alongside (startup default): alerts and
    // advice off, but the 3D view stays (the docking assistant is the P button)
    moored: false,
    mob: false,
    // Base of the scene: 'water' (the sea), 'black' (plain grid), 'depth'
    // (3D chart: seabed relief with the chart over it)
    oceanMode: 'black',
    // Layers, on any base: other vessels, polar, laylines, wind, buoys
    ais: false,
    showPolar: true,
    showLaylines3D: false,
    showWind: false,
    showCurrent: false,
    showSeamarks: true,
    racing: false
};

// Display preferences restored across restarts. Transient/safety modes
// (autopilot, anchor watch, parking, MOB, racing) always start from defaults.
const PERSISTED_STATE_KEYS = ['oceanMode', 'ais', 'showPolar', 'showLaylines3D', 'showWind', 'showCurrent', 'showSeamarks'];

// True wind from the apparent wind and the boat's speed and heading, when the
// server publishes none (TRUE_WIND_QUIET_MS without one)
const TRUE_WIND_PATHS = ['environment.wind.speedTrue', 'environment.wind.angleTrueWater', 'environment.wind.directionTrue'];
const TRUE_WIND_INPUTS = ['environment.wind.angleApparent', 'environment.wind.speedApparent', 'navigation.speedThroughWater',
    'navigation.speedOverGround', 'navigation.headingTrue', 'navigation.courseOverGroundTrue'];
const TRUE_WIND_QUIET_MS = 10000;
export const trueWindFromApparent = (data) => {
    const awa = data['environment.wind.angleApparent'];
    const aws = data['environment.wind.speedApparent'];
    if (!Number.isFinite(awa) || !Number.isFinite(aws)) return null;
    // Through the water when the log gives it, else over the ground
    const stw = data['navigation.speedThroughWater'];
    const v = Number.isFinite(stw) ? stw : (data['navigation.speedOverGround'] ?? 0);
    const u = aws * Math.cos(awa) - (Number.isFinite(v) ? v : 0);
    const w = aws * Math.sin(awa);
    const tws = Math.hypot(u, w);
    const twa = tws > 0.05 ? Math.atan2(w, u) : awa;
    const out = { 'environment.wind.speedTrue': tws, 'environment.wind.angleTrueWater': twa };
    const heading = data['navigation.headingTrue'] ?? data['navigation.courseOverGroundTrue'];
    if (Number.isFinite(heading)) out['environment.wind.directionTrue'] = ((heading + twa) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    return out;
};

// The base modes, in the order the button cycles through them
export const OCEAN_MODES = ['water', 'black', 'depth'];

const loadPersistedStates = () => {
    const saved = configService.get('uiStates');
    if (!saved || typeof saved !== 'object') return {};
    const states = PERSISTED_STATE_KEYS.reduce((acc, key) => {
        if (key in saved) acc[key] = saved[key];
        return acc;
    }, {});
    // The flat chart and the meteo map became the 3D chart (+ the wind layer)
    if (states.oceanMode === 'chart') states.oceanMode = 'depth';
    if (states.oceanMode === 'meteo') { states.oceanMode = 'depth'; states.showWind = true; }
    if (!OCEAN_MODES.includes(states.oceanMode)) delete states.oceanMode;
    return states;
};




export const OcearoContextProvider = ({ children }) => {
    // themeMode is the user's choice ('auto' | 'day' | 'dark' | 'night');
    // theme is what is displayed — in auto mode it follows the sun.
    const [themeMode, setThemeModeState] = useState(() => normalizeThemeMode(configService.get('theme')));
    const [autoTheme, setAutoTheme] = useState('dark');
    const theme = themeMode === 'auto' ? autoTheme : themeMode;
    const nightMode = theme === 'night';
    const [states, setStates] = useState(() => ({ ...INITIAL_STATES, ...loadPersistedStates() }));

    // Save display preferences whenever one of them changes
    useEffect(() => {
        configService.set('uiStates', PERSISTED_STATE_KEYS.reduce((acc, key) => {
            acc[key] = states[key];
            return acc;
        }, {}));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, PERSISTED_STATE_KEYS.map((key) => states[key]));
    
    const setTheme = useCallback((mode) => {
        const normalized = normalizeThemeMode(mode);
        configService.set('theme', normalized);
        setThemeModeState(normalized);
    }, []);

    // Push the theme's colour tokens to CSS variables
    useEffect(() => {
        if (typeof document !== 'undefined') {
            applyThemeTokens(THEMES[theme]);
        }
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

    // Prefix subscribers, for paths that embed an id (e.g. notifications.mob.<id>)
    const prefixSubscribersRef = useRef(new Map()); // callback -> prefix

    /**
     * Subscribe to every path starting with `prefix`; the callback receives
     * (path, value). Meant for a handful of listeners, not per-frame data.
     */
    const subscribePrefix = useCallback((prefix, callback) => {
        prefixSubscribersRef.current.set(callback, prefix);
    }, []);

    const unsubscribePrefix = useCallback((callback) => {
        prefixSubscribersRef.current.delete(callback);
    }, []);

    /** Snapshot of all current values whose path starts with `prefix` */
    const getSignalKValuesByPrefix = useCallback((prefix) => {
        const out = {};
        for (const [path, value] of Object.entries(signalkDataRef.current)) {
            if (path.startsWith(prefix)) out[path] = value;
        }
        return out;
    }, []);

    /**
     * Notify subscribers of a data change
     */
    const notifySubscribers = useCallback((path, value) => {
        if (subscribersRef.current[path]) {
            subscribersRef.current[path].forEach(callback => callback(value));
        }
        if (prefixSubscribersRef.current.size > 0) {
            prefixSubscribersRef.current.forEach((prefix, callback) => {
                if (path.startsWith(prefix)) callback(path, value);
            });
        }
    }, []);

    /**
     * Update SignalK data and notify subscribers only when values actually change.
     * This prevents unnecessary re-renders when demo/sample data is re-pushed
     * with identical values.
     */
    // True wind computed here when the boat only publishes the apparent wind
    // (many instruments, and the Signal K demo server): without it the polar,
    // the sail plan and the laylines took 0 kn of wind from dead ahead
    const serverTrueWindAt = useRef(0);
    const updateSignalKData = useCallback((updates) => {
        const current = signalkDataRef.current;
        if (TRUE_WIND_PATHS.some((p) => Number.isFinite(updates[p]))) serverTrueWindAt.current = Date.now();

        // Store the values that changed and tell their subscribers
        const apply = (values) => {
            let changed = false;
            for (const [path, value] of Object.entries(values)) {
                const prev = current[path];
                if (prev === value) continue;
                if (typeof prev === 'object' && typeof value === 'object' &&
                    prev !== null && value !== null &&
                    JSON.stringify(prev) === JSON.stringify(value)) {
                    continue;
                }
                current[path] = value;
                changed = true;
                notifySubscribers(path, value);
            }
            return changed;
        };

        const hasChanges = apply(updates);
        if (hasChanges && Date.now() - serverTrueWindAt.current > TRUE_WIND_QUIET_MS
            && TRUE_WIND_INPUTS.some((p) => p in updates)) {
            const trueWind = trueWindFromApparent(current);
            if (trueWind) apply(trueWind);
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
        const preferred = configService.get('preferredHeadingPath') || 'courseOverGroundTrue';
        const preferredValue = data[`navigation.${preferred}`];
        if (preferredValue != null) return preferredValue;
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
    const convertLatLonToXY = useCallback((position, referencePosition) => {
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
            }, []);


    
   
    const cycleOceanMode = useCallback(() => {
        setStates((prevState) => {
            const currentIndex = OCEAN_MODES.indexOf(prevState.oceanMode);
            const nextIndex = (currentIndex + 1) % OCEAN_MODES.length;
            return { ...prevState, oceanMode: OCEAN_MODES[nextIndex] };
        });
    }, []);

    // Last mode read from ocearo-core, and when the crew last changed it here
    const coreModeRef = useRef(null);
    const localModeChangeRef = useRef(0);

    // Method to toggle any state (e.g., autopilot, anchorWatch)
    const toggleState = useCallback(async (key, value = undefined) => {
        const newValue = value !== undefined ? value : !states[key];
        localModeChangeRef.current = Date.now();

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
                    console.warn('Failed to update OcearoCore mode for anchorWatch:', handleOcearoCoreError(error));
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
                } else if (isOcearoCoreEnabled()) {
                    // Leaving the berth: back to sailing or motoring
                    const data = signalkDataRef.current;
                    const engineState = data['propulsion.main.state'] || data['propulsion.main.revolutions'];
                    await updateOcearoCoreMode((engineState === 'running' || (typeof engineState === 'number' && engineState > 0)) ? 'motoring' : 'sailing');
                }
            } catch (error) {
                if (error.name === 'NetworkError') {
                    console.warn('OcearoCore unreachable for parkingMode update');
                } else {
                    console.warn('Failed to update OcearoCore mode for parkingMode:', handleOcearoCoreError(error));
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
    }, [states]);

    /**
     * Toggles a state exclusively, turning off other exclusive states
     * Exclusive states are: autopilot, anchorWatch, parkingMode
     */
    const toggleExclusiveMode = useCallback(async (key) => {
        const exclusiveKeys = ['autopilot', 'anchorWatch', 'parkingMode'];
        if (!exclusiveKeys.includes(key)) {
            return toggleState(key);
        }

        const newValue = !states[key];
        localModeChangeRef.current = Date.now();
        
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
                    console.warn(`Failed to update OcearoCore mode for ${key}:`, handleOcearoCoreError(error));
                }
            }
        } else if (key !== 'autopilot') {
            // Leaving the anchor watch or the harbour returns to navigation:
            // with every mode off the boat view lost its laylines / AIS
            // buttons until the helm button was pressed again
            setStates((prevState) => ({ ...prevState, autopilot: true }));
            return toggleState(key, false);
        } else if (states.moored && isOcearoCoreEnabled()) {
            // Moored at startup with the navigation view on: pressing it means
            // "we are under way", without waiting for the boat to move
            try {
                const data = signalkDataRef.current;
                const engineState = data['propulsion.main.state'] || data['propulsion.main.revolutions'];
                await updateOcearoCoreMode((engineState === 'running' || (typeof engineState === 'number' && engineState > 0)) ? 'motoring' : 'sailing');
                setStates((prevState) => ({ ...prevState, moored: false }));
            } catch (error) {
                console.warn('Failed to leave moored mode:', handleOcearoCoreError(error));
            }
        }
        // Navigation is the default view: pressing it again keeps it on
    }, [states, toggleState]);

    // ocearo-core owns the mode: it starts moored (anchored if the anchor was
    // down) and switches to sailing or motoring by itself once the boat moves.
    // Follow it, without posting it back, whenever it changes there.
    useEffect(() => {
        if (!isOcearoCoreEnabled()) return undefined;
        let cancelled = false;
        const sync = async () => {
            const status = await getOcearoCoreStatus();
            const mode = status?.mode;
            const source = status?.modeSource;
            const key = `${mode}/${source}`;
            if (cancelled || typeof mode !== 'string' || key === coreModeRef.current) return;
            // A toggle made here is on its way to ocearo-core: let it land
            if (Date.now() - localModeChangeRef.current < 5000) return;
            coreModeRef.current = key;
            // Moored by the crew (P button) shows the docking assistant; moored
            // at startup keeps the 3D view
            const docking = mode === 'moored' && source === 'user';
            setStates((prev) => ({
                ...prev,
                autopilot: mode !== 'anchored' && !docking,
                anchorWatch: mode === 'anchored',
                parkingMode: docking,
                moored: mode === 'moored',
                racing: mode === 'racing',
            }));
        };
        sync();
        const timer = setInterval(sync, 10000);
        return () => { cancelled = true; clearInterval(timer); };
    }, []);

    // Use useRef to persist client between renders
    const clientRef = useRef(null);
    const sampleDataIntervalRef = useRef(null);
    const staleCheckIntervalRef = useRef(null);

    // Initialize SignalK client connection
    useEffect(() => {
        let isMounted = true;

        /**
         * Connects to the SignalK server and sets up data handling
         * Ensures debug data is available even if the connection fails
         */
        const connectSignalKClient = async () => {
         
            const config = configService.getAll(); // Load config from the service
            const { debugMode } = config;
            const signalkUrl = configService.getSignalKUrl();

            // Live sensor values expire when their source stops sending.
            // Sample data has no source to lose: no expiry in debug mode.
            const staleTracker = createStaleTracker(debugMode ? 0 : staleTimeoutMs(config.staleDataTimeout));
            const clearPaths = (paths) => {
                if (paths.length === 0) return;
                updateSignalKData(Object.fromEntries(paths.map((path) => [path, null])));
            };
            
            // Setup debug data interval function - extracted to be reusable
            // Paths the server actually sends: the sample data (demo mode) only
            // fills in the others. Over the demo server it used to rewrite the
            // wind angle every 5 s, spinning the sails and the polar.
            const livePaths = new Set();
            const notLive = (values) => Object.fromEntries(Object.entries(values).filter(([path]) => !livePaths.has(path)));
            const liveWind = () => [...livePaths].some((path) => path.startsWith('environment.wind.'));

            const setupDebugDataInterval = (live = false) => {
                // Clear any existing interval
                if (sampleDataIntervalRef.current) {
                    clearInterval(sampleDataIntervalRef.current);
                }
                if (live) {
                    // Give the server a moment to show what it sends
                    sampleDataIntervalRef.current = setTimeout(() => setupDebugDataInterval(false), 3000);
                    return;
                }

                // Track angles for smooth incremental changes
                let currentWindAngle = 0;
                let currentRudderAngle = 0;
                let rudderDirection = 1;

                // Push initial sample data immediately (only once)
                const initialData = {
                    'steering.rudderAngle': MathUtils.degToRad(currentRudderAngle),
                    ...SAMPLE_DATA.temperature,
                    ...SAMPLE_DATA.environment,
                    ...SAMPLE_DATA.performance,
                    ...SAMPLE_DATA.navigation,
                    ...SAMPLE_DATA.racing,
                    ...SAMPLE_DATA.electrical,
                    ...SAMPLE_DATA.propulsion,
                    ...SAMPLE_DATA.tanks,
                };

                // Only push sample wind data if wind override is not active
                // and the server has no wind of its own
                if (!configService.get('debugWindOverride') && !liveWind()) {
                    Object.assign(initialData, SAMPLE_DATA.wind);
                }

                updateSignalKData(notLive(initialData));

                // Create interval that only updates values that actually change
                sampleDataIntervalRef.current = setInterval(() => {
                    if (isReplaying()) return;
                    // Smooth rudder oscillation instead of random jumps
                    currentRudderAngle += rudderDirection * 2;
                    if (currentRudderAngle >= 15 || currentRudderAngle <= -15) {
                        rudderDirection *= -1;
                    }

                    const updates = {
                        'steering.rudderAngle': MathUtils.degToRad(currentRudderAngle),
                    };

                    // Skip wind angle updates when wind override is active, or
                    // when the server sends its own wind
                    if (!configService.get('debugWindOverride') && !liveWind()) {
                        currentWindAngle = (currentWindAngle + 5) % 360;
                        updates['environment.wind.angleTrueWater'] = MathUtils.degToRad(currentWindAngle);
                        updates['environment.wind.angleApparent'] = MathUtils.degToRad(currentWindAngle);
                    }

                    const fresh = notLive(updates);
                    if (Object.keys(fresh).length) updateSignalKData(fresh);
                }, SAMPLE_DATA_INTERVAL);
            };

            if (!signalkUrl || signalkUrl.trim().length === 0) {
                if (debugMode) {
                    setupDebugDataInterval();
                }
                return;
            }
            
            try {
                // Use SignalKService to create client with proper authentication
                const client = signalKService.createClient({
                    deltaStreamBehaviour: 'self',
                    sendMeta: 'all'
                });

            clientRef.current = client; // Store client in ref

            // Connect to the client
            await client.connect();

            // Wind paths that should be blocked when wind override is active
            const WIND_OVERRIDE_PATHS = [
                'environment.wind.speedTrue',
                'environment.wind.speedApparent',
                'environment.wind.angleTrueWater',
                'environment.wind.angleApparent',
                'environment.wind.directionTrue',
                'environment.wind.speedOverGround',
                'environment.wind.angleTrueGround',
            ];

            // Listen for delta updates from SignalK server
            client.on('delta', (delta) => {
                        if (!isMounted) return;
                        const now = Date.now();
                        delta.updates.forEach((update) => {
                    if (update.values) {
                        update.values.forEach((value) => {
                    // Skip wind paths when wind override is active
                    if (configService.get('debugWindOverride') && WIND_OVERRIDE_PATHS.includes(value.path)) {
                        staleTracker.forget(value.path);
                        return;
                    }
                    // A voyage replay owns the own-boat data meanwhile
                    if (isReplaying()) return;
                    // Old value replayed from the server's model: not live
                    if (!staleTracker.seen(value.path, update.timestamp, now)) return;
                    livePaths.add(value.path);
                    updateSignalKData({
                        [value.path]: value.value,
                    });
                        });
                    }
                });
            });

            // A new connection brings a new clock skew estimate; a lost one
            // leaves nothing live on screen (the server replays its model on reconnect)
            client.on('connect', () => staleTracker.reset());
            const syncServerClock = (info) => staleTracker.syncClock(info?.timestamp, Date.now());
            client.on('connectionInfo', syncServerClock);
            if (client.connection?.connectionInfo) syncServerClock(client.connection.connectionInfo);
            client.on('disconnect', () => {
                if (!isMounted) return;
                staleTracker.reset();
                if (!isReplaying()) clearPaths(staleTracker.clear());
            });

            if (staleTracker.timeoutMs) {
                staleCheckIntervalRef.current = setInterval(() => {
                    const now = Date.now();
                    // A voyage replay owns the own-boat data: pause the expiry
                    if (isReplaying()) {
                        staleTracker.touchAll(now);
                        return;
                    }
                    clearPaths(staleTracker.expire(now));
                }, STALE_CHECK_INTERVAL_MS);
            }


                // Set up interval for sample data if debugMode is enabled
                if (debugMode) {
                    setupDebugDataInterval(true);
                }
            } catch (error) {
                let errorMessage;
                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (error && typeof error === 'object' && 'isTrusted' in error) {
                    errorMessage = 'Network error (Event). Check SignalK URL, server availability, and CORS settings.';
                } else {
                    try {
                        errorMessage = JSON.stringify(error);
                    } catch (stringifyError) {
                        errorMessage = String(error);
                    }
                }
                console.warn(`Failed to connect to SignalK (${signalkUrl}): ${errorMessage}`);
                
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
                if (staleCheckIntervalRef.current) {
                    clearInterval(staleCheckIntervalRef.current);
                }
            };
        }, []); // Empty dependency array means this runs once on mount


        // Automatic theme: follow the sun at the boat's position (GPS time, so a
        // Pi that booted with a stale clock still switches at the right moment)
        useEffect(() => {
            if (themeMode !== 'auto') return undefined;
            const update = () => {
                const position = signalkDataRef.current['navigation.position'];
                const sun = sunPosition(position?.latitude, position?.longitude, vesselNow());
                setAutoTheme(prev => themeForSunElevation(sun?.elevation, prev));
            };
            // First fix may arrive a moment after start-up
            const first = setTimeout(update, 1500);
            const timer = setInterval(update, 60000);
            return () => {
                clearTimeout(first);
                clearInterval(timer);
            };
        }, [themeMode]);

        // Memoized so consumers only re-render when a context value actually changes,
        // not every time the provider's parent re-renders
        const contextValue = useMemo(() => ({
            getSignalKValue,
            subscribe,
            unsubscribe,
            subscribePrefix,
            unsubscribePrefix,
            getSignalKValuesByPrefix,
            updateSignalKData,
            getBoatRotationAngle,
            convertLatLonToXY,
            theme,
            themeMode,
            setTheme,
            tokens: THEMES[theme],
            nightMode,
            states,
            toggleState,
            toggleExclusiveMode,
            cycleOceanMode,
        }), [
            getSignalKValue, subscribe, unsubscribe, subscribePrefix, unsubscribePrefix, getSignalKValuesByPrefix, updateSignalKData, getBoatRotationAngle, convertLatLonToXY, theme, themeMode, setTheme, nightMode, states, toggleState, toggleExclusiveMode, cycleOceanMode,
        ]);

        return (
            <OcearoContext.Provider value={contextValue}>
                {children}
            </OcearoContext.Provider>
        );
    };

// Hook to access the Ocearo context throughout the application
export const useOcearoContext = () => useContext(OcearoContext);

export { calculateTideHeightUsingTwelfths } from './TideContext';
