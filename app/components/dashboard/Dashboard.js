'use client';
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faCompass, faChartLine } from '@fortawesome/free-solid-svg-icons';
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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('environment');

  const renderEnvironmentTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 h-full">
      {/* Environment widgets */}
      <div>
        <TemperatureWidget />
      </div>
      <div>
        <TideWidget /> 
      </div>
      <div>
        <AirQualityWidget />
      </div>
      <div>
        <PressureWidget />
      </div>
      <div>
        <UVIndexWidget />
      </div>
      <div>
        <HumidityWidget />
      </div>
      <div>
        <SunriseSunsetWidget />
      </div>
      <div>
        <VisibilityWidget />
      </div>
      <div>
        <WeatherWidget />
      </div>
    </div>
  );

  const renderNavigationTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 h-full">
      {/* Navigation widgets */}
      <div>
        <BoatWidget3D />
      </div>
      <div>
        <AttitudeWidget />
      </div>
      <div>
        <SpeedWidget />
      </div>
      <div>
        <DepthWidget />
      </div>
      <div>
        <AISRadarWidget />
      </div>
      <div>
        <BatteryWidget />
      </div>
      <div>
        <TankLevelsWidget />
      </div>
      <div>
        <TimeWidget />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full rightPaneBg overflow-auto">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-600 bg-oGray2">
        <button
          onClick={() => setActiveTab('environment')}
          className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
            activeTab === 'environment'
              ? 'text-oBlue border-b-2 border-oBlue bg-oGray1'
              : 'text-gray-400 hover:text-white hover:bg-oGray1'
          }`}
        >
          <FontAwesomeIcon icon={faLeaf} />
          <span>Environment</span>
        </button>
        <button
          onClick={() => setActiveTab('navigation')}
          className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
            activeTab === 'navigation'
              ? 'text-oBlue border-b-2 border-oBlue bg-oGray1'
              : 'text-gray-400 hover:text-white hover:bg-oGray1'
          }`}
        >
          <FontAwesomeIcon icon={faCompass} />
          <span>Navigation</span>
        </button>
      </div>
    
      {/* Dashboard Content */}
      <div className="flex-1 p-4">
        {activeTab === 'environment' ? renderEnvironmentTab() : renderNavigationTab()}
      </div>
    </div>
  );
}
