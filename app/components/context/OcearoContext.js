import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import Client, { Discovery } from '@signalk/client';

const OcearoContext = createContext();

export const OcearoContextProvider = ({ children }) => {
    const [signalkData, setSignalKData] = useState({}); // State to hold SignalK data

    // Use useRef to persist client between renders
    const clientRef = useRef(null);

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
                    // Either "self", "all", "none", or null (see below)
                    // - null: no behaviour is set for the delta stream, default behaviour is used. Use this option when connecting to older devices that don't support the subscription modifiers per query request. See https://signalk.org/specification/1.4.0/doc/subscription_protocol.html.
                    // - "self" provides a stream of all local data of own vessel
                    // - "all" provides a stream of all data for all vessels
                    // - "none" provides no data over the stream
                    deltaStreamBehaviour: 'self',
                    // Either "all" or null.
                    // - null: provides no Meta data over the stream
                    // - "all" include Meta data of all data for all vessels
                    sendMeta: 'all',
                    // Sends an empty message to the websocket every 10 seconds when the client does not receive any more update from the server to detect if the socket is dead.
                    wsKeepaliveInterval: 10
                });

                clientRef.current = client; // Store client in ref

                // Connect to the client
                await client.connect();
                /*
                                // Subscribe to SignalK paths
                                client.subscribe([
                                    {
                                        context: 'vessels.self',
                                        subscribe: [
                                            { path: 'navigation.position', policy: 'instant' },
                                            { path: 'navigation.courseOverGroundTrue', policy: 'instant' },
                                            { path: 'environment.wind.speedTrue', policy: 'instant' },
                                            { path: 'environment.wind.angleTrueWater', policy: 'instant' },
                                            { path: 'navigation.speedOverGround', policy: 'instant' },
                                            { path: 'performance.velocityMadeGood', policy: 'instant' },
                                            { path: 'navigation.speedThroughWater', policy: 'instant' }
                                        ],
                                    },
                                ]);
                */
                // Listen for delta updates from SignalK server
                client.on('delta', (delta) => {
                  
                        delta.updates.forEach((update) => {
                            if(update.values){
                            update.values.forEach((value) => {
                                console.log("Update : "+value.path+":"+value.value);
                                setSignalKData((prevData) => ({
                                    ...prevData,
                                    [value.path]: value.value,
                                }));
                                
                            });
}
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
            if (clientRef.current) {
                clientRef.current.disconnect();
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