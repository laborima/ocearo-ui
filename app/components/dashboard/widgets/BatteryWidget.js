'use client';
import React, { useMemo } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBatteryFull, faBatteryHalf, faBatteryQuarter, faBolt } from '@fortawesome/free-solid-svg-icons';

export default function BatteryWidget() {
  const { getSignalKValue, nightMode } = useOcearoContext();
  const debugMode = configService.get('debugMode');
  const primaryTextClass = nightMode ? 'text-oNight' : 'text-white';
  const secondaryTextClass = nightMode ? 'text-oNight' : 'text-gray-400';
  const mutedTextClass = nightMode ? 'text-oNight' : 'text-gray-500';
  const accentIconClass = nightMode ? 'text-oNight' : 'text-oBlue';
  
  const batteryData = useMemo(() => {
    // Get battery data from SignalK (batteries.1 = house, batteries.0 = starter)
    const houseVoltage = getSignalKValue('electrical.batteries.1.voltage');
    const starterVoltage = getSignalKValue('electrical.batteries.0.voltage');
    const houseCurrent = getSignalKValue('electrical.batteries.1.current');
    const starterCurrent = getSignalKValue('electrical.batteries.0.current');

    const hasData = houseVoltage !== null || starterVoltage !== null;

    if (!hasData && !debugMode) {
      return { hasData: false };
    }

    const house = houseVoltage || (debugMode ? 12.6 : null);
    const starter = starterVoltage || (debugMode ? 12.4 : null);
    const houseCurr = houseCurrent || (debugMode ? -2.3 : null);
    const starterCurr = starterCurrent || (debugMode ? 0.1 : null);
    
    return {
      hasData: true,
      house: {
        voltage: house ? Math.round(house * 10) / 10 : null,
        current: houseCurr ? Math.round(houseCurr * 10) / 10 : null,
        percentage: house ? Math.min(100, Math.max(0, ((house - 11.8) / (12.8 - 11.8)) * 100)) : null
      },
      starter: {
        voltage: starter ? Math.round(starter * 10) / 10 : null,
        current: starterCurr ? Math.round(starterCurr * 10) / 10 : null,
        percentage: starter ? Math.min(100, Math.max(0, ((starter - 11.8) / (12.8 - 11.8)) * 100)) : null
      }
    };
  }, [getSignalKValue, debugMode]);

  const getBatteryIcon = (percentage) => {
    if (percentage > 75) return faBatteryFull;
    if (percentage > 25) return faBatteryHalf;
    return faBatteryQuarter;
  };

  const getBatteryColor = (percentage) => {
    if (percentage < 20) return 'text-oRed';
    if (percentage < 50) return 'text-oYellow';
    return 'text-oGreen';
  };

  const getBatteryStatus = (percentage) => {
    if (percentage < 20) return 'Critical';
    if (percentage < 50) return 'Low';
    if (percentage < 80) return 'Good';
    return 'Excellent';
  };

  if (!batteryData.hasData) {
    return (
      <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
        <div className="flex items-center space-x-2 mb-4">
          <FontAwesomeIcon icon={faBolt} className={`${accentIconClass} text-lg`} />
          <span className={`${primaryTextClass} font-medium text-lg`}>Battery Status</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 mb-2">N/A</div>
            <div className={`text-sm ${mutedTextClass}`}>No battery data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faBolt} className={`${accentIconClass} text-lg`} />
        <span className={`${primaryTextClass} font-medium text-lg`}>Battery Status</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Battery readings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* House Battery */}
          <div className="text-center">
            <div className={`${secondaryTextClass} text-base mb-2`}>House</div>
            <FontAwesomeIcon 
              icon={getBatteryIcon(batteryData.house.percentage || 0)} 
              className={`text-2xl mb-2 ${batteryData.house.percentage !== null ? getBatteryColor(batteryData.house.percentage) : 'text-gray-500'}`} 
            />
            <div className={`${primaryTextClass} text-xl font-bold`}>
              {batteryData.house.voltage !== null ? `${batteryData.house.voltage}V` : 'N/A'}
            </div>
            <div className={`text-base ${batteryData.house.percentage !== null ? getBatteryColor(batteryData.house.percentage) : 'text-gray-500'}`}>
              {batteryData.house.percentage !== null ? `${Math.round(batteryData.house.percentage)}%` : 'N/A'}
            </div>
            <div className={`${secondaryTextClass} text-xs`}>
              {batteryData.house.current !== null ? `${batteryData.house.current > 0 ? '+' : ''}${batteryData.house.current}A` : 'N/A'}
            </div>
          </div>
          
          {/* Starter Battery */}
          <div className="text-center">
            <div className={`${secondaryTextClass} text-base mb-2`}>Starter</div>
            <FontAwesomeIcon 
              icon={getBatteryIcon(batteryData.starter.percentage || 0)} 
              className={`text-2xl mb-2 ${batteryData.starter.percentage !== null ? getBatteryColor(batteryData.starter.percentage) : 'text-gray-500'}`} 
            />
            <div className={`${primaryTextClass} text-xl font-bold`}>
              {batteryData.starter.voltage !== null ? `${batteryData.starter.voltage}V` : 'N/A'}
            </div>
            <div className={`text-base ${batteryData.starter.percentage !== null ? getBatteryColor(batteryData.starter.percentage) : 'text-gray-500'}`}>
              {batteryData.starter.percentage !== null ? `${Math.round(batteryData.starter.percentage)}%` : 'N/A'}
            </div>
            <div className={`${secondaryTextClass} text-xs`}>
              {batteryData.starter.current !== null ? `${batteryData.starter.current > 0 ? '+' : ''}${batteryData.starter.current}A` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Visual battery bars */}
        <div className="space-y-3 mb-4">
          {/* House battery bar */}
          <div className="flex items-center space-x-2">
            <div className={`${secondaryTextClass} text-xs w-12`}>House</div>
            <div className="flex-1 bg-gray-600 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  batteryData.house.percentage !== null && batteryData.house.percentage < 20 ? 'bg-oRed' : 
                  batteryData.house.percentage !== null && batteryData.house.percentage < 50 ? 'bg-oYellow' : 'bg-oGreen'
                }`}
                style={{ width: `${batteryData.house.percentage !== null ? batteryData.house.percentage : 0}%` }}
              />
            </div>
            <div className={`${secondaryTextClass} text-xs w-8`}>{batteryData.house.percentage !== null ? `${Math.round(batteryData.house.percentage)}%` : 'N/A'}</div>
          </div>
          
          {/* Starter battery bar */}
          <div className="flex items-center space-x-2">
            <div className={`${secondaryTextClass} text-xs w-12`}>Start</div>
            <div className="flex-1 bg-gray-600 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  batteryData.starter.percentage !== null && batteryData.starter.percentage < 20 ? 'bg-oRed' : 
                  batteryData.starter.percentage !== null && batteryData.starter.percentage < 50 ? 'bg-oYellow' : 'bg-oGreen'
                }`}
                style={{ width: `${batteryData.starter.percentage !== null ? batteryData.starter.percentage : 0}%` }}
              />
            </div>
            <div className={`${secondaryTextClass} text-xs w-8`}>{batteryData.starter.percentage !== null ? `${Math.round(batteryData.starter.percentage)}%` : 'N/A'}</div>
          </div>
        </div>

        {/* Status and info */}
        <div className="text-center space-y-2">
          <div className={`text-sm font-medium ${batteryData.house.percentage !== null && batteryData.starter.percentage !== null ? getBatteryColor(Math.min(batteryData.house.percentage, batteryData.starter.percentage)) : mutedTextClass}`}>
            {batteryData.house.percentage !== null && batteryData.starter.percentage !== null ? getBatteryStatus(Math.min(batteryData.house.percentage, batteryData.starter.percentage)) : 'Unknown'}
          </div>
          <div className={`${secondaryTextClass} text-xs`}>
            Total Load: {batteryData.house.current !== null && batteryData.starter.current !== null ? `${Math.abs(batteryData.house.current + batteryData.starter.current).toFixed(1)}A` : 'N/A'}
          </div>
          <div className={`${secondaryTextClass} text-xs`}>
            Range: 11.0V - 13.0V
          </div>
        </div>
      </div>
    </div>
  );
}
