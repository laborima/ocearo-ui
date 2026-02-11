import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faCompass, faCog, faExpand, faCompress } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import SunriseSunsetWidget from './widgets/SunriseSunsetWidget';
import UVIndexWidget from './widgets/UVIndexWidget';
import HumidityWidget from './widgets/HumidityWidget';
import PressureWidget from './widgets/PressureWidget';
import AirQualityWidget from './widgets/AirQualityWidget';
import TideWidget from './widgets/TideWidget';
import TemperatureWidget from './widgets/TemperatureWidget';
import BoatWidget3D from './widgets/BoatWidget3D';
import AttitudeWidget from './widgets/AttitudeWidget';
import DepthWidget from './widgets/DepthWidget';
import AISRadarWidget from './widgets/AISRadarWidget';
import BatteryWidget from './widgets/BatteryWidget';
import TankLevelsWidget from './widgets/TankLevelsWidget';
import VisibilityWidget from './widgets/VisibilityWidget';
import WeatherWidget from './widgets/WeatherWidget';
import SpeedWidget from './widgets/SpeedWidget';
import TimeWidget from './widgets/TimeWidget';
import CourseWidget from './widgets/CourseWidget';
import { AISProvider } from '../3dview/ais/AISContext';
import { NavigationContextProvider } from '../context/NavigationContext';

const WidgetWrapper = React.memo(({ children, widgetName, className = "", fullscreenWidget, toggleFullscreen }) => (
  <motion.div 
    layout
    variants={{
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0 }
    }}
    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    className={`relative group ${className}`}
  >
    {children}
    <button
      onClick={() => toggleFullscreen(widgetName)}
      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-hud-bg backdrop-blur-md hover:bg-hud-elevated rounded-full w-8 h-8 flex items-center justify-center text-hud-muted hover:text-hud-main z-10 shadow-soft"
      title={fullscreenWidget === widgetName ? "Exit fullscreen" : "Fullscreen"}
    >
      <FontAwesomeIcon icon={fullscreenWidget === widgetName ? faCompress : faExpand} className="text-xs" />
    </button>
  </motion.div>
));

WidgetWrapper.displayName = 'WidgetWrapper';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

export default function Dashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('environment');
  const [fullscreenWidget, setFullscreenWidget] = useState(null);

  const toggleFullscreen = React.useCallback((widgetName) => {
    setFullscreenWidget(prev => prev === widgetName ? null : widgetName);
  }, []);

  const renderEnvironmentTab = React.useMemo(() => (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`${fullscreenWidget ? 'flex h-full' : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 h-full auto-rows-fr'}`}
    >
      {/* Environment widgets - 6 total */}
      <WidgetWrapper 
        widgetName="temperature" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'temperature' ? 'hidden' : fullscreenWidget === 'temperature' ? 'w-full h-full' : ''}
      >
        <TemperatureWidget />
      </WidgetWrapper>
      <WidgetWrapper 
        widgetName="weather" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'weather' ? 'hidden' : fullscreenWidget === 'weather' ? 'w-full h-full' : ''}
      >
        <WeatherWidget />
      </WidgetWrapper>
      <WidgetWrapper 
        widgetName="tide" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'tide' ? 'hidden' : fullscreenWidget === 'tide' ? 'w-full h-full' : ''}
      >
        <TideWidget />
      </WidgetWrapper>
      <WidgetWrapper 
        widgetName="visibility" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'visibility' ? 'hidden' : fullscreenWidget === 'visibility' ? 'w-full h-full' : ''}
      >
        <VisibilityWidget />
      </WidgetWrapper>
      <WidgetWrapper 
        widgetName="airquality" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'airquality' ? 'hidden' : fullscreenWidget === 'airquality' ? 'w-full h-full' : ''}
      >
        <AirQualityWidget />
      </WidgetWrapper>
      <WidgetWrapper 
        widgetName="pressure" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'pressure' ? 'hidden' : fullscreenWidget === 'pressure' ? 'w-full h-full' : ''}
      >
        <PressureWidget />
      </WidgetWrapper>
    </motion.div>
  ), [fullscreenWidget, toggleFullscreen]);

  const renderNavigationTab = React.useMemo(() => (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`${fullscreenWidget ? 'flex h-full' : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 h-full auto-rows-fr'}`}
    >
      {/* Navigation widgets - 6 total */}
      <WidgetWrapper 
        widgetName="boat3d" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'boat3d' ? 'hidden' : fullscreenWidget === 'boat3d' ? 'w-full h-full' : ''}
      >
        <BoatWidget3D />
      </WidgetWrapper>
      <WidgetWrapper 
        widgetName="attitude" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'attitude' ? 'hidden' : fullscreenWidget === 'attitude' ? 'w-full h-full' : ''}
      >
        <AttitudeWidget />
      </WidgetWrapper>
      <WidgetWrapper 
        widgetName="speed" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'speed' ? 'hidden' : fullscreenWidget === 'speed' ? 'w-full h-full' : ''}
      >
        <SpeedWidget />
      </WidgetWrapper>
      <WidgetWrapper 
        widgetName="depth" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'depth' ? 'hidden' : fullscreenWidget === 'depth' ? 'w-full h-full' : ''}
      >
        <DepthWidget />
      </WidgetWrapper>
      <WidgetWrapper 
        widgetName="aisradar" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'aisradar' ? 'hidden' : fullscreenWidget === 'aisradar' ? 'w-full h-full' : ''}
      >
        <AISProvider>
          <AISRadarWidget />
        </AISProvider>
      </WidgetWrapper>
      <WidgetWrapper 
        widgetName="course" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'course' ? 'hidden' : fullscreenWidget === 'course' ? 'w-full h-full' : ''}
      >
        <NavigationContextProvider>
          <CourseWidget />
        </NavigationContextProvider>
      </WidgetWrapper>
    </motion.div>
  ), [fullscreenWidget, toggleFullscreen]);

  const renderSystemTab = React.useMemo(() => (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`${fullscreenWidget ? 'flex h-full' : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 h-full auto-rows-fr'}`}
    >
      {/* System widgets - 5 total */}
      <WidgetWrapper 
        widgetName="battery" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'battery' ? 'hidden' : fullscreenWidget === 'battery' ? 'w-full h-full' : ''}
      >
        <BatteryWidget />
      </WidgetWrapper>
      <WidgetWrapper 
        widgetName="tanks" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'tanks' ? 'hidden' : fullscreenWidget === 'tanks' ? 'w-full h-full' : ''}
      >
        <TankLevelsWidget />
      </WidgetWrapper>
      <WidgetWrapper 
        widgetName="humidity" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'humidity' ? 'hidden' : fullscreenWidget === 'humidity' ? 'w-full h-full' : ''}
      >
        <HumidityWidget />
      </WidgetWrapper>
      <WidgetWrapper 
        widgetName="uvindex" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'uvindex' ? 'hidden' : fullscreenWidget === 'uvindex' ? 'w-full h-full' : ''}
      >
        <UVIndexWidget />
      </WidgetWrapper>
      <WidgetWrapper 
        widgetName="sunrise" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'sunrise' ? 'hidden' : fullscreenWidget === 'sunrise' ? 'w-full h-full' : ''}
      >
        <SunriseSunsetWidget />
      </WidgetWrapper>
      <WidgetWrapper 
        widgetName="time" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'time' ? 'hidden' : fullscreenWidget === 'time' ? 'w-full h-full' : ''}
      >
        <TimeWidget />
      </WidgetWrapper>
    </motion.div>
  ), [fullscreenWidget, toggleFullscreen]);


  const renderTabContent = React.useMemo(() => {
    switch (activeTab) {
      case 'environment':
        return renderEnvironmentTab;
      case 'navigation':
        return renderNavigationTab;
      case 'system':
        return renderSystemTab;
      default:
        return renderEnvironmentTab;
    }
  }, [activeTab, renderEnvironmentTab, renderNavigationTab, renderSystemTab]);

  return (
    <div className="flex flex-col h-full bg-rightPaneBg overflow-hidden">
      {/* Tab Navigation - Tesla Style */}
      <div className="flex border-b border-hud bg-hud-bg">
        {[
          { id: 'environment', label: t('dashboard.environment'), icon: faLeaf },
          { id: 'navigation', label: t('dashboard.navigation'), icon: faCompass },
          { id: 'system', label: t('dashboard.systems'), icon: faCog }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-2 text-xs font-black uppercase flex items-center justify-center transition-all duration-500 ${
              activeTab === tab.id
                ? 'text-oGreen border-b-2 border-oGreen bg-hud-bg'
                : 'text-hud-secondary hover:text-hud-main tesla-hover'
            }`}
          >
            <FontAwesomeIcon icon={tab.icon} className="mr-2" />
            {tab.label}
          </button>
        ))}
      </div>
    
      {/* Dashboard Content */}
      <div className="flex-1 p-4 min-h-0 overflow-auto scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full"
          >
            {renderTabContent}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
