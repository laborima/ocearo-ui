import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

import { useOcearoContext } from '../../context/OcearoContext';
import { useAIS } from './AISContext';
import AISBoat from './AISBoat';
import { Color } from 'three';

const AISView = () => {
    const { aisData, vesselIds } = useAIS();
    const boatRefs = useRef({});
    const aisInitRef = useRef(false); // Changed to boolean for clarity

    const { getSignalKValue } = useOcearoContext();

    // Helper function to find a mesh with material
    const findMaterial = (obj) => {
        if (obj.material) {
            return obj;
        }
        for (let child of obj.children) {
            let result = findMaterial(child);
            if (result) return result;
        }
        return null;
    };
    
    const lengthScalingFactor = 0.1;

    // Utility function to calculate relative X, Y coordinates
    const relativeLatLonToXY = (lat, lon, homeLat, homeLon) => {
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat - homeLat) * (Math.PI / 180);
        const dLon = (lon - homeLon) * (Math.PI / 180);
        const x = R * dLon * Math.cos(homeLat * Math.PI / 180);
        const y = R * dLat;
        return { x, y };
    };

    // Utility function to calculate the great-circle distance
    const relativeDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Earth's radius in meters
        const rad = Math.PI / 180;
        const lat1Rad = lat1 * rad;
        const lat2Rad = lat2 * rad;
        const deltaLat = (lat2 - lat1) * rad;
        const deltaLon = (lon2 - lon1) * rad;

        const a = Math.sin(deltaLat / 2) ** 2 +
                  Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                  Math.sin(deltaLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    // Normalize angle difference to [-π, π]
    const relativeAngle = (angle1, angle2) => {
        const delta = angle2 - angle1;
        return ((delta + Math.PI) % (2 * Math.PI)) - Math.PI;
    };

    // Update boat's color based on distance
    const updateColor = (mesh, targetColor) => {
        if (!mesh || !mesh.material || !mesh.material.color) {
            console.warn("Mesh or material is missing. Unable to update color.");
            return;
        }

        const currentColor = mesh.material.color.getHexString();
        const newColor = new Color(targetColor).getHexString();
        if (currentColor !== newColor) {
            mesh.material.color.set(targetColor);
        }
    };

    // Predict boat's position based on SOG/COG
    const predictPosition = (boatData, elapsedTime) => {
        if (boatData.sog !== undefined && boatData.cog !== undefined) {
            const speed = boatData.sog * 0.51444; // Convert knots to m/s
            const deltaX = speed * elapsedTime * Math.sin(boatData.cog);
            const deltaY = speed * elapsedTime * Math.cos(boatData.cog);
            return { deltaX, deltaY };
        }
        return { deltaX: 0, deltaY: 0 };
    };

    // Update boat's position smoothly
    const updatePosition = (boat, targetX, targetY, interpolate = true) => {
        if (interpolate) {
            boat.position.x += (-targetX * lengthScalingFactor - boat.position.x) * 0.1;
            boat.position.z += (targetY * lengthScalingFactor - boat.position.z) * 0.1;
        } else {
            boat.position.set(-targetX * lengthScalingFactor, 0, targetY * lengthScalingFactor);
        }
    };

    // Update boat's rotation smoothly
    const updateRotation = (boat, currentAngle, targetAngle, interpolate = true) => {
        const angleDiff = relativeAngle(currentAngle, targetAngle);
        if (interpolate) {
            boat.children[0].rotation.y += (angleDiff - boat.children[0].rotation.y) * 0.1;
        } else {
            boat.children[0].rotation.y = targetAngle;
        }
    };

    // Main rendering logic
    useFrame(() => {
        const myPosition = getSignalKValue('navigation.position');
        const courseOverGroundAngle = getSignalKValue('navigation.courseOverGroundTrue');
        const mySpeed = getSignalKValue('navigation.speedOverGround'); // Speed in m/s

        if (!myPosition || !myPosition.latitude || !myPosition.longitude) return;
        if (Object.keys(boatRefs.current).length === 0) return;

        const currentTime = performance.now(); // Current time in ms
        let currentData = aisData;
        const isFirstFrame = !aisInitRef.current && vesselIds && Object.keys(vesselIds).length > 0;

        if (isFirstFrame) {
            aisInitRef.current = true;
            currentData = vesselIds; // Use vesselIds for the first frame
        }

        Object.entries(currentData).forEach(([_, boatData]) => {
            if (boatData.latitude && boatData.longitude && boatRefs.current[boatData.mmsi]) {
                const boat = boatRefs.current[boatData.mmsi];
                const lastUpdate = boatData.lastUpdate || currentTime;

                const { x: targetX, y: targetY } = relativeLatLonToXY(
                    boatData.latitude,
                    boatData.longitude,
                    myPosition.latitude,
                    myPosition.longitude
                );

                const distance = relativeDistance(
                    boatData.latitude,
                    boatData.longitude,
                    myPosition.latitude,
                    myPosition.longitude
                );

                if (distance > 0 && distance <= 3000) {
                    boat.visible = true;

                    // Predict position if AIS data is stale
                    let deltaX = 0, deltaY = 0;
                    if (!isFirstFrame && mySpeed !== undefined && mySpeed > 0 && currentTime - lastUpdate > 1000) {
                        const elapsedTime = (currentTime - lastUpdate) / 1000; // Elapsed time in seconds
                        ({ deltaX, deltaY } = predictPosition(boatData, elapsedTime));
                    }

                    // Update position and rotation
                    updatePosition(boat, targetX + deltaX, targetY + deltaY, !isFirstFrame);
                    if (boatData.cog !== undefined) {
                        updateRotation(boat, courseOverGroundAngle, boatData.cog, !isFirstFrame);
                    } else if (boatData.heading !== undefined) {
                        updateRotation(boat, courseOverGroundAngle, boatData.heading, !isFirstFrame);
                    }

                    // Update boat color
                    const meshWithMaterial = findMaterial(boat.children[0]);
                    if (meshWithMaterial) {
                        const targetColor = distance < 500 ? 'red' : 'white';
                        updateColor(meshWithMaterial, targetColor);
                    }
                } else if (boat.visible) {
                    boat.visible = false;
                }
            }
        });
    }, [vesselIds, aisData]);


    const boats = React.useMemo(() => {
        return Object.entries(vesselIds).map(([_, boatData]) => {
            if (boatData.mmsi && !boatData.mmsi.startsWith("urn:mrn:signalk:uuid:") && !boatData.mmsi.startsWith("227925790") && ! boatData.mmsi.startsWith("urn:mrn:imo:mmsi:230035780") ) {
               // console.log("Add vessel : " + boatData.mmsi);
                return (
                    <AISBoat
                        key={boatData.mmsi}
                        ref={(el) => (boatRefs.current[boatData.mmsi] = el)}
                        position={[0, 0, 0]} // Initial position, will be updated by useFrame
                        visible={false}
                        distance={0}
                        boatData={boatData}
                    />
                );
            }
            return null; // Skip invalid MMSI
        });
    }, [vesselIds]);

    return (
        <>
            {boats}
        </>
    );
};

export default AISView;