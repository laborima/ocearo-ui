import { Text } from '@react-three/drei';
import React, { forwardRef, useState, useEffect } from 'react';

/**
 * Dynamically imports a 3D boat model component based on the boat type
 * @param {string} boatType - The type of boat to load (e.g., 'windsurf', 'sailboat')
 * @returns {Promise<Component>} - The loaded React component for the boat model
 */
const loadBoatComponent = async (boatType) => {
    try {
        // Load the appropriate 3D model from the public directory
        const boatModule = await import(`/public/boats/${boatType}/Scene.jsx`);
        // Handle different export styles in 3D model files
        return boatModule.default ? boatModule.default : boatModule.Model;
    } catch (error) {
        console.error(`Error loading ${boatType} component:`, error);
        throw error;
    }
};

/**
 * Maps AIS ship type codes to specific boat model types
 * @param {number} shipType - AIS ship type code
 * @returns {string} - Boat model type to be loaded
 */
const determineBoatType = (shipType) => {
    if (shipType === 0) return 'windsurf';
    if (shipType === 30) return 'optimist';
    if (shipType === 36) return 'sailboat';
    return 'ship'; // Default boat type
};

// Base length of the boat model in units (for scaling calculations)
const BASE_MODEL_LENGTH = 10;

/**
 * AISBoat component - Renders a 3D boat model with information display
 * Optimized for touchscreen interaction using click events instead of hover
 */
const AISBoat = forwardRef(({ position, visible, boatData, onHover }, ref) => {
    // State to hold the dynamically loaded boat component
    const [BoatComponent, setBoatComponent] = useState(null);
    // Determine which boat model to use based on AIS data
    const boatType = determineBoatType(boatData.shipType);

    // Load the appropriate boat model when component mounts or boat type changes
    useEffect(() => {
        let isMounted = true;

        loadBoatComponent(boatType)
            .then((Component) => {
                // Only update state if component is still mounted
                if (isMounted) setBoatComponent(() => Component);
            })
            .catch((error) => console.error(`Failed to load ${boatType}:`, error));

        // Clean up function to prevent memory leaks
        return () => { isMounted = false; };
    }, [boatType]);

    // Don't render anything until the boat model is loaded
    if (!BoatComponent) {
        return null;
    }

    /**
     * Formats boat data with label and unit for display
     * @param {string} label - The label for the data field
     * @param {*} value - The value to display
     * @param {string} unit - Optional unit to append to the value
     * @returns {string} - Formatted string with newline
     */
    const formatBoatData = (label, value, unit = '') => {
        const displayValue = value !== undefined && value !== null ? `${value}${unit}` : 'N/A';
        return `${label}: ${displayValue}\n`;
    };

    // Prepare the basic info to display above the boat
    // If name exists, display it with label, otherwise just show MMSI without a label
    const basicInfo = [
        boatData.name 
            ? formatBoatData('Name', boatData.name, '') 
            : `MMSI ${boatData.mmsi.replace('urn:mrn:imo:mmsi:', '')}\n`
    ].join('');

    // Calculate the scale factor for the boat model based on actual boat length
    // Set minimum boat length for better visibility on the map
    const MIN_BOAT_LENGTH = 4; // Minimum boat length in meters
    const providedLength = boatData.length || BASE_MODEL_LENGTH;
    const desiredLength = Math.max(providedLength, MIN_BOAT_LENGTH);
    const scaleFactor = desiredLength / BASE_MODEL_LENGTH;

    return (
        <group 
            ref={ref} 
            position={position} 
            visible={visible}
        >
            {/* Clickable boat model group */}
            <group 
                onClick={(e) => {
                    e.stopPropagation();
                    // Toggle the info panel for this boat on click (touchscreen optimized)
                    if (BoatComponent) {
                        // Call the onHover callback (which actually handles click events)
                        // despite the name, this toggles the info panel
                        onHover && onHover(boatData);
                    }
                    console.log('Clicked on boat:', boatData.name || boatData.mmsi);
                }}
            >
                {/* Render the actual boat model with proper scaling */}
                <BoatComponent 
                    scale={[scaleFactor, scaleFactor, scaleFactor]}
                />
            </group>

            {/* Label that appears above the boat */}
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
                    renderOrder={1000} // Ensure text renders on top of other elements
                    depthTest={false}  // Make sure text is always visible regardless of depth
                >
                    {basicInfo}
                </Text>
            </group>
        </group>
    );
});

// Set display name for React DevTools
AISBoat.displayName = 'AISBoat';

export default AISBoat;
