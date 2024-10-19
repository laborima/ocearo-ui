'use client';  // Add this at the top

import React, { useState } from 'react';
// Import components
import LeftPane from './components/LeftPane'; // Left pane containing 3DBoatView and ParkAssistView
import RightPane from './components/RightPane'; // Right pane containing the iframe
import BottomNavigation from './components/BottomNavigation'; // Bottom navigation bar

export default function Home() {
    
    const [leftView, setLeftView] = useState('boat'); // State for left pane view
    const [rightView, setRightView] = useState('iframe1'); // State for right pane view

    
  return (
    <div className="h-screen flex flex-col bg-gray-800">
      {/* Top layout: Two panes */}
      <div className="flex flex-1">
        {/* Left container with 3D view */}
        <div className="w-2/3 h-full relative">
         <LeftPane view={leftView} /> {/* Pass the view state as prop */}
        </div>

        {/* Right container with iframe */}
        <div className="w-1/3 h-full bg-gray-900 p-4">
          <RightPane view={rightView} /> {/* Pass the view state as prop */}
        </div>
      </div>

      {/* Bottom navigation bar */}
      <div className="w-full h-16 bg-gray-700 flex items-center justify-center">
        <BottomNavigation setLeftView={setLeftView} setRightView={setRightView} />
      </div>
    </div>
  );
}
