'use client';
import React, { useMemo } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
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
  const { getSignalKValue } = useOcearoContext();
  
  const { humidity, humidityPercentage, dewPointCelsius } = useMemo(() => {
    const humidityValue = getSignalKValue(HUMIDITY_CONFIG.humidity.path);
    const dewPointValue = getSignalKValue(HUMIDITY_CONFIG.dewPoint.path);
    
    const humidityPercent = humidityValue !== null ? HUMIDITY_CONFIG.humidity.transform(humidityValue) : '65';
    
    return {
      humidity: humidityPercent,
      humidityPercentage: humidityPercent,
      dewPointCelsius: dewPointValue !== null ? HUMIDITY_CONFIG.dewPoint.transform(dewPointValue) : '18.5'
    };
  }, [getSignalKValue]);

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

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faTint} className="text-oBlue text-lg" />
        <span className="text-white font-medium text-lg">Humidity</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Main humidity display */}
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-white mb-2">
            {humidity}%
          </div>
          <div className={`text-base font-medium ${getHumidityColor(humidity)}`}>
            {getHumidityStatus(humidity)}
          </div>
        </div>

        {/* Visual representation */}
        <div className="mb-4">
          <div className="w-full bg-oGray rounded-full h-3">
            <div 
              className="bg-oBlue h-3 rounded-full transition-all duration-500"
              style={{ width: `${humidityPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Dew point */}
        <div className="flex items-center justify-center space-x-2 text-sm">
          <FontAwesomeIcon icon={faThermometerHalf} className="text-oBlue" />
          <span className="text-gray-400">Dew Point:</span>
          <span className="text-white font-medium">{dewPointCelsius}°C</span>
        </div>
      </div>
    </div>
  );
}
