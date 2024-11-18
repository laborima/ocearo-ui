import { useThreeDView } from './context/ThreeDViewContext';
import { useOcearoContext } from '../context/OcearoContext';
import { useState, useEffect } from 'react';

const ThreeDBoatSeeLevelIndicator = () => {
    const { nightMode } = useThreeDView(); // Access SignalK data and nightMode from context
    const { getSignalKValue } = useOcearoContext();
    // State variables for the environment data
    const [depth, setDepth] = useState(0);

    // Fetching depth and tide levels from SignalK
    useEffect(() => {
        setDepth(getSignalKValue('environment.depth.belowTransducer') || 0);
    }, [getSignalKValue]);

    // Dynamic text color and progress bar background based on night mode
    const textColor = nightMode ? 'text-oNight' : 'text-white';
    const progressBarBg = nightMode ? 'bg-blue-700' : 'bg-oBlue';

    // Calculate the height of the progress bars as percentages
    const depthPercentage = Math.min((depth / 50) * 100, 100); // Max depth at 50m
    // Determine ascending or descending tide based on current tide level

    return (
        <div >

            {/* Label for Depth */}
            <div className={`text-xs mb-2 ${textColor}`}>Depth</div>
            {/* Vertical progress bar for Depth */}
            <div className={`w-2 h-60 ${progressBarBg}  rounded-lg overflow-hidden mb-4`}>
                <div
                    className={`bg-oGray transition-all duration-500 `}
                    style={{ height: `${depthPercentage}%` }}
                ></div>
            </div>
            {/* Display depth value */}
            <div className={`text-xs mt-2 ${textColor}`}>{depth} m</div>

        </div>
    );
};

export default ThreeDBoatSeeLevelIndicator;
