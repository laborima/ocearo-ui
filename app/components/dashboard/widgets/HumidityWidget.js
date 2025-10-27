'use client';
import React, { useMemo } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTint, faThermometerHalf } from '@fortawesome/free-solid-svg-icons';

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
  const { getSignalKValue, nightMode } = useOcearoContext();
  const debugMode = configService.get('debugMode');
  const primaryTextClass = nightMode ? 'text-oNight' : 'text-white';
  const secondaryTextClass = nightMode ? 'text-oNight' : 'text-gray-400';
  const mutedTextClass = nightMode ? 'text-oNight' : 'text-gray-500';
  const accentIconClass = nightMode ? 'text-oNight' : 'text-oBlue';
  
  const humidityData = useMemo(() => {
    const humidityValue = getSignalKValue(HUMIDITY_CONFIG.humidity.path);
    const dewPointValue = getSignalKValue(HUMIDITY_CONFIG.dewPoint.path);

    const hasData = humidityValue !== null || dewPointValue !== null;

    if (!hasData && !debugMode) {
      return { hasData: false };
    }
    
    const humidityPercent = humidityValue !== null ? HUMIDITY_CONFIG.humidity.transform(humidityValue) : (debugMode ? '65' : null);
    
    return {
      hasData: true,
      humidity: humidityPercent,
      humidityPercentage: humidityPercent,
      dewPointCelsius: dewPointValue !== null ? HUMIDITY_CONFIG.dewPoint.transform(dewPointValue) : (debugMode ? '18.5' : null)
    };
  }, [getSignalKValue, debugMode]);

  // Determine humidity status color
  const getHumidityColor = (humidity) => {
    const h = parseInt(humidity);
    if (h < 30 || h > 70) return 'text-oYellow';
    if (h < 40 || h > 60) return 'text-oBlue';
    return 'text-oGreen';
  };

  // Determine humidity status text
  const getHumidityStatus = (humidity) => {
    const h = parseInt(humidity);
    if (h < 30) return 'Too Dry';
    if (h > 70) return 'Too Humid';
    if (h < 40 || h > 60) return 'Moderate';
    return 'Optimal';
  };

  if (!humidityData.hasData) {
    return (
      <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
        <div className="flex items-center space-x-2 mb-4">
          <FontAwesomeIcon icon={faTint} className={`${accentIconClass} text-lg`} />
          <span className={`${primaryTextClass} font-medium text-lg`}>Humidity</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 mb-2">N/A</div>
            <div className={`text-sm ${mutedTextClass}`}>No humidity data available</div>
          </div>
        </div>
      </div>
    );
  }

  const { humidity, humidityPercentage, dewPointCelsius } = humidityData;

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faTint} className={`${accentIconClass} text-lg`} />
        <span className={`${primaryTextClass} font-medium text-lg`}>Humidity</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Main humidity display */}
        <div className="text-center mb-6">
          <div className={`text-5xl font-bold ${primaryTextClass} mb-2`}>
            {humidity !== null ? `${humidity}%` : 'N/A'}
          </div>
          <div className={`text-base font-medium ${humidity !== null ? getHumidityColor(humidity) : mutedTextClass}`}>
            {humidity !== null ? getHumidityStatus(humidity) : 'Unknown'}
          </div>
        </div>

        {/* Visual representation */}
        <div className="mb-4">
          <div className="w-full bg-oGray rounded-full h-3">
            <div 
              className="bg-oBlue h-3 rounded-full transition-all duration-500"
              style={{ width: `${humidityPercentage !== null ? humidityPercentage : 0}%` }}
            ></div>
          </div>
          <div className={`flex justify-between text-xs ${secondaryTextClass} mt-1`}>
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Dew point */}
        <div className="flex items-center justify-center space-x-2 text-sm">
          <FontAwesomeIcon icon={faThermometerHalf} className={accentIconClass} />
          <span className={`${secondaryTextClass}`}>Dew Point:</span>
          <span className={`${primaryTextClass} font-medium`}>{dewPointCelsius !== null ? `${dewPointCelsius}°C` : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}
