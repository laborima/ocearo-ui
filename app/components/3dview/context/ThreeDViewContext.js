import React, { createContext, useState, useEffect, useContext } from 'react';
import Client, { Discovery } from '@signalk/client';


const ThreeDViewContext = createContext();

export const ThreeDViewProvider = ({ children }) => {
    const [nightMode, setNightMode] = useState(false); // Night mode state
    const [states, setStates] = useState({}); // General state object for other toggles (e.g., autopilot, anchorWatch)
    const [signalkData, setSignalKData] = useState({}); // State to hold SignalK data

    let client = null;

    // Create SignalK client (you can modify the hostname/port for production)
    useEffect(() => {
        const connectSignalKClient = async () => {
            try {
                client = new Client({
                    hostname: 'demo.signalk.org', // Use actual SignalK server hostname here
                    port: 443,
                    useTLS: true,
                    reconnect: true,
                    autoConnect: false,
                    notifications: false,
                    deltaStreamBehaviour: 'self',
                    sendMeta: 'all',
                });

                // Connect to the client
                await client.connect();

                // Subscribe to SignalK paths
                client.subscribe([
                    {
                        context: 'vessels.self',
                        subscribe: [
                            { path: 'navigation.position', policy: 'instant' },
                            { path: 'navigation.courseOverGroundTrue', policy: 'instant' },
                            { path: 'environment.wind.speedTrue', policy: 'instant' },
                            { path: 'environment.wind.angleTrueWater', policy: 'instant' },
                            { path: 'environment.depth.belowTransducer', policy: 'instant' },
                        ],
                    },
                ]);

                // Listen for delta updates from SignalK server
                client.on('delta', (delta) => {
                    // Update the state with incoming SignalK delta data
                    delta.updates.forEach((update) => {
                        update.values.forEach((value) => {
                            setSignalKData((prevData) => ({
                                ...prevData,
                                [value.path]: value.value,
                            }));
                        });
                    });
                });
            } catch (error) {
                console.error('Failed to connect to SignalK:', error);
            }
        };

        // Initialize SignalK client connection
        connectSignalKClient();

        // Cleanup function to disconnect from SignalK on unmount
        return () => {
            if (client) {
                client.disconnect();
            }
        };
    }, []); // Run once on mount

    // General method to subscribe to SignalK values
    const getSignalKValue = (path) => {
        return signalkData[path] || null;
    };

    // Method to toggle any state (e.g., autopilot, anchorWatch)
    const toggleState = (key) => {
        setStates((prevState) => ({
            ...prevState,
            [key]: !prevState[key],
        }));
    };

    return (
        <ThreeDViewContext.Provider
            value={{
                nightMode,
                setNightMode,
                getSignalKValue,
                states,
                toggleState,
            }}
        >
            {children}
        </ThreeDViewContext.Provider>
    );
};

// Hook to use ThreeDViewContext
export const useThreeDView = () => useContext(ThreeDViewContext);
