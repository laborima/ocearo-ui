import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faShip,
    faHandsHelping,
    faCogs,
    faMapMarkedAlt,
    faVideo,
    faTachometerAlt,
    faCloudSun,
    faExpand,
    faBatteryFull,
    faHeadphones,
    faSyncAlt,
    faChartLine,
    faExclamationTriangle,
    faBook,
    faCompass,
    faBug
} from '@fortawesome/free-solid-svg-icons';
import configService from './settings/ConfigService';
import { VIEW_MODES } from '../page';
import { isOcearoCoreEnabled } from './utils/OcearoCoreUtils';
import { useTranslation } from 'react-i18next';

const AppMenu = ({
    currentViewMode,
    toggleViewMode,
    handleSetRightView,
    toggleSettings,
    toggleFullscreen,
    setShowAppMenu,
}) => {
    const { t } = useTranslation();
    const jarvisEnabled = isOcearoCoreEnabled();
    const debugMode = configService.get('debugMode');

    const MenuButton = ({ icon, label, onClick }) => (
        <button
            onClick={() => {
                onClick();
                setShowAppMenu(false);
            }}
            className="flex items-center text-hud-main px-2 py-2 sm:px-4 sm:py-3 rounded-xl tesla-hover transition-all duration-200 group bg-hud-bg shadow-soft border border-hud"
        >
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-hud-elevated rounded-lg mr-2 sm:mr-3 group-hover:scale-110 transition-transform shrink-0">
                <FontAwesomeIcon icon={icon} className="text-sm sm:text-base text-hud-muted group-hover:text-hud-main transition-colors" />
            </div>
            <span className="hidden sm:block text-xs sm:text-sm font-bold uppercase tracking-widest truncate">{label}</span>
        </button>
    );

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 20, x: '-50%', opacity: 0, scale: 0.95 }}
                animate={{ y: 0, x: '-50%', opacity: 1, scale: 1 }}
                exit={{ y: 20, x: '-50%', opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="fixed bottom-20 left-1/2 bg-hud-bg backdrop-blur-xl p-3 sm:p-6 rounded-3xl shadow-2xl z-50 w-[95vw] sm:w-full max-w-lg border border-hud ocearo-appmenu-scroll"
            >
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {currentViewMode !== VIEW_MODES.SPLIT && (
                    <MenuButton icon={faExpand} label={t('menu.splitView')} onClick={() => toggleViewMode(VIEW_MODES.SPLIT)} />
                )}
                {currentViewMode !== VIEW_MODES.APP && (
                    <MenuButton icon={faExpand} label={t('menu.fullView')} onClick={() => toggleViewMode(VIEW_MODES.APP)} />
                )}
                <MenuButton 
                    icon={faChartLine} 
                    label={t('menu.dashboard')} 
                    onClick={() => handleSetRightView('dashboard')} 
                /> 
                {jarvisEnabled && (
                    <MenuButton 
                        icon={faBook} 
                        label={t('menu.logbook')} 
                        onClick={() => handleSetRightView('logbook')} 
                    />
                )}
                <MenuButton 
                    icon={faCompass} 
                    label={t('menu.autopilot')} 
                    onClick={() => handleSetRightView('autopilot')} 
                />
                {currentViewMode !== VIEW_MODES.BOAT && (
                    <MenuButton icon={faShip} label={t('menu.boatView')} onClick={() => toggleViewMode(VIEW_MODES.BOAT)} />
                )}

               
                <MenuButton
                    icon={faHandsHelping}
                    label={t('menu.manual')}
                    onClick={() => handleSetRightView('manual')}
                />

                <MenuButton
                    icon={faTachometerAlt}
                    label={t('menu.instruments')}
                    onClick={() => handleSetRightView('instrument')}
                />

                <MenuButton
                    icon={faVideo}
                    label={t('menu.webcam')}
                    onClick={() => handleSetRightView('webcam1')}
                />

                <MenuButton
                    icon={faMapMarkedAlt}
                    label={t('menu.navigation')}
                    onClick={() => handleSetRightView('navigation')}
                />

                <MenuButton
                    icon={faCogs}
                    label={t('menu.settings')}
                    onClick={toggleSettings}
                />

                <MenuButton
                    icon={faCloudSun}
                    label={t('menu.weather')}
                    onClick={() => handleSetRightView('weather')}
                />

                <MenuButton
                    icon={faBatteryFull}
                    label={t('menu.battery')}
                    onClick={() => handleSetRightView('battery')}
                />

                <MenuButton
                    icon={faExclamationTriangle}
                    label={t('menu.engine')}
                    onClick={() => handleSetRightView('motor')}
                />

                <MenuButton
                    icon={faHeadphones}
                    label={t('menu.mediaPlayer')}
                    onClick={() => handleSetRightView('mediaplayer')}
                />

                <MenuButton
                    icon={faExpand}
                    label={t('menu.toggleFullscreen')}
                    onClick={toggleFullscreen}
                />


                {debugMode && (
                    <MenuButton
                        icon={faBug}
                        label={t('menu.debug')}
                        onClick={() => handleSetRightView('debug')}
                    />
                )}

                {/* Refresh Page Button */}
                <MenuButton
                    icon={faSyncAlt}
                    label={t('menu.refresh')}
                    onClick={() => {
                        window.location.reload();
                    }}
                />
            </div>
        </motion.div>
        </AnimatePresence>
    );
};

export default AppMenu;