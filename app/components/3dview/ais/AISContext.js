import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Client from '@signalk/client';
import configService from '../../settings/ConfigService';
import signalKService from '../../services/SignalKService';
import { useOcearoContext } from '../../context/OcearoContext';
import { useSignalKPath } from '../../hooks/useSignalK';

const AISContext = createContext();

export const useAIS = () => useContext(AISContext);

const setKey = (obj, key, path, source) => {
    const value = path.split('.').reduce((acc, part) => acc?.[part], source);
    if (value !== undefined) obj[key] = value;
};


const getAISBoatRotationAngle = (boatData) => {
    if (!boatData) return 0;
    const heading = boatData.heading || boatData.headingMagnetic;
    const courseOverGroundAngle = boatData.cog || boatData.cogMagnetic;
    return courseOverGroundAngle || heading || 0;
};


const extractVesselRenderProps = (vessel) => ({
    mmsi: vessel.mmsi,
    name: vessel.name,
    latitude: vessel.latitude,
    longitude: vessel.longitude,
    visible: vessel.visible,
    sceneX: vessel.sceneX,
    sceneZ: vessel.sceneZ,
    rotationAngleY: vessel.rotationAngleY,
    length: vessel.length,
    beam: vessel.beam,
    shipType: vessel.shipType,
    distanceMeters: vessel.distanceMeters
});

// Function to compare two lists of visible vessels
const vesselListsAreDifferent = (currentList, newList) => {
    if (currentList.length !== newList.length) return true;

    const currentMMSIs = new Set(currentList.map(v => v.mmsi));
    const newMMSIs = new Set(newList.map(v => v.mmsi));

    // Check if both lists have the same MMSIs
    if (currentMMSIs.size !== newMMSIs.size) return true;

    for (const mmsi of currentMMSIs) {
        if (!newMMSIs.has(mmsi)) return true;
    }

    return false;
};

export const AISProvider = ({ children }) => {
    const [aisData, setAisData] = useState({});
    const [vesselIds, setVesselIds] = useState([]);
    const clientRef = useRef(null);
    const lastUpdateRef = useRef({});
    const pendingVisibilityUpdateRef = useRef(null);

    const { convertLatLonToXY } = useOcearoContext();
    const myPosition = useSignalKPath('navigation.position');

    const updateVesselSpatialPropertiesRef = useRef();
    const scheduleVisibilityUpdateRef = useRef();

    // Helper function to update spatial properties
    const updateVesselSpatialProperties = useCallback((vessel) => {
        if (vessel.latitude && vessel.longitude &&
            myPosition && myPosition.latitude && myPosition.longitude
         && vessel.latitude!=myPosition.latitude && vessel.longitude!=myPosition.longitude
        ) {

            const maxDisplayedDistance = 5000;
            const minDisplayedDistance = 10;
            const scalingFactor = configService.get('aisLengthScalingFactor') || 0.7;

            const { x: targetX, y: targetY } = convertLatLonToXY(
                { lat: vessel.latitude, lon: vessel.longitude },
                { lat: myPosition.latitude, lon: myPosition.longitude }
            );

            vessel.sceneX = targetX * scalingFactor;
            vessel.sceneZ = -targetY * scalingFactor;
            vessel.rotationAngleY = getAISBoatRotationAngle(vessel);
            vessel.distanceMeters = Math.sqrt(targetX ** 2 + targetY ** 2);

            // Update visibility
            const wasVisible = vessel.visible;
            vessel.visible =  vessel.distanceMeters > minDisplayedDistance && vessel.distanceMeters <= maxDisplayedDistance;

            // Return true if visibility changed
            return wasVisible !== vessel.visible;
        }
        return false;
    }, [myPosition, convertLatLonToXY]);

    // Function to update the vesselIds array based on current aisData
    const updateVisibleVessels = useCallback(() => {
        // Cancel any pending update
        if (pendingVisibilityUpdateRef.current) {
            clearTimeout(pendingVisibilityUpdateRef.current);
            pendingVisibilityUpdateRef.current = null;
        }

        const visibleVessels = Object.values(aisData)
            .filter(vessel => vessel.visible);

        // Only update if the list has changed
        if (vesselListsAreDifferent(vesselIds, visibleVessels)) {
            console.log(`Updating visible vessels: ${visibleVessels.length} vessels`);
            setVesselIds(visibleVessels);
        }
    }, [aisData, vesselIds]);

    // Schedule a visible vessel update with debounce
    const scheduleVisibilityUpdate = useCallback(() => {
        if (pendingVisibilityUpdateRef.current) {
            clearTimeout(pendingVisibilityUpdateRef.current);
        }
        pendingVisibilityUpdateRef.current = setTimeout(() => {
            updateVisibleVessels();
            pendingVisibilityUpdateRef.current = null;
        }, 100); // 100ms debounce
    }, [updateVisibleVessels]);

    useEffect(() => {
        updateVesselSpatialPropertiesRef.current = updateVesselSpatialProperties;
        scheduleVisibilityUpdateRef.current = scheduleVisibilityUpdate;
    }, [updateVesselSpatialProperties, scheduleVisibilityUpdate]);

    // Clean up outdated AIS data
    useEffect(() => {
        const cleanupInterval = setInterval(() => {
            const now = Date.now();
            const timeoutThreshold = 10 * 60 * 1000; // 10 minutes

            setAisData(prevData => {
                let hasChanges = false;
                const newData = { ...prevData };

                Object.entries(newData).forEach(([mmsi, vessel]) => {
                    if (now - vessel.lastUpdate > timeoutThreshold) {
                        delete newData[mmsi];
                        hasChanges = true;
                    }
                });

                if (hasChanges) {
                    scheduleVisibilityUpdate();
                    return newData;
                }

                return prevData;
            });
        }, 60000); // Check every minute

        return () => clearInterval(cleanupInterval);
    }, [scheduleVisibilityUpdate]);

    useEffect(() => {
        const fetchStaticVesselInfo = async (client) => {
            console.log("Fetching static vessel info...");
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

                    info.distanceMeters = null;
                    info.sceneX = null;
                    info.sceneZ = null;
                    info.rotationAngleY = null;
                    info.visible = false;

                    return info;
                });

                // Initialize aisData with static vessel info
                const initialAisData = {};
                staticInfo.forEach(vessel => {
                    if (vessel.mmsi && vessel.mmsi!="self" && (vessel.latitude !== null || vessel.longitude !== null)) {
                          updateVesselSpatialPropertiesRef.current(vessel);
                         initialAisData[vessel.mmsi] = vessel;
                        
                    }
                });

                console.log(`Fetched ${staticInfo.length} vessels.`);

                if (Object.keys(initialAisData).length > 0) {
                    console.log(`Initializing AIS data with ${Object.keys(initialAisData).length} vessels`);
                    setAisData(initialAisData);

                    // Update vesselIds array based on initial data
                    const initialVisibleVessels = Object.values(initialAisData)
                        .filter(vessel => vessel.visible);

                    setVesselIds(initialVisibleVessels);
                    console.log(`${initialVisibleVessels.length} vessels initially visible`);
                }
            } catch (error) {
                console.error('Error fetching static info:', error);
            }
        };

        const fetchAISBoatData = (delta) => {
            if (!delta?.updates) {
                console.warn("Missing delta or no updates:", delta);
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
                distanceMeters: null,
                sceneX: null,
                sceneZ: null,
                rotationAngleY: null,
                visible: false,
                length: null,
                beam: null,
                shipType: null
            });

            const mmsi = delta.context.replace("vessels.", "");
            if (!mmsi) {
                console.warn("Update without MMSI context:", delta);
                return;
            }

            // Update the timestamp for this vessel
            lastUpdateRef.current[mmsi] = Date.now();

            // Use functional form to get latest aisData
            setAisData((prevData) => {
                const target = prevData[mmsi] || getDefaultTarget(mmsi);
                target.lastUpdate = lastUpdateRef.current[mmsi];

                let hasPositionUpdate = false;
                let hasOrientationUpdate = false;

                delta.updates.forEach((update) => {
                    if (update.values) {
                        update.values.forEach((data) => {
                        switch (data.path) {
                            case 'name':
                                target.name = data.value;
                                break;
                            case 'navigation.position':
                                target.latitude = data.value.latitude;
                                target.longitude = data.value.longitude;
                                hasPositionUpdate = true;
                                break;
                            case 'navigation.speedOverGround':
                                target.sog = data.value;
                                break;
                            case 'navigation.courseOverGroundTrue':
                                target.cog = data.value;
                                hasOrientationUpdate = true;
                                break;
                            case 'navigation.courseOverGroundMagnetic':
                                target.cogMagnetic = data.value;
                                hasOrientationUpdate = true;
                                break;
                            case 'navigation.headingTrue':
                                target.heading = data.value;
                                hasOrientationUpdate = true;
                                break;
                            case 'navigation.headingMagnetic':
                                target.headingMagnetic = data.value;
                                hasOrientationUpdate = true;
                                break;
                            default:
                                break;
                        }
                    });
                }
            });

                // Check if visibility changed
                const visibilityChanged = updateVesselSpatialPropertiesRef.current(target);

                // Schedule vesselIds update if needed
                if (visibilityChanged || hasPositionUpdate || hasOrientationUpdate) {
                    scheduleVisibilityUpdateRef.current();
                }

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

                console.log(`Connecting to SignalK at: ${signalkUrl}`);

                // Use SignalKService to create client with proper authentication
                const client = signalKService.createClient({
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
            if (pendingVisibilityUpdateRef.current) {
                clearTimeout(pendingVisibilityUpdateRef.current);
            }
            clientRef.current?.disconnect();
        };
    }, []);

    return (
        <AISContext.Provider value={{ aisData, vesselIds }}>
            {children}
        </AISContext.Provider>
    );
};
