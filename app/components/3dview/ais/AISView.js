import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

import { useOcearoContext } from '../../context/OcearoContext';
import { useAIS } from './AISContext';
import AISBoat from './AISBoat';

const AISView = () => {
    const { aisData, vesselIds } = useAIS();
    const boatRefs = useRef({});

    const { getSignalKValue } = useOcearoContext();
    const myPosition = getSignalKValue('navigation.position') || { latitude: 59.7159925, longitude: 59.7141604 };

    const relativeLatLonToXY = (lat, lon, homeLat, homeLon) => {
        const R = 6371000; // Radius of Earth in meters
        const dLat = (lat - homeLat) * (Math.PI / 180);
        const dLon = (lon - homeLon) * (Math.PI / 180);
        const x = R * dLon * Math.cos(homeLat * Math.PI / 180);
        const y = R * dLat;
        return { x, y };
    };

    const relativeDistance = (lat, lon, homeLat, homeLon) => {
        return 60 * Math.sqrt(
            Math.pow(lat - homeLat, 2) + Math.pow(Math.cos(homeLat / 180 * Math.PI) * (lon - homeLon), 2)
        );
    };

    const lengthScalingFactor = 0.1; // Adjust length scaling factor as necessary for visual clarity

    useFrame(() => {
        Object.entries(aisData).forEach(([mmsi, boatData]) => {
            if (boatData.lat && boatData.lon) {
                const { x, y } = relativeLatLonToXY(boatData.lat, boatData.lon, myPosition.latitude, myPosition.longitude);
                const distance = relativeDistance(boatData.lat, boatData.lon, myPosition.latitude, myPosition.longitude);

                if (boatRefs.current[mmsi]) {
                    // Update position and visibility
                    boatRefs.current[mmsi].position.set(x, 0, y);
                    boatRefs.current[mmsi].visible = distance <= 500;

                    // Adjust length scaling dynamically based on distance
                    const adjustedScale = 1 + (distance / 500) * lengthScalingFactor;
                    boatRefs.current[mmsi].scale.set(adjustedScale, adjustedScale, adjustedScale);

                    // Rotate the boat based on COG
                    if (boatData.cog !== null) {
                        boatRefs.current[mmsi].rotation.y = -boatData.cog;
                    }

                    // Change color to red if distance is less than 50 meters
                    const boatMaterial = boatRefs.current[mmsi].material;
                    if (distance < 50) {
                        boatMaterial.color.set('red');
                    } else {
                         boatMaterial.color.set('blue'); // Default color
                    }
                }
            }
        });
    });

    return (
        <>
            {Object.entries(vesselIds).map(([mmsi, boatData]) => {
                const { x, y } = relativeLatLonToXY(boatData.lat, boatData.lon, myPosition.latitude, myPosition.longitude);
                const distance = relativeDistance(boatData.lat, boatData.lon, myPosition.latitude, myPosition.longitude);

                // Assign size based on boatData.length or default value
                const size = boatData.length || 5;

                // Determine initial length scaling based on the boat's real-world length
                const initialLength = size * lengthScalingFactor;

                return (
                    <AISBoat
                        key={mmsi}
                        ref={(el) => (boatRefs.current[mmsi] = el)}
                        length={initialLength}
                        size={size}
                        position={[x, 0, y]}
                        visible={distance <= 500}
                    />
                );
            })}
        </>
    );
};

export default AISView;



/* <mesh ref={ref} position={position} visible={visible}>
       <coneGeometry args={[1, 1, 32]} />
       <meshStandardMaterial color="orange" />
   </mesh> */
