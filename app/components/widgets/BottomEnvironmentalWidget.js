import { useEffect, useState } from 'react';
import { convertPressure, useOcearoContext } from '../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloud, faDroplet, faWind } from '@fortawesome/free-solid-svg-icons';

const BottomEnvironmentalWidget = () => {
    const { nightMode } = useOcearoContext();
    const { getSignalKValue } = useOcearoContext(); // Access SignalK data from the context
    

    const [availableModes, setAvailableModes] = useState([]);
    const [displayMode, setDisplayMode] = useState(null);

    // Conditionally fetch values or set them to null if debugMode is off
    const atmosphericPressure = convertPressure(getSignalKValue('environment.outside.pressure'));
    const humidity = getSignalKValue('environment.inside.relativeHumidity') ;
    const vocConcentration =  getSignalKValue('environment.inside.voc') ;

        
        // Set modes after hydration
           useEffect(() => {
               const modes = [];
               if (atmosphericPressure !== null) modes.push('pressure');
               if (humidity !== null) modes.push('humidity');
               if (vocConcentration !== null) modes.push('voc');

               setAvailableModes(modes);
               if (modes.length > 0) {
                   setDisplayMode(modes[0]);
               }
           }, [atmosphericPressure, humidity, vocConcentration]);

           const toggleDisplayMode = () => {
               if (availableModes.length === 0) return;

               const currentIndex = availableModes.indexOf(displayMode);
               const nextModeIndex = (currentIndex + 1) % availableModes.length;
               setDisplayMode(availableModes[nextModeIndex]);
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
            {!displayMode && (
                           <div className="text-2xl">
                               <span>NA</span>
                           </div>
                       )}
        </div>
    );
};

export default BottomEnvironmentalWidget;
