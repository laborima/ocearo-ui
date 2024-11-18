import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import Client, { Discovery } from '@signalk/client';

const OcearoContext = createContext();

export const OcearoContextProvider = ({ children, sampleData = true }) => {
    const [signalkData, setSignalKData] = useState({}); // State to hold SignalK data

    // Use useRef to persist client between renders
    const clientRef = useRef(null);
    const sampleDataIntervalRef = useRef(null);

    useEffect(() => {
        const connectSignalKClient = async () => {
            try {
                const client = new Client({
                    hostname: 'demo.signalk.org', // Use actual SignalK server hostname here
                    port: 443,
                    useTLS: true,
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
    }, []); // Empty dependency array means this runs once on mount


    // General method to retrieve SignalK values
    const getSignalKValue = (path) => {
        return signalkData[path] || null;
    };



    return (
        <OcearoContext.Provider
            value={{
                getSignalKValue
            }}
        >
            {children}
        </OcearoContext.Provider>
    );
};

// Hook to useOcearoContext
export const useOcearoContext = () => useContext(OcearoContext);