import { useState } from 'react';
import { useOcearoContext } from '../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThermometerHalf, faWater, faFire, faSnowflake } from '@fortawesome/free-solid-svg-icons'; // Import appropriate icons

const BottomTemperatureWidget = () => {
    const nightMode = false; // Define night mode (can be dynamic)
    const { getSignalKValue } = useOcearoContext(); // Access SignalK data from the context
    const [displayMode, setDisplayMode] = useState('waterTemp'); // Default display mode to water temperature

    const kelvinToCelsius = (kelvin) => kelvin - 273.15;

    // Fetching various temperatures from SignalK
    const waterTemperature = kelvinToCelsius(getSignalKValue('environment.water.temperature')) || 20; // Water temperature, fallback to 20°C
    const airTemperature = getSignalKValue('environment.outside.temperature') || 22; // Air temperature, fallback to 22°C
    const exhaustTemperature = getSignalKValue('propulsion.main.exhaustTemperature') || 200; // Exhaust temperature, fallback to 200°C
    const fridgeTemperature = getSignalKValue('environment.inside.fridge.temperature') || 4; // Fridge temperature, fallback to 4°C

    // Function to toggle between display modes
    const toggleDisplayMode = () => {
        const modes = ['waterTemp', 'airTemp', 'exhaustTemp', 'fridgeTemp'];
        const nextModeIndex = (modes.indexOf(displayMode) + 1) % modes.length;
        setDisplayMode(modes[nextModeIndex]);
    };

    // Define text color based on night mode
    const textColor = nightMode ? 'text-red-500' : 'text-white';

    return (
        <div
            className={`cursor-pointer ${textColor} flex items-center space-x-2`}
            onClick={toggleDisplayMode}
            title="Toggle Temperature Display"
        >
            {displayMode === 'waterTemp' && (
                <div className="flex items-center text-2xl">
                    <FontAwesomeIcon icon={faWater} className="mr-2" />
                    <span>{waterTemperature}°C</span>
                </div>
            )}
            {displayMode === 'airTemp' && (
                <div className="flex items-center text-2xl">
                    <FontAwesomeIcon icon={faThermometerHalf} className="mr-2" />
                    <span>{airTemperature}°C</span>
                </div>
            )}
            {displayMode === 'exhaustTemp' && (
                <div className="flex items-center text-2xl">
                    <FontAwesomeIcon icon={faFire} className="mr-2" />
                    <span>{exhaustTemperature}°C</span>
                </div>
            )}
            {displayMode === 'fridgeTemp' && (
                <div className="flex items-center text-2xl">
                    <FontAwesomeIcon icon={faSnowflake} className="mr-2" />
                    <span>{fridgeTemperature}°C</span>
                </div>
            )}
        </div>
    );
};

export default BottomTemperatureWidget;
