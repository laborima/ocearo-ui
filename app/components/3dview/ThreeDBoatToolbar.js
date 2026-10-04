import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAnchor, faShip, faMoon, faSun, faEye, faCircleHalfStroke, faWater, faParking, faSatellite, faCompass, faRulerCombined, faMap, faCloudSunRain, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { THEME_MODES } from '../theme/themes';
import { useOcearoContext } from '../context/OcearoContext';
import { useTranslation } from 'react-i18next';

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

const ThreeDBoatToolbar = () => {
    const { t } = useTranslation();
    const { theme, themeMode, setTheme, states, toggleState, toggleExclusiveMode, cycleOceanMode } = useOcearoContext();

    const activeColor = {
        autopilot: 'text-oBlue',
        anchorWatch: 'text-oYellow',
        parkingMode: 'text-oGreen',
        polar: 'text-oBlue',
        laylines: 'text-oGreen',
        ais: 'text-oGreen'
    };

    const OCEAN_MODE_CONFIG = {
        black: { icon: faWater,        color: 'text-hud-muted',  label: t('toolbar.oceanBlack') },
        water: { icon: faWater,        color: 'text-oBlue',      label: t('toolbar.oceanWater') },
        chart: { icon: faMap,          color: 'text-oGreen',     label: t('toolbar.oceanChart') },
        depth: { icon: faLayerGroup,   color: 'text-oBlue',      label: t('toolbar.oceanDepth') },
        meteo: { icon: faCloudSunRain, color: 'text-oYellow',    label: t('toolbar.oceanMeteo') },
    };

    // auto -> day -> dark -> night -> auto
    const THEME_BUTTON = {
        auto: { icon: faCircleHalfStroke, label: t('toolbar.themeAuto', { theme: t(`toolbar.theme_${theme}`) }) },
        day: { icon: faSun, label: t('toolbar.theme_day') },
        dark: { icon: faMoon, label: t('toolbar.theme_dark') },
        night: { icon: faEye, label: t('toolbar.theme_night') },
    };
    const themeButton = THEME_BUTTON[themeMode] || THEME_BUTTON.dark;
    const cycleTheme = () => {
        const next = THEME_MODES[(THEME_MODES.indexOf(themeMode) + 1) % THEME_MODES.length];
        setTheme(next);
    };

    const currentOceanMode = states.oceanMode || 'black';
    const oceanConfig = OCEAN_MODE_CONFIG[currentOceanMode];


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
                onClick={cycleTheme}
                icon={themeButton.icon}
                isActive={themeMode !== 'dark'}
                activeClass="text-hud-main"
                label={themeButton.label}
            />

            <ToolbarButton
                onClick={cycleOceanMode}
                icon={oceanConfig.icon}
                isActive={currentOceanMode !== 'black'}
                activeClass={oceanConfig.color}
                label={oceanConfig.label}
            />

            {states.autopilot && currentOceanMode === 'black' && (
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