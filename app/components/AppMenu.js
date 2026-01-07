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
    faCompass
} from '@fortawesome/free-solid-svg-icons';
import { VIEW_MODES } from '../page';
import { isOcearoCoreEnabled } from './utils/OcearoCoreUtils';

const AppMenu = ({
    currentViewMode,
    toggleViewMode,
    handleSetRightView,
    toggleFullscreen,
    setShowAppMenu,
}) => {
    // Check if Jarvis is enabled
    const jarvisEnabled = isOcearoCoreEnabled();

    const MenuButton = ({ icon, label, onClick }) => (
        <button
            onClick={() => {
                onClick();
                setShowAppMenu(false);
            }}
            className="flex items-center text-white p-2 rounded-md hover:bg-gray-700 transition"
        >
            <FontAwesomeIcon icon={icon} className="mr-2" /> {label}
        </button>
    );

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 20, x: '-50%', opacity: 0, scale: 0.95 }}
                animate={{ y: 0, x: '-50%', opacity: 1, scale: 1 }}
                exit={{ y: 20, x: '-50%', opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="fixed bottom-24 left-1/2 bg-black/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl z-50 w-full max-w-md border border-white/10"
            >
                <div className="grid grid-cols-2 gap-3">
                {currentViewMode !== VIEW_MODES.SPLIT && (
                    <MenuButton icon={faExpand} label="Split View" onClick={() => toggleViewMode(VIEW_MODES.SPLIT)} />
                )}
                {currentViewMode !== VIEW_MODES.APP && (
                    <MenuButton icon={faExpand} label="Full View" onClick={() => toggleViewMode(VIEW_MODES.APP)} />
                )}
                <MenuButton 
                    icon={faChartLine} 
                    label="Dashboard" 
                    onClick={() => handleSetRightView('dashboard')} 
                /> 
                {jarvisEnabled && (
                    <MenuButton 
                        icon={faBook} 
                        label="Logbook" 
                        onClick={() => handleSetRightView('logbook')} 
                    />
                )}
                <MenuButton 
                    icon={faCompass} 
                    label="Autopilot" 
                    onClick={() => handleSetRightView('autopilot')} 
                />
                {currentViewMode !== VIEW_MODES.BOAT && (
                    <MenuButton icon={faShip} label="Boat View" onClick={() => toggleViewMode(VIEW_MODES.BOAT)} />
                )}

               
                <MenuButton
                    icon={faHandsHelping}
                    label="Manual"
                    onClick={() => handleSetRightView('manual')}
                />

                <MenuButton
                    icon={faTachometerAlt}
                    label="Instruments"
                    onClick={() => handleSetRightView('instrument')}
                />

                <MenuButton
                    icon={faVideo}
                    label="Webcam"
                    onClick={() => handleSetRightView('webcam1')}
                />

                <MenuButton
                    icon={faMapMarkedAlt}
                    label="Navigation"
                    onClick={() => handleSetRightView('navigation')}
                />

                <MenuButton
                    icon={faCogs}
                    label="Settings"
                    onClick={() => handleSetRightView('settings')}
                />

                <MenuButton
                    icon={faCloudSun}
                    label="Weather"
                    onClick={() => handleSetRightView('weather')}
                />

                <MenuButton
                    icon={faBatteryFull}
                    label="Battery"
                    onClick={() => handleSetRightView('battery')}
                />

                <MenuButton
                    icon={faExclamationTriangle}
                    label="Engine"
                    onClick={() => handleSetRightView('motor')}
                />

                <MenuButton
                    icon={faHeadphones}
                    label="Media player"
                    onClick={() => handleSetRightView('mediaplayer')}
                />

                <MenuButton
                    icon={faExpand}
                    label="Toggle Fullscreen"
                    onClick={toggleFullscreen}
                />


                {/* Refresh Page Button */}
                <MenuButton
                    icon={faSyncAlt}
                    label="Refresh"
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