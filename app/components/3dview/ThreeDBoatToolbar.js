import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnchor, faShip, faPersonFalling, faMoon, faWater } from '@fortawesome/free-solid-svg-icons';
import { useThreeDView } from './context/ThreeDViewContext';
//import { useOcearoContext } from '../../OcearoContext';

const ThreeDBoatToolbar = () => {
    const { nightMode, setNightMode, states, toggleState } = useThreeDView();
    
   // const {getSignalKValue}  = useOcearoContext();

    // Use SignalK client to get seeState from the SignalK server
   // const seeState = getSignalKValue('navigation.seeState'); // Fetch SignalK value for seeState

    // Dynamic text color based on night mode
    const textColor = nightMode ? 'text-oNight' : 'text-oGray';

    return (
        <div class="text-lg" >
            {/* Autopilot */}
            <button
                onClick={() => toggleState('autopilot')}
                className={`p-1 `}
            >
                <FontAwesomeIcon icon={faShip} className={states.autopilot ? 'text-oBlue text-xl' : textColor } />
            </button>

            {/* Anchor Watch */}
            <button
                onClick={() => toggleState('anchorWatch')}
                className={`p-1  `}
            >
                <FontAwesomeIcon icon={faAnchor} className={states.anchorWatch ? 'text-oYellow text-xl' :textColor } />
            </button>

            {/* MOB */}
            <button
                onClick={() => toggleState('mob')}
                className={`p-1 `}
            >
                <FontAwesomeIcon icon={faPersonFalling} className={states.mob ? 'text-oRed  text-xl' : textColor } />
            </button>

            {/* Night Mode */}
            <button
                onClick={() => setNightMode(!nightMode)}
                className={`p-1`}
            >
                <FontAwesomeIcon icon={faMoon} className={states.nightMode ? "text-oNight text-xl": textColor } />
            </button>

            {/* See State - Display real-time seeState from SignalK */}
            <button 
            onClick={() => toggleState('showOcean')}
            className={`p-1`}>
                <FontAwesomeIcon icon={faWater} className={states.showOcean ? 'text-oBlue text-xl' : textColor } />
            </button>
        </div>
    );
};

export default ThreeDBoatToolbar;
