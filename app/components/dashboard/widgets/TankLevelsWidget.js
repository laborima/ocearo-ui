'use client';
import React, { useMemo } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGasPump, faTint, faOilCan, faToilet } from '@fortawesome/free-solid-svg-icons';

export default function TankLevelsWidget() {
  const { getSignalKValue } = useOcearoContext();
  
  const tankData = useMemo(() => {
    // Get tank data from SignalK - using mock data for now
    return {
      fuel: {
        level: getSignalKValue('tanks.fuel.main.currentLevel') || 0.75,
        capacity: getSignalKValue('tanks.fuel.main.capacity') || 200,
        icon: faGasPump,
        color: 'text-oYellow',
        bgColor: 'bg-oYellow',
        name: 'Fuel'
      },
      freshWater: {
        level: getSignalKValue('tanks.freshWater.main.currentLevel') || 0.45,
        capacity: getSignalKValue('tanks.freshWater.main.capacity') || 150,
        icon: faTint,
        color: 'text-oBlue',
        bgColor: 'bg-oBlue',
        name: 'Fresh Water'
      },
      wasteWater: {
        level: getSignalKValue('tanks.wasteWater.main.currentLevel') || 0.25,
        capacity: getSignalKValue('tanks.wasteWater.main.capacity') || 80,
        icon: faToilet,
        color: 'text-gray-400',
        bgColor: 'bg-gray-400',
        name: 'Waste Water'
      },
      oil: {
        level: getSignalKValue('tanks.oil.main.currentLevel') || 0.90,
        capacity: getSignalKValue('tanks.oil.main.capacity') || 5,
        icon: faOilCan,
        color: 'text-orange-400',
        bgColor: 'bg-orange-400',
        name: 'Engine Oil'
      }
    };
  }, [getSignalKValue]);

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

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faGasPump} className="text-oBlue text-lg" />
        <span className="text-white font-medium text-lg">Tank Levels</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Tank displays */}
        <div className="space-y-4">
          {Object.entries(tankData).map(([key, tank]) => {
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
                    <span className="text-white text-base font-medium">{tank.name}</span>
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
                    <div className="text-gray-400 text-xs w-12">{percentage}%</div>
                  </div>
                  
                  {/* Tank volume */}
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{liters}L</span>
                    <span>{tank.capacity}L</span>
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
              <div className="text-gray-400">Critical Tanks</div>
              <div className="text-white font-medium">
                {Object.values(tankData).filter(tank => tank.level < 0.1).length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Low Tanks</div>
              <div className="text-white font-medium">
                {Object.values(tankData).filter(tank => tank.level < 0.25 && tank.level >= 0.1).length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
