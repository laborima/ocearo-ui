import { useThreeDView } from './context/ThreeDViewContext';
import { useState } from 'react';

const ThreeDBoatThanksIndicator = () => {
    const { getSignalKValue, nightMode } = useThreeDView(); // Access SignalK data and night mode from context
    const [displayMode, setDisplayMode] = useState('batteries'); // Default mode is to display batteries

    // Fetching battery levels from SignalK
    const battery1 = getSignalKValue('electrical.batteries.0.capacity.stateOfCharge') || 22; // Battery 1 percentage
    const battery2 = getSignalKValue('electrical.batteries.1.capacity.stateOfCharge') || 50; // Battery 2 percentage

    // Fetching tank levels from SignalK
    const freshWater = getSignalKValue('tanks.freshWater.0.currentLevel') || 40; // Fresh water tank percentage
    const petrol = getSignalKValue('tanks.fuel.0.currentLevel') || 75; // Fuel/petrol tank percentage
    const blackWater = getSignalKValue('tanks.blackWater.0.currentLevel') || 20; // Blackwater tank percentage

    // Function to toggle between batteries and tanks display
    const toggleDisplayMode = () => {
        setDisplayMode(displayMode === 'batteries' ? 'tanks' : 'batteries');
    };

    // Define text colors based on night mode
    const textColor = nightMode ? 'text-red-500' : 'text-white';

    return (
        <div className={`${textColor}`} onClick={toggleDisplayMode}>
            {displayMode === 'batteries' ? (
                // Display battery levels
                <div>
                    <div className="text-sm">Battery 1: {battery1}%</div>
                    <div className="text-sm">Battery 2: {battery2}%</div>
                </div>
            ) : (
                // Display tanks levels
                <div>
                    <div className="text-sm">Fresh Water: {freshWater}%</div>
                    <div className="text-sm">Petrol: {petrol}%</div>
                    <div className="text-sm">Black Water: {blackWater}%</div>
                </div>
            )}
        </div>
    );
};

export default ThreeDBoatThanksIndicator;
