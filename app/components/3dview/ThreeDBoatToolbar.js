import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnchor, faShip, faPersonFalling, faMoon, faWater, faParking, faSatellite } from '@fortawesome/free-solid-svg-icons';
import { useOcearoContext } from '../context/OcearoContext';

const ThreeDBoatToolbar = () => {
    const { nightMode, setNightMode, states, toggleState } = useOcearoContext();

    // Dynamic text color based on night mode
    const textColor = nightMode ? 'text-oNight' : 'text-oGray';

    return (
        <div className="text-lg">
            {/* Autopilot */}
            <button
                onClick={() => toggleState('autopilot')}
                className={`p-1`}
            >
                <FontAwesomeIcon icon={faShip} className={states.autopilot ? 'text-oBlue ' : textColor} />
            </button>

            {/* Anchor Watch */}
            <button
                onClick={() => toggleState('anchorWatch')}
                className={`p-1`}
            >
                <FontAwesomeIcon icon={faAnchor} className={states.anchorWatch ? 'text-oYellow ' : textColor} />
            </button>
            

            {/* Parking Mode */}
            <button
                onClick={() => toggleState('parkingMode')}
                className={`p-1`}
            >
                <FontAwesomeIcon icon={faParking} className={states.parkingMode ? 'text-oGreen ' : textColor} />
            </button>

            {/* MOB */}
            <button
                onClick={() => toggleState('mob')}
                className={`p-1`}
            >
                <FontAwesomeIcon icon={faPersonFalling} className={states.mob ? 'text-oRed ' : textColor} />
            </button>

            {/* Night Mode */}
            <button
                onClick={() => setNightMode(!nightMode)}
                className={`p-1`}
            >
                <FontAwesomeIcon icon={faMoon} className={states.nightMode ? 'text-oNight ' : textColor} />
            </button>
            
            

            {/* See State */}
            <button
                onClick={() => toggleState('showOcean')}
                className={`p-1`}
            >
                <FontAwesomeIcon icon={faWater} className={states.showOcean ? 'text-oBlue ' : textColor} />
            </button>



            <button
                onClick={() => toggleState('ais')}
                className={`p-1`}
            >
                <FontAwesomeIcon icon={faSatellite} className={states.ais ? 'text-oGreen ' : textColor} />
            </button>

        </div>
    );
};

export default ThreeDBoatToolbar;
