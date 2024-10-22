import { useThreeDView } from './context/ThreeDViewContext';
import { useOcearoContext } from '../context/OcearoContext';
import { useState, useEffect } from 'react';

const ThreeDBoatSeeLevelIndicator = () => {
    const { nightMode } = useThreeDView(); // Access SignalK data and nightMode from context
    const {getSignalKValue}  = useOcearoContext();
    const [depth, setDepth] = useState(0); // Default depth value
    const [tideLevel, setTideLevel] = useState(0); // Default tide level value

    // Fetching depth and tide levels from SignalK
    useEffect(() => {
        const currentDepth = getSignalKValue('environment.depth.belowTransducer') || 0; // Fetch current depth from SignalK
        const currentTideLevel = getSignalKValue('environment.tide.height') || 0; // Fetch current tide level from SignalK

        setDepth(currentDepth);
        setTideLevel(currentTideLevel);
    }, [getSignalKValue]);

    // Dynamic text color and progress bar background based on night mode
    const textColor = nightMode ? 'text-red-500' : 'text-white';
    const progressBarBg = nightMode ? 'bg-blue-700' : 'bg-blue-500';

    // Calculate height of the progress bar for depth and tide level (scaled from 0 to 100%)
    const depthPercentage = Math.min((depth / 50) * 100, 100); // Assuming max depth of 50 meters for scaling
    const tidePercentage = Math.min((tideLevel / 10) * 100, 100); // Assuming max tide level of 10 meters for scaling

    return (
        <div >
            {/* Label for Depth */}
            <div className={`text-xs mb-2 ${textColor}`}>Depth</div>
            {/* Vertical progress bar for Depth */}
            <div className="w-2 h-40 bg-gray-700 rounded-lg overflow-hidden mb-4">
                <div
                    className={`${progressBarBg} transition-all duration-500`}
                    style={{ height: `${depthPercentage}%` }}
                ></div>
            </div>
            {/* Display depth value */}
            <div className={`text-xs mb-4 ${textColor}`}>{depth} m</div>

            {/* Label for Tide */}
            <div className={`text-xs mb-2 ${textColor}`}>Tide</div>
            {/* Vertical progress bar for Tide */}
            <div className="w-2 h-40 bg-gray-700 rounded-lg overflow-hidden">
                <div
                    className={`${progressBarBg} transition-all duration-500`}
                    style={{ height: `${tidePercentage}%` }}
                ></div>
            </div>
            {/* Display tide level value */}
            <div className={`text-xs mt-2 ${textColor}`}>{tideLevel} m</div>
        </div>
    );
};

export default ThreeDBoatSeeLevelIndicator;
