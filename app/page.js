'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Draggable from 'react-draggable';
import RightPane from './components/RightPane';
import BottomNavigation from './components/BottomNavigation';
import AppMenu from './components/AppMenu';
import { OcearoContextProvider } from './components/context/OcearoContext';
import ThreeDMainView from './components/3dview/ThreeDMainView';
import ErrorBoundary from './ErrorBoundary';

// View mode constants
export const VIEW_MODES = {
    BOAT: 'boat',
    APP: 'app',
    SPLIT: 'split'
};

export default function Home() {
    const [rightView, setRightView] = useState('settings');
    const [showAppMenu, setShowAppMenu] = useState(false);
    const [currentViewMode, setCurrentViewMode] = useState(VIEW_MODES.BOAT);
    const [isSettingsView, setIsSettingsView] = useState(false);

    const toggleAppMenu = useCallback(() => {
        setShowAppMenu(prev => !prev);
    }, []);

    const toggleViewMode = useCallback((view) => {
        setCurrentViewMode(view);
    }, []);

    const handleDrag = useCallback((e, data) => {
        const totalWidth = window.innerWidth;
        const threshold = totalWidth / 5;

        if (data.x > threshold) {
            toggleViewMode(VIEW_MODES.BOAT);
        } else if (data.x < -threshold) {
            toggleViewMode(VIEW_MODES.APP);
        } else {
            toggleViewMode(VIEW_MODES.SPLIT);
        }
    }, [toggleViewMode]);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error('Fullscreen error:', err.message);
            });
        } else {
            document.exitFullscreen();
        }
    }, []);

    const handleSetRightView = useCallback((view) => {
        if (currentViewMode === VIEW_MODES.BOAT) {
            toggleViewMode(VIEW_MODES.APP);
        }
        setRightView(view);
    }, [currentViewMode, toggleViewMode]);

    const toggleSettings = useCallback(() => {
        if (isSettingsView) {
            toggleViewMode(VIEW_MODES.BOAT);
            setIsSettingsView(false);
        } else {
            handleSetRightView('settings');
            setIsSettingsView(true);
        }
    }, [isSettingsView, toggleViewMode, handleSetRightView]);

    // Memoize layout classes
    const layoutClasses = useMemo(() => ({
        leftPane: `transition-all duration-300 ${
            currentViewMode === VIEW_MODES.BOAT 
                ? 'w-full' 
                : currentViewMode === VIEW_MODES.APP 
                    ? 'hidden' 
                    : 'w-2/5'
        } bg-leftPaneBg h-full relative`,
        rightPane: `transition-all duration-300 ${
            currentViewMode === VIEW_MODES.APP 
                ? 'w-full' 
                : currentViewMode === VIEW_MODES.BOAT 
                    ? 'hidden' 
                    : 'w-3/5'
        } h-full bg-rightPaneBg p-4`
    }), [currentViewMode]);

    return (
        <ErrorBoundary>
            <OcearoContextProvider>
                <div className="h-screen flex flex-col bg-black relative">
                    <div className="flex flex-1">
                        <div className={layoutClasses.leftPane}>
                            <ThreeDMainView setFullScreen={() => {}} />
                        </div>

                        <Draggable 
                            axis="x"
                            onDrag={handleDrag}
                            position={{ x: 0, y: 0 }}
                            handle=".handle"
                        >
                            <div className="handle w-1 bg-leftPaneBg h-full cursor-col-resize transition-all duration-200 flex items-center justify-center">
                                <div className="rounded-full w-3 bg-gray-600 h-40 transition-all duration-200 hover:bg-gray-500" />
                            </div>
                        </Draggable>

                        <div className={layoutClasses.rightPane}>
                            <RightPane view={rightView} />
                        </div>
                    </div>

                    <div className="w-full h-16 bg-black flex items-center justify-center">
                        <BottomNavigation
                            setRightView={handleSetRightView}
                            toggleAppMenu={toggleAppMenu}
                            toggleSettings={toggleSettings}
                        />
                    </div>

                    {showAppMenu && (
                        <AppMenu
                            currentViewMode={currentViewMode}
                            toggleViewMode={toggleViewMode}
                            handleSetRightView={handleSetRightView}
                            toggleFullscreen={toggleFullscreen}
                            setShowAppMenu={setShowAppMenu}
                        />
                    )}
                </div>
            </OcearoContextProvider>
        </ErrorBoundary>
    );
}