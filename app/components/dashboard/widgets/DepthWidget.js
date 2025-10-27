'use client';
import React, { useMemo } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWater, faAnchor } from '@fortawesome/free-solid-svg-icons';

export default function DepthWidget() {
  const { getDepthData, nightMode } = useOcearoContext();
  const debugMode = configService.get('debugMode');
  
  const depthData = useMemo(() => {
    const depth = getDepthData();
    
    const hasData = depth.belowKeel !== null || depth.belowSurface !== null || depth.belowTransducer !== null;

    if (!hasData && !debugMode) {
      return { hasData: false };
    }

    return {
      hasData: true,
      belowKeel: depth.belowKeel ?? (debugMode ? 5.2 : null),
      belowSurface: depth.belowSurface ?? (debugMode ? 6.8 : null)
    };
  }, [getDepthData, debugMode]);

  const getDepthColor = (depth) => {
    if (depth < 2) return 'text-oRed';
    if (depth < 5) return 'text-oYellow';
    return 'text-oBlue';
  };

  const getDepthStatus = (depth) => {
    if (depth < 2) return 'Shallow';
    if (depth < 5) return 'Caution';
    if (depth < 10) return 'Safe';
    return 'Deep';
  };

  if (!depthData.hasData) {
    return (
      <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
        <div className="flex items-center space-x-2 mb-4">
          <FontAwesomeIcon icon={faWater} className="text-oBlue text-lg" />
          <span className="text-white font-medium text-lg">Depth</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 mb-2">N/A</div>
            <div className="text-sm text-gray-500">No depth data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faWater} className={`${nightMode ? 'text-oNight' : 'text-oBlue'} text-lg`} />
        <span className={`${nightMode ? 'text-oNight' : 'text-white'} font-medium text-lg`}>Depth</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Main depth reading */}
        <div className="text-center mb-6">
          <div className={`text-5xl font-bold ${nightMode ? 'text-oNight' : 'text-white'} mb-2`}>
            {depthData.belowKeel !== null ? depthData.belowKeel : 'N/A'}
            {depthData.belowKeel !== null && <span className={`text-xl ${nightMode ? 'text-oNight' : 'text-gray-400'} ml-1`}>m</span>}
          </div>
          <div className={`text-base font-medium ${depthData.belowKeel !== null ? getDepthColor(depthData.belowKeel) : nightMode ? 'text-oNight' : 'text-gray-500'}`}>
            {depthData.belowKeel !== null ? getDepthStatus(depthData.belowKeel) : 'Unknown'}
          </div>
        </div>

        {/* Depth readings */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className={`${nightMode ? 'text-oNight' : 'text-gray-400'} text-base mb-1`}>Below Keel</div>
            <div className={`text-2xl font-bold ${depthData.belowKeel !== null ? getDepthColor(depthData.belowKeel) : nightMode ? 'text-oNight' : 'text-gray-500'}`}>
              {depthData.belowKeel !== null ? `${depthData.belowKeel}m` : 'N/A'}
            </div>
          </div>
          
          <div className="text-center">
            <div className={`${nightMode ? 'text-oNight' : 'text-gray-400'} text-base mb-1`}>Below Surface</div>
            <div className={`text-2xl font-bold ${depthData.belowSurface !== null ? getDepthColor(depthData.belowSurface) : nightMode ? 'text-oNight' : 'text-gray-500'}`}>
              {depthData.belowSurface !== null ? `${depthData.belowSurface}m` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Visual depth indicator */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faAnchor} className={`${nightMode ? 'text-oNight' : 'text-gray-400'} text-xs`} />
            <div className="flex-1 bg-gray-600 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${depthData.belowKeel !== null ? getDepthColor(depthData.belowKeel).replace('text-', 'bg-') : 'bg-gray-500'}`}
                style={{ width: `${depthData.belowKeel !== null ? Math.min(100, Math.max(5, depthData.belowKeel * 5)) : 0}%` }}
              />
            </div>
            <div className={`${nightMode ? 'text-oNight' : 'text-gray-400'} text-xs w-12`}>{depthData.belowKeel !== null ? `${depthData.belowKeel}m` : 'N/A'}</div>
          </div>
        </div>

        {/* Status info */}
        <div className="text-center space-y-1">
          <div className={`${nightMode ? 'text-oNight' : 'text-gray-400'} text-xs`}>
            Draft clearance: {depthData.belowKeel !== null ? `${Math.max(0, depthData.belowKeel - 1.5).toFixed(1)}m` : 'N/A'}
          </div>
          <div className={`${nightMode ? 'text-oNight' : 'text-gray-400'} text-xs`}>
            Range: 0-50m
          </div>
        </div>
      </div>
    </div>
  );
}
