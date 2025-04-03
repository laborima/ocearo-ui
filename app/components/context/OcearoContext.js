import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import Client from '@signalk/client';
import configService from '../settings/ConfigService'; // Import the ConfigService
import { MathUtils } from 'three';

const OcearoContext = createContext();


export const oBlue = '#09bfff';
export const oRed = '#cc000c';
export const oYellow = '#ffbe00';
export const oGreen = '#0fcd4f';
export const oNight = '#ef4444';

/**
 * Convert radians to degrees
 * @param {number} rad - Angle in radians
 * @returns {number} - Angle in degrees
 */
export const radToDeg = (rad) => rad === null || rad === undefined ? null : rad * (180 / Math.PI);

/**
 * Convert radians to degrees and format as rounded integer with normalization to 0-360 range
 * @param {number} rad - Angle in radians
 * @returns {number} - Angle in degrees (0-360)
 */
export const toDegrees = (rad) => {
  if (rad === null || rad === undefined) return null;
  return Math.round((rad * 180 / Math.PI + 360) % 360);
};

/**
 * Convert degrees to radians
 * @param {number} deg - Angle in degrees
 * @returns {number} - Angle in radians
 */
export const degToRad = (deg) => deg === null || deg === undefined ? null : deg * (Math.PI / 180);

/**
 * Convert meters per second to knots
 * @param {number} mps - Speed in meters per second
 * @returns {string} - Speed in knots, formatted to 1 decimal place
 */
export const toKnots = (mps) => {
  if (mps === null || mps === undefined) return null;
  return (mps * MS_TO_KNOTS).toFixed(1);
};

/**
 * Constants for maritime navigation and coordinate conversion
 */

/**
 * Conversion factor from m/s to knots (1 m/s = 1.94384 knots)
 * @constant {number}
 */
export const MS_TO_KNOTS = 1.94384;
export const EARTH_RADIUS_METERS = 6371000;
export const KNOTS_TO_MPS = 0.51444; // Convert knots to meters per second



// Utility functions
export const toKelvin = (degrees) => degrees + 273.15;
export const convertTemperature = (kelvin) => kelvin != null ? Math.round((kelvin - 273.15) * 10) / 10 : null;
export const convertWindSpeed = (mps) => mps != null ? Math.round((mps * 1.94384) * 10) / 10 : null;
export const convertSpeed = convertWindSpeed;
export const convertPressure = (pa) => pa != null ? Math.round((pa / 100) * 10) / 10 : null;

// Constants
const SAMPLE_DATA_INTERVAL = 1000;
const INITIAL_STATES = {
    autopilot: true,
    anchorWatch: false,
    parkingMode: false,
    mob: false,
    showOcean: false,
    ais: false,
    showPolar: true
};

// Separate sample data into its own object for better organization
const SAMPLE_DATA = {
    wind: {
        'environment.wind.angleTrueWater': MathUtils.degToRad(0),
        'environment.wind.speedTrue': 10.288,
        'environment.wind.angleApparent': MathUtils.degToRad(0),
        'environment.wind.speedApparent': 10.288,
    },
    temperature: {
        'environment.water.temperature': toKelvin(17),
        'environment.outside.temperature': toKelvin(21),
        'propulsion.main.exhaustTemperature': toKelvin(95),
        'environment.inside.fridge.temperature': toKelvin(4),
    },
    environment: {
        'environment.outside.pressure': 102300,
        'environment.inside.relativeHumidity': 0.74,
        'environment.inside.voc': 0.03,
    },
    performance: {
        'performance.beatAngle': MathUtils.degToRad(45),
        'performance.gybeAngle': MathUtils.degToRad(135),
        'performance.beatAngleVelocityMadeGood': 6,
        'performance.gybeAngleVelocityMadeGood': 5,
        'performance.targetAngle': MathUtils.degToRad(45),
        'performance.polarSpeed': 8,
        'performance.polarSpeedRatio': 0.95,
        'performance.velocityMadeGood': 5,
        'performance.polarVelocityMadeGood': 6,
        'performance.polarVelocityMadeGoodRatio': 0.9,
    },
    navigation: {
        'navigation.speedThroughWater': 7,
        'navigation.headingTrue': MathUtils.degToRad(0),
        'navigation.courseOverGround': MathUtils.degToRad(20),
        'navigation.courseGreatCircle.nextPoint.bearingTrue': MathUtils.degToRad(30),
        'navigation.attitude.roll': MathUtils.degToRad(5),
    },
    racing: {
        'navigation.racing.layline': MathUtils.degToRad(10),
        'navigation.racing.layline.distance': 100,
        'navigation.racing.layline.time': 180,
        'navigation.racing.oppositeLayline': MathUtils.degToRad(45),
        'navigation.racing.oppositeLayline.distance': 80,
        'navigation.racing.oppositeLayline.time': 180,
        'navigation.racing.startLineStb': { latitude: 0, longitude: 0, altitude: 0 },
        'navigation.racing.startLinePort': { latitude: 0, longitude: 0, altitude: 0 },
        'navigation.racing.distanceStartline': 50,
        'navigation.racing.timeToStart': 120,
        'navigation.racing.timePortDown': 60,
        'navigation.racing.timePortUp': 70,
        'navigation.racing.timeStbdDown': 65,
        'navigation.racing.timeStbdUp': 75,
    },
};



export const OcearoContextProvider = ({ children }) => {
    const [signalkData, setSignalKData] = useState({}); // State to hold SignalK data
    const [nightMode, setNightMode] = useState(false); // Night mode state
    const [states, setStates] = useState(INITIAL_STATES);
    
    /**
     * Get the value of a SignalK data path
     * @param {string} path - The SignalK data path
     * @returns {*} - The value at the specified path, or null if not found
     */
    const getSignalKValue = (path) => {
        return signalkData[path] || null;
    };
    
    /**
     * Get the user's boat rotation angle in degrees
     * First tries to use course over ground, then falls back to heading
     * @returns {number} - Rotation angle in radian
     */
    const getBoatRotationAngle = () => {
        // Get heading and COG in radians
       // Get heading data from SignalK values
        const heading = getSignalKValue('navigation.headingTrue') || getSignalKValue('navigation.headingMagnetic');
        const courseOverGroundAngle = getSignalKValue('navigation.courseOverGroundTrue')
        || getSignalKValue('navigation.courseOverGroundMagnetic');

        // Use course over ground if available, otherwise use heading
        return courseOverGroundAngle || heading || 0;
    };
    
    /**
     * Get the rotation angle for a boat based on its AIS data
     * First tries to use COG, then falls back to heading
     * @param {Object} boatData - The boat's AIS data
     * @returns {number} - Rotation angle in radian
     */
    const getAISBoatRotationAngle = (boatData) => {
        if (!boatData) return 0;
        
        // Use course over ground if available, otherwise use heading
        return boatData.cog !== null && boatData.cog !== undefined ? boatData.cog : 
               boatData.cogMagnetic !== null && boatData.cogMagnetic !== undefined ? boatData.cogMagnetic : 
               boatData.heading !== null && boatData.heading !== undefined ? boatData.heading : 
               boatData.headingMagnetic !== null && boatData.headingMagnetic !== undefined ? boatData.headingMagnetic : 
               0; // Default to 0 if no heading data
    };
    
    /**
     * Convert latitude/longitude coordinates to X/Y coordinates relative to a reference position
     * @param {Object} position - Position with lat and lon properties
     * @param {Object} referencePosition - Reference position with lat and lon properties
     * @returns {Object} - {x, y} coordinates in meters (maritime coordinate system)
     */
    const convertLatLonToXY = (position, referencePosition) => {
        if (!position || !referencePosition) return { x: 0, y: 0 };
        
        // Convert latitude and longitude from degrees to radians
        const lat1 = referencePosition.lat * Math.PI / 180;
        const lon1 = referencePosition.lon * Math.PI / 180;
        const lat2 = position.lat * Math.PI / 180;
        const lon2 = position.lon * Math.PI / 180;
        
        // Calculate differences
        const dLon = lon2 - lon1;
        
        // Calculate bearing in radians
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - 
                  Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        const bearing = Math.atan2(y, x);
        
        // Calculate distance using Haversine formula
        const a = Math.sin((lat2 - lat1) / 2) * Math.sin((lat2 - lat1) / 2) +
                  Math.cos(lat1) * Math.cos(lat2) * 
                  Math.sin((lon2 - lon1) / 2) * Math.sin((lon2 - lon1) / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = EARTH_RADIUS_METERS * c;
        
        // Convert polar (distance, bearing) to cartesian (x, y)
        // Maritime convention: positive X is to starboard (right), positive Y is forward
        const eastWest = distance * Math.sin(bearing);  // X axis
        const northSouth = -distance * Math.cos(bearing); // Y axis
        
        return { x: eastWest, y: northSouth };
    };


    // Method to toggle any state (e.g., autopilot, anchorWatch)
    const toggleState = (key, value = undefined) => {
        setStates((prevState) => ({
            ...prevState,
            [key]: value !== undefined ? value : !prevState[key], // Set explicitly or toggle
        }));
    };

    // Use useRef to persist client between renders
    const clientRef = useRef(null);
    const sampleDataIntervalRef = useRef(null);

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
                
                // Track the wind angle for incremental changes
                let currentWindAngle = 0;
                
                // Create new interval for sample data
                sampleDataIntervalRef.current = setInterval(() => {
                    const randomAngle = Math.floor(Math.random() * 91) - 45;
                    
                    // Increment the wind angle by 5 degrees each interval
                    currentWindAngle = (currentWindAngle + 5) % 360;
                    
                    setSignalKData(prev => ({
                        ...prev,
                        'steering.rudderAngle': MathUtils.degToRad(randomAngle),
                        // Override the apparent wind angle with our incrementing value
                        'environment.wind.angleApparent': MathUtils.degToRad(currentWindAngle),
                        // Keep other wind data from sample data
                        'environment.wind.angleTrueWater': SAMPLE_DATA.wind['environment.wind.angleTrueWater'],
                        'environment.wind.speedTrue': SAMPLE_DATA.wind['environment.wind.speedTrue'],
                        'environment.wind.speedApparent': SAMPLE_DATA.wind['environment.wind.speedApparent'],
                        ...SAMPLE_DATA.temperature,
                        ...SAMPLE_DATA.environment,
                        ...SAMPLE_DATA.performance,
                        ...SAMPLE_DATA.navigation,
                        ...SAMPLE_DATA.racing,
                    }));
                }, SAMPLE_DATA_INTERVAL);
            };
            
            try {
                // Only attempt to connect if not in debug mode
                if (!debugMode) {
                    const [hostname, port] = signalkUrl.replace(/https?:\/\//, '').split(':');
                    const client = new Client({
                        hostname: hostname || 'localhost',
                        port: parseInt(port) || 3000,
                        useTLS: signalkUrl.startsWith('https'),
                        reconnect: true,
                        autoConnect: false,
                        notifications: false,
                        deltaStreamBehaviour: 'self',
                        sendMeta: 'all',
                        wsKeepaliveInterval: 10
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
                                    // Update SignalK data state
                                    setSignalKData((prevData) => ({
                                        ...prevData,
                                        [value.path]: value.value,
                                    }));
                                });
                            }
                        });
                    });
                }
                
                // Set up interval for sample data if debugMode is enabled
                if (debugMode) {
                    setupDebugDataInterval();
                }
            } catch (error) {
                console.error('Failed to connect to SignalK:', error);
                
                // If connection fails, enable debug data regardless of config setting
                // This ensures the app has data to display even without a server connection
                setupDebugDataInterval();
            }
        };

        const fetchTideData = async () => {
            const date = new Date();
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const filePath = `tides/larochelle/${month}_${year}.json`;

            const response = await fetch(filePath);
            if (response.ok) {
                const tideData = await response.json();

                const today = date.toISOString().split('T')[0];
                if (tideData[today]) {
                    let closestHighTide = null;
                    let closestLowTide = null;
                    const now = new Date();
                    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

                    tideData[today].forEach(([type, time, height, coef]) => {
                        const [hours, minutes] = time.split(':').map(Number);
                        const tideTimeInMinutes = hours * 60 + minutes;

                        if (type === 'tide.high' && (!closestHighTide || Math.abs(currentTimeInMinutes - tideTimeInMinutes) < Math.abs(currentTimeInMinutes - closestHighTide.timeInMinutes))) {
                            closestHighTide = { height: parseFloat(height), time, timeInMinutes: tideTimeInMinutes, coef };
                        } else if (type === 'tide.low' && (!closestLowTide || Math.abs(currentTimeInMinutes - tideTimeInMinutes) < Math.abs(currentTimeInMinutes - closestLowTide.timeInMinutes))) {
                            closestLowTide = { height: parseFloat(height), time, timeInMinutes: tideTimeInMinutes };
                        }
                    });

                    if (closestHighTide && closestLowTide) {
                        const nowTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                        const currentTideHeight = calculateTideHeightUsingTwelfths(
                            closestHighTide.height,
                            closestLowTide.height,
                            nowTime,
                            closestHighTide.time,
                            closestLowTide.time
                        );

                        setSignalKData((prevData) => ({
                            ...prevData,
                            'environment.tide.heightNow': currentTideHeight,
                            'environment.tide.heightHigh': closestHighTide.height,
                            'environment.tide.heightLow': closestLowTide.height,
                            'environment.tide.timeLow': closestLowTide.time,
                            'environment.tide.timeHigh': closestHighTide.time,
                            'environment.tide.coeffNow': closestHighTide.coef
                        }));

                    } else {
                        throw new Error("Tide data for today is incomplete.");
                    }
                }
            } else {
                console.warn("No tide data found");
            }

        };



        // Initialize SignalK client connection
        connectSignalKClient();

        fetchTideData();


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
                getBoatRotationAngle,
                getAISBoatRotationAngle,
                convertLatLonToXY,
                nightMode,
                setNightMode,
                states,
                toggleState,
            }}
        >
            {children}
        </OcearoContext.Provider>
    );
};

// Hook to access the Ocearo context throughout the application
export const useOcearoContext = () => useContext(OcearoContext);


/**
 * Calculates the tide height at a specific time using the Rule of Twelfths.
 * 
 * The Rule of Twelfths is a simple method used by sailors to estimate the height of the tide at a given time,
 * based on the principle that the tide rises and falls in a sinusoidal pattern. The rule divides the tidal range
 * into 12 equal parts and distributes them over a 6-hour cycle as follows:
 * 
 * Hour 1: 1/12 of the range
 * Hour 2: 2/12 of the range
 * Hour 3: 3/12 of the range
 * Hour 4: 3/12 of the range
 * Hour 5: 2/12 of the range
 * Hour 6: 1/12 of the range
 * 
 * @param {number} highTideHeight - The water height at high tide in meters
 * @param {number} lowTideHeight - The water height at low tide in meters
 * @param {string} currentTime - The current time in 24-hour format (HH:MM)
 * @param {string} highTideTime - The time of high tide in 24-hour format (HH:MM)
 * @param {string} lowTideTime - The time of low tide in 24-hour format (HH:MM)
 * @returns {number} The estimated tide height at the current time in meters
 */
export const calculateTideHeightUsingTwelfths = function(highTideHeight, lowTideHeight, currentTime, highTideTime, lowTideTime) {
    // Validate input time strings
    if (!currentTime || !highTideTime || !lowTideTime || 
        !/^\d{1,2}:\d{2}$/.test(currentTime) || 
        !/^\d{1,2}:\d{2}$/.test(highTideTime) || 
        !/^\d{1,2}:\d{2}$/.test(lowTideTime)) {
        console.error('Invalid time format provided to calculateTideHeightUsingTwelfths');
        return (highTideHeight + lowTideHeight) / 2; // Return average as fallback
    }
    
    /**
     * Converts a time string (HH:MM) to total minutes since midnight
     * @param {string} timeString - Time in format HH:MM
     * @returns {number} Total minutes since midnight
     */
    const convertTimeToMinutes = (timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };

    // Convert all times to minutes for easier calculation
    const highTideMinutes = convertTimeToMinutes(highTideTime);
    const lowTideMinutes = convertTimeToMinutes(lowTideTime);
    const currentMinutes = convertTimeToMinutes(currentTime);

    // Determine if tide is rising or falling and set calculation parameters
    let isRising = false;
    let startHeight, endHeight, startMinutes, endMinutes;

    if (lowTideMinutes <= currentMinutes && currentMinutes <= highTideMinutes) {
        // We are in a rising tide cycle (low to high)
        isRising = true;
        startHeight = lowTideHeight;
        endHeight = highTideHeight;
        startMinutes = lowTideMinutes;
        endMinutes = highTideMinutes;
    } else {
        // We are in a falling tide cycle (high to low)
        startHeight = highTideHeight;
        endHeight = lowTideHeight;
        startMinutes = highTideMinutes;
        // Handle case where low tide is on the next day (midnight overlap)
        endMinutes = lowTideMinutes + (lowTideMinutes < highTideMinutes ? 1440 : 0); 
    }

    // Calculate total duration of this tide cycle and the total height change
    const tideCycleDuration = Math.abs(endMinutes - startMinutes);
    const tideChange = Math.abs(endHeight - startHeight);
    
    // Calculate elapsed time since start of cycle, handling day wraparound
    let elapsedTime = currentMinutes - startMinutes;
    if (elapsedTime < 0) elapsedTime += 1440; // Add minutes in a day (24*60) if negative

    // Calculate one twelfth of the total tide change
    const twelfth = tideChange / 12;
    let heightChange = 0;

    // Apply the Rule of Twelfths based on elapsed time
    // First hour: 1/12 of the range
    if (elapsedTime <= tideCycleDuration / 6) {
        heightChange = twelfth * Math.ceil(elapsedTime / (tideCycleDuration / 12));
    } 
    // Second hour: 2/12 of the range (total 3/12)
    else if (elapsedTime <= 2 * tideCycleDuration / 6) {
        heightChange = twelfth * 2 + twelfth * Math.ceil((elapsedTime - tideCycleDuration / 6) / (tideCycleDuration / 12));
    } 
    // Third hour: 3/12 of the range (total 6/12)
    else if (elapsedTime <= 3 * tideCycleDuration / 6) {
        heightChange = twelfth * 5;
    } 
    // Fourth hour: 3/12 of the range (total 9/12)
    else if (elapsedTime <= 4 * tideCycleDuration / 6) {
        heightChange = twelfth * 8;
    } 
    // Fifth hour: 2/12 of the range (total 11/12)
    else if (elapsedTime <= 5 * tideCycleDuration / 6) {
        heightChange = twelfth * 10;
    } 
    // Sixth hour: 1/12 of the range (total 12/12)
    else {
        heightChange = tideChange;
    }

    // Return the final calculated height based on whether tide is rising or falling
    return isRising ? startHeight + heightChange : startHeight - heightChange;
}

