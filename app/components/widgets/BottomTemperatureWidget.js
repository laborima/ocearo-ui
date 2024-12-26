import { useState, useEffect } from 'react';
import { convertTemperature, useOcearoContext } from '../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThermometerHalf, faWater, faFire, faSnowflake } from '@fortawesome/free-solid-svg-icons';


const BottomTemperatureWidget = () => {
    const { nightMode } = useOcearoContext();
    const { getSignalKValue } = useOcearoContext();

    const [availableModes, setAvailableModes] = useState([]);
    const [displayMode, setDisplayMode] = useState(null);

    // Conditionally fetch values
    const waterTemperature = convertTemperature(getSignalKValue('environment.water.temperature')) ;
    const airTemperature =  convertTemperature(getSignalKValue('environment.outside.temperature'));
    const exhaustTemperature =  convertTemperature(getSignalKValue('propulsion.main.exhaustTemperature'));
    const fridgeTemperature =convertTemperature(getSignalKValue('environment.inside.fridge.temperature')) ;

    // Set modes after hydration
    useEffect(() => {
        const modes = [];
        if (waterTemperature !== null) modes.push('waterTemp');
        if (airTemperature !== null) modes.push('airTemp');
        if (exhaustTemperature !== null) modes.push('exhaustTemp');
        if (fridgeTemperature !== null) modes.push('fridgeTemp');

        setAvailableModes(modes);
        if (modes.length > 0) {
            setDisplayMode(modes[0]);
        }
    }, [waterTemperature, airTemperature, exhaustTemperature, fridgeTemperature]);

    const toggleDisplayMode = () => {
        if (availableModes.length === 0) return;

        const currentIndex = availableModes.indexOf(displayMode);
        const nextModeIndex = (currentIndex + 1) % availableModes.length;
        setDisplayMode(availableModes[nextModeIndex]);
    };

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
            {!displayMode && (
                <div className="text-2xl">
                    <span>NA</span>
                </div>
            )}
        </div>
    );
 };

export default BottomTemperatureWidget;
