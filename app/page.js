'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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

// Helper function to determine if screen is 15 inches or larger
const isLargeScreen = () => {
    // Common width for 15 inch laptops at typical resolution
    const fifteenInchPixelWidth = 1366;
    return window.innerWidth >= fifteenInchPixelWidth;
};

export default function Home() {
    // Use refs for values that don't need to trigger re-renders
    const initialRenderComplete = useRef(false);
    
    // State management
    const [currentViewMode, setCurrentViewMode] = useState(null);
    const [rightView, setRightView] = useState('navigation');
    const [showAppMenu, setShowAppMenu] = useState(false);
    const [isSettingsView, setIsSettingsView] = useState(false);

    // Set initial view mode based on screen size
    useEffect(() => {
        // Set view mode only on client-side to avoid hydration issues
        setCurrentViewMode(isLargeScreen() ? VIEW_MODES.SPLIT : VIEW_MODES.BOAT);
        initialRenderComplete.current = true;
        
        // Use debounced resize handler to improve performance
        let resizeTimer;
        const handleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                setCurrentViewMode(isLargeScreen() ? VIEW_MODES.SPLIT : VIEW_MODES.BOAT);
            }, 250); // Debounce resize events by 250ms
        };
        
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimer);
        };
    }, []);

    // Memoized callback functions to prevent unnecessary re-renders
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

    // Memoize layout classes to prevent unnecessary recalculations
    const layoutClasses = useMemo(() => {
        if (currentViewMode === null) return {}; // Early return during first render
        
        return {
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
        };
    }, [currentViewMode]);

    // Handle client-side rendering
    if (!initialRenderComplete.current) {
        // Return a skeleton layout that matches your app's structure
        return (
            <div className="h-screen bg-black flex items-center justify-center">
                <div className="animate-pulse text-white">Loading...</div>
            </div>
        );
    }

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
                            bounds="parent"
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