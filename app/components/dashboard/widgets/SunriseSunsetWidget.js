'use client';
import React, { useMemo } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';

const SUN_CONFIG = {
  sunrise: {
    path: 'environment.sun.sunrise',
    transform: value => value || '07:25'
  },
  sunset: {
    path: 'environment.sun.sunset',
    transform: value => value || '18:06'
  }
};

export default function SunriseSunsetWidget() {
  const { getSignalKValue } = useOcearoContext();
  const debugMode = configService.get('debugMode');
  
  const sunData = useMemo(() => {
    const sunriseValue = getSignalKValue(SUN_CONFIG.sunrise.path);
    const sunsetValue = getSignalKValue(SUN_CONFIG.sunset.path);

    const hasData = sunriseValue !== null || sunsetValue !== null;

    if (!hasData && !debugMode) {
      return { hasData: false };
    }
    
    return {
      hasData: true,
      sunrise: sunriseValue !== null ? SUN_CONFIG.sunrise.transform(sunriseValue) : (debugMode ? '07:25' : null),
      sunset: sunsetValue !== null ? SUN_CONFIG.sunset.transform(sunsetValue) : (debugMode ? '18:06' : null)
    };
  }, [getSignalKValue, debugMode]);

  if (!sunData.hasData) {
    return (
      <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
        <div className="flex items-center space-x-2 mb-4">
          <FontAwesomeIcon icon={faSun} className="text-oBlue text-lg" />
          <span className="text-white font-medium text-lg">Sun Times</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 mb-2">N/A</div>
            <div className="text-sm text-gray-500">No sun times data available</div>
          </div>
        </div>
      </div>
    );
  }

  const { sunrise, sunset } = sunData;

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faSun} className="text-oBlue text-lg" />
        <span className="text-white font-medium text-lg">Sun Times</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Visual representation */}
        <div className="relative mb-6">
          <div className="w-full h-16 relative overflow-hidden rounded-lg bg-gradient-to-r from-orange-900 via-orange-600 to-yellow-400">
            {/* Horizon line */}
            <div className="absolute bottom-0 w-full h-1 bg-oGray"></div>
            
            {/* Sun position indicator */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-oYellow rounded-full shadow-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faSun} className="text-orange-800 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Times display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-gray-400 text-base mb-2">Sunrise</div>
            <div className="text-3xl font-bold text-oYellow mb-1">
              {sunrise !== null ? sunrise : 'N/A'}
            </div>
            <div className="text-gray-400 text-sm">Local Time</div>
          </div>
          
          <div className="text-center">
            <div className="text-gray-400 text-base mb-2">Sunset</div>
            <div className="text-3xl font-bold text-orange-400 mb-1">
              {sunset !== null ? sunset : 'N/A'}
            </div>
            <div className="text-gray-400 text-sm">Local Time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
