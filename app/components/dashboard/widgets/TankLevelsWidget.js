'use client';
import React, { useMemo } from 'react';
import { useSignalKPaths } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGasPump, faTint, faOilCan, faToilet, faTemperatureHalf } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';

export default function TankLevelsWidget() {
  const debugMode = configService.get('debugMode');
  
  const tankPaths = [
    'tanks.fuel.0.currentLevel', 'tanks.fuel.0.capacity', 'tanks.fuel.0.name', 'tanks.fuel.0.type', 'tanks.fuel.0.temperature',
    'tanks.freshWater.0.currentLevel', 'tanks.freshWater.0.capacity', 'tanks.freshWater.0.name', 'tanks.freshWater.0.type', 'tanks.freshWater.0.temperature',
    'tanks.wasteWater.0.currentLevel', 'tanks.wasteWater.0.capacity', 'tanks.wasteWater.0.name', 'tanks.wasteWater.0.type', 'tanks.wasteWater.0.temperature',
    'tanks.oil.0.currentLevel', 'tanks.oil.0.capacity', 'tanks.oil.0.name', 'tanks.oil.0.type', 'tanks.oil.0.temperature'
  ];
  
  const tankValues = useSignalKPaths(tankPaths);

  const tankData = useMemo(() => {
    const getTankInfo = (type, defaultLabel, icon, color, bgColor) => {
      const level = tankValues[`tanks.${type}.0.currentLevel`];
      const capacity = tankValues[`tanks.${type}.0.capacity`];
      return {
        level: level ?? (debugMode ? (type === 'fuel' ? 0.75 : type === 'freshWater' ? 0.45 : type === 'wasteWater' ? 0.25 : 0.90) : null),
        capacity: capacity ?? (debugMode ? (type === 'oil' ? 5 : 200) : null),
        tankName: tankValues[`tanks.${type}.0.name`],
        tankType: tankValues[`tanks.${type}.0.type`],
        temperature: tankValues[`tanks.${type}.0.temperature`],
        icon,
        color,
        bgColor,
        displayName: defaultLabel
      };
    };

    const data = {
      fuel: getTankInfo('fuel', 'Fuel', faGasPump, 'text-oYellow', 'bg-oYellow'),
      freshWater: getTankInfo('freshWater', 'Fresh Water', faTint, 'text-oBlue', 'bg-oBlue'),
      wasteWater: getTankInfo('wasteWater', 'Waste Water', faToilet, 'text-gray-400', 'bg-gray-400'),
      oil: getTankInfo('oil', 'Engine Oil', faOilCan, 'text-orange-400', 'bg-orange-400')
    };

    const hasData = Object.values(data).some(tank => tank.level !== null) || debugMode;
    return { hasData, ...data };
  }, [tankValues, debugMode]);

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
    <BaseWidget
      title="Tank Levels"
      icon={faGasPump}
      hasData={tankData.hasData}
      noDataMessage="No tank data available"
    >
      <div className="flex-1 flex flex-col min-h-0 space-y-5">
        {Object.entries(tankData).filter(([key]) => key !== 'hasData').map(([key, tank]) => {
          if (tank.level === null || tank.capacity === null) return null;
          const percentage = Math.round(tank.level * 100);
          const liters = Math.round(tank.level * tank.capacity);
          const isWaste = key === 'wasteWater';
          
          return (
            <div key={key} className="bg-oGray p-3 rounded-lg border border-gray-800">
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex items-center justify-center w-8 h-8 bg-black/20 rounded-full border border-gray-800 shadow-inner">
                  <FontAwesomeIcon icon={tank.icon} className={`${tank.color} text-base`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col truncate">
                      <span className="text-white text-sm font-black uppercase tracking-tight truncate">{tank.displayName}</span>
                      {tank.tankName && (
                        <span className="text-[9px] text-gray-500 font-bold uppercase truncate">{tank.tankName}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${getTankColor(tank.level, isWaste)}`}>
                        {getTankStatus(tank.level)}
                      </span>
                      {tank.temperature && (
                        <div className="flex items-center space-x-1 text-[9px] text-gray-500 font-bold">
                          <FontAwesomeIcon icon={faTemperatureHalf} className="text-[8px]" />
                          <span>{Math.round(tank.temperature - 273.15)}°C</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-black/40 rounded-full h-2.5 border border-gray-800 overflow-hidden shadow-inner">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.3)] ${
                      isWaste ? 
                        (tank.level > 0.8 ? 'bg-oRed shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 
                         tank.level > 0.6 ? 'bg-oYellow shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 
                         'bg-oGreen shadow-[0_0_8px_rgba(16,185,129,0.4)]') :
                        (tank.level < 0.1 ? 'bg-oRed shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 
                         tank.level < 0.25 ? 'bg-oYellow shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 
                         'bg-oGreen shadow-[0_0_8px_rgba(16,185,129,0.4)]')
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-white text-[10px] w-8 text-right font-mono font-bold">{percentage}%</div>
              </div>
              
              <div className="flex justify-between text-[9px] font-black text-gray-500 mt-1 uppercase tracking-tighter">
                <span>Capacity: {tank.capacity}L</span>
                <span className="text-gray-400">{liters}L Remaining</span>
              </div>
            </div>
          );
        })}

        {/* Global Status Footer */}
        <div className="grid grid-cols-2 gap-4 mt-auto pt-2 border-t border-gray-800">
          <div className="text-center">
            <div className="text-gray-500 text-[9px] uppercase font-black tracking-widest">Critical</div>
            <div className="text-oRed font-mono font-black text-lg">
              {Object.values(tankData).filter(tank => tank && tank.level !== null && (tank.displayName === 'Waste Water' ? tank.level > 0.8 : tank.level < 0.1)).length}
            </div>
          </div>
          <div className="text-center border-l border-gray-800">
            <div className="text-gray-500 text-[9px] uppercase font-black tracking-widest">Active Tanks</div>
            <div className="text-white font-mono font-black text-lg">
              {Object.values(tankData).filter(tank => tank && tank.level !== null).length}
            </div>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
