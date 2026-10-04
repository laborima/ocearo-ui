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

const MenuButton = ({ icon, label, onClick, onClose }) => (
    <button
        onClick={() => {
            onClick();
            onClose();
        }}
        className="flex items-center text-hud-main px-2 py-2 sm:px-4 sm:py-3 rounded-xl tesla-hover transition-all duration-200 group bg-hud-bg shadow-soft border border-hud"
    >
        <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-hud-elevated rounded-lg mr-2 sm:mr-3 group-hover:scale-110 transition-transform shrink-0">
            <FontAwesomeIcon icon={icon} className="text-sm sm:text-base text-hud-muted group-hover:text-hud-main transition-colors" />
        </div>
        <span className="hidden sm:block text-caption sm:text-label font-bold uppercase tracking-widest truncate">{label}</span>
    </button>
);

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
    const closeMenu = () => setShowAppMenu(false);

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
                    <MenuButton onClose={closeMenu} icon={faExpand} label={t('menu.splitView')} onClick={() => toggleViewMode(VIEW_MODES.SPLIT)} />
                )}
                {currentViewMode !== VIEW_MODES.APP && (
                    <MenuButton onClose={closeMenu} icon={faExpand} label={t('menu.fullView')} onClick={() => toggleViewMode(VIEW_MODES.APP)} />
                )}
                <MenuButton onClose={closeMenu}
                    icon={faChartLine} 
                    label={t('menu.dashboard')} 
                    onClick={() => handleSetRightView('dashboard')} 
                /> 
                {jarvisEnabled && (
                    <MenuButton onClose={closeMenu}
                        icon={faBook} 
                        label={t('menu.logbook')} 
                        onClick={() => handleSetRightView('logbook')} 
                    />
                )}
                <MenuButton onClose={closeMenu}
                    icon={faCompass} 
                    label={t('menu.autopilot')} 
                    onClick={() => handleSetRightView('autopilot')} 
                />
                {currentViewMode !== VIEW_MODES.BOAT && (
                    <MenuButton onClose={closeMenu} icon={faShip} label={t('menu.boatView')} onClick={() => toggleViewMode(VIEW_MODES.BOAT)} />
                )}

               
                <MenuButton onClose={closeMenu}
                    icon={faHandsHelping}
                    label={t('menu.manual')}
                    onClick={() => handleSetRightView('manual')}
                />

                <MenuButton onClose={closeMenu}
                    icon={faTachometerAlt}
                    label={t('menu.instruments')}
                    onClick={() => handleSetRightView('instrument')}
                />

                <MenuButton onClose={closeMenu}
                    icon={faVideo}
                    label={t('menu.webcam')}
                    onClick={() => handleSetRightView('webcam1')}
                />

                <MenuButton onClose={closeMenu}
                    icon={faMapMarkedAlt}
                    label={t('menu.navigation')}
                    onClick={() => handleSetRightView('navigation')}
                />

                <MenuButton onClose={closeMenu}
                    icon={faCogs}
                    label={t('menu.settings')}
                    onClick={toggleSettings}
                />

                <MenuButton onClose={closeMenu}
                    icon={faCloudSun}
                    label={t('menu.weather')}
                    onClick={() => handleSetRightView('weather')}
                />

                <MenuButton onClose={closeMenu}
                    icon={faBatteryFull}
                    label={t('menu.battery')}
                    onClick={() => handleSetRightView('battery')}
                />

                <MenuButton onClose={closeMenu}
                    icon={faExclamationTriangle}
                    label={t('menu.engine')}
                    onClick={() => handleSetRightView('motor')}
                />

                <MenuButton onClose={closeMenu}
                    icon={faHeadphones}
                    label={t('menu.mediaPlayer')}
                    onClick={() => handleSetRightView('mediaplayer')}
                />

                <MenuButton onClose={closeMenu}
                    icon={faExpand}
                    label={t('menu.toggleFullscreen')}
                    onClick={toggleFullscreen}
                />


                {debugMode && (
                    <MenuButton onClose={closeMenu}
                        icon={faBug}
                        label={t('menu.debug')}
                        onClick={() => handleSetRightView('debug')}
                    />
                )}

                {/* Refresh Page Button */}
                <MenuButton onClose={closeMenu}
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