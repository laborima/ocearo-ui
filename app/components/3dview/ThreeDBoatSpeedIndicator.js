import { useOcearoContext } from '../context/OcearoContext';
import { useState } from 'react';

const ThreeDBoatSpeedIndicator = () => {
    const { nightMode } = useOcearoContext(); // Access global context, including nightMode
    const [speedType, setSpeedType] = useState('SOG'); // Default speed type: SOG
    const {getSignalKValue}  = useOcearoContext();

    // Example speed data; you can replace these values with real SignalK data if available
    const speedTypes = {
        SOG: getSignalKValue('navigation.speedOverGround') || 0.0, // Speed over ground
        VMG: getSignalKValue('performance.velocityMadeGood') || 0.0, // Velocity made good
        STW: getSignalKValue('navigation.speedThroughWater') || 0.0, // Speed through water
        POL : getSignalKValue('performance.polarSpeedRatio') || 8
    };
    
  /*  const polarSpeed = getSignalKValue('performance.polarSpeed') || 8; // Vitesse polaire du bateau
      const polarSpeedRatio = getSignalKValue('performance.polarSpeedRatio') || 0.95; // Ratio de vitesse polaire (Performance polaire)
      // *** Données de vitesse et de performance ***
      const velocityMadeGood = getSignalKValue('performance.velocityMadeGood') || 5; // VMG actuel
      const speedThroughWater = getSignalKValue('navigation.speedThroughWater') || 7; // Vitesse à travers l'eau
      const polarVelocityMadeGood = getSignalKValue('performance.polarVelocityMadeGood') || 6; // VMG polaire
      const polarVelocityMadeGoodRatio = getSignalKValue('performance.polarVelocityMadeGoodRatio') || 0.9; // Ratio de VMG polaire*/


    // State to display the current speed
    const [speed, setSpeed] = useState(speedTypes[speedType]); // Use speed from the current speed type

    // Function to handle speed type change on click
    const toggleSpeedType = () => {
        const types = Object.keys(speedTypes);
        const currentIndex = types.indexOf(speedType);
        const nextIndex = (currentIndex + 1) % types.length;
        const nextType = types[nextIndex];

        setSpeedType(nextType); // Update the speed type
        setSpeed(speedTypes[nextType]); // Update the speed value
    };

    // Define text colors based on night mode
    const textColor = nightMode ? 'text-oNight' : 'text-oGray'; // Change to red in night mode

    return (
        <div className="mt-4">
            {/* Speedometer */}
            <div
                className={`text-6xl font-bold cursor-pointer text-white`} // Apply night mode text color
                onClick={toggleSpeedType}
            >
                {speed} {/* Display current speed */}
            </div>
            <div className={`text-lg ${textColor}`}>{speedType}</div> {/* Display current speed type */}
        </div>
    );
};

export default ThreeDBoatSpeedIndicator;
