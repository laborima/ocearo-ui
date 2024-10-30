import React from 'react';
import { Ring, Sphere, Text } from '@react-three/drei';
import { DoubleSide, MathUtils } from 'three';
import { useOcearoContext } from '../../context/OcearoContext';

const CompassDial = ({ outerRadius, innerRadius }) => {
    const dialColor = 0xffffff;
    const outerDialOpacity = 0.5;
    const markerColorPrimary = 0x000000;
    const markerColorGreen = 0x00ff00;
    const markerColorRed = 0xff0000;

    const { getSignalKValue } = useOcearoContext();
    const courseOverGroundAngle = getSignalKValue('navigation.courseOverGroundTrue') || 10;

    // Function to create markers for both inner and outer rings
    const createMarkers = (radius, isOuter) => {
        const markers = [];
        
        for (let deg = 0; deg < 360; deg += 10) {
            const angle = MathUtils.degToRad(deg - 90);
            const isMainMarker = deg % 30 === 0;
            const markerSize = isOuter ? (isMainMarker ? 0.4 : 0.2) : (isMainMarker ? 0.3 : 0.15);
            const x = (radius + markerSize * 0.5 + 0.1) * Math.cos(angle);
            const z = (radius + markerSize * 0.5 + 0.1) * Math.sin(angle);
            
            const isGreenZone = isOuter && deg > 0 && deg < 61;
            const isRedZone = isOuter && deg >= 300 && deg < 360;
            const currentMarkerColor = isGreenZone ? markerColorGreen : isRedZone ? markerColorRed : markerColorPrimary;

            // Add text labels only for inner main markers
            if (!isOuter && isMainMarker) {
                const label = deg === 0 ? "N" : deg.toString();
                markers.push(
                    <Text
                        key={`text-${deg}`}
                        position={[x, 0, z]}
                        color={markerColorPrimary}
                        fontSize={0.5}
                        rotation={[-Math.PI / 2, 0, Math.PI / 2 - angle]}
                    >
                        {label}
                    </Text>
                );
            } else {
                markers.push(
                    <Sphere
                        key={`marker-${isOuter ? 'outer' : 'inner'}-${deg}`}
                        args={[markerSize / 2, 16, 16]}
                        position={[x, 0, z]}
                    >
                        <meshBasicMaterial color={currentMarkerColor} />
                    </Sphere>
                );
            }
        }
        return markers;
    };

    return (
        <>
            {/* Primary Dial with Rotation */}
            <group rotation={[0, -courseOverGroundAngle, 0]}>
                <Ring
                    args={[innerRadius, outerRadius, 64]}
                    rotation={[Math.PI / 2, 0, 0]}
                >
                    <meshBasicMaterial color={dialColor} side={DoubleSide} />
                </Ring>
                {createMarkers(innerRadius, false)}
            </group>

            {/* Secondary Transparent Dial */}
            <group>
                <Ring
                    args={[innerRadius + 1, outerRadius + 1, 64]}
                    rotation={[Math.PI / 2, 0, 0]}
                >
                    <meshBasicMaterial
                        color={dialColor}
                        side={DoubleSide}
                        transparent={true}
                        opacity={outerDialOpacity}
                    />
                </Ring>
                {createMarkers(innerRadius + 1, true)}
            </group>
        </>
    );
};

export default CompassDial;
