'use client';
import React, { useMemo } from 'react';
import { convertPressure } from '../../context/OcearoContext';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { faGaugeHigh } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';
import { useTranslation } from 'react-i18next';

const PRESSURE_CONFIG = {
  path: 'environment.outside.pressure',
  transform: value => convertPressure(value || 0)
};

export default function PressureWidget() {
  const { t } = useTranslation();
  const debugMode = configService.get('debugMode');
  
  const pressureValue = useSignalKPath(PRESSURE_CONFIG.path);

  const pressureData = useMemo(() => {
    const hasData = pressureValue !== null || debugMode;

    if (!hasData) {
      return { hasData: false };
    }

    return {
      hasData: true,
      pressureMbar: pressureValue !== null ? PRESSURE_CONFIG.transform(pressureValue) : (debugMode ? 1013 : null)
    };
  }, [pressureValue, debugMode]);

  const { hasData, pressureMbar } = pressureData;

  const getPressureColor = (pressure) => {
    if (pressure < 1000) return 'text-oRed';
    if (pressure > 1025) return 'text-oBlue';
    return 'text-oGreen';
  };

  const getPressureStatus = (pressure) => {
    if (pressure < 1000) return t('widgets.pressureLow');
    if (pressure > 1025) return t('widgets.pressureHigh');
    return t('widgets.pressureNormal');
  };

  return (
    <BaseWidget
      title={t('widgets.pressureTelemetry')}
      icon={faGaugeHigh}
      hasData={pressureData.hasData}
      noDataMessage={t('widgets.signalLossPressure')}
    >
      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        {/* Circular gauge - flex to fill available space */}
        <div className="relative flex-1 flex items-center justify-center min-h-0 w-full">
          <svg className="w-full h-full max-w-[12rem] max-h-[12rem] transform -rotate-90 filter drop-shadow-[0_0_15px_var(--color-oBlue)] shadow-opacity-10" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--hud-border)" strokeWidth="4" opacity="0.2" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke="var(--color-oBlue)" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${pressureMbar !== null ? 2 * Math.PI * 44 * (1 - (Math.min(Math.max(pressureMbar, 950), 1050) - 950) / 100) : 2 * Math.PI * 44}`}
              className="transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-black text-hud-main leading-none gliding-value tracking-tighter">
              {pressureMbar !== null ? pressureMbar : t('common.na')}
            </div>
            <div className="text-hud-muted text-xs uppercase font-black mt-1 tracking-[0.2em] opacity-60">mbar</div>
          </div>
        </div>

        {/* Status row */}
        <div className="flex items-center justify-between w-full shrink-0">
          <div className={`text-xs font-black uppercase tracking-[0.2em] ${pressureMbar !== null ? getPressureColor(pressureMbar) : 'text-hud-muted'} ${pressureMbar !== null && (pressureMbar < 1000 || pressureMbar > 1025) ? 'animate-soft-pulse' : ''}`}>
            {pressureMbar !== null ? getPressureStatus(pressureMbar) : t('widgets.offline')}
          </div>
          <div className="text-hud-muted text-xs uppercase font-black tracking-widest opacity-40">
            950 — 1050
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
