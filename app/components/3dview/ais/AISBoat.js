import React, { useState, useEffect } from 'react';


/**
 * Dynamically imports a 3D boat model component based on the boat type
 * @param {string} boatType - The type of boat to load (e.g., 'windsurf', 'sailboat')
 * @returns {Promise<Component>} - The loaded React component for the boat model
 */
const loadBoatComponent = async (boatType) => {
    try {
        // Load the appropriate 3D model from the public directory
        const boatModule = await import(`@/public/boats/${boatType}/Scene.jsx`);
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
const AISBoat = ({ position, visible, boatData, onClick, ref }) => {
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
    
                onClick={(e) => {
                    e.stopPropagation();
                    // Toggle the info panel for this boat on click (touchscreen optimized)
                    if (BoatComponent) {
                        // Call the onHover callback (which actually handles click events)
                        // despite the name, this toggles the info panel
                        onClick && onClick(boatData);
                    }
                }}
            >
                {/* Render the actual boat model with proper scaling */}
                <BoatComponent 
                    scale={[scaleFactor, scaleFactor, scaleFactor]}
                />
            </group>

    );
};



export default AISBoat;
