'use client';
import React, { useMemo } from 'react';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';

const UV_CONFIG = {
  path: 'environment.outside.uvIndex',
  transform: value => (value || 0).toFixed(1)
};

export default function UVIndexWidget() {
  const debugMode = configService.get('debugMode');
  
  const uvValue = useSignalKPath(UV_CONFIG.path);

  const uvData = useMemo(() => {
    const hasData = uvValue !== null || debugMode;

    if (!hasData) {
      return { hasData: false };
    }

    return {
      hasData: true,
      uvIndex: uvValue !== null ? UV_CONFIG.transform(uvValue) : (debugMode ? 4 : null)
    };
  }, [uvValue, debugMode]);

  const { hasData, uvIndex } = uvData;

  const getUVInfo = (uv) => {
    const index = parseFloat(uv);
    if (index <= 2) return { level: 'Low', color: 'text-oGreen', bg: 'bg-green-900/30 border-green-800' };
    if (index <= 5) return { level: 'Moderate', color: 'text-oYellow', bg: 'bg-yellow-900/30 border-yellow-800' };
    if (index <= 7) return { level: 'High', color: 'text-orange-400', bg: 'bg-orange-900/30 border-orange-800' };
    if (index <= 10) return { level: 'Very High', color: 'text-oRed', bg: 'bg-red-900/30 border-red-800' };
    return { level: 'Extreme', color: 'text-purple-400', bg: 'bg-purple-900/30 border-purple-800' };
  };

  const uvInfo = hasData ? getUVInfo(uvIndex) : null;

  return (
    <BaseWidget
      title="UV Index"
      icon={faSun}
      hasData={uvData.hasData}
      noDataMessage="No UV index data available"
    >
      <div className="flex-1 flex flex-col justify-center items-center min-h-0">
        {/* Main UV display */}
        <div className="text-center mb-6">
          <div className="text-5xl font-black text-white mb-1 tracking-tighter">
            {uvIndex !== null ? uvIndex : 'N/A'}
          </div>
          <div className={`text-xs font-black uppercase tracking-widest ${uvIndex !== null ? getUVInfo(uvIndex).color : 'text-gray-500'}`}>
            {uvIndex !== null ? getUVInfo(uvIndex).level : 'Unknown'}
          </div>
        </div>

        {/* Risk level indicator */}
        <div className={`px-4 py-1.5 rounded-lg border uppercase text-[10px] font-black tracking-widest ${uvInfo?.bg || 'bg-gray-900/30 border-gray-800'} mb-6`}>
          <span className={uvInfo?.color || 'text-gray-500'}>
            {uvInfo?.level || 'Unknown'} Risk
          </span>
        </div>

        {/* UV scale bar */}
        <div className="w-full px-2">
          <div className="flex h-2.5 rounded-full overflow-hidden border border-gray-800 shadow-inner">
            <div className="flex-1 bg-oGreen shadow-[inset_0_0_5px_rgba(0,0,0,0.2)]"></div>
            <div className="flex-1 bg-oYellow shadow-[inset_0_0_5px_rgba(0,0,0,0.2)]"></div>
            <div className="flex-1 bg-orange-500 shadow-[inset_0_0_5px_rgba(0,0,0,0.2)]"></div>
            <div className="flex-1 bg-oRed shadow-[inset_0_0_5px_rgba(0,0,0,0.2)]"></div>
            <div className="flex-1 bg-purple-500 shadow-[inset_0_0_5px_rgba(0,0,0,0.2)]"></div>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-tighter px-0.5">
            <span>0</span>
            <span>2</span>
            <span>5</span>
            <span>7</span>
            <span>10+</span>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
