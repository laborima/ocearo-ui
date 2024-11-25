'use client';

import React, { useState,useEffect } from 'react';
import Draggable from 'react-draggable';
import RightPane from './components/RightPane';
import BottomNavigation from './components/BottomNavigation';
import { OcearoContextProvider } from './components/context/OcearoContext';
import FullscreenHandler from './FullScreenHandler';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faShip,
    faParking,
    faHandsHelping,
    faCogs,
    faMapMarkedAlt,
    faVideo,
    faTachometerAlt, faCloudSun
} from '@fortawesome/free-solid-svg-icons'
import ThreeDMainView from './components/3dview/ThreeDMainView';

export default function Home() {
    const [rightView, setRightView] = useState('settings');
     const [isLeftPaneFullScreen, setIsLeftPaneFullScreen] = useState(false);
    const [isRightPaneFullScreen, setIsRightPaneFullScreen] = useState(false);
    const [showAppMenu, setShowAppMenu] = useState(false);
    const [ShowWebcam, setShowWebcam] = useState(false);
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const [fullscreenSet, setFullscreenSet] = useState(false); // Track if fullscreen is already set

      const handleSetFullScreen = (fullScreen) => {
          // Only set the fullscreen state if it hasn't been set yet
          if (!fullscreenSet && fullScreen) {
              setIsLeftPaneFullScreen(true);
              setFullscreenSet(true); // Set the flag to avoid further updates
          }
      };
      

      // Effect to handle fullscreen mode when screen width is less than or equal to 720px
      useEffect(() => {
          if (screenWidth <= 720) {
              // Force fullscreen mode for mobile and tablet-sized screens
              handleSetFullScreen(true);
          }
      }, [screenWidth]);

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


    return (
        <OcearoContextProvider>
            <div className="h-screen flex flex-col bg-black relative">
                <div className="flex flex-1">
                    <div
                        className={`transition-all duration-300 ${isLeftPaneFullScreen ? 'w-full' : isRightPaneFullScreen ? 'hidden' : 'w-2/5'
                            } bg-leftPaneBg h-full relative`}
                    >
                        <ThreeDMainView  setFullScreen={handleSetFullScreen} />
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
                        className={` transition-all duration-300 ${isRightPaneFullScreen ? 'w-full' : isLeftPaneFullScreen ? 'hidden' : 'w-3/5'
                            } h-full bg-rightPaneBg p-4`}
                    >
                        <RightPane view={rightView} />
                    </div>
                </div>



                <div className="w-full h-16 bg-black flex items-center justify-center">
                    <BottomNavigation
                        setRightView={setRightView}
                        toggleAppMenu={toggleAppMenu}
                        setShowWebcam={setShowWebcam}
                    />
                </div>

                {showAppMenu && (
                    <div className="absolute bg-white p-4 rounded-lg shadow-md top-4 left-1/2 transform -translate-x-1/2 z-50">
                        <button onClick={() => setLeftView('boat')} className="flex items-center text-black p-2">
                            <FontAwesomeIcon icon={faShip} className="mr-2" /> Boat View
                        </button>
                        <button onClick={() => setRightView('manual')} className="flex items-center text-black p-2">
                            <FontAwesomeIcon icon={faHandsHelping} className="mr-2" /> Manual
                        </button>
                        <button onClick={() => setRightView('instrument')} className="flex items-center text-black p-2">
                            <FontAwesomeIcon icon={faTachometerAlt} className="mr-2" /> Instruments
                        </button>
                        <button onClick={() => setRightView('webcam')} className="flex items-center text-black p-2">
                            <FontAwesomeIcon icon={faVideo} className="mr-2" /> Webcam
                        </button>
                        <button onClick={() => setRightView('navigation')} className="flex items-center text-black p-2">
                            <FontAwesomeIcon icon={faMapMarkedAlt} className="mr-2" /> Navigation
                        </button>
                        <button onClick={() => setRightView('webcam1')} className="flex items-center text-black p-2">
                            <FontAwesomeIcon icon={faVideo} className="mr-2" /> Webcams
                        </button>
                        <button onClick={() => setRightView('settings')} className="flex items-center text-black p-2">
                            <FontAwesomeIcon icon={faCogs} className="mr-2" /> Settings
                        </button>
                        <button onClick={() => setRightView('weather')} className="flex items-center text-black p-2">
                            <FontAwesomeIcon icon={faCloudSun} className="mr-2" /> Weather
                        </button>

                    </div>
                )}

                {ShowWebcam && (
                    <Draggable>
                        <div className="absolute top-0 right-0 p-4 bg-gray-900 text-white z-50 rounded-lg shadow-lg cursor-move">
                            <h2 className="text-lg font-bold mb-2">Webcam</h2>
                            <div className="w-64 h-48 bg-gray-700 flex items-center justify-center">
                                <p>Webcam Stream</p>
                            </div>
                        </div>
                    </Draggable>
                )}
            </div>
        </OcearoContextProvider>
    );
}
