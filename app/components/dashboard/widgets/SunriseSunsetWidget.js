'use client';
import React, { useMemo } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
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
  
  const { sunrise, sunset } = useMemo(() => {
    const sunriseValue = getSignalKValue(SUN_CONFIG.sunrise.path);
    const sunsetValue = getSignalKValue(SUN_CONFIG.sunset.path);
    
    return {
      sunrise: sunriseValue !== null ? SUN_CONFIG.sunrise.transform(sunriseValue) : '07:25',
      sunset: sunsetValue !== null ? SUN_CONFIG.sunset.transform(sunsetValue) : '18:06'
    };
  }, [getSignalKValue]);

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
              {sunrise}
            </div>
            <div className="text-gray-400 text-sm">Local Time</div>
          </div>
          
          <div className="text-center">
            <div className="text-gray-400 text-base mb-2">Sunset</div>
            <div className="text-3xl font-bold text-orange-400 mb-1">
              {sunset}
            </div>
            <div className="text-gray-400 text-sm">Local Time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
