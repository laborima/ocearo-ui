import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnchor, faShip, faPersonFalling, faMoon, faWater, faParking, faSatellite, faCompass, faRulerCombined } from '@fortawesome/free-solid-svg-icons';
import { useOcearoContext } from '../context/OcearoContext';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const ThreeDBoatToolbar = () => {
    const { t } = useTranslation();
    const { nightMode, setNightMode, states, toggleState, toggleExclusiveMode } = useOcearoContext();
    const prevAutopilotRef = useRef(states.autopilot);

    // Dynamic text color based on night mode
    const activeColor = {
        autopilot: 'text-oBlue',
        anchorWatch: 'text-oYellow',
        parkingMode: 'text-oGreen',
        nightMode: 'text-oNight',
        ocean: 'text-oBlue',
        polar: 'text-oBlue',
        laylines: 'text-oGreen',
        ais: 'text-oGreen'
    };

    const ToolbarButton = ({ onClick, icon, isActive, activeClass, label }) => (
        <button
            onClick={onClick}
            className={`p-2 rounded-xl tesla-hover transition-all duration-300 group relative ${isActive ? 'bg-hud-elevated shadow-soft' : ''}`}
            title={label}
        >
            <FontAwesomeIcon 
                icon={icon} 
                className={`text-xl transition-all duration-300 ${isActive ? activeClass + ' scale-110' : 'text-hud-muted group-hover:text-hud-main'}`} 
            />
            {isActive && (
                <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${activeClass.replace('text-', 'bg-')} animate-soft-pulse`} />
            )}
        </button>
    );

    return (
        <div className="flex items-center space-x-1 p-1.5 rounded-2xl">
            <ToolbarButton
                onClick={() => toggleExclusiveMode('autopilot')}
                icon={faShip}
                isActive={states.autopilot}
                activeClass={activeColor.autopilot}
                label={t('toolbar.autopilot')}
            />

            <ToolbarButton
                onClick={() => toggleExclusiveMode('anchorWatch')}
                icon={faAnchor}
                isActive={states.anchorWatch}
                activeClass={activeColor.anchorWatch}
                label={t('toolbar.anchorWatch')}
            />

            <ToolbarButton
                onClick={() => toggleExclusiveMode('parkingMode')}
                icon={faParking}
                isActive={states.parkingMode}
                activeClass={activeColor.parkingMode}
                label={t('toolbar.parkingMode')}
            />

            <div className="h-6 w-[1px] bg-hud-border mx-0.5" />

            <ToolbarButton
                onClick={() => setNightMode(!nightMode)}
                icon={faMoon}
                isActive={nightMode}
                activeClass={activeColor.nightMode}
                label={t('toolbar.nightMode')}
            />

            <ToolbarButton
                onClick={() => toggleState('showOcean')}
                icon={faWater}
                isActive={states.showOcean}
                activeClass={activeColor.ocean}
                label={t('toolbar.seaState')}
            />

            {states.autopilot && !states.showOcean && (
                <ToolbarButton
                    onClick={() => toggleState('showPolar')}
                    icon={faCompass}
                    isActive={states.showPolar}
                    activeClass={activeColor.polar}
                    label={t('toolbar.polarView')}
                />
            )}

            {states.autopilot && (
                <ToolbarButton
                    onClick={() => toggleState('showLaylines3D')}
                    icon={faRulerCombined}
                    isActive={states.showLaylines3D}
                    activeClass={activeColor.laylines}
                    label={t('toolbar.laylines3D')}
                />
            )}

            {states.autopilot && (
                <ToolbarButton
                    onClick={() => toggleState('ais')}
                    icon={faSatellite}
                    isActive={states.ais}
                    activeClass={activeColor.ais}
                    label={t('toolbar.aisRadar')}
                />
            )}
        </div>
    );
};

export default ThreeDBoatToolbar;