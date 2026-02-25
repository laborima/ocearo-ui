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
    className={`${textColor} flex-shrink-0 flex flex-col items-center justify-center p-1 sm:p-2 rounded-xl tesla-hover transition-all duration-300 group relative`}
    aria-label={label}
  >
    <div className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg group-hover:bg-hud-elevated transition-colors relative">
      <FontAwesomeIcon icon={icon} className="text-base sm:text-xl group-hover:scale-110 transition-transform" />
      {badgeColor && (
        <span className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-leftPaneBg ${badgeColor} animate-pulse`} />
      )}
    </div>
    <span className="ocearo-large-label text-xs font-black uppercase tracking-[0.2em] mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
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
    <div className="flex items-center justify-between w-full h-full bg-leftPaneBg px-1 sm:px-6 overflow-x-auto overflow-y-hidden scrollbar-hide">
      {/* Left Section */}
      <div className="flex items-center space-x-0.5 sm:space-x-6 flex-shrink-0 sm:flex-1 min-w-0">
        {renderSection('left')}
        <div className="hidden sm:block h-8 w-[1px] bg-hud-muted opacity-20 mx-1 sm:mx-2" />
        <BottomTemperatureWidget />
      </div>

      {/* Center Section */}
      <div className="flex flex-shrink-0 items-center justify-center space-x-0.5 sm:space-x-8 px-1 sm:px-0">
        {renderSection('center')}
      </div>

      {/* Right Section */}
      <div className="flex items-center justify-end space-x-0.5 sm:space-x-6 flex-shrink-0 sm:flex-1 min-w-0">
        <BottomEnvironmentalWidget />
      </div>
    </div>
  );
};

export default BottomNavigation;
