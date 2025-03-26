import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnchor, faShip, faPersonFalling, faMoon, faWater, faParking, faSatellite, faCompass } from '@fortawesome/free-solid-svg-icons';
import { useOcearoContext } from '../context/OcearoContext';
import { useEffect, useRef } from 'react';

const ThreeDBoatToolbar = () => {
    const { nightMode, setNightMode, states, toggleState } = useOcearoContext();
    const prevAutopilotRef = useRef(states.autopilot);

    // Dynamic text color based on night mode
    const textColor = nightMode ? 'text-oNight' : 'text-oGray';

    // Helper function to toggle a mode, ensuring exclusivity
    const toggleExclusiveMode = (mode) => {
        const updatedStates = {
            autopilot: mode === 'autopilot',
            anchorWatch: mode === 'anchorWatch',
            parkingMode: mode === 'parkingMode',
        };

        // Update states to ensure only the selected mode is active
        Object.keys(updatedStates).forEach((key) => {
            toggleState(key, updatedStates[key]);
        });
    };

    // Enable showPolar by default ONLY when autopilot is first activated
    useEffect(() => {
        // Only enable showPolar when autopilot changes from false to true
        if (states.autopilot && !prevAutopilotRef.current) {
            toggleState('showPolar', true);
        }
        // Update the ref to track autopilot state changes
        prevAutopilotRef.current = states.autopilot;
    }, [states.autopilot, toggleState]);

    return (
        <div className="text-lg">
            {/* Autopilot */}
            <button
                onClick={() => toggleExclusiveMode('autopilot')}
                className="p-1"
            >
                <FontAwesomeIcon icon={faShip} className={states.autopilot ? 'text-oBlue' : textColor} />
            </button>



            {/* Anchor Watch */}
            <button
                onClick={() => toggleExclusiveMode('anchorWatch')}
                className="p-1"
            >
                <FontAwesomeIcon icon={faAnchor} className={states.anchorWatch ? 'text-oYellow' : textColor} />
            </button>

            {/* Parking Mode */}
            <button
                onClick={() => toggleExclusiveMode('parkingMode')}
                className="p-1"
            >
                <FontAwesomeIcon icon={faParking} className={states.parkingMode ? 'text-oGreen' : textColor} />
            </button>

            {/* MOB
      <button
        onClick={() => toggleState('mob')}
        className="p-1"
      >
        <FontAwesomeIcon icon={faPersonFalling} className={states.mob ? 'text-oRed' : textColor} />
      </button>
      */}
            {/* Night Mode */}
            <button
                onClick={() => setNightMode(!nightMode)}
                className="p-1"
            >
                <FontAwesomeIcon icon={faMoon} className={nightMode ? 'text-oNight' : textColor} />
            </button>



            {/* See State */}
            <button
                onClick={() => toggleState('showOcean')}
                className="p-1"
            >
                <FontAwesomeIcon icon={faWater} className={states.showOcean ? 'text-oBlue' : textColor} />
            </button>

            {/* Show Polar - only visible when autopilot is active and ocean is hidden */}
            {states.autopilot && !states.showOcean && (
                <button
                    onClick={() => toggleState('showPolar')}
                    className="p-1"
                >
                    <FontAwesomeIcon icon={faCompass} className={states.showPolar ? 'text-oBlue' : textColor} />
                </button>
            )}

            {/* AIS */}
            {states.autopilot && (
                <button
                    onClick={() => toggleState('ais')}
                    className="p-1"
                >
                    <FontAwesomeIcon icon={faSatellite} className={states.ais ? 'text-oGreen' : textColor} />
                </button>
            )}
        </div>

    );
};

export default ThreeDBoatToolbar;