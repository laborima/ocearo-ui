import { useState } from 'react';
import { useOcearoContext } from '../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloud, faDroplet, faWind } from '@fortawesome/free-solid-svg-icons'; // Import appropriate icons

const BottomEnvironmentalWidget = () => {
    const nightMode = false; // Define night mode (can be dynamic)
    const { getSignalKValue } = useOcearoContext(); // Access SignalK data from the context
    const [displayMode, setDisplayMode] = useState('pressure'); // Default display mode to atmospheric pressure

    // Fetching various environmental metrics from SignalK
    const atmosphericPressure = getSignalKValue('environment.outside.pressure') || 1013; // Atmospheric pressure in hPa, fallback to 1013 hPa
    const humidity = getSignalKValue('environment.inside.humidity') || 50; // Humidity percentage, fallback to 50%
    const vocConcentration = getSignalKValue('environment.inside.voc') || 0.5; // VOC concentration in ppm, fallback to 0.5 ppm

    // Function to toggle between display modes
    const toggleDisplayMode = () => {
        const modes = ['pressure', 'humidity', 'voc'];
        const nextModeIndex = (modes.indexOf(displayMode) + 1) % modes.length;
        setDisplayMode(modes[nextModeIndex]);
    };

    // Define text color based on night mode
    const textColor = nightMode ? 'text-red-500' : 'text-white';

    return (
        <div
            className={`cursor-pointer ${textColor} flex items-center space-x-2`}
            onClick={toggleDisplayMode}
            title="Toggle Environmental Display"
        >
            {displayMode === 'pressure' && (
                <div className="flex items-center text-2xl">
                    <FontAwesomeIcon icon={faCloud} className="mr-2" />
                    <span>{atmosphericPressure} hPa</span>
                </div>
            )}
            {displayMode === 'humidity' && (
                <div className="flex items-center text-2xl">
                    <FontAwesomeIcon icon={faDroplet} className="mr-2" />
                    <span>{humidity}%</span>
                </div>
            )}
            {displayMode === 'voc' && (
                <div className="flex items-center text-2xl">
                    <FontAwesomeIcon icon={faWind} className="mr-2" />
                    <span>{vocConcentration} ppm</span>
                </div>
            )}
        </div>
    );
};

export default BottomEnvironmentalWidget;
