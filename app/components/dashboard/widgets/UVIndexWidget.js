'use client';
import React, { useMemo } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons';

const UV_CONFIG = {
  path: 'environment.outside.uvIndex',
  transform: value => (value || 0).toFixed(1)
};

export default function UVIndexWidget() {
  const { getSignalKValue } = useOcearoContext();
  
  const uvIndex = useMemo(() => {
    const value = getSignalKValue(UV_CONFIG.path);
    return value !== null ? UV_CONFIG.transform(value) : '3.2';
  }, [getSignalKValue]);

  // Determine UV risk level and color
  const getUVInfo = (uv) => {
    const index = parseFloat(uv);
    if (index <= 2) return { level: 'Low', color: 'text-oGreen', bg: 'bg-green-900' };
    if (index <= 5) return { level: 'Moderate', color: 'text-oYellow', bg: 'bg-yellow-900' };
    if (index <= 7) return { level: 'High', color: 'text-orange-400', bg: 'bg-orange-900' };
    if (index <= 10) return { level: 'Very High', color: 'text-oRed', bg: 'bg-red-900' };
    return { level: 'Extreme', color: 'text-purple-400', bg: 'bg-purple-900' };
  };

  const uvInfo = getUVInfo(uvIndex);

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faSun} className="text-oYellow" />
        <span className="text-white font-medium">UV Index</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center items-center">
        {/* UV Index value */}
        <div className="text-center mb-4">
          <div className={`text-4xl font-bold ${uvInfo.color}`}>
            {uvIndex}
          </div>
          <div className="text-gray-400 text-sm mt-1">UV Index</div>
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
          <div className="flex justify-between text-xs text-gray-400 mt-1">
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
