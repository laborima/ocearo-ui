import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import Client, { Discovery } from '@signalk/client';
import configService from '../settings/ConfigService'; // Import the ConfigService

const OcearoContext = createContext();

export const OcearoContextProvider = ({ children, sampleData = true }) => {
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

            const { signalkUrl, username, password, debugMode } = config;
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

                /*         const client = new Client({
                             hostname: 'demo.signalk.org', // Use actual SignalK server hostname here
                             port: 443,
                             useTLS: true,
                             reconnect: true,
                             autoConnect: false,
                             notifications: false,
                             deltaStreamBehaviour: 'self',
                             sendMeta: 'all',
                             wsKeepaliveInterval: 10
                         });*/

                clientRef.current = client; // Store client in ref

                // Connect to the client
                await client.connect();

                // Listen for delta updates from SignalK server
                client.on('delta', (delta) => {
                    delta.updates.forEach((update) => {
                        if (update.values) {
                            update.values.forEach((value) => {
                                // Log each update path and value
                                //  console.log(`Update: ${value.path}: ${value.value}`);

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
                if (sampleData) {
                    sampleDataIntervalRef.current = setInterval(() => {
                        // Generate random values for testing
                        const randomAngle = Math.floor(Math.random() * 91) - 45; // Random angle between -45 and 45
                        const randomRoll = Math.floor(Math.random() * 5) - 5;  // Random roll between -10 and 10

                        // Log the random data being set
                        console.log(`Sample Data - Rudder Angle: ${randomAngle}, Roll: ${randomRoll}`);

                        // Update SignalK data with sample values
                        setSignalKData((prevData) => ({
                            ...prevData,
                            'steering.rudderAngle': randomAngle/*,
                            'navigation.attitude.roll': randomRoll*/
                        }));
                    }, 5000); // Update every 5 seconds
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
    }, [sampleData]); // Empty dependency array means this runs once on mount


    // General method to retrieve SignalK values
    const getSignalKValue = (path) => {
        return signalkData[path] || null;
    };



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


export function  toRadians(degrees) {return (degrees * Math.PI) / 180};


export function rotateVector(v) {
    return new Vector3(v.x, 0, -v.y);
}

export function defaultValue(path) {
    switch (path) {
        // *** Données de vent ***
        case 'environment.wind.angleTrueWater':
            return toRadians(25); // Angle du vent réel (TWA)
        case 'environment.wind.speedTrue':
            return 20; // Vitesse du vent réel
        case 'environment.wind.angleApparent':
            return toRadians(23); // Angle du vent apparent
        case 'environment.wind.speedApparent':
            return 25; // Vitesse du vent apparent

        // *** Performances de navigation ***
        case 'performance.beatAngle':
            return toRadians(45); // Angle de près
        case 'performance.gybeAngle':
            return toRadians(135); // Angle d'empannage
        case 'performance.beatAngleVelocityMadeGood':
            return 6; // VMG en près
        case 'performance.gybeAngleVelocityMadeGood':
            return 5; // VMG au portant
        case 'performance.targetAngle':
            return defaultValue('performance.beatAngle'); // Angle cible TWA
        case 'performance.polarSpeed':
            return 8; // Vitesse polaire du bateau
        case 'performance.polarSpeedRatio':
            return 0.95; // Ratio de vitesse polaire
        case 'performance.velocityMadeGood':
            return 5; // VMG actuel
        case 'navigation.speedThroughWater':
            return 7; // Vitesse à travers l'eau
        case 'performance.polarVelocityMadeGood':
            return 6; // VMG polaire
        case 'performance.polarVelocityMadeGoodRatio':
            return 0.9; // Ratio de VMG polaire

        // *** Cap et angle par rapport au waypoint ***
        case 'navigation.headingTrue':
            return toRadians(0); // Cap vrai
        case 'navigation.courseOverGround':
            return toRadians(20); // Cap sur fond
        case 'navigation.courseGreatCircle.nextPoint.bearingTrue':
            return toRadians(30); // Cap vers le prochain waypoint
        case 'performance.laylineAngle':
            return toRadians(10); // Angle de layline

        // *** Layline pour navigation de régate ***
        case 'navigation.racing.layline':
            return toRadians(10); // Layline parallèle au cap actuel
        case 'navigation.racing.layline.distance':
            return 100; // Distance jusqu'à la layline
        case 'navigation.racing.layline.time':
            return 180; // Temps estimé pour atteindre la layline

        // *** Layline opposée pour la navigation de régate ***
        case 'navigation.racing.oppositeLayline':
            return toRadians(45); // Layline parallèle au cap actuel
        case 'navigation.racing.oppositeLayline.distance':
            return 80; // Distance jusqu'à la layline opposée
        case 'navigation.racing.oppositeLayline.time':
            return 180; // Temps estimé pour atteindre la layline

        // *** Données de ligne de départ pour la régate ***
        case 'navigation.racing.startLineStb':
            return { latitude: 0, longitude: 0, altitude: 0 }; // Position de la marque de départ tribord
        case 'navigation.racing.startLinePort':
            return { latitude: 0, longitude: 0, altitude: 0 }; // Position de la marque de départ bâbord
        case 'navigation.racing.distanceStartline':
            return 50; // Distance jusqu'à la ligne de départ
        case 'navigation.racing.timeToStart':
            return 120; // Temps estimé pour atteindre la ligne de départ
        case 'navigation.racing.timePortDown':
            return 60; // Temps estimé en bâbord amure au vent arrière
        case 'navigation.racing.timePortUp':
            return 70; // Temps estimé en bâbord amure au près
        case 'navigation.racing.timeStbdDown':
            return 65; // Temps estimé en tribord amure au vent arrière
        case 'navigation.racing.timeStbdUp':
            return 75; // Temps estimé en tribord amure au près

        default:
            return null; // Valeur par défaut si le chemin n'est pas trouvé
    }
}
