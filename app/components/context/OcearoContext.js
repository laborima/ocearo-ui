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



// Utility functions
export const toKelvin = (degrees) => degrees + 273.15;
export const convertTemperature = (kelvin) => kelvin != null ? Math.round((kelvin - 273.15) * 10) / 10 : null;
export const convertWindSpeed = (mps) => mps != null ? Math.round((mps * 1.94384) * 10) / 10 : null;
export const convertSpeed = convertWindSpeed;
export const convertPressure = (pa) => pa != null ? Math.round((pa / 100) * 10) / 10 : null;

// Constants
const SAMPLE_DATA_INTERVAL = 5000;
const INITIAL_STATES = {
    autopilot: true,
    anchorWatch: false,
    parkingMode: false,
    mob: false,
    showOcean: false,
    ais: false,
};

export const BATTERY_CONFIG = {
  WARNING_THRESHOLD: 50,
  DANGER_THRESHOLD: 20,
  CHARGING_THRESHOLD: 13 // Voltage threshold to determine if battery is charging
};

// Function to estimate SoC based on voltage
export const estimateStateOfCharge = (voltage) => {
  // Example for a 12V lead-acid battery
  if (voltage >= 12.7) return 100;
  if (voltage >= 12.5) return 75;
  if (voltage >= 12.3) return 50;
  if (voltage >= 12.1) return 25;
  return 0;
};


// Separate sample data into its own object for better organization
const SAMPLE_DATA = {
    wind: {
        'environment.wind.angleTrueWater': MathUtils.degToRad(25),
        'environment.wind.speedTrue': 20,
        'environment.wind.angleApparent': MathUtils.degToRad(23),
        'environment.wind.speedApparent': 25,
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
    const [states, setStates] = useState({
        autopilot: true, // Default autopilot to true
        anchorWatch: false,
        parkingMode: false,
        mob: false,
        showOcean: false,
        ais: false,
    });


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


        const connectSignalKClient = async () => {
            const config = configService.getAll(); // Load config from the service

            const { signalkUrl, debugMode } = config;
            try {
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

                // Set up interval for sample data if sampleData is enabled
                if (config.debugMode) {
                    sampleDataIntervalRef.current = setInterval(() => {
                        const randomAngle = Math.floor(Math.random() * 91) - 45;
                        setSignalKData(prev => ({
                            ...prev,
                            'steering.rudderAngle': MathUtils.degToRad(randomAngle),
                            ...SAMPLE_DATA.wind,
                            ...SAMPLE_DATA.temperature,
                            ...SAMPLE_DATA.environment,
                            ...SAMPLE_DATA.performance,
                            ...SAMPLE_DATA.navigation,
                            ...SAMPLE_DATA.racing,
                        }));
                    }, SAMPLE_DATA_INTERVAL);
                }
            } catch (error) {
                console.error('Failed to connect to SignalK:', error);
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
            if (clientRef.current) {
                clientRef.current.disconnect();
            }
            if (sampleDataIntervalRef.current) {
                clearInterval(sampleDataIntervalRef.current);
            }
        };
    }, []); // Empty dependency array means this runs once on mount


    // General method to retrieve SignalK values

    const getSignalKValue = (path) => signalkData[path] || null;

    return (
        <OcearoContext.Provider
            value={{
                getSignalKValue,
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

// Hook to useOcearoContext
export const useOcearoContext = () => useContext(OcearoContext);


export const calculateTideHeightUsingTwelfths = function(highTideHeight, lowTideHeight, currentTime, highTideTime, lowTideTime) {
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
        endMinutes = lowTideMinutes + (lowTideMinutes < highTideMinutes ? 1440 : 0); // Handle midnight overlap
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
}

