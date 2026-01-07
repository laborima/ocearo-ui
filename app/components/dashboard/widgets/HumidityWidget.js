'use client';
import React, { useMemo } from 'react';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTint, faThermometerHalf } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';

const HUMIDITY_CONFIG = {
  humidity: {
    path: 'environment.inside.relativeHumidity',
    transform: value => ((value || 0) * 100).toFixed(0)
  },
  dewPoint: {
    path: 'environment.inside.dewPoint',
    transform: value => ((value || 0) - 273.15).toFixed(1)
  }
};

export default function HumidityWidget() {
  const debugMode = configService.get('debugMode');
  
  const humidityValue = useSignalKPath(HUMIDITY_CONFIG.humidity.path);
  const dewPointValue = useSignalKPath(HUMIDITY_CONFIG.dewPoint.path);

  const humidityData = useMemo(() => {
    const hasData = humidityValue !== null || dewPointValue !== null || debugMode;

    if (!hasData) {
      return { hasData: false };
    }
    
    const humidityPercent = humidityValue !== null ? HUMIDITY_CONFIG.humidity.transform(humidityValue) : (debugMode ? '65' : null);
    
    return {
      hasData: true,
      humidity: humidityPercent,
      humidityPercentage: humidityPercent,
      dewPointCelsius: dewPointValue !== null ? HUMIDITY_CONFIG.dewPoint.transform(dewPointValue) : (debugMode ? '18.5' : null)
    };
  }, [humidityValue, dewPointValue, debugMode]);

  const { humidity, humidityPercentage, dewPointCelsius } = humidityData;

  const getHumidityColor = (humidity) => {
    const h = parseInt(humidity);
    if (h < 30 || h > 70) return 'text-oYellow';
    if (h < 40 || h > 60) return 'text-oBlue';
    return 'text-oGreen';
  };

  const getHumidityStatus = (humidity) => {
    const h = parseInt(humidity);
    if (h < 30) return 'Too Dry';
    if (h > 70) return 'Too Humid';
    if (h < 40 || h > 60) return 'Moderate';
    return 'Optimal';
  };

  return (
    <BaseWidget
      title="Humidity"
      icon={faTint}
      hasData={humidityData.hasData}
      noDataMessage="No humidity data available"
    >
      <div className="flex-1 flex flex-col justify-center min-h-0">
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-white mb-1">
            {humidity !== null ? `${humidity}%` : 'N/A'}
          </div>
          <div className={`text-xs font-bold uppercase tracking-widest ${humidity !== null ? getHumidityColor(humidity) : 'text-gray-500'}`}>
            {humidity !== null ? getHumidityStatus(humidity) : 'Unknown'}
          </div>
        </div>

        <div className="mb-6 px-2">
          <div className="w-full bg-oGray rounded-full h-3 border border-gray-800 overflow-hidden shadow-inner">
            <div 
              className="bg-oBlue h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.4)]"
              style={{ width: `${humidityPercentage !== null ? humidityPercentage : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-tighter px-1">
            <span>Dry</span>
            <span>Optimal</span>
            <span>Humid</span>
          </div>
        </div>

        <div className="bg-oGray p-3 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faThermometerHalf} className="text-oBlue text-sm" />
              <span className="text-gray-400 text-xs uppercase font-bold">Dew Point</span>
            </div>
            <div className="text-white font-bold font-mono">
              {dewPointCelsius !== null ? `${dewPointCelsius}°C` : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
