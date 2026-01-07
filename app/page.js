'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useDrag } from '@use-gesture/react';
import { OcearoContextProvider } from './components/context/OcearoContext';
import { WeatherContextProvider } from './components/context/WeatherContext';
import ErrorBoundary from './ErrorBoundary';
import configService from './components/settings/ConfigService';

// Dynamically import components for code splitting
const RightPane = dynamic(() => import('./components/RightPane'), {
  loading: () => <div className="w-full h-full flex items-center justify-center">Loading...</div>
});

const BottomNavigation = dynamic(() => import('./components/BottomNavigation'));

const AppMenu = dynamic(() => import('./components/AppMenu'));

// Keep ThreeDMainView import dynamic with custom loading component
const ThreeDMainView = dynamic(() => import('./components/3dview/ThreeDMainView'), {
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-white text-2xl">Loading 3D View...</div>
    </div>
  ),
  ssr: false // Disable server-side rendering for 3D components
});

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
    const nodeRef = useRef(null);
    
    // State management
    const [currentViewMode, setCurrentViewMode] = useState(null);
    const [rightView, setRightView] = useState(() => configService.getCurrentView() || 'navigation');
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

    const bind = useDrag(({ movement: [x] }) => {
        const totalWidth = window.innerWidth;
        const threshold = totalWidth / 5;

        if (x > threshold) {
            toggleViewMode(VIEW_MODES.BOAT);
        } else if (x < -threshold) {
            toggleViewMode(VIEW_MODES.APP);
        } else {
            toggleViewMode(VIEW_MODES.SPLIT);
        }
    }, { axis: 'x' });

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
        configService.setCurrentView(view);
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
                <WeatherContextProvider>
                    <div className="h-screen flex flex-col bg-black relative overflow-hidden">
                        <div className="flex flex-1 min-h-0">
                            <div className={layoutClasses.leftPane}>
                                <ThreeDMainView  />
                            </div>

                            <div 
                                ref={nodeRef} 
                                {...bind()} 
                                className="handle w-1 bg-leftPaneBg h-full cursor-col-resize transition-all duration-200 flex items-center justify-center touch-none"
                            >
                                <div className="rounded-full w-3 bg-gray-600 h-40 transition-all duration-200 hover:bg-gray-500" />
                            </div>

                            <div className={layoutClasses.rightPane}>
                                <RightPane view={rightView} />
                            </div>
                        </div>

                        <div className="w-full h-16 min-h-16 bg-black flex items-center justify-center shrink-0">
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
                </WeatherContextProvider>
            </OcearoContextProvider>
        </ErrorBoundary>
    );
}