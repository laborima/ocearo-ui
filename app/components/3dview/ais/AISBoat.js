import React, { forwardRef } from 'react';

// Dynamic import utility function
const loadBoatComponent = async (boatType) => {
    try {
        const boatModule = await import(`/public/boats/${boatType}/Scene.jsx`);
        return boatModule.Model; // Ensure Scene.jsx exports a Model
    } catch (error) {
        console.error(`Error loading ${boatType} component:`, error);
        throw error;
    }
};

// Function to determine boat type based on size
const determineBoatType = (size) => {
    if (size <= 2) return 'windsurf';
    if (size <= 4) return 'optimist';
    if (size <= 15) return 'sailboat';
    return 'ship';
};

// AISBoat component
const AISBoat = forwardRef(({ size, position, visible, length }, ref) => {
    const [BoatComponent, setBoatComponent] = React.useState(null);
    const boatType = determineBoatType(size);

    React.useEffect(() => {
        let isMounted = true;

        // Dynamically load the boat component
        loadBoatComponent(boatType)
            .then((Component) => {
                if (isMounted) setBoatComponent(() => Component);
            })
            .catch((error) => console.error(`Failed to load ${boatType}:`, error));

        return () => { isMounted = false; };
    }, [boatType]);

    if (!BoatComponent) return null; // Show nothing or a loading indicator while the component loads

    return (
        <group ref={ref} position={position} visible={visible}>
            <BoatComponent scale={[length, length, length]} />
        </group>
    );
});

// Set display name for debugging purposes
AISBoat.displayName = 'AISBoat';

export default AISBoat;

