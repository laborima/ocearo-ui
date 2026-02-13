'use client';
import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useOcearoContext } from '../../context/OcearoContext';
import { convertDepthUnit, getDepthUnitLabel } from '../../utils/UnitConversions';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { faWater, faAnchor } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';
import { useTranslation } from 'react-i18next';

export default function DepthWidget() {
  const { t } = useTranslation();
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
      belowKeel: keel !== null ? convertDepthUnit(keel) : null,
      belowSurface: surface !== null ? convertDepthUnit(surface) : null,
      depthUnitLabel: getDepthUnitLabel()
    };
  }, [depthKeel, depthSurface, depthTransducer, debugMode]);

  const getDepthColor = (depth) => {
    if (depth < 2) return 'text-oRed';
    if (depth < 5) return 'text-oYellow';
    return 'text-oBlue';
  };

  const getDepthStatus = (depth) => {
    if (depth < 2) return t('widgets.shallow');
    if (depth < 5) return t('widgets.caution');
    if (depth < 10) return t('widgets.safe');
    return t('widgets.deep');
  };

  const secondaryTextClass = nightMode ? 'text-oNight' : 'text-hud-secondary';

  return (
    <BaseWidget
      title={t('widgets.depth')}
      icon={faWater}
      hasData={depthData.hasData}
      noDataMessage={t('widgets.noDepthData')}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Main depth reading */}
        <div className="text-center mb-6">
          <div className="text-5xl font-black text-hud-main leading-none gliding-value tracking-tighter">
            {depthData.belowKeel !== null ? depthData.belowKeel : t('common.na')}
            {depthData.belowKeel !== null && <span className="text-xl text-hud-secondary ml-2 uppercase font-black tracking-widest">{depthData.depthUnitLabel}</span>}
          </div>
          <div className={`text-xs font-black uppercase tracking-[0.3em] mt-3 ${depthData.belowKeel !== null ? getDepthColor(depthData.belowKeel) : 'text-hud-muted'} ${depthData.belowKeel !== null && depthData.belowKeel < 5 ? 'animate-soft-pulse' : ''}`}>
            {depthData.belowKeel !== null ? getDepthStatus(depthData.belowKeel) : t('widgets.offline')}
          </div>
        </div>

        {/* Depth readings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="tesla-card p-3 text-center tesla-hover bg-hud-bg">
            <div className="text-hud-secondary text-xs uppercase font-black tracking-widest mb-1 opacity-60">{t('widgets.belowKeel')}</div>
            <div className={`text-xl font-black gliding-value ${depthData.belowKeel !== null ? getDepthColor(depthData.belowKeel) : 'text-hud-muted'}`}>
              {depthData.belowKeel !== null ? `${depthData.belowKeel} ${depthData.depthUnitLabel}` : t('common.na')}
            </div>
          </div>
          
          <div className="tesla-card p-3 text-center tesla-hover bg-hud-bg">
            <div className="text-hud-secondary text-xs uppercase font-black tracking-widest mb-1 opacity-60">{t('widgets.surface')}</div>
            <div className={`text-xl font-black gliding-value ${depthData.belowSurface !== null ? getDepthColor(depthData.belowSurface) : 'text-hud-muted'}`}>
              {depthData.belowSurface !== null ? `${depthData.belowSurface} ${depthData.depthUnitLabel}` : t('common.na')}
            </div>
          </div>
        </div>

        {/* Visual depth indicator */}
        <div className="mb-6 px-2">
          <div className="flex items-center space-x-3">
            <FontAwesomeIcon icon={faAnchor} className="text-hud-muted text-xs opacity-50" />
            <div className="flex-1 bg-hud-elevated rounded-full h-1 overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${
                  depthData.belowKeel !== null ? getDepthColor(depthData.belowKeel).replace('text-', 'bg-') : 'bg-hud-bg'
                }`}
                style={{ width: `${depthData.belowKeel !== null ? Math.min(100, (depthData.belowKeel / 50) * 100) : 0}%` }}
              />
            </div>
            <div className="text-hud-muted text-xs font-black tracking-tighter">50{depthData.depthUnitLabel}</div>
          </div>
        </div>

        {/* Status info */}
        <div className="tesla-card p-3 bg-hud-bg space-y-2">
          <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
            <span className="text-hud-secondary">{t('widgets.hullClearance')}</span>
            <span className={`gliding-value font-mono ${depthData.belowKeel !== null && depthData.belowKeel < 2 ? 'text-oRed' : 'text-hud-main'}`}>
              {depthData.belowKeel !== null ? `${Math.max(0, depthData.belowKeel - convertDepthUnit(1.5)).toFixed(1)} ${depthData.depthUnitLabel}` : t('common.na')}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
            <span className="text-hud-secondary">{t('widgets.transducerOffset')}</span>
            <span className="text-hud-dim font-mono opacity-60">1.5m</span>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
