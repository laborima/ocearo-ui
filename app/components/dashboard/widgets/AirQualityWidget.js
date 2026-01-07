'use client';
import React, { useMemo } from 'react';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWind } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';

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
  const debugMode = configService.get('debugMode');
  
  const co2Value = useSignalKPath(AIR_QUALITY_CONFIG.co2.path);
  const pm25Value = useSignalKPath(AIR_QUALITY_CONFIG.pm25.path);

  const airQualityData = useMemo(() => {
    const hasData = co2Value !== null || pm25Value !== null || debugMode;

    if (!hasData) {
      return { hasData: false };
    }
    
    return {
      hasData: true,
      co2: co2Value !== null ? AIR_QUALITY_CONFIG.co2.transform(co2Value) : (debugMode ? 420 : null),
      pm25: pm25Value !== null ? AIR_QUALITY_CONFIG.pm25.transform(pm25Value) : (debugMode ? 12 : null)
    };
  }, [co2Value, pm25Value, debugMode]);
  
  const getAirQualityInfo = (co2Level) => {
    if (co2Level <= 800) return { level: 'Good', color: 'text-oGreen', bg: 'bg-green-900/30 border-green-800' };
    if (co2Level <= 1000) return { level: 'Moderate', color: 'text-oYellow', bg: 'bg-yellow-900/30 border-yellow-800' };
    if (co2Level <= 1500) return { level: 'Poor', color: 'text-orange-400', bg: 'bg-orange-900/30 border-orange-800' };
    if (co2Level <= 2000) return { level: 'Unhealthy', color: 'text-oRed', bg: 'bg-red-900/30 border-red-800' };
    return { level: 'Hazardous', color: 'text-red-300', bg: 'bg-red-950 border-red-900' };
  };

  const { hasData, co2, pm25 } = airQualityData;
  const airQualityInfo = getAirQualityInfo(co2 || 400);

  return (
    <BaseWidget
      title="Air Quality"
      icon={faWind}
      hasData={airQualityData.hasData}
      noDataMessage="No air quality data available"
    >
      <div className="flex-1 flex flex-col justify-center min-h-0 space-y-6">
        {/* CO2 Level */}
        <div className="text-center">
          <div className={`text-5xl font-bold mb-1 ${airQualityInfo.color}`}>
            {co2 !== null ? co2 : 'N/A'}
          </div>
          <div className="text-gray-400 text-xs uppercase font-bold tracking-widest">CO₂ (ppm)</div>
          
          {/* CO2 Progress bar */}
          <div className="w-full bg-oGray rounded-full h-3 mt-4 border border-gray-800 overflow-hidden shadow-inner">
            <div 
              className={`h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.3)] ${
                co2 <= 800 ? 'bg-oGreen' : co2 <= 1000 ? 'bg-oYellow' : 'bg-oRed'
              }`}
              style={{ width: `${co2 !== null ? Math.min((co2 / 2000) * 100, 100) : 0}%` }}
            />
          </div>
        </div>

        {/* Air Quality Status */}
        <div className="text-center">
          <div className={`inline-block px-4 py-1.5 rounded-lg border uppercase text-xs font-black tracking-widest ${airQualityInfo.bg}`}>
            <span className={airQualityInfo.color}>
              {airQualityInfo.level}
            </span>
          </div>
        </div>

        {/* Details and Reference */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-oGray p-3 rounded-lg border border-gray-800 text-center">
            <div className="text-white font-bold text-xl mb-1">
              {pm25 !== null ? pm25 : 'N/A'}
            </div>
            <div className="text-gray-500 text-[10px] uppercase font-bold">PM2.5 (µg/m³)</div>
          </div>
          
          <div className="bg-oGray p-3 rounded-lg border border-gray-800 flex flex-col justify-center">
            <div className="flex justify-between items-center text-[9px] font-bold uppercase mb-1">
              <span className="text-gray-500">Good:</span>
              <span className="text-oGreen">&lt;800</span>
            </div>
            <div className="flex justify-between items-center text-[9px] font-bold uppercase">
              <span className="text-gray-500">Poor:</span>
              <span className="text-oRed">&gt;1500</span>
            </div>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
