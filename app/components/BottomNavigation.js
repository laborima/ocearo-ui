// BottomNavigation.js
import React from 'react';

const BottomNavigation = ({ setLeftView, setRightView }) => {
  return (
    <div className="flex justify-around w-full h-full">
      {/* View Toggle */}
        <button onClick={() => setLeftView('boat')} className="bg-gray-700 text-white p-2 m-2">3D Boat</button>
        <button onClick={() => setLeftView('park')} className="bg-gray-700 text-white p-2 m-2">3D Park Assist</button>
        <button onClick={() => setRightView('iframe1')} className="bg-gray-700 text-white p-2 m-2">App 1</button>
        <button onClick={() => setRightView('iframe2')} className="bg-gray-700 text-white p-2 m-2">App 2</button>

    </div>
  );
};

export default BottomNavigation;