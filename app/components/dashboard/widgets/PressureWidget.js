import React, { useMemo } from 'react';
import { useOcearoContext, convertPressure } from '../../context/OcearoContext';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGaugeHigh } from '@fortawesome/free-solid-svg-icons';
import { CircularGauge } from '../../engines/GaugeComponents';

const PRESSURE_CONFIG = {
  path: 'environment.outside.pressure',
  transform: value => convertPressure(value || 0)
};
export default function PressureWidget() {
  const { getSignalKValue, nightMode } = useOcearoContext();
  const debugMode = configService.get('debugMode');
  const primaryTextClass = nightMode ? 'text-oNight' : 'text-white';
  const secondaryTextClass = nightMode ? 'text-oNight' : 'text-gray-400';
  const mutedTextClass = nightMode ? 'text-oNight' : 'text-gray-500';
  const accentIconClass = nightMode ? 'text-oNight' : 'text-oBlue';
  
  const pressureData = useMemo(() => {
    const value = getSignalKValue(PRESSURE_CONFIG.path);

    const hasData = value !== null;

    if (!hasData && !debugMode) {
      return { hasData: false };
    }

    return {
      hasData: true,
      pressureMbar: value !== null ? PRESSURE_CONFIG.transform(value) : (debugMode ? 1013 : null)
    };
  }, [getSignalKValue, debugMode]);

  // Determine pressure status color
  const getPressureColor = (pressure) => {
    if (pressure < 1000) return 'text-oRed';
    if (pressure > 1025) return 'text-oBlue';
    return 'text-oGreen';
  };

  const getPressureStatus = (pressure) => {
    if (pressure < 1000) return 'Low';
    if (pressure > 1025) return 'High';
    return 'Normal';
  };

  if (!pressureData.hasData) {
    return (
      <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
        <div className="flex items-center space-x-2 mb-4">
          <FontAwesomeIcon icon={faGaugeHigh} className={accentIconClass} />
          <span className={`${primaryTextClass} font-medium`}>Barometric Pressure</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 mb-2">N/A</div>
            <div className={`text-sm ${mutedTextClass}`}>No pressure data available</div>
          </div>
        </div>
      </div>
    );
  }

  const { pressureMbar } = pressureData;

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faGaugeHigh} className={accentIconClass} />
        <span className={`${primaryTextClass} font-medium`}>Barometric Pressure</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center items-center">
        {/* Circular gauge */}
        <div className="relative mb-4">
          <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#424242"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#09bfff"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${pressureMbar !== null ? 2 * Math.PI * 40 * (1 - (pressureMbar - 950) / 100) : 2 * Math.PI * 40}`}
              className="transition-all duration-500"
            />
          </svg>
          
          {/* Center value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-2xl font-bold ${pressureMbar !== null ? getPressureColor(pressureMbar) : mutedTextClass}`}>
              {pressureMbar !== null ? pressureMbar : 'N/A'}
            </div>
            <div className={`${secondaryTextClass} text-xs`}>mbar</div>
          </div>
        </div>

        {/* Status */}
        <div className="text-center">
          <div className={`text-sm font-medium ${pressureMbar !== null ? getPressureColor(pressureMbar) : mutedTextClass}`}>
            {pressureMbar !== null ? getPressureStatus(pressureMbar) : 'Unknown'}
          </div>
          <div className={`${secondaryTextClass} text-xs mt-1`}>
            Range: 950-1050 mbar
          </div>
        </div>
      </div>
    </div>
  );
}
