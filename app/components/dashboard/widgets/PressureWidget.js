'use client';
import React, { useMemo } from 'react';
import { convertPressure } from '../../context/OcearoContext';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { faGaugeHigh } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';

const PRESSURE_CONFIG = {
  path: 'environment.outside.pressure',
  transform: value => convertPressure(value || 0)
};

export default function PressureWidget() {
  const debugMode = configService.get('debugMode');
  
  const pressureValue = useSignalKPath(PRESSURE_CONFIG.path);

  const pressureData = useMemo(() => {
    const hasData = pressureValue !== null || debugMode;

    if (!hasData) {
      return { hasData: false };
    }

    return {
      hasData: true,
      pressureMbar: pressureValue !== null ? PRESSURE_CONFIG.transform(pressureValue) : (debugMode ? 1013 : null)
    };
  }, [pressureValue, debugMode]);

  const { hasData, pressureMbar } = pressureData;

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

  return (
    <BaseWidget
      title="Pressure"
      icon={faGaugeHigh}
      hasData={pressureData.hasData}
      noDataMessage="No pressure data available"
    >
      <div className="flex-1 flex flex-col justify-center items-center min-h-0">
        <div className="relative mb-6">
          <svg className="w-40 h-40 transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(9,191,255,0.2)]" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#2a2a2a"
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#09bfff"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${pressureMbar !== null ? 2 * Math.PI * 42 * (1 - (Math.min(Math.max(pressureMbar, 950), 1050) - 950) / 100) : 2 * Math.PI * 42}`}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-3xl font-bold text-white mb-0.5`}>
              {pressureMbar !== null ? pressureMbar : 'N/A'}
            </div>
            <div className="text-gray-500 text-[10px] uppercase font-black">mbar</div>
          </div>
        </div>

        <div className="text-center">
          <div className={`text-xs font-black uppercase tracking-widest mb-2 ${pressureMbar !== null ? getPressureColor(pressureMbar) : 'text-gray-500'}`}>
            {pressureMbar !== null ? getPressureStatus(pressureMbar) : 'Unknown'}
          </div>
          <div className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">
            Operational Range: 950-1050
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
