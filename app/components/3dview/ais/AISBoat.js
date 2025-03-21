import { Text } from '@react-three/drei';
import React, { forwardRef, useState, useEffect } from 'react';

// Dynamic import utility function
const loadBoatComponent = async (boatType) => {
    try {
        const boatModule = await import(`/public/boats/${boatType}/Scene.jsx`);
        return boatModule.default ? boatModule.default : boatModule.Model; // Check if the default export is used
    } catch (error) {
        console.error(`Error loading ${boatType} component:`, error);
        throw error;
    }
};

// Function to determine boat type based on size
const determineBoatType = (shipType) => {
    if (shipType === 0) return 'windsurf';
    if (shipType === 30) return 'optimist';
    if (shipType === 36) return 'sailboat';
    return 'ship';
};

const BASE_MODEL_LENGTH = 10; // Base length of the boat model in units

// AISBoat component
const AISBoat = forwardRef(({ position, visible, boatData, onHover }, ref) => {
    const [BoatComponent, setBoatComponent] = useState(null);
    const boatType = determineBoatType(boatData.shipType);

    useEffect(() => {
        let isMounted = true;

        // Dynamically load the boat component
        loadBoatComponent(boatType)
            .then((Component) => {
                if (isMounted) setBoatComponent(() => Component);
            })
            .catch((error) => console.error(`Failed to load ${boatType}:`, error));

        return () => { isMounted = false; };
    }, [boatType]);

    if (!BoatComponent) {
        return null; // Or show a loading indicator
    }

    // Helper function to format boat data
    const formatBoatData = (label, value, unit = '') => {
        const displayValue = value !== undefined && value !== null ? `${value}${unit}` : 'N/A';
        return `${label}: ${displayValue}\n`;
    };

    // Basic info always displayed
    const basicInfo = [
        formatBoatData('Name', boatData.name || boatData.mmsi)
    ].join('');

    // Calculate the scale factor based on the desired length
    const desiredLength = boatData.length || BASE_MODEL_LENGTH; // Default to base model length if length is not provided
    const scaleFactor = desiredLength / BASE_MODEL_LENGTH;



    return (
        <group 
            ref={ref} 
            position={position} 
            visible={visible}
        >
            <group 
                onClick={(e) => {
                    e.stopPropagation();
                    console.log('Clicked on boat:', boatData.name || boatData.mmsi);
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    // Only trigger hover when component is for sure mounted
                    if (BoatComponent) {
                        onHover && onHover(boatData);
                    }
                }}
                onPointerOut={(e) => {
                    e.stopPropagation();
                    onHover && onHover(null);
                }}
            >
                <BoatComponent 
                    scale={[scaleFactor, scaleFactor, scaleFactor]}
                />
            </group>

            {/* Simple label above the boat */}
            <group position={[1.5, 4, 0]}>
                <Text
                    position={[0, 0, 0]}
                    fontSize={0.4}
                    maxWidth={3}
                    lineHeight={1.2}
                    textAlign="left"
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    font="fonts/Roboto-Bold.ttf"
                    renderOrder={1000}
                    depthTest={false}
                >
                    {basicInfo}
                </Text>
            </group>
        </group>
    );
});

// Set display name for debugging purposes
AISBoat.displayName = 'AISBoat';

export default AISBoat;
