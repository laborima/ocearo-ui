import { useState } from 'react';
import { useOcearoContext } from '../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThermometerHalf, faWater } from '@fortawesome/free-solid-svg-icons'; // Import appropriate icons

const BottomTemperatureWidget = () => {
    const nightMode = false; // Define night mode (can be dynamic)
    const { getSignalKValue } = useOcearoContext(); // Access SignalK data from the context
    const [displayMode, setDisplayMode] = useState('waterTemp'); // Default display mode to water temperature

    // Fetching water temperature and sea temperature from SignalK
    const waterTemperature = getSignalKValue('environment.water.temperature') || 20; // Water temperature, fallback to 20°C
    const seaTemperature = getSignalKValue('environment.outside.temperature') || 22; // Sea temperature, fallback to 22°C

    // Function to toggle between water and sea temperature display
    const toggleDisplayMode = () => {
        setDisplayMode(displayMode === 'waterTemp' ? 'seaTemp' : 'waterTemp');
    };

    // Define text color based on night mode
    const textColor = nightMode ? 'text-red-500' : 'text-white';

    return (
        <div 
            className={`cursor-pointer ${textColor} flex items-center space-x-2`} 
            onClick={toggleDisplayMode}
            title="Toggle Temperature Display"
        >
            {displayMode === 'waterTemp' ? (
                // Display water temperature with an icon
                <div className="flex items-center  text-2xl"> {/* Increased font size */}
                    <FontAwesomeIcon icon={faWater} className="mr-2" /> {/* Water icon */}
                    <span> {waterTemperature}°C</span>
                </div>
            ) : (
                // Display sea temperature with an icon
                <div className="flex items-center  text-2xl"> {/* Increased font size */}
                    <FontAwesomeIcon icon={faThermometerHalf} className="mr-2" /> {/* Thermometer icon */}
                    <span>{seaTemperature}°C</span>
                </div>
            )}
        </div>
    );
};

export default BottomTemperatureWidget;
