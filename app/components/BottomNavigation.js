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
import { useOcearoContext } from './context/OcearoContext';

const NavButton = ({ icon, onClick, label, textColor }) => (
  <button
    onClick={onClick}
    className={`${textColor} text-2xl flex items-center justify-center hover:text-gray-300 transition-colors duration-200`}
    aria-label={label}
  >
    <FontAwesomeIcon icon={icon} />
  </button>
);

const BottomNavigation = ({ setRightView, toggleSettings , toggleAppMenu }) => {
  const { nightMode } = useOcearoContext();
  const textColor = nightMode ? 'text-oNight' : 'text-white';

  const navigationItems = [
    {
      section: 'left',
      items: [
        {
          icon: faShip,
          onClick: () => toggleSettings(),
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
        textColor={textColor}
      />
    ));
  };

  return (
    <div className="flex items-center w-full h-full bg-black px-4">
      {/* Left Section */}
      <div className="flex-1 flex items-center space-x-10">
        {renderSection('left')}
        <BottomTemperatureWidget />
      </div>

      {/* Center Section */}
      <div className="flex-1 flex items-center justify-center space-x-10">
        {renderSection('center')}
      </div>

      {/* Right Section */}
      <div className="flex-1 flex items-center justify-end space-x-10">
        <BottomEnvironmentalWidget />
      </div>
    </div>
  );
};

export default BottomNavigation;
