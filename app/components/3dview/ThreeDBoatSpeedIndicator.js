import { convertSpeed, useOcearoContext } from '../context/OcearoContext';
import { useState, useMemo, useCallback } from 'react';

// Define speed types and their corresponding SignalK paths
const SPEED_CONFIG = {
    SOG: 'navigation.speedOverGround',
    VMG: 'performance.velocityMadeGood',
    STW: 'navigation.speedThroughWater',
    POL: 'performance.polarSpeedRatio'
};


const ThreeDBoatSpeedIndicator = () => {
    const { nightMode, getSignalKValue } = useOcearoContext();
    const [speedType, setSpeedType] = useState('SOG');


    // Use useMemo to prevent unnecessary recalculations
    const speedTypes = useMemo(() => {
        const types = {};
        for (const [type, path] of Object.entries(SPEED_CONFIG)) {
            const value = getSignalKValue(path);
            // Only include speed type if data is available
            if (value !== undefined && value !== null) {
                types[type] = convertSpeed(value);
            }
        }
        return types;
    }, [getSignalKValue]);

    // Use the first available speed type as default if current type has no data
    const availableTypes = Object.keys(speedTypes);
    const currentSpeedType = speedTypes[speedType] !== undefined ? 
        speedType : 
        availableTypes[0];

    const currentSpeed = speedTypes[currentSpeedType];

    // Memoize the toggle function
    const toggleSpeedType = useCallback(() => {
        if (availableTypes.length === 0) return; // Don't toggle if no data available

        const currentIndex = availableTypes.indexOf(currentSpeedType);
        const nextIndex = (currentIndex + 1) % availableTypes.length;
        const nextType = availableTypes[nextIndex];
        setSpeedType(nextType);
    }, [availableTypes, currentSpeedType]);

    const textColor = nightMode ? 'text-oNight' : 'text-oGray';
    const speedTextColor = nightMode ? 'text-oNight' : 'text-white';

    // If no speed data is available at all
    if (availableTypes.length === 0) {
        return (
            <div className="mt-4">
                <div className="text-6xl font-bold text-gray-400">--</div>
                <div className={`text-lg ${textColor}`}>NO DATA</div>
            </div>
        );
    }

    return (
        <div className="mt-4">
            <div
                className={`text-6xl font-bold cursor-pointer ${speedTextColor}`}
                onClick={toggleSpeedType}
                role="button"
                tabIndex={0}
                aria-label={`Current speed: ${currentSpeed} ${currentSpeedType}. Click to change speed type.`}
            >
                {currentSpeed?.toFixed(1) || '--'}
            </div>
            <div className={`text-lg ${textColor}`}>{currentSpeedType}</div>
        </div>
    );
};

export default ThreeDBoatSpeedIndicator;