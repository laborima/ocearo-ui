'use client';

import React, { useState } from 'react';
import Draggable from 'react-draggable';
import RightPane from './components/RightPane';
import BottomNavigation from './components/BottomNavigation';
import { OcearoContextProvider } from './components/context/OcearoContext';
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
} from '@fortawesome/free-solid-svg-icons';
import ThreeDMainView from './components/3dview/ThreeDMainView';
import ErrorBoundary from './ErrorBoundary';

export default function Home() {
    const [rightView, setRightView] = useState('settings');
    const [isLeftPaneFullScreen, setIsLeftPaneFullScreen] = useState(true);
    const [isRightPaneFullScreen, setIsRightPaneFullScreen] = useState(false);
    const [showAppMenu, setShowAppMenu] = useState(false);
    const [fullscreenSet, setFullscreenSet] = useState(false); // Track if fullscreen is already set
   

    const handleSetFullScreen = (fullScreen) => {
        if (!fullscreenSet && fullScreen) {
            setIsLeftPaneFullScreen(true);
            setFullscreenSet(true); // Set the flag to avoid further updates
        }
    };

    const toggleAppMenu = () => setShowAppMenu(!showAppMenu);

    const handleDrag = (e, data) => {
        
          
        const totalWidth = window.innerWidth;
        const threshold = totalWidth / 5;

        if (data.x > threshold) {
            setIsLeftPaneFullScreen(true);
            setIsRightPaneFullScreen(false);
        } else if (data.x < -threshold) {
            setIsRightPaneFullScreen(true);
            setIsLeftPaneFullScreen(false);
        } else {
            setIsLeftPaneFullScreen(false);
            setIsRightPaneFullScreen(false);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    // Updated setRightView function
    const handleSetRightView = (view) => {
        if (isLeftPaneFullScreen) {
            setIsRightPaneFullScreen(true);
            setIsLeftPaneFullScreen(false);
        }
        setRightView(view);
    };

    return (
        <ErrorBoundary>
            <OcearoContextProvider>
                <div className="h-screen flex flex-col bg-black relative">
                    <div className="flex flex-1">
                        <div
                            className={`transition-all duration-300 ${isLeftPaneFullScreen ? 'w-full' : isRightPaneFullScreen ? 'hidden' : 'w-2/5'
                                } bg-leftPaneBg h-full relative`}
                        >
                            <ThreeDMainView setFullScreen={handleSetFullScreen} />
                        </div>

                        {/* Draggable Slider */}
                        <Draggable 
                            axis="x"
                            onDrag={handleDrag}
                           position={{ x: 0, y: 0 }}
                            handle=".handle"
                        >
                            <div className="handle w-1 bg-leftPaneBg h-full cursor-col-resize transition-all duration-200 flex items-center justify-center">
                                <div className="rounded-full w-3 bg-gray-600 h-40 transition-all duration-200 hover:bg-gray-500"></div>
                            </div>
                        </Draggable>

                        <div
                            className={`transition-all duration-300 ${isRightPaneFullScreen ? 'w-full' : isLeftPaneFullScreen ? 'hidden' : 'w-3/5'
                                } h-full bg-rightPaneBg p-4`}
                        >
                            <RightPane view={rightView} />
                        </div>
                    </div>

                    <div className="w-full h-16 bg-black flex items-center justify-center">
                        <BottomNavigation
                            setRightView={handleSetRightView}
                            toggleAppMenu={toggleAppMenu}
                        />
                    </div>

                    {showAppMenu && (
                        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-black p-6 rounded-lg shadow-lg z-50 w-200">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Show Split View button only if IsRightPaneFullScreen or IsLeftPaneFullScreen */}
                                {(isRightPaneFullScreen || isLeftPaneFullScreen) && (
                                    <button
                                        onClick={() => {
                                            setIsRightPaneFullScreen(false);
                                            setIsLeftPaneFullScreen(false);
                                            setShowAppMenu(false);
                                        }}
                                        className="flex items-center text-white p-2 rounded-md hover:bg-gray-700 transition">
                                        <FontAwesomeIcon icon={faShip} className="mr-2" /> Split View
                                    </button>
                                )}

                                {/* Show Boat View button only if IsRightPaneFullScreen */}
                                {isRightPaneFullScreen && (
                                    <button
                                        onClick={() => {
                                            setIsRightPaneFullScreen(false);
                                            setIsLeftPaneFullScreen(true);
                                            setShowAppMenu(false);
                                        }}
                                        className="flex items-center text-white p-2 rounded-md hover:bg-gray-700 transition">
                                        <FontAwesomeIcon icon={faShip} className="mr-2" /> Boat View
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        handleSetRightView('manual');
                                        setShowAppMenu(false);
                                    }}
                                    className="flex items-center text-white p-2 rounded-md hover:bg-gray-700 transition">
                                    <FontAwesomeIcon icon={faHandsHelping} className="mr-2" /> Manual
                                </button>
                                <button
                                    onClick={() => {
                                        handleSetRightView('instrument');
                                        setShowAppMenu(false);
                                    }}
                                    className="flex items-center text-white p-2 rounded-md hover:bg-gray-700 transition">
                                    <FontAwesomeIcon icon={faTachometerAlt} className="mr-2" /> Instruments
                                </button>
                                <button
                                    onClick={() => {
                                        handleSetRightView('webcam1');
                                        setShowAppMenu(false);
                                    }}
                                    className="flex items-center text-white p-2 rounded-md hover:bg-gray-700 transition">
                                    <FontAwesomeIcon icon={faVideo} className="mr-2" /> Webcam
                                </button>
                                <button
                                    onClick={() => {
                                        handleSetRightView('navigation');
                                        setShowAppMenu(false);
                                    }}
                                    className="flex items-center text-white p-2 rounded-md hover:bg-gray-700 transition">
                                    <FontAwesomeIcon icon={faMapMarkedAlt} className="mr-2" /> Navigation
                                </button>
                                <button
                                    onClick={() => {
                                        handleSetRightView('settings');
                                        setShowAppMenu(false);
                                    }}
                                    className="flex items-center text-white p-2 rounded-md hover:bg-gray-700 transition">
                                    <FontAwesomeIcon icon={faCogs} className="mr-2" /> Settings
                                </button>
                                <button
                                    onClick={() => {
                                        handleSetRightView('weather');
                                        setShowAppMenu(false);
                                    }}
                                    className="flex items-center text-white p-2 rounded-md hover:bg-gray-700 transition">
                                    <FontAwesomeIcon icon={faCloudSun} className="mr-2" /> Weather
                                </button>
                                <button
                                    onClick={() => {
                                        toggleFullscreen();
                                        setShowAppMenu(false);
                                    }}
                                    className="flex items-center text-white p-2 rounded-md hover:bg-gray-700 transition">
                                    <FontAwesomeIcon icon={faExpand} className="mr-2" /> Toggle Fullscreen
                                </button>
                            </div>
                        </div>
                    )}


              
                </div>
            </OcearoContextProvider>
        </ErrorBoundary>
    );
}
