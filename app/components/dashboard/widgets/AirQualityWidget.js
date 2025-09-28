'use client';
import React, { useMemo } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWind } from '@fortawesome/free-solid-svg-icons';

const AIR_QUALITY_CONFIG = {
  co2: {
    path: 'environment.inside.co2',
    transform: value => Math.round(value || 0),
    unit: 'ppm'
  },
  pm25: {
    path: 'environment.inside.pm25',
    transform: value => Math.round(value || 0),
    unit: 'µg/m³'
  }
};

export default function AirQualityWidget() {
  const { getSignalKValue } = useOcearoContext();
  
  const { co2, pm25 } = useMemo(() => {
    const co2Value = getSignalKValue(AIR_QUALITY_CONFIG.co2.path);
    const pm25Value = getSignalKValue(AIR_QUALITY_CONFIG.pm25.path);
    
    return {
      co2: co2Value !== null ? AIR_QUALITY_CONFIG.co2.transform(co2Value) : 420,
      pm25: pm25Value !== null ? AIR_QUALITY_CONFIG.pm25.transform(pm25Value) : 12
    };
  }, [getSignalKValue]);
  
  const getAirQualityInfo = (co2Level) => {
    if (co2Level <= 800) return { level: 'Good', color: 'text-oGreen', bg: 'bg-green-900' };
    if (co2Level <= 1000) return { level: 'Moderate', color: 'text-oYellow', bg: 'bg-yellow-900' };
    if (co2Level <= 1500) return { level: 'Poor', color: 'text-orange-400', bg: 'bg-orange-900' };
    if (co2Level <= 2000) return { level: 'Unhealthy', color: 'text-oRed', bg: 'bg-red-900' };
    return { level: 'Hazardous', color: 'text-red-300', bg: 'bg-red-900' };
  };

  const airQualityInfo = getAirQualityInfo(co2);

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faWind} className="text-oBlue" />
        <span className="text-white font-medium">Air Quality</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center space-y-4">
        {/* CO2 Level */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${airQualityInfo.color}`}>
            {co2}
          </div>
          <div className="text-gray-400 text-sm">CO₂ (ppm)</div>
          
          {/* CO2 Progress bar */}
          <div className="w-full bg-oGray rounded-full h-2 mt-2">
            <div 
              className="bg-oBlue h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((co2 / 2000) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Air Quality Status */}
        <div className="text-center">
          <div className={`inline-block px-3 py-1 rounded-full ${airQualityInfo.bg}`}>
            <span className={`text-sm font-medium ${airQualityInfo.color}`}>
              {airQualityInfo.level}
            </span>
          </div>
        </div>

        {/* PM2.5 Level */}
        <div className="text-center">
          <div className="text-xl font-bold text-white">
            {pm25}
          </div>
          <div className="text-gray-400 text-xs">PM2.5 (µg/m³)</div>
        </div>

        {/* Reference scale */}
        <div className="text-center text-xs text-gray-400">
          <div>Good: &lt;800 ppm</div>
          <div>Moderate: 800-1000 ppm</div>
        </div>
      </div>
    </div>
  );
}
