import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faVideo,
  faShip,
  faMapMarkedAlt,
  faTh,
  faHandsHelping,
  faTachometerAlt,
  faCloudSun
} from '@fortawesome/free-solid-svg-icons';
import BottomTemperatureWidget from './widgets/BottomTemperatureWidget';
import BottomEnvironmentalWidget from './widgets/BottomEnvironmentalWidget';

const NavButton = ({ icon, onClick, label }) => (
  <button
    onClick={onClick}
    className="text-white text-2xl flex items-center justify-center hover:text-gray-300 transition-colors duration-200"
    aria-label={label}
  >
    <FontAwesomeIcon icon={icon} />
  </button>
);

const BottomNavigation = ({ setLeftView, setRightView, toggleAppMenu, setShowWebcam }) => {
  const navigationItems = [
    {
      section: 'left',
      items: [
        {
          icon: faShip,
          onClick: () => setRightView('settings'),
          label: 'Settings'
        }
      ]
    },
    {
      section: 'center',
      items: [
        {
          icon: faMapMarkedAlt,
          onClick: () => setRightView('navigation'),
          label: 'Navigation'
        },
        {
          icon: faCloudSun,
          onClick: () => setRightView('weather'),
          label: 'Weather'
        },
        {
          icon: faTh,
          onClick: toggleAppMenu,
          label: 'App Menu'
        },
        {
          icon: faHandsHelping,
          onClick: () => setRightView('manual'),
          label: 'Manual'
        },
        {
          icon: faTachometerAlt,
          onClick: () => setRightView('instrument'),
          label: 'Instrument'
        }
      ]
    }
  ];

  const renderSection = (section) => {
    const sectionData = navigationItems.find(item => item.section === section);
    if (!sectionData) return null;

    return sectionData.items.map((item, index) => (
      <NavButton
        key={`${section}-${index}`}
        icon={item.icon}
        onClick={item.onClick}
        label={item.label}
      />
    ));
  };

  return (
    <div className="flex items-center justify-between w-full h-full bg-black px-4">
      {/* Left Section */}
      <div className="flex items-center space-x-10">
        {renderSection('left')}
        <BottomTemperatureWidget />
      </div>

      {/* Center Section */}
      <div className="flex items-center justify-center space-x-10">
        {renderSection('center')}
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-10">
        <BottomEnvironmentalWidget />
      </div>
    </div>
  );
};

export default BottomNavigation;