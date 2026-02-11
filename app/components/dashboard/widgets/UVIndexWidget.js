'use client';
import React, { useMemo } from 'react';
import { useSignalKPath } from '../../hooks/useSignalK';
import { oGreen, oRed, oYellow, useOcearoContext } from '../../context/OcearoContext';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';
import { useTranslation } from 'react-i18next';

const UV_CONFIG = {
  path: 'environment.outside.uvIndex',
  transform: value => (value || 0).toFixed(1)
};

export default function UVIndexWidget() {
  const { t } = useTranslation();
  const debugMode = configService.get('debugMode');
  
  const uvValue = useSignalKPath(UV_CONFIG.path);

  const uvData = useMemo(() => {
    const hasData = uvValue !== null || debugMode;

    if (!hasData) {
      return { hasData: false };
    }

    return {
      hasData: true,
      uvIndex: uvValue !== null ? UV_CONFIG.transform(uvValue) : (debugMode ? 4 : null)
    };
  }, [uvValue, debugMode]);

  const { hasData, uvIndex } = uvData;

  const getUVInfo = (uv) => {
    const index = parseFloat(uv);
    if (index <= 2) return { level: t('widgets.uvLow'), color: 'text-oGreen', bg: 'bg-oGreen/10 border-oGreen/20' };
    if (index <= 5) return { level: t('widgets.uvModerate'), color: 'text-oYellow', bg: 'bg-oYellow/10 border-oYellow/20' };
    if (index <= 7) return { level: t('widgets.uvHigh'), color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' };
    if (index <= 10) return { level: t('widgets.uvVeryHigh'), color: 'text-oRed', bg: 'bg-oRed/10 border-oRed/20' };
    return { level: t('widgets.uvExtreme'), color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' };
  };

  const uvInfo = hasData ? getUVInfo(uvIndex) : null;

  return (
    <BaseWidget
      title={t('widgets.solarRadiation')}
      icon={faSun}
      hasData={uvData.hasData}
      noDataMessage={t('widgets.signalLossUV')}
    >
      <div className="flex-1 flex flex-col justify-center py-4 space-y-8">
        {/* Main UV display */}
        <div className="text-center group">
          <div className={`text-6xl font-black mb-4 leading-none gliding-value tracking-tighter ${uvIndex !== null ? getUVInfo(uvIndex).color : 'text-hud-muted'} ${parseFloat(uvIndex) >= 6 ? 'animate-soft-pulse' : ''}`}>
            {uvIndex !== null ? uvIndex : t('common.na')}
          </div>
          <div className={`text-xs font-black uppercase tracking-[0.3em] mt-4 ${uvIndex !== null ? getUVInfo(uvIndex).color : 'text-hud-muted'}`}>
            {uvIndex !== null ? getUVInfo(uvIndex).level : t('widgets.offline')}
          </div>
        </div>

        {/* Risk level indicator */}
        <div className="text-center">
          <div className={`inline-block px-4 py-1.5 rounded-sm uppercase text-xs font-black tracking-[0.2em] shadow-soft ${uvInfo?.bg || 'bg-hud-bg border-hud'} border border-hud`}>
            <span className={uvInfo?.color || 'text-hud-muted'}>
              {uvInfo?.level || t('widgets.uvUnknown')} {t('widgets.riskThreshold')}
            </span>
          </div>
        </div>

        {/* UV scale bar */}
        <div className="w-full px-2">
          <div className="flex h-1 rounded-full overflow-hidden shadow-inner bg-hud-elevated">
            <div className="flex-1 bg-oGreen/40"></div>
            <div className="flex-1 bg-oYellow/40"></div>
            <div className="flex-1 bg-orange-500/40"></div>
            <div className="flex-1 bg-oRed/40"></div>
            <div className="flex-1 bg-purple-500/40"></div>
          </div>
          {/* Current position indicator on scale */}
          {uvIndex !== null && (
            <div 
              className="relative h-1 w-full"
              style={{ top: '-4px' }}
            >
              <div 
                className={`absolute w-2 h-2 rounded-full border border-hud-main shadow-soft transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${uvInfo.color.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor]`}
                style={{ left: `${Math.min(100, (parseFloat(uvIndex) / 11) * 100)}%`, transform: 'translateX(-50%)' }}
              />
            </div>
          )}
          <div className="flex justify-between text-xs font-black text-hud-muted mt-4 uppercase tracking-widest px-0.5">
            <span>0</span>
            <span>2</span>
            <span>5</span>
            <span>7</span>
            <span>11+</span>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
