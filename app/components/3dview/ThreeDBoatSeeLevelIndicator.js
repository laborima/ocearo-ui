
import { useOcearoContext } from '../context/OcearoContext';
import { useState, useEffect } from 'react';

const ThreeDBoatSeeLevelIndicator = () => {
    const { nightMode } = useOcearoContext(); // Access SignalK data and nightMode from context
    const { getSignalKValue } = useOcearoContext();
    // State variables for the environment data
    const [depth, setDepth] = useState(0);

    // Fetching depth and tide levels from SignalK
    useEffect(() => {
        setDepth(getSignalKValue('environment.depth.belowTransducer') || 0);
    }, [getSignalKValue]);

    // Dynamic text color and progress bar background based on night mode
    const textColor = nightMode ? 'text-oNight' : 'text-white';

    // Calculate the height of the progress bars as percentages
    const depthPercentage = Math.min((depth / 50) * 100, 100); // Max depth at 50m
    // Determine ascending or descending tide based on current tide level
    
    // Determine progress bar color based on depth
     let progressBarColor = 'bg-oBlue'; // Default color
     if (depth < 3) {
         progressBarColor = 'bg-oRed'; // Red for depth < 3m
     } else if (depth < 5) {
         progressBarColor = 'bg-oYellow'; // Yellow for depth < 5m
     }


    return (
        <div >

            {/* Label for Depth */}
            <div className={`text-s mb-2 ${textColor}`}>Depth</div>
            {/* Vertical progress bar for Depth */}
            <div className={`w-2 h-60 ${progressBarColor}  rounded-lg overflow-hidden mb-4`}>
                <div
                    className={`bg-oGray transition-all duration-500 `}
                    style={{ height: `${depthPercentage}%` }}
                ></div>
            </div>
            {/* Display depth value */}
            <div className={`text-s mt-2 ${textColor}`}>{depth} m</div>

        </div>
    );
};

export default ThreeDBoatSeeLevelIndicator;
