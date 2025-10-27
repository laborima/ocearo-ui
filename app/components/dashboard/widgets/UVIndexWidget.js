'use client';
import React, { useMemo } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons';

const UV_CONFIG = {
  path: 'environment.outside.uvIndex',
  transform: value => (value || 0).toFixed(1)
};

export default function UVIndexWidget() {
  const { getSignalKValue, nightMode } = useOcearoContext();
  const debugMode = configService.get('debugMode');
  const primaryTextClass = nightMode ? 'text-oNight' : 'text-white';
  const secondaryTextClass = nightMode ? 'text-oNight' : 'text-gray-400';
  const mutedTextClass = nightMode ? 'text-oNight' : 'text-gray-500';
  const accentIconClass = nightMode ? 'text-oNight' : 'text-oBlue';
  
  const uvData = useMemo(() => {
    const value = getSignalKValue(UV_CONFIG.path);

    const hasData = value !== null;

    if (!hasData && !debugMode) {
      return { hasData: false };
    }

    return {
      hasData: true,
      uvIndex: value !== null ? UV_CONFIG.transform(value) : (debugMode ? '3.2' : null)
    };
  }, [getSignalKValue, debugMode]);

  // Determine UV risk level and color
  const getUVInfo = (uv) => {
    const index = parseFloat(uv);
    if (index <= 2) return { level: 'Low', color: 'text-oGreen', bg: 'bg-green-900' };
    if (index <= 5) return { level: 'Moderate', color: 'text-oYellow', bg: 'bg-yellow-900' };
    if (index <= 7) return { level: 'High', color: 'text-orange-400', bg: 'bg-orange-900' };
    if (index <= 10) return { level: 'Very High', color: 'text-oRed', bg: 'bg-red-900' };
    return { level: 'Extreme', color: 'text-purple-400', bg: 'bg-purple-900' };
  };

  const getUVColor = (uv) => {
    const index = parseFloat(uv);
    if (index <= 2) return 'text-oGreen';
    if (index <= 5) return 'text-oYellow';
    if (index <= 7) return 'text-orange-400';
    if (index <= 10) return 'text-oRed';
    return 'text-purple-400';
  };

  if (!uvData.hasData) {
    return (
      <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
        <div className="flex items-center space-x-2 mb-4">
          <FontAwesomeIcon icon={faSun} className={`${accentIconClass} text-lg`} />
          <span className={`${primaryTextClass} font-medium text-lg`}>UV Index</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 mb-2">N/A</div>
            <div className={`text-sm ${mutedTextClass}`}>No UV index data available</div>
          </div>
        </div>
      </div>
    );
  }

  const { uvIndex } = uvData;
  const uvInfo = uvIndex !== null ? getUVInfo(uvIndex) : { level: 'Unknown', color: 'text-gray-500', bg: 'bg-gray-700' };

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faSun} className={`${accentIconClass} text-lg`} />
        <span className={`${primaryTextClass} font-medium text-lg`}>UV Index</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center items-center">
        {/* Main UV display */}
        <div className="text-center mb-6">
          <div className={`text-5xl font-bold ${primaryTextClass} mb-2`}>
            {uvIndex !== null ? uvIndex : 'N/A'}
          </div>
          <div className={`text-base font-medium ${uvIndex !== null ? getUVColor(uvIndex) : mutedTextClass}`}>
            {uvInfo.level}
          </div>
        </div>

        {/* Risk level indicator */}
        <div className={`px-3 py-1 rounded-full ${uvInfo.bg} mb-4`}>
          <span className={`text-sm font-medium ${uvInfo.color}`}>
            {uvInfo.level}
          </span>
        </div>

        {/* UV scale bar */}
        <div className="w-full">
          <div className="flex h-3 rounded-full overflow-hidden">
            <div className="flex-1 bg-green-500"></div>
            <div className="flex-1 bg-yellow-500"></div>
            <div className="flex-1 bg-orange-500"></div>
            <div className="flex-1 bg-red-500"></div>
            <div className="flex-1 bg-purple-500"></div>
          </div>
          <div className={`flex justify-between text-xs ${secondaryTextClass} mt-1`}>
            <span>0</span>
            <span>2</span>
            <span>5</span>
            <span>7</span>
            <span>10+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
