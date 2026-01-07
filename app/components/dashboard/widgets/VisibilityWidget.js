'use client';
import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { faEye, faSmog, faSun, faCloud } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';

export default function VisibilityWidget() {
  const debugMode = configService.get('debugMode');
  
  const visibilityValue = useSignalKPath('environment.outside.visibility');

  const visibilityData = useMemo(() => {
    const hasData = visibilityValue !== null || debugMode;

    if (!hasData) {
      return { hasData: false };
    }

    const visValue = visibilityValue || (debugMode ? 8000 : null);
     
    return {
      hasData: true,
      distance: visValue !== null ? Math.round(visValue / 100) / 10 : null,
      distanceNM: visValue !== null ? Math.round((visValue / 1852) * 10) / 10 : null
    };
  }, [visibilityValue, debugMode]);

  const getVisibilityStatus = (distance) => {
    if (distance < 1) return 'Dense Fog';
    if (distance < 2) return 'Thick Fog';
    if (distance < 5) return 'Moderate Fog';
    if (distance < 10) return 'Light Haze';
    if (distance < 20) return 'Good';
    return 'Excellent';
  };

  const getVisibilityColor = (distance) => {
    if (distance < 1) return 'text-oRed';
    if (distance < 2) return 'text-orange-400';
    if (distance < 5) return 'text-oYellow';
    if (distance < 10) return 'text-oBlue';
    return 'text-oGreen';
  };

  const getVisibilityIcon = (distance) => {
    if (distance < 2) return faSmog;
    if (distance < 10) return faCloud;
    return faSun;
  };

  const getVisibilityDescription = (distance) => {
    if (distance < 0.05) return 'Extremely dense fog';
    if (distance < 0.2) return 'Very dense fog';
    if (distance < 0.5) return 'Dense fog';
    if (distance < 1) return 'Thick fog';
    if (distance < 2) return 'Moderate fog';
    if (distance < 4) return 'Light fog';
    if (distance < 10) return 'Mist or haze';
    if (distance < 20) return 'Slight haze';
    if (distance < 40) return 'Clear';
    return 'Very clear';
  };

  return (
    <BaseWidget
      title="Visibility"
      icon={faEye}
      hasData={visibilityData.hasData}
      noDataMessage="No visibility data available"
    >
      <div className="flex-1 flex flex-col justify-center min-h-0">
        {/* Main visibility reading */}
        <div className="text-center mb-6">
          <FontAwesomeIcon 
            icon={getVisibilityIcon(visibilityData.distance)} 
            className={`text-5xl mb-3 ${getVisibilityColor(visibilityData.distance)}`} 
          />
          <div className="text-5xl font-black text-white mb-1 tracking-tighter">
            {visibilityData.distance}
            <span className="text-xl text-gray-400 ml-1">km</span>
          </div>
          <div className={`text-xs font-black uppercase tracking-widest ${getVisibilityColor(visibilityData.distance)}`}>
            {getVisibilityStatus(visibilityData.distance)}
          </div>
        </div>

        {/* Distance readings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-oGray p-3 rounded-lg border border-gray-800 text-center">
            <div className="text-gray-400 text-[10px] uppercase font-bold mb-1 tracking-tight">Metric</div>
            <div className={`text-xl font-bold ${getVisibilityColor(visibilityData.distance)}`}>
              {visibilityData.distance} km
            </div>
          </div>
          
          <div className="bg-oGray p-3 rounded-lg border border-gray-800 text-center">
            <div className="text-gray-400 text-[10px] uppercase font-bold mb-1 tracking-tight">Nautical</div>
            <div className={`text-xl font-bold ${getVisibilityColor(visibilityData.distance)}`}>
              {visibilityData.distanceNM} NM
            </div>
          </div>
        </div>

        {/* Visual visibility bar */}
        <div className="mb-6 px-2">
          <div className="flex items-center space-x-3">
            <div className="text-gray-500 text-[10px] font-bold">0</div>
            <div className="flex-1 bg-oGray rounded-full h-3 border border-gray-800 overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.3)] ${
                  visibilityData.distance < 1 ? 'bg-oRed' : 
                  visibilityData.distance < 5 ? 'bg-oYellow' : 
                  visibilityData.distance < 10 ? 'bg-oBlue' : 'bg-oGreen'
                }`}
                style={{ width: `${Math.min(100, (visibilityData.distance / 20) * 100)}%` }}
              />
            </div>
            <div className="text-gray-500 text-[10px] font-bold">20k+</div>
          </div>
        </div>

        {/* Additional info */}
        <div className="bg-oGray p-3 rounded-lg border border-gray-800 text-center">
          <div className="text-white font-bold text-sm mb-1 uppercase tracking-tight">
            {getVisibilityDescription(visibilityData.distance)}
          </div>
          <div className="text-gray-500 text-[10px] uppercase font-bold">
            Environmental Condition
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
