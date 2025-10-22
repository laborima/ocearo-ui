import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faCompass, faCog, faExpand, faCompress } from '@fortawesome/free-solid-svg-icons';
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
import { AISProvider } from '../3dview/ais/AISContext';

const WidgetWrapper = React.memo(({ children, widgetName, className = "", fullscreenWidget, toggleFullscreen }) => (
  <div className={`relative group ${className}`}>
    {children}
    <button
      onClick={() => toggleFullscreen(widgetName)}
      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-50 hover:bg-opacity-70 rounded p-1 text-white text-xs"
      title={fullscreenWidget === widgetName ? "Exit fullscreen" : "Fullscreen"}
    >
      <FontAwesomeIcon icon={fullscreenWidget === widgetName ? faCompress : faExpand} />
    </button>
  </div>
));

WidgetWrapper.displayName = 'WidgetWrapper';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('environment');
  const [fullscreenWidget, setFullscreenWidget] = useState(null);

  const toggleFullscreen = React.useCallback((widgetName) => {
    setFullscreenWidget(prev => prev === widgetName ? null : widgetName);
  }, []);

  const renderEnvironmentTab = React.useMemo(() => (
    <div className={`${fullscreenWidget ? 'flex h-full' : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 h-full auto-rows-fr'}`}>
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
    </div>
  ), [fullscreenWidget, toggleFullscreen]);

  const renderNavigationTab = React.useMemo(() => (
    <div className={`${fullscreenWidget ? 'flex h-full' : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 h-full auto-rows-fr'}`}>
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
        widgetName="time" 
        fullscreenWidget={fullscreenWidget} 
        toggleFullscreen={toggleFullscreen}
        className={fullscreenWidget && fullscreenWidget !== 'time' ? 'hidden' : fullscreenWidget === 'time' ? 'w-full h-full' : ''}
      >
        <TimeWidget />
      </WidgetWrapper>
    </div>
  ), [fullscreenWidget, toggleFullscreen]);

  const renderSystemTab = React.useMemo(() => (
    <div className={`${fullscreenWidget ? 'flex h-full' : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 h-full auto-rows-fr'}`}>
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
    </div>
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
    <div className="flex flex-col h-full rightPaneBg overflow-hidden">
      {/* Tab Navigation - Modern Style */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('environment')}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center transition-all ${
            activeTab === 'environment'
              ? 'text-green-500 border-b-2 border-green-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <FontAwesomeIcon icon={faLeaf} className="mr-2" />
          Environment
        </button>
        <button
          onClick={() => setActiveTab('navigation')}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center transition-all ${
            activeTab === 'navigation'
              ? 'text-green-500 border-b-2 border-green-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <FontAwesomeIcon icon={faCompass} className="mr-2" />
          Navigation
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center transition-all ${
            activeTab === 'system'
              ? 'text-green-500 border-b-2 border-green-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <FontAwesomeIcon icon={faCog} className="mr-2" />
          System
        </button>
      </div>
    
      {/* Dashboard Content */}
      <div className="flex-1 p-4 min-h-0">
        {renderTabContent}
      </div>
    </div>
  );
}
