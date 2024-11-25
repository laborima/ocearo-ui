import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faShip, faMapMarkedAlt, faTh,faHandsHelping,faTachometerAlt,faCloudSun } from '@fortawesome/free-solid-svg-icons';
import BottomTemperatureWidget from './widgets/BottomTemperatureWidget';
import BottomEnvironmentalWidget from './widgets/BottomEnvironmentalWidget';

const BottomNavigation = ({ setLeftView, setRightView, toggleAppMenu, setShowWebcam }) => {
    // Define a reusable button class for uniform styling
    const buttonClass = "text-white text-2xl flex items-center justify-center ";


    return (
        <div className="flex items-center justify-between w-full h-full bg-black px-4">

            {/* Left Section - Settings Button */}
            <div className="flex items-center space-x-10">
                <button onClick={() => setRightView('settings')} className={buttonClass}>
                    {/*<img
            src="/icons/ocearo.webp"
            alt="App Logo"
            className="w-12 h-12"  // Consistent size using Tailwind classes
          /> */}
                    <FontAwesomeIcon icon={faShip} />
                </button>
                <BottomTemperatureWidget />
            </div>

            {/* Center Section - App Selection Button */}
            <div className="flex items-center justify-center space-x-10">
                <button onClick={() => setRightView('navigation')} className={buttonClass}>
                    <FontAwesomeIcon icon={faMapMarkedAlt} />
                </button>
                <button onClick={() => setRightView('weather')} className={buttonClass}>
                    <FontAwesomeIcon icon={faCloudSun} className="mr-2" /> 
                </button>

                <button onClick={toggleAppMenu} className={buttonClass}>
                    <FontAwesomeIcon icon={faTh} />
                </button>
                <button onClick={() => setRightView('manual')} className={buttonClass}>
                    <FontAwesomeIcon icon={faHandsHelping} className="mr-2" />
                </button>
                <button onClick={() => setRightView('instrument')} className={buttonClass}>
                    <FontAwesomeIcon icon={faTachometerAlt} className="mr-2" />
                </button>
            </div>

            {/* Right Section - Webcam Buttons */}
            <div className="flex items-center  space-x-10">
                <BottomEnvironmentalWidget />

                {/*
        <button onClick={() => setShowWebcam(true)} className={buttonClass}>
          <FontAwesomeIcon icon={faVideo}  />
        </button>
        */}
            </div>
        </div>
    );
};

export default BottomNavigation;
