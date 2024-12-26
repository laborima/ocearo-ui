import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import Client from '@signalk/client';
import configService from '../settings/ConfigService'; // Import the ConfigService
import { MathUtils } from 'three';

const OcearoContext = createContext();

export const OcearoContextProvider = ({ children }) => {
    const [signalkData, setSignalKData] = useState({}); // State to hold SignalK data
    const [nightMode, setNightMode] = useState(false); // Night mode state
    const [states, setStates] = useState({}); // General state object for other toggles (e.g., autopilot, anchorWatch)

    // Method to toggle any state (e.g., autopilot, anchorWatch)
    const toggleState = (key) => {
        setStates((prevState) => ({
            ...prevState,
            [key]: !prevState[key],
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
                if (debugMode) {
                    sampleDataIntervalRef.current = setInterval(() => {
                        // Generate random values for testing
                        const randomAngle = Math.floor(Math.random() * 91) - 45; // Random angle between -45 and 45
                        const randomRoll = Math.floor(Math.random() * 5) - 5;  // Random roll between -10 and 10

                        // Steering and navigation attitude
                        setSignalKData((prevData) => ({
                            ...prevData,
                            'steering.rudderAngle': randomAngle,
                            'navigation.attitude.roll': randomRoll
                        }));
                    }, 5000); // Update every 5 seconds

                    setSignalKData((prevData) => ({
                        ...prevData,
                        // Sample wind data
                        'environment.wind.angleTrueWater': MathUtils.degToRad(25),
                        'environment.wind.speedTrue': 20,
                        'environment.wind.angleApparent': MathUtils.degToRad(23),
                        'environment.wind.speedApparent': 25,
                        
                        'environment.water.temperature': toKelvin(17),
                        'environment.outside.temperature':toKelvin(21),
                        'propulsion.main.exhaustTemperature':toKelvin(95),
                        'environment.inside.fridge.temperature':toKelvin(4),
                        'environment.outside.pressure':1023000,
                        'environment.inside.humidity': 74,
                        'environment.inside.voc': 0.03,

                        // Sailing performance
                        'performance.beatAngle': MathUtils.degToRad(45),
                        'performance.gybeAngle': MathUtils.degToRad(135),
                        'performance.beatAngleVelocityMadeGood': 6,
                        'performance.gybeAngleVelocityMadeGood': 5,
                        'performance.targetAngle': MathUtils.degToRad(45), // Assuming beatAngle as target
                        'performance.polarSpeed': 8,
                        'performance.polarSpeedRatio': 0.95,
                        'performance.velocityMadeGood': 5,
                        'navigation.speedThroughWater': 7,
                        'performance.polarVelocityMadeGood': 6,
                        'performance.polarVelocityMadeGoodRatio': 0.9,

                        // Navigation heading and waypoints
                        'navigation.headingTrue': MathUtils.degToRad(0),
                        'navigation.courseOverGround': MathUtils.degToRad(20),
                        'navigation.courseGreatCircle.nextPoint.bearingTrue': MathUtils.degToRad(30),
                        'performance.laylineAngle': MathUtils.degToRad(10),

                        // Laylines for racing
                        'navigation.racing.layline': MathUtils.degToRad(10),
                        'navigation.racing.layline.distance': 100,
                        'navigation.racing.layline.time': 180,
                        'navigation.racing.oppositeLayline': MathUtils.degToRad(45),
                        'navigation.racing.oppositeLayline.distance': 80,
                        'navigation.racing.oppositeLayline.time': 180,

                        // Start line data for racing
                        'navigation.racing.startLineStb': { latitude: 0, longitude: 0, altitude: 0 },
                        'navigation.racing.startLinePort': { latitude: 0, longitude: 0, altitude: 0 },
                        'navigation.racing.distanceStartline': 50,
                        'navigation.racing.timeToStart': 120,
                        'navigation.racing.timePortDown': 60,
                        'navigation.racing.timePortUp': 70,
                        'navigation.racing.timeStbdDown': 65,
                        'navigation.racing.timeStbdUp': 75,

                    }));



                }
            } catch (error) {
                console.error('Failed to connect to SignalK:', error);
            }
        };

        // Initialize SignalK client connection
        connectSignalKClient();
        
       

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

    const getSignalKValue =(path) => signalkData[path] || null;

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


export function toKelvin(degrees) { return degrees + 273.15 };


export const convertTemperature = (kelvin) => {
    return kelvin != null ? Math.round((kelvin - 273.15) * 10) / 10 : null;
};

export const convertWindSpeed = (mps) => {
    return mps != null ? Math.round((mps * 1.94384) * 10) / 10 : null;
};

export const convertSpeed = (mps) => {
    return mps != null ? Math.round((mps * 1.94384) * 10) / 10 : null;
};


export const convertPressure = (pa) => {
    return pa != null ? Math.round((pa / 100) * 10) / 10 : null;
};


