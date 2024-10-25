'use client';

import React, { useState } from 'react';
import Draggable from 'react-draggable'; // Import the Draggable component
import LeftPane from './components/LeftPane'; // Left pane containing 3DBoatView and ParkAssistView
import RightPane from './components/RightPane'; // Right pane containing the iframe
import BottomNavigation from './components/BottomNavigation'; // Bottom navigation bar
import { OcearoContextProvider } from './components/context/OcearoContext';

export default function Home() {
    const [leftView, setLeftView] = useState('boat'); // State for left pane view
    const [rightView, setRightView] = useState('manual'); // State for right pane view
    const [isLeftPaneFullScreen, setIsLeftPaneFullScreen] = useState(false); // State to track full-screen mode
    const [showAppMenu, setShowAppMenu] = useState(false); // State for App Menu popup
    const [ShowWebcam, setShowWebcam] = useState(false); // State to control showing webcam2 in a draggable pane

    // Function to toggle App Menu
    const toggleAppMenu = () => setShowAppMenu(!showAppMenu);

    // Function to handle dragging
    const handleDrag = (e, data) => {
        const totalWidth = window.innerWidth;
        const threshold = totalWidth / 3; // Threshold for switching to full width

        if (data.x > threshold) {
            setIsLeftPaneFullScreen(true);
        } else {
            setIsLeftPaneFullScreen(false);
        }
    };

    return (
        <OcearoContextProvider>
            <div className="h-screen flex flex-col bg-gray-800 relative">
                {/* Top layout: Two panes */}
                <div className="flex flex-1">
                    {/* Left container with 3D view */}
                    <div className={`transition-all duration-300 ${isLeftPaneFullScreen ? 'w-full' : 'w-1/3'} h-full relative`}>
                        <LeftPane view={leftView} /> {/* Pass the view state as prop */}
                    </div>

                    {/* Draggable Slider */}
                    <Draggable axis="x" onDrag={handleDrag} position={{ x: 0, y: 0 }}>
                        <div className="w-1 bg-gray-600 cursor-col-resize h-full" />
                    </Draggable>

                    {/* Right container with iframe */}
                    <div className={`transition-all duration-300 ${isLeftPaneFullScreen ? 'hidden' : 'w-2/3'} h-full bg-gray-900 p-4`}>
                        <RightPane view={rightView} /> {/* Pass the view state as prop */}
                    </div>
                </div>

                {/* Bottom navigation bar */}
                <div className="w-full h-16 bg-gray-700 flex items-center justify-center">
                    <BottomNavigation
                        setLeftView={setLeftView}
                        setRightView={setRightView}
                        toggleAppMenu={toggleAppMenu} // Pass toggle function for App Menu
                        setShowWebcam={setShowWebcam} // Pass toggle for webcam2
                    />
                </div>

                {/* App Menu Popup - Rendered at the top */}
                {showAppMenu && (
                    <div className="absolute bg-white p-4 rounded-lg shadow-md top-4 left-1/2 transform -translate-x-1/2 z-50">
                        <button onClick={() => setLeftView('boat')} className="block text-black p-2">
                            Boat View
                        </button>
                        <button onClick={() => setLeftView('park')} className="block text-black p-2">
                            Park Assist
                        </button>
                        <button onClick={() => setRightView('manual')} className="block text-black p-2">
                            Manual
                        </button>
                        <button onClick={() => setRightView('instrument')} className="block text-black p-2">
                            Instruments
                        </button>
                        <button onClick={() => setRightView('netflix')} className="block text-black p-2">
                            Netflix
                        </button>
                    </div>
                )}

                {/* Draggable Webcam Pane */}
                {ShowWebcam && (
                    <Draggable>
                        <div className="absolute top-0 right-0 p-4 bg-gray-900 text-white z-50 rounded-lg shadow-lg cursor-move">
                            {/* Webcam2 content */}
                            <h2 className="text-lg font-bold mb-2">Webcam</h2>
                            {/* Replace this with actual webcam2 component */}
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
