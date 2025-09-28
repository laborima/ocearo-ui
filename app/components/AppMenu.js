import React from 'react';
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
    faBook
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
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black p-6 rounded-lg shadow-lg z-50 w-200">
            <div className="grid grid-cols-2 gap-4">
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
                    label="Refresh Page"
                    onClick={() => {
                        window.location.reload();
                    }}
                />
            </div>
        </div>
    );
};

export default AppMenu;