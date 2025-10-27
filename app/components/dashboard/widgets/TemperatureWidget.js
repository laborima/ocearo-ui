'use client';
import React, { useMemo } from 'react';
import { useOcearoContext, convertTemperature } from '../../context/OcearoContext';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThermometerHalf } from '@fortawesome/free-solid-svg-icons';

const TEMPERATURE_CONFIG = {
  airPath: 'environment.outside.temperature',
  seaPath: 'environment.water.temperature',
  transform: value => convertTemperature(value || 0)
};

const TemperatureWidget = React.memo(() => {
  const { getSignalKValue, nightMode } = useOcearoContext();
  const debugMode = configService.get('debugMode');
  const primaryTextClass = nightMode ? 'text-oNight' : 'text-white';
  const secondaryTextClass = nightMode ? 'text-oNight' : 'text-gray-400';
  const mutedTextClass = nightMode ? 'text-oNight' : 'text-gray-500';
  const accentIconClass = nightMode ? 'text-oNight' : 'text-oBlue';
  
  const temperatureData = useMemo(() => {
    const airValue = getSignalKValue(TEMPERATURE_CONFIG.airPath);
    const seaValue = getSignalKValue(TEMPERATURE_CONFIG.seaPath);

    const hasData = airValue !== null || seaValue !== null;

    if (!hasData && !debugMode) {
      return { hasData: false };
    }

    return {
      hasData: true,
      airTemp: airValue !== null ? TEMPERATURE_CONFIG.transform(airValue) : (debugMode ? 21 : null),
      seaTemp: seaValue !== null ? TEMPERATURE_CONFIG.transform(seaValue) : (debugMode ? 17 : null)
    };
  }, [getSignalKValue, debugMode]);

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

  if (!temperatureData.hasData) {
    return (
      <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
        <div className="flex items-center space-x-2 mb-4">
          <FontAwesomeIcon icon={faThermometerHalf} className={`${accentIconClass} text-lg`} />
          <span className={`${primaryTextClass} font-medium text-lg`}>Temperature</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 mb-2">N/A</div>
            <div className={`text-sm ${mutedTextClass}`}>No temperature data available</div>
          </div>
        </div>
      </div>
    );
  }

  const { airTemp, seaTemp } = temperatureData;

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faThermometerHalf} className={`${accentIconClass} text-lg`} />
        <span className={`${primaryTextClass} font-medium text-lg`}>Temperature</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center min-h-0">
        {/* Temperature readings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Air Temperature */}
          <div className="text-center">
            <div className={`${secondaryTextClass} text-base mb-1`}>Air</div>
            <div className={`text-4xl font-bold ${airTemp !== null ? getTemperatureColor(airTemp) : 'text-gray-500'}`}>
              {airTemp !== null ? `${airTemp}°` : 'N/A'}
            </div>
            <div className={`${secondaryTextClass} text-sm`}>Celsius</div>
          </div>
          
          {/* Sea Temperature */}
          <div className="text-center">
            <div className={`${secondaryTextClass} text-base mb-1`}>Sea</div>
            <div className={`text-4xl font-bold ${seaTemp !== null ? getTemperatureColor(seaTemp) : 'text-gray-500'}`}>
              {seaTemp !== null ? `${seaTemp}°` : 'N/A'}
            </div>
            <div className={`${secondaryTextClass} text-sm`}>Celsius</div>
          </div>
        </div>

        {/* Visual temperature bars */}
        <div className="space-y-3 mb-4">
          {/* Air temperature bar */}
          <div className="flex items-center space-x-2">
            <div className={`${secondaryTextClass} text-sm w-10`}>Air</div>
            <div className="flex-1 bg-gray-600 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  airTemp !== null && airTemp < 10 ? 'bg-oBlue' : airTemp !== null && airTemp > 25 ? 'bg-oRed' : 'bg-oGreen'
                }`}
                style={{ width: `${airTemp !== null ? Math.min(100, Math.max(0, (airTemp + 10) * 2.5)) : 0}%` }}
              />
            </div>
            <div className={`${secondaryTextClass} text-sm w-10`}>{airTemp !== null ? `${airTemp}°` : 'N/A'}</div>
          </div>
          
          {/* Sea temperature bar */}
          <div className="flex items-center space-x-2">
            <div className={`${secondaryTextClass} text-sm w-10`}>Sea</div>
            <div className="flex-1 bg-gray-600 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  seaTemp !== null && seaTemp < 10 ? 'bg-oBlue' : seaTemp !== null && seaTemp > 25 ? 'bg-oRed' : 'bg-oGreen'
                }`}
                style={{ width: `${seaTemp !== null ? Math.min(100, Math.max(0, (seaTemp + 10) * 2.5)) : 0}%` }}
              />
            </div>
            <div className={`${secondaryTextClass} text-sm w-10`}>{seaTemp !== null ? `${seaTemp}°` : 'N/A'}</div>
          </div>
        </div>

        {/* Status and difference */}
        <div className="text-center space-y-2">
          <div className={`text-base font-medium ${airTemp !== null && seaTemp !== null ? getTemperatureColor((airTemp + seaTemp) / 2) : mutedTextClass}`}>
            {airTemp !== null && seaTemp !== null ? getTemperatureStatus(airTemp, seaTemp) : 'Unknown'}
          </div>
          <div className={`${secondaryTextClass} text-sm`}>
            Difference: {airTemp !== null && seaTemp !== null ? `${Math.abs(airTemp - seaTemp).toFixed(1)}°C` : 'N/A'}
          </div>
          <div className={`${secondaryTextClass} text-sm`}>
            Range: -10°C to 40°C
          </div>
        </div>
      </div>
    </div>
  );
});

TemperatureWidget.displayName = 'TemperatureWidget';

export default TemperatureWidget;
