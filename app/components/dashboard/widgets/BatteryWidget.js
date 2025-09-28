'use client';
import React, { useMemo } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBatteryFull, faBatteryHalf, faBatteryQuarter, faBolt } from '@fortawesome/free-solid-svg-icons';

export default function BatteryWidget() {
  const { getSignalKValue } = useOcearoContext();
  
  const batteryData = useMemo(() => {
    // Get battery data from SignalK - using mock data for now
    const house = getSignalKValue('electrical.batteries.house.voltage') || 12.6;
    const starter = getSignalKValue('electrical.batteries.starter.voltage') || 12.4;
    const houseCurrent = getSignalKValue('electrical.batteries.house.current') || -2.3;
    const starterCurrent = getSignalKValue('electrical.batteries.starter.current') || 0.1;
    
    return {
      house: {
        voltage: Math.round(house * 10) / 10,
        current: Math.round(houseCurrent * 10) / 10,
        percentage: Math.min(100, Math.max(0, ((house - 11.8) / (12.8 - 11.8)) * 100))
      },
      starter: {
        voltage: Math.round(starter * 10) / 10,
        current: Math.round(starterCurrent * 10) / 10,
        percentage: Math.min(100, Math.max(0, ((starter - 11.8) / (12.8 - 11.8)) * 100))
      }
    };
  }, [getSignalKValue]);

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

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faBolt} className="text-oBlue text-lg" />
        <span className="text-white font-medium text-lg">Battery Status</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Battery readings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* House Battery */}
          <div className="text-center">
            <div className="text-gray-400 text-base mb-2">House</div>
            <FontAwesomeIcon 
              icon={getBatteryIcon(batteryData.house.percentage)} 
              className={`text-2xl mb-2 ${getBatteryColor(batteryData.house.percentage)}`} 
            />
            <div className="text-white text-xl font-bold">
              {batteryData.house.voltage}V
            </div>
            <div className={`text-base ${getBatteryColor(batteryData.house.percentage)}`}>
              {Math.round(batteryData.house.percentage)}%
            </div>
            <div className="text-gray-400 text-xs">
              {batteryData.house.current > 0 ? '+' : ''}{batteryData.house.current}A
            </div>
          </div>
          
          {/* Starter Battery */}
          <div className="text-center">
            <div className="text-gray-400 text-base mb-2">Starter</div>
            <FontAwesomeIcon 
              icon={getBatteryIcon(batteryData.starter.percentage)} 
              className={`text-2xl mb-2 ${getBatteryColor(batteryData.starter.percentage)}`} 
            />
            <div className="text-white text-xl font-bold">
              {batteryData.starter.voltage}V
            </div>
            <div className={`text-base ${getBatteryColor(batteryData.starter.percentage)}`}>
              {Math.round(batteryData.starter.percentage)}%
            </div>
            <div className="text-gray-400 text-xs">
              {batteryData.starter.current > 0 ? '+' : ''}{batteryData.starter.current}A
            </div>
          </div>
        </div>

        {/* Visual battery bars */}
        <div className="space-y-3 mb-4">
          {/* House battery bar */}
          <div className="flex items-center space-x-2">
            <div className="text-gray-400 text-xs w-12">House</div>
            <div className="flex-1 bg-gray-600 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  batteryData.house.percentage < 20 ? 'bg-oRed' : 
                  batteryData.house.percentage < 50 ? 'bg-oYellow' : 'bg-oGreen'
                }`}
                style={{ width: `${batteryData.house.percentage}%` }}
              />
            </div>
            <div className="text-gray-400 text-xs w-8">{Math.round(batteryData.house.percentage)}%</div>
          </div>
          
          {/* Starter battery bar */}
          <div className="flex items-center space-x-2">
            <div className="text-gray-400 text-xs w-12">Start</div>
            <div className="flex-1 bg-gray-600 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  batteryData.starter.percentage < 20 ? 'bg-oRed' : 
                  batteryData.starter.percentage < 50 ? 'bg-oYellow' : 'bg-oGreen'
                }`}
                style={{ width: `${batteryData.starter.percentage}%` }}
              />
            </div>
            <div className="text-gray-400 text-xs w-8">{Math.round(batteryData.starter.percentage)}%</div>
          </div>
        </div>

        {/* Status and info */}
        <div className="text-center space-y-2">
          <div className={`text-sm font-medium ${getBatteryColor(Math.min(batteryData.house.percentage, batteryData.starter.percentage))}`}>
            {getBatteryStatus(Math.min(batteryData.house.percentage, batteryData.starter.percentage))}
          </div>
          <div className="text-gray-400 text-xs">
            Total Load: {Math.abs(batteryData.house.current + batteryData.starter.current).toFixed(1)}A
          </div>
          <div className="text-gray-400 text-xs">
            Range: 11.0V - 13.0V
          </div>
        </div>
      </div>
    </div>
  );
}
