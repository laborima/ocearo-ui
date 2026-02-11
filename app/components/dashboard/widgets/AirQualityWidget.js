'use client';
import React, { useMemo } from 'react';
import { useSignalKPath } from '../../hooks/useSignalK';
import { oGreen, oRed, oYellow, useOcearoContext } from '../../context/OcearoContext';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWind } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';
import { useTranslation } from 'react-i18next';

const AIR_QUALITY_CONFIG = {
  co2: {
    path: 'environment.inside.co2',
    transform: value => Math.round(value || 0),
    unit: 'ppm'
  },
  pm25: {
    path: 'environment.inside.pm25',
    transform: value => Math.round(value || 0),
    unit: 'µg/m³'
  }
};

export default function AirQualityWidget() {
  const { t } = useTranslation();
  const debugMode = configService.get('debugMode');
  
  const co2Value = useSignalKPath(AIR_QUALITY_CONFIG.co2.path);
  const pm25Value = useSignalKPath(AIR_QUALITY_CONFIG.pm25.path);

  const airQualityData = useMemo(() => {
    const hasData = co2Value !== null || pm25Value !== null || debugMode;

    if (!hasData) {
      return { hasData: false };
    }
    
    return {
      hasData: true,
      co2: co2Value !== null ? AIR_QUALITY_CONFIG.co2.transform(co2Value) : (debugMode ? 420 : null),
      pm25: pm25Value !== null ? AIR_QUALITY_CONFIG.pm25.transform(pm25Value) : (debugMode ? 12 : null)
    };
  }, [co2Value, pm25Value, debugMode]);
  
  const getAirQualityInfo = (co2Level) => {
    if (co2Level <= 800) return { level: t('widgets.aqGood'), color: 'text-oGreen', bg: 'bg-oGreen/10 border-oGreen/20' };
    if (co2Level <= 1000) return { level: t('widgets.aqModerate'), color: 'text-oYellow', bg: 'bg-oYellow/10 border-oYellow/20' };
    if (co2Level <= 1500) return { level: t('widgets.aqPoor'), color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' };
    if (co2Level <= 2000) return { level: t('widgets.aqUnhealthy'), color: 'text-oRed', bg: 'bg-oRed/10 border-oRed/20' };
    return { level: t('widgets.aqHazardous'), color: 'text-oRed', bg: 'bg-oRed/20 border-oRed/30' };
  };

  const { hasData, co2, pm25 } = airQualityData;
  const airQualityInfo = getAirQualityInfo(co2 || 400);

  return (
    <BaseWidget
      title={t('widgets.airQualityMonitoring')}
      icon={faWind}
      hasData={airQualityData.hasData}
      noDataMessage={t('widgets.signalLossAir')}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* CO2 Level - centered */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className={`text-6xl font-black mb-3 leading-none gliding-value tracking-tighter ${airQualityInfo.color} ${co2 > 1500 ? 'animate-soft-pulse' : ''}`}>
            {co2 !== null ? co2 : t('common.na')}
          </div>
          <div className="text-hud-secondary text-xs uppercase font-black tracking-[0.3em] opacity-60">{t('widgets.co2Concentration')}</div>
          
          {/* CO2 Progress bar */}
          <div className="w-full bg-hud-elevated rounded-full h-1 mt-4 overflow-hidden shadow-inner">
            <div 
              className={`h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${
                co2 <= 800 ? 'bg-oGreen' : co2 <= 1000 ? 'bg-oYellow' : 'bg-oRed'
              }`}
              style={{ width: `${co2 !== null ? Math.min((co2 / 2000) * 100, 100) : 0}%` }}
            />
          </div>

          {/* Status badge */}
          <div className="mt-4">
            <div className={`inline-block px-4 py-1.5 rounded-sm uppercase text-xs font-black tracking-[0.2em] shadow-soft ${airQualityInfo.bg} border border-hud`}>
              <span className={airQualityInfo.color}>{airQualityInfo.level} {t('widgets.atmosphere')}</span>
            </div>
          </div>
        </div>

        {/* PM2.5 + Reference */}
        <div className="grid grid-cols-2 gap-4 shrink-0">
          <div className="tesla-card p-3 text-center tesla-hover bg-hud-bg">
            <div className={`text-2xl font-black mb-1 gliding-value ${pm25 > 25 ? 'text-oRed' : 'text-hud-main'}`}>
              {pm25 !== null ? pm25 : t('common.na')}
            </div>
            <div className="text-hud-muted text-xs uppercase font-black tracking-widest opacity-60">{t('widgets.pm25Particulate')}</div>
          </div>
          <div className="tesla-card p-3 bg-hud-bg tesla-hover flex flex-col justify-center space-y-2">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
              <span className="text-hud-muted">{t('widgets.nominal')}</span>
              <span className="text-oGreen">&lt; 800</span>
            </div>
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
              <span className="text-hud-muted">{t('widgets.critical')}</span>
              <span className="text-oRed">&gt; 1500</span>
            </div>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
