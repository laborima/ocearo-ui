'use client';
import React, { useMemo } from 'react';
import { useOcearoContext, convertTemperature } from '../../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThermometerHalf } from '@fortawesome/free-solid-svg-icons';

const TEMPERATURE_CONFIG = {
  airPath: 'environment.outside.temperature',
  seaPath: 'environment.water.temperature',
  transform: value => convertTemperature(value || 0)
};

export default function TemperatureWidget() {
  const { getSignalKValue } = useOcearoContext();
  
  const airTemp = useMemo(() => {
    const value = getSignalKValue(TEMPERATURE_CONFIG.airPath);
    return value !== null ? TEMPERATURE_CONFIG.transform(value) : 21;
  }, [getSignalKValue]);

  const seaTemp = useMemo(() => {
    const value = getSignalKValue(TEMPERATURE_CONFIG.seaPath);
    return value !== null ? TEMPERATURE_CONFIG.transform(value) : 17;
  }, [getSignalKValue]);

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

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faThermometerHalf} className="text-oBlue" />
        <span className="text-white font-medium">Temperature</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Temperature readings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Air Temperature */}
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">Air</div>
            <div className={`text-3xl font-bold ${getTemperatureColor(airTemp)}`}>
              {airTemp}°
            </div>
            <div className="text-gray-400 text-xs">Celsius</div>
          </div>
          
          {/* Sea Temperature */}
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">Sea</div>
            <div className={`text-3xl font-bold ${getTemperatureColor(seaTemp)}`}>
              {seaTemp}°
            </div>
            <div className="text-gray-400 text-xs">Celsius</div>
          </div>
        </div>

        {/* Visual temperature bars */}
        <div className="space-y-3 mb-4">
          {/* Air temperature bar */}
          <div className="flex items-center space-x-2">
            <div className="text-gray-400 text-xs w-8">Air</div>
            <div className="flex-1 bg-gray-600 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  airTemp < 10 ? 'bg-oBlue' : airTemp > 25 ? 'bg-oRed' : 'bg-oGreen'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, (airTemp + 10) * 2.5))}%` }}
              />
            </div>
            <div className="text-gray-400 text-xs w-8">{airTemp}°</div>
          </div>
          
          {/* Sea temperature bar */}
          <div className="flex items-center space-x-2">
            <div className="text-gray-400 text-xs w-8">Sea</div>
            <div className="flex-1 bg-gray-600 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  seaTemp < 10 ? 'bg-oBlue' : seaTemp > 25 ? 'bg-oRed' : 'bg-oGreen'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, (seaTemp + 10) * 2.5))}%` }}
              />
            </div>
            <div className="text-gray-400 text-xs w-8">{seaTemp}°</div>
          </div>
        </div>

        {/* Status and difference */}
        <div className="text-center space-y-2">
          <div className={`text-sm font-medium ${getTemperatureColor((airTemp + seaTemp) / 2)}`}>
            {getTemperatureStatus(airTemp, seaTemp)}
          </div>
          <div className="text-gray-400 text-xs">
            Difference: {Math.abs(airTemp - seaTemp).toFixed(1)}°C
          </div>
          <div className="text-gray-400 text-xs">
            Range: -10°C to 40°C
          </div>
        </div>
      </div>
    </div>
  );
}
