import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnchor, faShip, faPersonFalling, faMoon, faEye } from '@fortawesome/free-solid-svg-icons';
import { useThreeDView } from './context/ThreeDViewContext';
//import { useOcearoContext } from '../../OcearoContext';

const ThreeDBoatToolbar = () => {
    const { nightMode, setNightMode, states, toggleState } = useThreeDView();
  //  const {getSignalKValue}  = useOcearoContext();

    // Use SignalK client to get seeState from the SignalK server
   // const seeState = getSignalKValue('navigation.seeState'); // Fetch SignalK value for seeState

    // Dynamic text color based on night mode
    const textColor = nightMode ? 'text-red-500' : 'text-white';

    return (
        <div>
            {/* Autopilot */}
            <button
                onClick={() => toggleState('autopilot')}
                className={`p-1 rounded-full ${states.autopilot ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : 'bg-gray-800'}`}
            >
                <FontAwesomeIcon icon={faShip} className={textColor + " text-lg"} />
            </button>

            {/* Anchor Watch */}
            <button
                onClick={() => toggleState('anchorWatch')}
                className={`p-1 rounded-full ${states.anchorWatch ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' : 'bg-gray-800'}`}
            >
                <FontAwesomeIcon icon={faAnchor} className={textColor + " text-lg"} />
            </button>

            {/* MOB */}
            <button
                onClick={() => toggleState('mob')}
                className={`p-1 rounded-full ${states.mob ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-gray-800'}`}
            >
                <FontAwesomeIcon icon={faPersonFalling} className={textColor + " text-lg"} />
            </button>

            {/* Night Mode */}
            <button
                onClick={() => setNightMode(!nightMode)}
                className={`p-1 rounded-full ${nightMode ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : 'bg-gray-800'}`}
            >
                <FontAwesomeIcon icon={faMoon} className={textColor + " text-lg"} />
            </button>

            {/* See State - Display real-time seeState from SignalK */}
            <button 
            onClick={() => toggleState('seeView')}
            className="p-1 rounded-full bg-gray-800">
                <FontAwesomeIcon icon={faEye} className={textColor + " text-lg"} />
            </button>
        </div>
    );
};

export default ThreeDBoatToolbar;
