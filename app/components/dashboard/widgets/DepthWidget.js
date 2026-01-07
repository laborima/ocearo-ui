'use client';
import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useOcearoContext } from '../../context/OcearoContext';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { faWater, faAnchor } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';

export default function DepthWidget() {
  const { nightMode } = useOcearoContext();
  const debugMode = configService.get('debugMode');
  
  const depthKeel = useSignalKPath('environment.depth.belowKeel');
  const depthSurface = useSignalKPath('environment.depth.belowSurface');
  const depthTransducer = useSignalKPath('environment.depth.belowTransducer');

  const depthData = useMemo(() => {
    const keel = depthKeel ?? depthTransducer ?? (debugMode ? 5.2 : null);
    const surface = depthSurface ?? (depthTransducer !== null ? depthTransducer + 1.5 : (debugMode ? 6.8 : null));
    
    const hasData = keel !== null || surface !== null || debugMode;

    if (!hasData) {
      return { hasData: false };
    }

    return {
      hasData: true,
      belowKeel: keel !== null ? Math.round(keel * 10) / 10 : null,
      belowSurface: surface !== null ? Math.round(surface * 10) / 10 : null
    };
  }, [depthKeel, depthSurface, depthTransducer, debugMode]);

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

  const secondaryTextClass = nightMode ? 'text-oNight' : 'text-gray-400';

  return (
    <BaseWidget
      title="Depth"
      icon={faWater}
      hasData={depthData.hasData}
      noDataMessage="No depth data available"
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Main depth reading */}
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-white mb-2">
            {depthData.belowKeel !== null ? depthData.belowKeel : 'N/A'}
            {depthData.belowKeel !== null && <span className="text-xl text-gray-400 ml-1">m</span>}
          </div>
          <div className={`text-xs font-bold uppercase tracking-widest ${depthData.belowKeel !== null ? getDepthColor(depthData.belowKeel) : 'text-gray-500'}`}>
            {depthData.belowKeel !== null ? getDepthStatus(depthData.belowKeel) : 'Unknown'}
          </div>
        </div>

        {/* Depth readings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-oGray p-3 rounded-lg text-center border border-gray-800">
            <div className="text-gray-400 text-[10px] uppercase font-bold mb-1">Below Keel</div>
            <div className={`text-xl font-bold ${depthData.belowKeel !== null ? getDepthColor(depthData.belowKeel) : 'text-gray-500'}`}>
              {depthData.belowKeel !== null ? `${depthData.belowKeel}m` : 'N/A'}
            </div>
          </div>
          
          <div className="bg-oGray p-3 rounded-lg text-center border border-gray-800">
            <div className="text-gray-400 text-[10px] uppercase font-bold mb-1">Surface</div>
            <div className={`text-xl font-bold ${depthData.belowSurface !== null ? getDepthColor(depthData.belowSurface) : 'text-gray-500'}`}>
              {depthData.belowSurface !== null ? `${depthData.belowSurface}m` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Visual depth indicator */}
        <div className="mb-6 px-2">
          <div className="flex items-center space-x-3">
            <FontAwesomeIcon icon={faAnchor} className="text-gray-500 text-xs" />
            <div className="flex-1 bg-oGray rounded-full h-3 overflow-hidden border border-gray-800 shadow-inner">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${
                  depthData.belowKeel !== null ? getDepthColor(depthData.belowKeel).replace('text-', 'bg-') : 'bg-gray-500'
                } shadow-[0_0_10px_rgba(0,0,0,0.2)]`}
                style={{ width: `${depthData.belowKeel !== null ? Math.min(100, (depthData.belowKeel / 50) * 100) : 0}%` }}
              />
            </div>
            <div className="text-gray-500 text-[10px] w-8 text-right font-bold">50m</div>
          </div>
        </div>

        {/* Status info */}
        <div className="bg-oGray p-3 rounded-lg border border-gray-800 space-y-2">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold">
            <span className="text-gray-400">Draft clearance:</span>
            <span className="text-white font-mono">
              {depthData.belowKeel !== null ? `${Math.max(0, depthData.belowKeel - 1.5).toFixed(1)}m` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] uppercase font-bold">
            <span className="text-gray-400">Transducer offset:</span>
            <span className="text-white font-mono">1.5m</span>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
