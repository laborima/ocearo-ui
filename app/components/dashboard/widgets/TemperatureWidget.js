'use client';
import React, { useMemo } from 'react';
import { convertTemperature } from '../../context/OcearoContext';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { faThermometerHalf } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';

const TEMPERATURE_CONFIG = {
  airPath: 'environment.outside.temperature',
  seaPath: 'environment.water.temperature',
  transform: value => convertTemperature(value || 0)
};

const TemperatureWidget = React.memo(() => {
  const debugMode = configService.get('debugMode');
  
  const airValue = useSignalKPath(TEMPERATURE_CONFIG.airPath);
  const seaValue = useSignalKPath(TEMPERATURE_CONFIG.seaPath);

  const temperatureData = useMemo(() => {
    const hasData = airValue !== null || seaValue !== null || debugMode;

    if (!hasData) {
      return { hasData: false };
    }

    return {
      hasData: true,
      airTemp: airValue !== null ? TEMPERATURE_CONFIG.transform(airValue) : (debugMode ? 21 : null),
      seaTemp: seaValue !== null ? TEMPERATURE_CONFIG.transform(seaValue) : (debugMode ? 17 : null)
    };
  }, [airValue, seaValue, debugMode]);

  // Determine temperature color based on value
  const getTemperatureColor = (temp) => {
    if (temp < 10) return 'text-oBlue';
    if (temp > 25) return 'text-oRed';
    return 'text-oGreen';
  };

  const getTemperatureStatus = (airTemp, seaTemp) => {
    const avgTemp = (airTemp + seaTemp) / 2;
    if (avgTemp < 15) return 'Cold';
    if (avgTemp > 25) return 'Warm';
    return 'Moderate';
  };

  const { hasData, airTemp, seaTemp } = temperatureData;

  return (
    <BaseWidget
      title="Temperature"
      icon={faThermometerHalf}
      hasData={hasData}
      noDataMessage="No temperature data available"
    >
      <div className="flex-1 flex flex-col justify-center min-h-0">
        {/* Temperature readings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="text-gray-400 text-[10px] uppercase font-bold mb-1 tracking-tight">Air</div>
            <div className={`text-4xl font-black text-white mb-0.5`}>
              {airTemp !== null ? `${airTemp}°` : 'N/A'}
            </div>
            <div className={`text-[10px] font-black uppercase tracking-widest ${airTemp !== null ? getTemperatureColor(airTemp) : 'text-gray-500'}`}>
              Celsius
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-gray-400 text-[10px] uppercase font-bold mb-1 tracking-tight">Sea</div>
            <div className={`text-4xl font-black text-white mb-0.5`}>
              {seaTemp !== null ? `${seaTemp}°` : 'N/A'}
            </div>
            <div className={`text-[10px] font-black uppercase tracking-widest ${seaTemp !== null ? getTemperatureColor(seaTemp) : 'text-gray-500'}`}>
              Celsius
            </div>
          </div>
        </div>

        {/* Visual temperature bars */}
        <div className="space-y-4 mb-6 px-2">
          <div className="flex items-center space-x-3">
            <div className="text-gray-500 text-[9px] uppercase w-6 font-black">Air</div>
            <div className="flex-1 bg-oGray rounded-full h-2.5 border border-gray-800 overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.2)] ${
                  airTemp !== null && airTemp < 10 ? 'bg-oBlue shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 
                  airTemp !== null && airTemp > 25 ? 'bg-oRed shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 
                  'bg-oGreen shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                }`}
                style={{ width: `${airTemp !== null ? Math.min(100, Math.max(0, (airTemp + 10) * 2.5)) : 0}%` }}
              />
            </div>
            <div className="text-white text-[10px] w-8 text-right font-mono font-bold">{airTemp !== null ? `${airTemp}°` : 'N/A'}</div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-gray-500 text-[9px] uppercase w-6 font-black">Sea</div>
            <div className="flex-1 bg-oGray rounded-full h-2.5 border border-gray-800 overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.2)] ${
                  seaTemp !== null && seaTemp < 10 ? 'bg-oBlue shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 
                  seaTemp !== null && seaTemp > 25 ? 'bg-oRed shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 
                  'bg-oGreen shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                }`}
                style={{ width: `${seaTemp !== null ? Math.min(100, Math.max(0, (seaTemp + 10) * 2.5)) : 0}%` }}
              />
            </div>
            <div className="text-white text-[10px] w-8 text-right font-mono font-bold">{seaTemp !== null ? `${seaTemp}°` : 'N/A'}</div>
          </div>
        </div>

        {/* Status and info */}
        <div className="bg-oGray p-3 rounded-lg border border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <div className={`text-xs font-black uppercase tracking-widest ${airTemp !== null && seaTemp !== null ? getTemperatureColor((airTemp + seaTemp) / 2) : 'text-gray-500'}`}>
              {airTemp !== null && seaTemp !== null ? getTemperatureStatus(airTemp, seaTemp) : 'Unknown'}
            </div>
            <div className="text-[10px] text-gray-500 uppercase font-bold">
              Diff: <span className="text-white font-mono">{airTemp !== null && seaTemp !== null ? `${Math.abs(airTemp - seaTemp).toFixed(1)}°C` : 'N/A'}</span>
            </div>
          </div>
          <div className="text-center text-[9px] text-gray-500 uppercase font-black tracking-tighter border-t border-gray-800 pt-2">
            Safe Operational Range: -10°C to 40°C
          </div>
        </div>
      </div>
    </BaseWidget>
  );
});

TemperatureWidget.displayName = 'TemperatureWidget';

export default TemperatureWidget;
