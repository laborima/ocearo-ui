'use client';

import React, { useState } from 'react';
import Draggable from 'react-draggable';
import RightPane from './components/RightPane';
import BottomNavigation from './components/BottomNavigation';
import AppMenu from './components/AppMenu';
import { OcearoContextProvider } from './components/context/OcearoContext';
import ThreeDMainView from './components/3dview/ThreeDMainView';
import ErrorBoundary from './ErrorBoundary';

export default function Home() {
    const [rightView, setRightView] = useState('settings');
    const [isLeftPaneFullScreen, setIsLeftPaneFullScreen] = useState(true);
    const [isRightPaneFullScreen, setIsRightPaneFullScreen] = useState(false);
    const [showAppMenu, setShowAppMenu] = useState(false);
    const [fullscreenSet, setFullscreenSet] = useState(false);

    const handleSetFullScreen = (fullScreen) => {
        if (!fullscreenSet && fullScreen) {
            setIsLeftPaneFullScreen(true);
            setFullscreenSet(true);
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
                            className={`transition-all duration-300 ${
                                isLeftPaneFullScreen 
                                    ? 'w-full' 
                                    : isRightPaneFullScreen 
                                        ? 'hidden' 
                                        : 'w-2/5'
                            } bg-leftPaneBg h-full relative`}
                        >
                            <ThreeDMainView setFullScreen={handleSetFullScreen} />
                        </div>

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
                            className={`transition-all duration-300 ${
                                isRightPaneFullScreen 
                                    ? 'w-full' 
                                    : isLeftPaneFullScreen 
                                        ? 'hidden' 
                                        : 'w-3/5'
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
                        <AppMenu
                            isRightPaneFullScreen={isRightPaneFullScreen}
                            isLeftPaneFullScreen={isLeftPaneFullScreen}
                            handleSetRightView={handleSetRightView}
                            setIsRightPaneFullScreen={setIsRightPaneFullScreen}
                            setIsLeftPaneFullScreen={setIsLeftPaneFullScreen}
                            toggleFullscreen={toggleFullscreen}
                            setShowAppMenu={setShowAppMenu}
                        />
                    )}
                </div>
            </OcearoContextProvider>
        </ErrorBoundary>
    );
}