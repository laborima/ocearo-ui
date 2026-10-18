import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef, useState } from 'react';
import { faAnchor, faShip, faMoon, faSun, faEye, faCircleHalfStroke, faWater, faParking, faSatellite, faCompass, faRulerCombined, faCube, faBorderAll, faWind, faLayerGroup, faLifeRing, faCheck } from '@fortawesome/free-solid-svg-icons';
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

/**
 * The layers drawn over the base: a small opaque menu of switches, closed by a
 * tap elsewhere or Escape.
 */
const LayersMenu = ({ layers, onToggle, label }) => {
    const [open, setOpen] = useState(false);
    const box = useRef(null);
    useEffect(() => {
        if (!open) return undefined;
        const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
        const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('pointerdown', away);
        document.addEventListener('keydown', esc);
        return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
    }, [open]);
    const anyOn = layers.some((l) => l.on);
    return (
        <div ref={box} className="relative">
            <ToolbarButton onClick={() => setOpen((o) => !o)} icon={faLayerGroup} isActive={open || anyOn} activeClass="text-oBlue" label={label} />
            {open && (
                <div role="menu" aria-label={label}
                    className="bg-hud-menu absolute left-0 top-full mt-2 z-50 min-w-[13rem] p-2 rounded-2xl border border-hud shadow-2xl flex flex-col gap-1">
                    {layers.map((l) => (
                        <button key={l.key} role="menuitemcheckbox" aria-checked={l.on} onClick={() => onToggle(l.key)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-label tesla-hover ${l.on ? 'text-hud-main' : 'text-hud-muted'}`}>
                            <FontAwesomeIcon icon={l.icon} className={`w-4 ${l.on ? l.color : ''}`} />
                            <span className="flex-1">{l.label}</span>
                            <FontAwesomeIcon icon={faCheck} className={`w-3 ${l.on ? 'text-oBlue' : 'opacity-0'}`} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

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

    // The base of the scene, cycled by one button: the sea, the plain grid, the 3D chart
    const OCEAN_MODE_CONFIG = {
        water: { icon: faWater,     color: 'text-oBlue',  label: t('toolbar.oceanWater') },
        black: { icon: faBorderAll, color: 'text-hud-main', label: t('toolbar.oceanBlack') },
        depth: { icon: faCube,      color: 'text-oGreen', label: t('toolbar.oceanDepth') },
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

    const currentOceanMode = OCEAN_MODE_CONFIG[states.oceanMode] ? states.oceanMode : 'black';
    const oceanConfig = OCEAN_MODE_CONFIG[currentOceanMode];
    const layers = [
        { key: 'ais', on: !!states.ais, icon: faSatellite, color: 'text-oGreen', label: t('toolbar.aisRadar') },
        { key: 'showWind', on: !!states.showWind, icon: faWind, color: 'text-oYellow', label: t('toolbar.layerWind') },
        { key: 'showLaylines3D', on: !!states.showLaylines3D, icon: faRulerCombined, color: 'text-oGreen', label: t('toolbar.laylines3D') },
        { key: 'showPolar', on: !!states.showPolar, icon: faCompass, color: 'text-oBlue', label: t('toolbar.polarView') },
        { key: 'showSeamarks', on: !!states.showSeamarks, icon: faLifeRing, color: 'text-oYellow', label: t('toolbar.layerSeamarks') },
    ];


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
                isActive
                activeClass={oceanConfig.color}
                label={oceanConfig.label}
            />

            <LayersMenu layers={layers} onToggle={(key) => toggleState(key)} label={t('toolbar.layers')} />
        </div>
    );
};

export default ThreeDBoatToolbar;