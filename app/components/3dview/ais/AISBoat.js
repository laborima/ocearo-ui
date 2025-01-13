import { Html } from '@react-three/drei';
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

const lengthScalingFactor = 0.1; // Adjust length scaling factor as necessary for visual clarity


// AISBoat component
const AISBoat = forwardRef(({ position, visible, boatData }, ref) => {
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
    const formatBoatData = (label, value) => {
        return `${label}: ${value || 'N/A'}\n`;
    };

    const boatInfo = [
        formatBoatData('Name', boatData.name || 'Unknown'),
        formatBoatData('Length', boatData.length ? `${boatData.length}m` : 'N/A'),
        formatBoatData('Type', boatData.shipType)
    ].join('');

    // Use Math.max to ensure a minimum size for visibility
    const length = Math.max((boatData.length || 5) * lengthScalingFactor, 0.5);

    return (
        <group ref={ref} position={position} visible={visible}>
            <BoatComponent scale={[length, length, length]} />

            <Text
                position={[3, 9, 0]} // Position above the boat
                fontSize={0.5}
                maxWidth={3} // Adjust as needed
                lineHeight={1}
                textAlign="left"
                color="white"
                anchorX="center"
                anchorY="top"
                font="fonts/Roboto-Bold.ttf"
            >
                {boatInfo}
            </Text>
        </group>
    );
});

// Set display name for debugging purposes
AISBoat.displayName = 'AISBoat';

export default AISBoat;