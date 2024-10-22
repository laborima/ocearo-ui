import { useThreeDView } from './context/ThreeDViewContext';
import { useOcearoContext } from '../context/OcearoContext';
import { useState, useEffect } from 'react';

const ThreeDBoatRudderIndicator = () => {
    const {nightMode } = useThreeDView(); // Access SignalK data and nightMode from context
    const {getSignalKValue}  = useOcearoContext();
    const [rudderAngle, setRudderAngle] = useState(0); // Default rudder angle

    // Fetch the rudder angle from SignalK when component mounts or data updates
    useEffect(() => {
        const angle = getSignalKValue('steering.rudderAngle') || 0; // Default to 0 degrees if no data
        setRudderAngle(angle);
    }, [getSignalKValue]);

    // Dynamic slider background based on night mode
    const sliderBgColor = nightMode ? 'bg-red-500' : 'bg-gray-300';

    return (
        <div>
            {/* Slider displaying rudder angle */}
            <input
                type="range"
                min="-45" // Port
                max="45"  // Starboard
                value={rudderAngle} // Dynamic value from SignalK
                className={`slider ${sliderBgColor} w-64`} // Adjust slider width and color
                readOnly // Make it read-only since we're just displaying the rudder angle
            />
            {/* Display rudder angle in text */}
            <div className={`text-center mt-2 text-sm ${nightMode ? 'text-red-500' : 'text-white'}`}>
                Rudder Angle: {rudderAngle}°
            </div>
        </div>
    );
};

export default ThreeDBoatRudderIndicator;