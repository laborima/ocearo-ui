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
  },
  voc: {
    // BME680 gas resistance in ohms — higher resistance means cleaner air
    path: 'environment.inside.voc',
    transform: value => Math.round((value || 0) / 1000),
    unit: 'kΩ'
  },
  humidity: {
    path: 'environment.inside.relativeHumidity',
    transform: value => Math.round((value || 0) * 100),
    unit: '%'
  }
};

export default function AirQualityWidget() {
  const { t } = useTranslation();
  const debugMode = configService.get('debugMode');

  const co2Value = useSignalKPath(AIR_QUALITY_CONFIG.co2.path);
  const pm25Value = useSignalKPath(AIR_QUALITY_CONFIG.pm25.path);
  const vocValue = useSignalKPath(AIR_QUALITY_CONFIG.voc.path);
  const humidityValue = useSignalKPath(AIR_QUALITY_CONFIG.humidity.path);

  const airQualityData = useMemo(() => {
    const hasData = co2Value !== null || pm25Value !== null || vocValue !== null || debugMode;

    if (!hasData) {
      return { hasData: false };
    }

    return {
      hasData: true,
      co2: co2Value !== null ? AIR_QUALITY_CONFIG.co2.transform(co2Value) : (debugMode ? 420 : null),
      pm25: pm25Value !== null ? AIR_QUALITY_CONFIG.pm25.transform(pm25Value) : (debugMode ? 12 : null),
      voc: vocValue !== null ? AIR_QUALITY_CONFIG.voc.transform(vocValue) : (debugMode ? 350 : null),
      humidity: humidityValue !== null ? AIR_QUALITY_CONFIG.humidity.transform(humidityValue) : null
    };
  }, [co2Value, pm25Value, vocValue, humidityValue, debugMode]);

  const getCo2QualityInfo = (co2Level) => {
    if (co2Level <= 800) return { level: t('widgets.aqGood'), color: 'text-oGreen', bg: 'bg-oGreen/10 border-oGreen/20' };
    if (co2Level <= 1000) return { level: t('widgets.aqModerate'), color: 'text-oYellow', bg: 'bg-oYellow/10 border-oYellow/20' };
    if (co2Level <= 1500) return { level: t('widgets.aqPoor'), color: 'text-oYellow', bg: 'bg-oYellow/10 border-oYellow/20' };
    if (co2Level <= 2000) return { level: t('widgets.aqUnhealthy'), color: 'text-oRed', bg: 'bg-oRed/10 border-oRed/20' };
    return { level: t('widgets.aqHazardous'), color: 'text-oRed', bg: 'bg-oRed/20 border-oRed/30' };
  };

  // BME680 gas resistance: rough qualitative scale (sensor needs burn-in, values drift)
  const getVocQualityInfo = (kohm) => {
    if (kohm >= 300) return { level: t('widgets.aqGood'), color: 'text-oGreen', bg: 'bg-oGreen/10 border-oGreen/20' };
    if (kohm >= 150) return { level: t('widgets.aqModerate'), color: 'text-oYellow', bg: 'bg-oYellow/10 border-oYellow/20' };
    if (kohm >= 50) return { level: t('widgets.aqPoor'), color: 'text-oYellow', bg: 'bg-oYellow/10 border-oYellow/20' };
    if (kohm >= 20) return { level: t('widgets.aqUnhealthy'), color: 'text-oRed', bg: 'bg-oRed/10 border-oRed/20' };
    return { level: t('widgets.aqHazardous'), color: 'text-oRed', bg: 'bg-oRed/20 border-oRed/30' };
  };

  const { hasData, co2, pm25, voc, humidity } = airQualityData;

  // Primary metric: CO2 when a real CO2 sensor exists, otherwise VOC gas resistance
  const usesVoc = co2 === null && voc !== null;
  const airQualityInfo = usesVoc ? getVocQualityInfo(voc) : getCo2QualityInfo(co2 ?? 400);
  const primaryValue = usesVoc ? voc : co2;
  const primaryLabel = usesVoc ? t('widgets.vocGasResistance') : t('widgets.co2Concentration');
  const primaryAlarm = usesVoc ? (voc !== null && voc < 20) : (co2 > 1500);
  const barRatio = usesVoc
    ? (voc !== null ? Math.min(voc / 500, 1) : 0)
    : (co2 !== null ? Math.min(co2 / 2000, 1) : 0);
  const barColor = usesVoc
    ? (voc >= 300 ? 'bg-oGreen' : voc >= 50 ? 'bg-oYellow' : 'bg-oRed')
    : (co2 <= 800 ? 'bg-oGreen' : co2 <= 1000 ? 'bg-oYellow' : 'bg-oRed');

  return (
    <BaseWidget
      title={t('widgets.airQualityMonitoring')}
      icon={faWind}
      hasData={airQualityData.hasData}
      noDataMessage={t('widgets.signalLossAir')}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Primary metric - centered */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className={`text-6xl font-black mb-3 leading-none gliding-value tracking-tighter ${airQualityInfo.color} ${primaryAlarm ? 'animate-soft-pulse' : ''}`}>
            {primaryValue !== null ? primaryValue : t('common.na')}
            {primaryValue !== null && usesVoc && <span className="text-2xl ml-1 align-baseline">kΩ</span>}
          </div>
          <div className="text-hud-secondary text-xs uppercase font-black tracking-[0.3em] opacity-60">{primaryLabel}</div>

          {/* Progress bar */}
          <div className="w-full bg-hud-elevated rounded-full h-1 mt-4 overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-1000 ${barColor}`}
              style={{ width: `${barRatio * 100}%` }}
            />
          </div>

          {/* Status badge */}
          <div className="mt-4">
            <div className={`inline-block px-4 py-1.5 rounded-sm uppercase text-xs font-black tracking-[0.2em] shadow-soft ${airQualityInfo.bg} border border-hud`}>
              <span className={airQualityInfo.color}>{airQualityInfo.level} {t('widgets.atmosphere')}</span>
            </div>
          </div>
        </div>

        {/* Secondary metric + reference */}
        <div className="grid grid-cols-2 gap-4 shrink-0">
          <div className="tesla-card p-3 text-center tesla-hover bg-hud-bg">
            {pm25 !== null ? (
              <>
                <div className={`text-2xl font-black mb-1 gliding-value ${pm25 > 25 ? 'text-oRed' : 'text-hud-main'}`}>
                  {pm25}
                </div>
                <div className="text-hud-muted text-xs uppercase font-black tracking-widest opacity-60">{t('widgets.pm25Particulate')}</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-black mb-1 gliding-value text-hud-main">
                  {humidity !== null ? `${humidity}%` : t('common.na')}
                </div>
                <div className="text-hud-muted text-xs uppercase font-black tracking-widest opacity-60">{t('environmental.humidity')}</div>
              </>
            )}
          </div>
          <div className="tesla-card p-3 bg-hud-bg tesla-hover flex flex-col justify-center space-y-2">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
              <span className="text-hud-muted">{t('widgets.nominal')}</span>
              <span className="text-oGreen">{usesVoc ? '> 300' : '< 800'}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
              <span className="text-hud-muted">{t('widgets.critical')}</span>
              <span className="text-oRed">{usesVoc ? '< 50' : '> 1500'}</span>
            </div>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
