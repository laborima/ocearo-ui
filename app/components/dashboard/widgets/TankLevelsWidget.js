'use client';
import React, { useMemo } from 'react';
import { useSignalKPaths } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGasPump, faTint, faOilCan, faToilet, faTemperatureHalf } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';
import { useTranslation } from 'react-i18next';

export default function TankLevelsWidget() {
  const { t } = useTranslation();
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
      fuel: getTankInfo('fuel', t('widgets.tankFuel'), faGasPump, 'text-oYellow', 'bg-oYellow'),
      freshWater: getTankInfo('freshWater', t('widgets.tankFreshWater'), faTint, 'text-oBlue', 'bg-oBlue'),
      wasteWater: getTankInfo('wasteWater', t('widgets.tankWasteWater'), faToilet, 'text-hud-secondary', 'bg-hud-elevated'),
      oil: getTankInfo('oil', t('widgets.tankEngineOil'), faOilCan, 'text-orange-400', 'bg-orange-400')
    };

    const hasData = Object.values(data).some(tank => tank.level !== null) || debugMode;
    return { hasData, ...data };
  }, [tankValues, debugMode]);

  const getTankStatus = (level) => {
    if (level < 0.1) return t('widgets.tankEmpty');
    if (level < 0.25) return t('widgets.tankLow');
    if (level < 0.75) return t('widgets.tankMedium');
    return t('widgets.tankFull');
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
      title={t('widgets.storageSystems')}
      icon={faGasPump}
      hasData={tankData.hasData}
      noDataMessage={t('widgets.signalLossLevelSensors')}
    >
      <div className="flex-1 flex flex-col justify-center min-h-0 space-y-4">
        {Object.entries(tankData).filter(([key]) => key !== 'hasData').map(([key, tank]) => {
          if (tank.level === null || tank.capacity === null) return null;
          const percentage = Math.round(tank.level * 100);
          const liters = Math.round(tank.level * tank.capacity);
          const isWaste = key === 'wasteWater';
          const isCritical = isWaste ? tank.level > 0.8 : tank.level < 0.1;
          
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-hud-elevated rounded-full">
                    <FontAwesomeIcon icon={tank.icon} className={`${tank.color} text-xs opacity-80`} />
                  </div>
                  <span className="text-hud-main text-xs font-black uppercase tracking-widest">{tank.displayName}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-hud-secondary text-xs font-black opacity-60">{liters}/{tank.capacity}L</span>
                  <span className={`text-sm font-black ${getTankColor(tank.level, isWaste)} ${isCritical ? 'animate-soft-pulse' : ''}`}>
                    {percentage}%
                  </span>
                </div>
              </div>
              <div className="bg-hud-elevated rounded-full h-1.5 overflow-hidden shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${
                    isWaste ? 
                      (tank.level > 0.8 ? 'bg-oRed' : tank.level > 0.6 ? 'bg-oYellow' : 'bg-oGreen') :
                      (tank.level < 0.1 ? 'bg-oRed' : tank.level < 0.25 ? 'bg-oYellow' : 'bg-oGreen')
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </BaseWidget>
  );
}
