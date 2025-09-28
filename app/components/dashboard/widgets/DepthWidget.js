'use client';
import React, { useMemo } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWater, faAnchor } from '@fortawesome/free-solid-svg-icons';

export default function DepthWidget() {
  const { getSignalKValue } = useOcearoContext();
  
  const depthData = useMemo(() => {
    const depth = getSignalKValue('environment.depth.belowKeel') || 0;
    const depthSurface = getSignalKValue('environment.depth.belowSurface') || 0;
    return {
      belowKeel: Math.round(depth * 10) / 10,
      belowSurface: Math.round(depthSurface * 10) / 10
    };
  }, [getSignalKValue]);

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

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faWater} className="text-oBlue" />
        <span className="text-white font-medium">Depth</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Main depth reading */}
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-white mb-2">
            {depthData.belowKeel}
            <span className="text-lg text-gray-400 ml-1">m</span>
          </div>
          <div className={`text-sm font-medium ${getDepthColor(depthData.belowKeel)}`}>
            {getDepthStatus(depthData.belowKeel)}
          </div>
        </div>

        {/* Depth readings */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">Below Keel</div>
            <div className={`text-2xl font-bold ${getDepthColor(depthData.belowKeel)}`}>
              {depthData.belowKeel}m
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">Below Surface</div>
            <div className={`text-2xl font-bold ${getDepthColor(depthData.belowSurface)}`}>
              {depthData.belowSurface}m
            </div>
          </div>
        </div>

        {/* Visual depth indicator */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faAnchor} className="text-gray-400 text-xs" />
            <div className="flex-1 bg-gray-600 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${getDepthColor(depthData.belowKeel).replace('text-', 'bg-')}`}
                style={{ width: `${Math.min(100, Math.max(5, depthData.belowKeel * 5))}%` }}
              />
            </div>
            <div className="text-gray-400 text-xs w-12">{depthData.belowKeel}m</div>
          </div>
        </div>

        {/* Status info */}
        <div className="text-center space-y-1">
          <div className="text-gray-400 text-xs">
            Draft clearance: {Math.max(0, depthData.belowKeel - 1.5).toFixed(1)}m
          </div>
          <div className="text-gray-400 text-xs">
            Range: 0-50m
          </div>
        </div>
      </div>
    </div>
  );
}
