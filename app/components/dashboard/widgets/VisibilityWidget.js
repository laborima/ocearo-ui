'use client';
import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { faEye, faSmog, faSun, faCloud } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';
import { useTranslation } from 'react-i18next';

export default function VisibilityWidget() {
  const { t } = useTranslation();
  const debugMode = configService.get('debugMode');
  
  const visibilityValue = useSignalKPath('environment.outside.visibility');

  const visibilityData = useMemo(() => {
    const hasData = visibilityValue !== null || debugMode;

    if (!hasData) {
      return { hasData: false };
    }

    const visValue = visibilityValue || (debugMode ? 8000 : null);
     
    return {
      hasData: true,
      distance: visValue !== null ? Math.round(visValue / 100) / 10 : null,
      distanceNM: visValue !== null ? Math.round((visValue / 1852) * 10) / 10 : null
    };
  }, [visibilityValue, debugMode]);

  const getVisibilityStatus = (distance) => {
    if (distance < 1) return t('widgets.denseFog');
    if (distance < 2) return t('widgets.thickFog');
    if (distance < 5) return t('widgets.moderateFog');
    if (distance < 10) return t('widgets.lightHaze');
    if (distance < 20) return t('widgets.visGood');
    return t('widgets.visExcellent');
  };

  const getVisibilityColor = (distance) => {
    if (distance < 1) return 'text-oRed';
    if (distance < 2) return 'text-orange-400';
    if (distance < 5) return 'text-oYellow';
    if (distance < 10) return 'text-oBlue';
    return 'text-oGreen';
  };

  const getVisibilityIcon = (distance) => {
    if (distance < 2) return faSmog;
    if (distance < 10) return faCloud;
    return faSun;
  };

  const getVisibilityDescription = (distance) => {
    if (distance < 0.05) return t('widgets.extremelyDenseFog');
    if (distance < 0.2) return t('widgets.veryDenseFog');
    if (distance < 0.5) return t('widgets.denseFog');
    if (distance < 1) return t('widgets.thickFog');
    if (distance < 2) return t('widgets.moderateFog');
    if (distance < 4) return t('widgets.lightFog');
    if (distance < 10) return t('widgets.mistOrHaze');
    if (distance < 20) return t('widgets.slightHaze');
    if (distance < 40) return t('widgets.clear');
    return t('widgets.veryClear');
  };

  return (
    <BaseWidget
      title={t('widgets.atmosphericVisibility')}
      icon={faEye}
      hasData={visibilityData.hasData}
      noDataMessage={t('widgets.signalLossOptical')}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Main display - centered */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className={`text-5xl mb-4 ${getVisibilityColor(visibilityData.distance)}`}>
            <FontAwesomeIcon 
              icon={getVisibilityIcon(visibilityData.distance)} 
              className={visibilityData.distance < 10 ? 'animate-soft-pulse' : ''} 
            />
          </div>
          <div className="text-5xl font-black text-hud-main leading-none gliding-value tracking-tighter">
            {visibilityData.distance}
            <span className="text-xl text-hud-secondary ml-2 uppercase font-black tracking-widest">km</span>
          </div>
          <div className={`text-xs font-black uppercase tracking-[0.3em] mt-3 ${getVisibilityColor(visibilityData.distance)}`}>
            {getVisibilityStatus(visibilityData.distance)}
          </div>
        </div>

        {/* Metric + Nautical */}
        <div className="grid grid-cols-2 gap-4 mb-4 shrink-0">
          <div className="tesla-card p-3 text-center tesla-hover bg-hud-bg">
            <div className="text-hud-secondary text-xs uppercase font-black tracking-widest mb-1 opacity-60">{t('widgets.metricRange')}</div>
            <div className={`text-xl font-black gliding-value ${getVisibilityColor(visibilityData.distance)}`}>
              {visibilityData.distance} km
            </div>
          </div>
          <div className="tesla-card p-3 text-center tesla-hover bg-hud-bg">
            <div className="text-hud-secondary text-xs uppercase font-black tracking-widest mb-1 opacity-60">{t('widgets.nauticalRange')}</div>
            <div className={`text-xl font-black gliding-value ${getVisibilityColor(visibilityData.distance)}`}>
              {visibilityData.distanceNM} NM
            </div>
          </div>
        </div>

        {/* Progress bar + description */}
        <div className="shrink-0 space-y-2">
          <div className="flex items-center space-x-3">
            <div className="text-hud-muted text-xs font-black tracking-tighter">0</div>
            <div className="flex-1 bg-hud-elevated rounded-full h-1 overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${
                  visibilityData.distance < 1 ? 'bg-oRed' : 
                  visibilityData.distance < 5 ? 'bg-oYellow' : 
                  visibilityData.distance < 10 ? 'bg-oBlue' : 'bg-oGreen'
                }`}
                style={{ width: `${Math.min(100, (visibilityData.distance / 20) * 100)}%` }}
              />
            </div>
            <div className="text-hud-muted text-xs font-black tracking-tighter">20k+</div>
          </div>
          <div className="text-center text-hud-main font-black text-xs uppercase tracking-widest opacity-60">
            {getVisibilityDescription(visibilityData.distance)}
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
