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
import { useTranslation } from 'react-i18next';
import configService from './settings/ConfigService';

const NavButton = ({ icon, onClick, label, textColor, badgeColor }) => (
  <button
    onClick={onClick}
    className={`${textColor} flex flex-col items-center justify-center p-2 rounded-xl tesla-hover transition-all duration-300 group relative`}
    aria-label={label}
  >
    <div className="w-10 h-10 flex items-center justify-center rounded-lg group-hover:bg-hud-elevated transition-colors relative">
      <FontAwesomeIcon icon={icon} className="text-xl group-hover:scale-110 transition-transform" />
      {badgeColor && (
        <span className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-leftPaneBg ${badgeColor} animate-pulse`} />
      )}
    </div>
    <span className="text-xs font-black uppercase tracking-[0.2em] mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
      {label}
    </span>
  </button>
);

const BottomNavigation = ({ setRightView, toggleSettings , toggleAppMenu }) => {
  const { t } = useTranslation();
  const { nightMode } = useOcearoContext();
  const textColor = nightMode ? 'text-hud-main/90' : 'text-hud-main';

  const config = configService.getAll();
  const settingsBadgeColor = config.debugMode
    ? 'bg-yellow-400'
    : !config.signalKUrlSet
      ? 'bg-oBlue'
      : null;

  const navigationItems = [
    {
      section: 'left',
      items: [
        {
          icon: faShip,
          onClick: () => toggleSettings(),
          label: t('nav.system'),
          badgeColor: settingsBadgeColor
        }
      ]
    },
    {
      section: 'center',
      items: [
        {
          icon: faMapMarkedAlt,
          onClick: () => setRightView('navigation'),
          label: t('nav.nav')
        },
        {
          icon: faCloudSun,
          onClick: () => setRightView('weather'),
          label: t('nav.weather')
        },
        {
          icon: faTh,
          onClick: toggleAppMenu,
          label: t('nav.apps')
        },
        {
          icon: faTachometerAlt,
          onClick: () => setRightView('instrument'),
          label: t('nav.gauges')
        },
        {
          icon: faHandsHelping,
          onClick: () => setRightView('manual'),
          label: t('nav.help')
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
        badgeColor={item.badgeColor}
      />
    ));
  };

  return (
    <div className="flex items-center w-full h-full bg-leftPaneBg px-6">
      {/* Left Section */}
      <div className="flex-1 flex items-center space-x-6">
        {renderSection('left')}
        <div className="h-8 w-[1px] bg-hud-muted opacity-20 mx-2" />
        <BottomTemperatureWidget />
      </div>

      {/* Center Section */}
      <div className="flex-1 flex items-center justify-center space-x-8">
        {renderSection('center')}
      </div>

      {/* Right Section */}
      <div className="flex-1 flex items-center justify-end space-x-6">
        <BottomEnvironmentalWidget />
      </div>
    </div>
  );
};

export default BottomNavigation;
