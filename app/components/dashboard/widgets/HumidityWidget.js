'use client';
import React, { useMemo } from 'react';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTint, faThermometerHalf } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';
import { useTranslation } from 'react-i18next';

const HUMIDITY_CONFIG = {
  humidity: {
    path: 'environment.inside.relativeHumidity',
    transform: value => ((value || 0) * 100).toFixed(0)
  },
  dewPoint: {
    path: 'environment.inside.dewPoint',
    transform: value => ((value || 0) - 273.15).toFixed(1)
  }
};

export default function HumidityWidget() {
  const { t } = useTranslation();
  const debugMode = configService.get('debugMode');
  
  const humidityValue = useSignalKPath(HUMIDITY_CONFIG.humidity.path);
  const dewPointValue = useSignalKPath(HUMIDITY_CONFIG.dewPoint.path);

  const humidityData = useMemo(() => {
    const hasData = humidityValue !== null || dewPointValue !== null || debugMode;

    if (!hasData) {
      return { hasData: false };
    }
    
    const humidityPercent = humidityValue !== null ? HUMIDITY_CONFIG.humidity.transform(humidityValue) : (debugMode ? '65' : null);
    
    return {
      hasData: true,
      humidity: humidityPercent,
      humidityPercentage: humidityPercent,
      dewPointCelsius: dewPointValue !== null ? HUMIDITY_CONFIG.dewPoint.transform(dewPointValue) : (debugMode ? '18.5' : null)
    };
  }, [humidityValue, dewPointValue, debugMode]);

  const { humidity, humidityPercentage, dewPointCelsius } = humidityData;

  const getHumidityColor = (humidity) => {
    const h = parseInt(humidity);
    if (h < 30 || h > 70) return 'text-oYellow';
    if (h < 40 || h > 60) return 'text-oBlue';
    return 'text-oGreen';
  };

  const getHumidityStatus = (humidity) => {
    const h = parseInt(humidity);
    if (h < 30) return t('widgets.tooDry');
    if (h > 70) return t('widgets.tooHumid');
    if (h < 40 || h > 60) return t('widgets.moderate');
    return t('widgets.optimal');
  };

  return (
    <BaseWidget
      title={t('widgets.humidityAnalysis')}
      icon={faTint}
      hasData={humidityData.hasData}
      noDataMessage={t('widgets.signalLossHygrometer')}
    >
      <div className="flex-1 flex flex-col justify-center py-4 space-y-8">
        <div className="text-center group">
          <div className={`text-6xl font-black mb-4 leading-none gliding-value tracking-tighter text-hud-main ${parseInt(humidity) > 70 || parseInt(humidity) < 30 ? 'animate-soft-pulse' : ''}`}>
            {humidity !== null ? humidity : t('common.na')}
            <span className="text-xl text-hud-muted ml-2 uppercase font-black tracking-widest">%</span>
          </div>
          <div className={`text-xs font-black uppercase tracking-[0.3em] mt-4 ${humidity !== null ? getHumidityColor(humidity) : 'text-hud-muted'}`}>
            {humidity !== null ? getHumidityStatus(humidity) : t('widgets.offline')}
          </div>
        </div>

        <div className="px-2">
          <div className="w-full bg-hud-elevated rounded-full h-1 overflow-hidden shadow-inner">
            <div 
              className={`h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${
                parseInt(humidity) < 30 || parseInt(humidity) > 70 ? 'bg-oYellow' : 'bg-oBlue shadow-[0_0_8px_var(--color-oBlue)] shadow-opacity-40'
              }`}
              style={{ width: `${humidityPercentage !== null ? humidityPercentage : 0}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-black text-hud-muted mt-4 uppercase tracking-widest px-0.5">
            <span>{t('widgets.arid')}</span>
            <span>{t('widgets.balanced')}</span>
            <span>{t('widgets.saturated')}</span>
          </div>
        </div>

        <div className="tesla-card p-4 bg-hud-bg tesla-hover border border-hud">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faThermometerHalf} className="text-oBlue text-xs opacity-50" />
              <span className="text-hud-secondary text-xs uppercase font-black tracking-widest">{t('widgets.dewPoint')}</span>
            </div>
            <div className="text-hud-main font-black text-lg gliding-value">
              {dewPointCelsius !== null ? `${dewPointCelsius}°` : t('common.na')}
            </div>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
