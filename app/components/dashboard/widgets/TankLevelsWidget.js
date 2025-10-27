'use client';
import React, { useMemo } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGasPump, faTint, faOilCan, faToilet } from '@fortawesome/free-solid-svg-icons';

export default function TankLevelsWidget() {
  const { getTankData, nightMode } = useOcearoContext();
  const debugMode = configService.get('debugMode');
  const primaryTextClass = nightMode ? 'text-oNight' : 'text-white';
  const secondaryTextClass = nightMode ? 'text-oNight' : 'text-gray-400';
  const mutedTextClass = nightMode ? 'text-oNight' : 'text-gray-500';
  const accentIconClass = nightMode ? 'text-oNight' : 'text-oBlue';
  
  const tankData = useMemo(() => {
    const fuel = getTankData('fuel', 0);
    const freshWater = getTankData('freshWater', 0);
    const wasteWater = getTankData('wasteWater', 0);
    const oil = getTankData('oil', 0);

    const hasData = fuel.currentLevel !== null || freshWater.currentLevel !== null || 
                    wasteWater.currentLevel !== null || oil.currentLevel !== null;

    if (!hasData && !debugMode) {
      return { hasData: false };
    }

    return {
      hasData: true,
      fuel: {
        level: fuel.currentLevel ?? (debugMode ? 0.75 : null),
        capacity: fuel.capacity ?? (debugMode ? 200 : null),
        tankName: fuel.name,
        tankType: fuel.type,
        temperature: fuel.temperature,
        icon: faGasPump,
        color: 'text-oYellow',
        bgColor: 'bg-oYellow',
        displayName: 'Fuel'
      },
      freshWater: {
        level: freshWater.currentLevel ?? (debugMode ? 0.45 : null),
        capacity: freshWater.capacity ?? (debugMode ? 150 : null),
        tankName: freshWater.name,
        tankType: freshWater.type,
        temperature: freshWater.temperature,
        icon: faTint,
        color: 'text-oBlue',
        bgColor: 'bg-oBlue',
        displayName: 'Fresh Water'
      },
      wasteWater: {
        level: wasteWater.currentLevel ?? (debugMode ? 0.25 : null),
        capacity: wasteWater.capacity ?? (debugMode ? 80 : null),
        tankName: wasteWater.name,
        tankType: wasteWater.type,
        temperature: wasteWater.temperature,
        icon: faToilet,
        color: 'text-gray-400',
        bgColor: 'bg-gray-400',
        displayName: 'Waste Water'
      },
      oil: {
        level: oil.currentLevel ?? (debugMode ? 0.90 : null),
        capacity: oil.capacity ?? (debugMode ? 5 : null),
        tankName: oil.name,
        tankType: oil.type,
        temperature: oil.temperature,
        icon: faOilCan,
        color: 'text-orange-400',
        bgColor: 'bg-orange-400',
        displayName: 'Engine Oil'
      }
    };
  }, [getTankData, debugMode]);

  const getTankStatus = (level) => {
    if (level < 0.1) return 'Empty';
    if (level < 0.25) return 'Low';
    if (level < 0.75) return 'Medium';
    return 'Full';
  };

  const getTankColor = (level, isWaste = false) => {
    if (isWaste) {
      if (level > 0.8) return 'text-oRed';
      if (level > 0.6) return 'text-oYellow';
      return 'text-oGreen';
    } else {
      if (level < 0.1) return 'text-oRed';
      if (level < 0.25) return 'text-oYellow';
      return 'text-oGreen';
    }
  };

  if (!tankData.hasData) {
    return (
      <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
        <div className="flex items-center space-x-2 mb-4">
          <FontAwesomeIcon icon={faGasPump} className={`${accentIconClass} text-lg`} />
          <span className={`${primaryTextClass} font-medium text-lg`}>Tank Levels</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 mb-2">N/A</div>
            <div className={`text-sm ${mutedTextClass}`}>No tank data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faGasPump} className={`${accentIconClass} text-lg`} />
        <span className={`${primaryTextClass} font-medium text-lg`}>Tank Levels</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Tank displays */}
        <div className="space-y-4">
          {Object.entries(tankData).filter(([key]) => key !== 'hasData').map(([key, tank]) => {
            if (tank.level === null || tank.capacity === null) return null;
            const percentage = Math.round(tank.level * 100);
            const liters = Math.round(tank.level * tank.capacity);
            const isWaste = key === 'wasteWater';
            
            return (
              <div key={key} className="flex items-center space-x-3">
                {/* Tank icon */}
                <div className="flex items-center justify-center w-8 h-8">
                  <FontAwesomeIcon icon={tank.icon} className={`${tank.color} text-lg`} />
                </div>
                
                {/* Tank info */}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex flex-col">
                      <span className={`${primaryTextClass} text-base font-medium`}>{tank.displayName || tank.name}</span>
                      {tank.tankName && (
                        <span className={`text-xs ${mutedTextClass}`}>{tank.tankName}</span>
                      )}
                      {tank.tankType && (
                        <span className={`text-xs ${mutedTextClass} capitalize`}>{tank.tankType}</span>
                      )}
                    </div>
                    <span className={`text-sm ${getTankColor(tank.level, isWaste)}`}>
                      {getTankStatus(tank.level)}
                    </span>
                  </div>
                  
                  {/* Tank level bar */}
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${tank.bgColor}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className={`${secondaryTextClass} text-xs w-12`}>{percentage}%</div>
                  </div>
                  
                  {/* Tank volume and temperature */}
                  <div className={`flex justify-between text-xs ${secondaryTextClass} mt-1`}>
                    <span>{liters}L / {tank.capacity}L</span>
                    {tank.temperature && (
                      <span>{Math.round(tank.temperature - 273.15)}°C</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-600">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="text-center">
              <div className={secondaryTextClass}>Critical Tanks</div>
              <div className={`${primaryTextClass} font-medium`}>
                {Object.values(tankData).filter(tank => tank.level < 0.1).length}
              </div>
            </div>
            <div className="text-center">
              <div className={secondaryTextClass}>Low Tanks</div>
              <div className={`${primaryTextClass} font-medium`}>
                {Object.values(tankData).filter(tank => tank.level < 0.25 && tank.level >= 0.1).length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
