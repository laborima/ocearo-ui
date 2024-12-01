import { useOcearoContext } from '../../context/OcearoContext';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import Client from '@signalk/client';
import configService from '../../settings/ConfigService';

const AISContext = createContext();

export const useAIS = () => useContext(AISContext);

export const AISProvider = ({ children }) => {
    const [aisData, setAisData] = useState({});
    const [vesselIds, setVesselIds] = useState([]);
    const clientRef = useRef(null);

    useEffect(() => {

        const fetchAISBoatData = (delta) => {
            if (!delta || !delta.updates) return;

            const updatedAisData = {};

            delta.updates.forEach((update) => {
                const mmsi = delta.context;

                if (!mmsi) return;

                const aisTarget = updatedAisData[mmsi] || aisData[mmsi] || {
                    mmsi,
                    name: "unknown",
                    lat: null,
                    lon: null,
                    length: null,
                    width: null,
                    cog: null,
                    sog: null,
                    state: null
                };

                update.values.forEach((data) => {
                    switch (data.path) {
                        case 'name':
                            aisTarget.name = data.value;
                            break;
                        case 'navigation.position':
                            aisTarget.lat = data.value.latitude;
                            aisTarget.lon = data.value.longitude;
                            break;
                        case 'navigation.courseOverGroundTrue':
                            aisTarget.cog = data.value * (180 / Math.PI);
                            break;
                        case 'navigation.speedOverGround':
                            aisTarget.sog = data.value;
                            break;
                        case 'design.length':
                            aisTarget.length = data.value.overall;
                            break;
                        case 'design.beam':
                            aisTarget.width = data.value;
                            break;
                        case 'navigation.state':
                            aisTarget.state = data.value;
                            break;
                        default:
                            break;
                    }
                });

                updatedAisData[mmsi] = aisTarget;

                // If position data exists, add or update vesselIds
                if (aisTarget.lat && aisTarget.lon) {
                    // Exclude the current user's vessel (myUUID)
                    if (!aisTarget.length) {
                        // Generates a random integer between 2 and 30 (inclusive)
                        const randomSize = () => Math.floor(Math.random() * (30 - 2 + 1)) + 2;
                        aisTarget.length = randomSize();
                    }


                    if (mmsi.indexOf("urn:mrn:signalk:uuid")<0) {
                        setVesselIds((prevVesselIds) => {
                            // Check if this MMSI is already in vesselIds
                            if (!prevVesselIds.some(vessel => vessel.mmsi === mmsi)) {
                                console.log("add vessel:" + aisTarget.length + " " + aisTarget, mmsi);
                                return [...prevVesselIds, aisTarget];
                            }
                            return prevVesselIds;
                        });
                    }
                }
            });
            setAisData((prevData) => ({ ...prevData, ...updatedAisData }));
        };

        const connectSignalKClient = async () => {

            const config = configService.getAll(); // Load config from the service
            
            console.debug("Connect to signalk")

            const { signalkUrl } = config;
            try {
                const [hostname, port] = signalkUrl.replace(/https?:\/\//, '').split(':');
                const client = new Client({
                    hostname: hostname || 'localhost',
                    port: parseInt(port) || 3000,
                    useTLS: signalkUrl.startsWith('https'),
                    reconnect: true,
                    autoConnect: false,
                    notifications: false,
                    subscriptions: [
                        {
                            context: "vessels.*",
                            subscribe: [
                                { path: "name" },
                                { path: "navigation.position" },
                                { path: "navigation.speedOverGround" },
                                { path: "navigation.courseOverGroundTrue" },
                                { path: "design.length" },
                                { path: "design.beam" },
                                { path: "navigation.headingTrue" },
                                { path: "design.aisShipType" },
                                { path: "communication" },
                            ],
                        },
                    ],
                });

                clientRef.current = client;
                await client.connect();
                client.on('delta', fetchAISBoatData);
            } catch (error) {
                console.error('Failed to connect to SignalK:', error);
            }
        };

        connectSignalKClient();

        return () => {
            if (clientRef.current) {
                clientRef.current.disconnect();
            }
        };
    }, []);

    return (
        <AISContext.Provider value={{ aisData, vesselIds }}>
            {children}
        </AISContext.Provider>
    );
};            
