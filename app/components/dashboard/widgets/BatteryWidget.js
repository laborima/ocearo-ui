'use client';
import React, { useMemo } from 'react';
import { useSignalKPaths } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBatteryFull, faBatteryHalf, faBatteryQuarter, faBolt } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';
import { useTranslation } from 'react-i18next';

export default function BatteryWidget() {
  const { t } = useTranslation();
  const debugMode = configService.get('debugMode');
  
  const batteryPaths = [
    'electrical.batteries.1.voltage',
    'electrical.batteries.0.voltage',
    'electrical.batteries.1.current',
    'electrical.batteries.0.current'
  ];
  
  const batteryValues = useSignalKPaths(batteryPaths);

  const batteryData = useMemo(() => {
    const houseVoltage = batteryValues['electrical.batteries.1.voltage'];
    const starterVoltage = batteryValues['electrical.batteries.0.voltage'];
    const houseCurrent = batteryValues['electrical.batteries.1.current'];
    const starterCurrent = batteryValues['electrical.batteries.0.current'];

    const hasData = houseVoltage !== null || starterVoltage !== null || debugMode;

    if (!hasData) {
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
  }, [batteryValues, debugMode]);

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
    if (percentage < 20) return t('widgets.batteryCritical');
    if (percentage < 50) return t('widgets.batteryLow');
    if (percentage < 80) return t('widgets.batteryGood');
    return t('widgets.batteryExcellent');
  };

  return (
    <BaseWidget
      title={t('widgets.energyStorage')}
      icon={faBolt}
      hasData={batteryData.hasData}
      noDataMessage={t('widgets.signalLossPowerGrid')}
    >
      <div className="flex-1 flex flex-col justify-center py-4">
        {/* Battery readings */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* House Battery */}
          <div className="text-center tesla-card p-3 tesla-hover bg-hud-bg">
            <div className="text-hud-muted text-xs uppercase mb-2 font-black tracking-widest">{t('widgets.serviceBank')}</div>
            <div className="flex items-center justify-center space-x-3 mb-2">
              <FontAwesomeIcon 
                icon={getBatteryIcon(batteryData.house.percentage || 0)} 
                className={`text-sm ${batteryData.house.percentage !== null ? getBatteryColor(batteryData.house.percentage) : 'text-hud-muted'} ${batteryData.house.percentage < 20 ? 'animate-soft-pulse' : ''}`} 
              />
              <div className="text-hud-main text-2xl font-black leading-none gliding-value tracking-tighter">
                {batteryData.house.voltage !== null ? `${batteryData.house.voltage}V` : t('common.na')}
              </div>
            </div>
            <div className={`text-xs font-black uppercase tracking-widest ${batteryData.house.percentage !== null ? getBatteryColor(batteryData.house.percentage) : 'text-hud-muted'}`}>
              {batteryData.house.percentage !== null ? `${Math.round(batteryData.house.percentage)}%` : t('widgets.offline')}
            </div>
            <div className="text-hud-secondary text-xs uppercase font-black tracking-widest mt-2">
              {batteryData.house.current !== null ? `${batteryData.house.current > 0 ? '+' : ''}${batteryData.house.current}A` : '—'}
            </div>
          </div>
          
          {/* Starter Battery */}
          <div className="text-center tesla-card p-3 tesla-hover bg-hud-bg">
            <div className="text-hud-muted text-xs uppercase mb-2 font-black tracking-widest">{t('widgets.ignitionBank')}</div>
            <div className="flex items-center justify-center space-x-3 mb-2">
              <FontAwesomeIcon 
                icon={getBatteryIcon(batteryData.starter.percentage || 0)} 
                className={`text-sm ${batteryData.starter.percentage !== null ? getBatteryColor(batteryData.starter.percentage) : 'text-hud-muted'} ${batteryData.starter.percentage < 20 ? 'animate-soft-pulse' : ''}`} 
              />
              <div className="text-hud-main text-2xl font-black leading-none gliding-value tracking-tighter">
                {batteryData.starter.voltage !== null ? `${batteryData.starter.voltage}V` : t('common.na')}
              </div>
            </div>
            <div className={`text-xs font-black uppercase tracking-widest ${batteryData.starter.percentage !== null ? getBatteryColor(batteryData.starter.percentage) : 'text-hud-muted'}`}>
              {batteryData.starter.percentage !== null ? `${Math.round(batteryData.starter.percentage)}%` : t('widgets.offline')}
            </div>
            <div className="text-hud-secondary text-xs uppercase font-black tracking-widest mt-2">
              {batteryData.starter.current !== null ? `${batteryData.starter.current > 0 ? '+' : ''}${batteryData.starter.current}A` : '—'}
            </div>
          </div>
        </div>

        {/* Visual battery bars */}
        <div className="space-y-6 mb-8 px-2">
          {[
            { label: t('widgets.serviceCap'), percentage: batteryData.house.percentage },
            { label: t('widgets.ignitionCap'), percentage: batteryData.starter.percentage }
          ].map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-hud-muted">
                <span>{item.label}</span>
                <span className="text-hud-main opacity-80">{item.percentage !== null ? `${Math.round(item.percentage)}%` : t('widgets.offline')}</span>
              </div>
              <div className="h-1 bg-hud-elevated rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${
                    item.percentage !== null && item.percentage < 20 ? 'bg-oRed shadow-[0_0_8px_var(--color-oRed)] shadow-opacity-40' : 
                    item.percentage !== null && item.percentage < 50 ? 'bg-oYellow' : 
                    'bg-oGreen'
                  }`}
                  style={{ width: `${item.percentage !== null ? item.percentage : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Status and info */}
        <div className="tesla-card p-3 bg-hud-bg tesla-hover border border-hud">
          <div className={`text-xs font-black uppercase tracking-[0.2em] text-center mb-3 ${
            batteryData.house.percentage !== null && batteryData.starter.percentage !== null 
              ? getBatteryColor(Math.min(batteryData.house.percentage, batteryData.starter.percentage)) 
              : 'text-hud-muted'
          } ${Math.min(batteryData.house.percentage, batteryData.starter.percentage) < 20 ? 'animate-soft-pulse' : ''}`}>
            {batteryData.house.percentage !== null && batteryData.starter.percentage !== null 
              ? `${getBatteryStatus(Math.min(batteryData.house.percentage, batteryData.starter.percentage))} ${t('widgets.health')}` 
              : t('widgets.analyzingCells')}
          </div>
          <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-hud-secondary">
            <span>{t('widgets.gridLoad')} <span className="text-hud-main ml-1 gliding-value">
              {batteryData.house.current !== null && batteryData.starter.current !== null 
                ? `${Math.abs(batteryData.house.current + batteryData.starter.current).toFixed(1)}A` 
                : '—'}
            </span></span>
            <span className="text-hud-dim">{t('widgets.operatingRange')}</span>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
