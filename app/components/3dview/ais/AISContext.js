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
        const setKey = (obj, key, path, source) => {
            const value = path.split('.').reduce((acc, part) => acc?.[part], source);
            if (value !== undefined) obj[key] = value;
        };

        const fetchStaticVesselInfo = async (client) => {
            console.log("Fetching static vessel information...");
            try {
                const vessels = await client.API().then(api => api.vessels());

                const staticInfo = Object.entries(vessels).map(([mmsi, data]) => {
                    const info = { mmsi };
                    setKey(info, 'name', 'name', data);
                    setKey(info, 'latitude', 'navigation.position.value.latitude', data);
                    setKey(info, 'longitude', 'navigation.position.value.longitude', data);
                    setKey(info, 'longitude', 'navigation.position.value.longitude', data);
                    setKey(info, 'cog', 'navigation.courseOverGroundTrue.value', data);
                    setKey(info, 'heading', 'navigation.headingTrue.value', data);
                    setKey(info, 'length', 'design.length.value.overall', data);
                    setKey(info, 'beam', 'design.beam.value', data);
                    setKey(info, 'callsign', 'communication.callsignVhf', data);
                    setKey(info, 'shipType', 'design.aisShipType.value.id', data);
                    return info;
                });

                console.log(`Fetched ${staticInfo.length} vessels.`);
                setVesselIds(staticInfo);
            } catch (error) {
                console.error('Error fetching static vessel info:', error);
            }
        };

        const fetchAISBoatData = (delta) => {
            if (!delta || !delta.updates) {
                console.warn("Delta is missing or does not contain updates:", delta);
                return;
            }

            const getDefaultTarget = (mmsi) => ({
                mmsi,
                name: 'unknown',
                latitude: null,
                longitude: null,
                sog: null, // Speed Over Ground
                cog: null, // Course Over Ground
                heading: null,
            });

            const mmsi = delta.context.replace("vessels.", "");
            if (!mmsi) {
                console.warn("Update missing MMSI context:", delta);
                return;
            }

            const target = aisData[mmsi] || getDefaultTarget(mmsi);

            delta.updates.forEach((update) => {


                update.values.forEach((data) => {
                    //console.log(`Updating AIS data for MMSI: ${mmsi} ${data.path} ${data.value}`);
                    switch (data.path) {
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
                        case 'navigation.headingTrue':
                            target.heading = data.value;
                            break;
                        default:
                            break;
                    }
                });

            });

            // Update SignalK data state
            setAisData((prevData) => ({
                ...prevData,
                [mmsi]: target,
            }));

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
                                { path: 'navigation.headingTrue' },
                                { path: 'navigation.headingTrue', policy: 'fixed' }
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
