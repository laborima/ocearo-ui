import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import Client from '@signalk/client';
import configService from '../../settings/ConfigService';

const AISContext = createContext();

export const useAIS = () => useContext(AISContext);

const setKey = (obj, key, path, source) => {
    const value = path.split('.').reduce((acc, part) => acc?.[part], source);
    if (value !== undefined) obj[key] = value;
};


export const AISProvider = ({ children }) => {
    const [aisData, setAisData] = useState({});
    const [vesselIds, setVesselIds] = useState([]);
    const clientRef = useRef(null);
    const lastUpdateRef = useRef({});



    useEffect(() => {

        const fetchStaticVesselInfo = async (client) => {
            console.log("Fetching static vessel information...");
            try {
                const vessels = await client.API().then(api => api.vessels());

                const staticInfo = Object.entries(vessels).map(([mmsi, data]) => {
                    const info = { mmsi };
                    setKey(info, 'name', 'name', data);
                    setKey(info, 'latitude', 'navigation.position.value.latitude', data);
                    setKey(info, 'longitude', 'navigation.position.value.longitude', data);
                    setKey(info, 'sog', 'navigation.speedOverGround.value', data);
                    setKey(info, 'cog', 'navigation.courseOverGroundTrue.value', data);
                    setKey(info, 'cogMagnetic', 'navigation.courseOverGroundMagnetic.value', data);
                    setKey(info, 'heading', 'navigation.headingTrue.value', data);
                    setKey(info, 'headingMagnetic', 'navigation.headingMagnetic.value', data);
                    setKey(info, 'length', 'design.length.value.overall', data);
                    setKey(info, 'beam', 'design.beam.value', data);
                    setKey(info, 'callsign', 'communication.callsignVhf', data);
                    setKey(info, 'shipType', 'design.aisShipType.value.id', data);
                    info.lastUpdate = Date.now();
                    return info;
                });

                console.log(`Fetched ${staticInfo.length} vessels.`);
                setVesselIds(staticInfo);
                
                // Initialize aisData with the static vessel information
                const initialAisData = {};
                staticInfo.forEach(vessel => {
                    if (vessel.mmsi && (vessel.latitude !== null || vessel.longitude !== null)) {
                        initialAisData[vessel.mmsi] = vessel;
                    }
                });
                
                if (Object.keys(initialAisData).length > 0) {
                    console.log(`Initializing AIS data with ${Object.keys(initialAisData).length} vessels`);
                    setAisData(initialAisData);
                }
            } catch (error) {
                console.error('Error fetching static vessel info:', error);
            }
        };

        const fetchAISBoatData = (delta) => {
            if (!delta?.updates) {
                console.warn("Delta is missing or does not contain updates:", delta);
                return;
            }

            const getDefaultTarget = (mmsi) => ({
                mmsi,
                name: 'unknown',
                latitude: null,
                longitude: null,
                sog: null,
                cog: null,
                cogMagnetic: null,
                heading: null,
                headingMagnetic: null,
            });

            const mmsi = delta.context.replace("vessels.", "");
            if (!mmsi) {
                console.warn("Update missing MMSI context:", delta);
                return;
            }

            // Track the last update time for this vessel
            lastUpdateRef.current[mmsi] = Date.now();
            
            // Use the functional update form to get the latest aisData.
            setAisData((prevData) => {
                // Use the previous state instead of the outer aisData.
                const target = prevData[mmsi] || getDefaultTarget(mmsi);
                target.lastUpdate = lastUpdateRef.current[mmsi];
                
                delta.updates.forEach((update) => {
                    update.values.forEach((data) => {
                        switch (data.path) {
                            case 'name':
                                target.name = data.value;
                                break;
                            case 'navigation.position':
                                target.latitude = data.value.latitude;
                                target.longitude = data.value.longitude;
                                break;
                            case 'navigation.speedOverGround':
                                target.sog = data.value;
                                break;
                            case 'navigation.courseOverGroundTrue':
                                target.cog = data.value;
                                break;
                            case 'navigation.courseOverGroundMagnetic':
                                target.cogMagnetic = data.value;
                                break;
                            case 'navigation.headingTrue':
                                target.heading = data.value;
                                break;
                            case 'navigation.headingMagnetic':
                                target.headingMagnetic = data.value;
                                break;
                            default:
                                break;
                        }
                    });
                });

                return {
                    ...prevData,
                    [mmsi]: target,
                };
            });
        };

        const connectSignalKClient = async () => {
            try {
                const { signalkUrl } = configService.getAll();
                console.log("SignalK URL:", signalkUrl);

                if (!signalkUrl) {
                    throw new Error("SignalK URL is undefined or invalid.");
                }

                const [hostname, port] = signalkUrl.replace(/https?:\/\//, '').split(':');
                console.log(`Connecting to SignalK at hostname: ${hostname}, port: ${port}`);

                const client = new Client({
                    hostname: hostname || 'localhost',
                    port: parseInt(port) || 3000,
                    useTLS: signalkUrl.startsWith('https'),
                    reconnect: true,
                    autoConnect: false,
                    notifications: false,
                    subscriptions: [
                        {
                            context: 'vessels.*',
                            subscribe: [
                                { path: 'navigation.position' },
                                { path: 'navigation.speedOverGround' },
                                { path: 'navigation.courseOverGroundTrue' },
                                { path: 'navigation.courseOverGroundMagnetic' },
                                { path: 'navigation.headingTrue' },
                                { path: 'navigation.headingMagnetic' }
                            ],
                        },
                    ],
                });

                clientRef.current = client;
                await client.connect();
                console.log("SignalK client connected.");

                // Fetch static info and attach listeners
                await fetchStaticVesselInfo(client);
                client.on('delta', fetchAISBoatData);
            } catch (error) {
                console.error('Error connecting to SignalK:', error);
            }
        };


        connectSignalKClient();

        return () => {
            console.log("Disconnecting SignalK client...");
            clientRef.current?.disconnect();
        };
    }, []);

    return (
        <AISContext.Provider value={{ aisData, vesselIds }}>
            {children}
        </AISContext.Provider>
    );
};
