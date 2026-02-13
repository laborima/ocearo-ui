'use client';
import React, { useMemo, useRef } from 'react';
import { convertTemperatureUnit, getTemperatureUnitLabel } from '../../utils/UnitConversions';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { faThermometerHalf } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';
import { useTranslation } from 'react-i18next';

const TEMPERATURE_CONFIG = {
  airPath: 'environment.outside.temperature',
  seaPath: 'environment.water.temperature',
  transform: value => value != null ? convertTemperatureUnit(value) : null
};

const TemperatureWidget = React.memo(() => {
  const { t } = useTranslation();
  const debugMode = configService.get('debugMode');
  const prevRef = useRef({ airTemp: null, seaTemp: null });
  
  const airValue = useSignalKPath(TEMPERATURE_CONFIG.airPath);
  const seaValue = useSignalKPath(TEMPERATURE_CONFIG.seaPath);

  const temperatureData = useMemo(() => {
    const hasData = airValue !== null || seaValue !== null || debugMode;

    if (!hasData) {
      return { hasData: false };
    }

    const newAir = airValue !== null ? TEMPERATURE_CONFIG.transform(airValue) : (debugMode ? 21 : null);
    const newSea = seaValue !== null ? TEMPERATURE_CONFIG.transform(seaValue) : (debugMode ? 17 : null);

    // Only update ref if values actually changed — prevents flicker from
    // subscribe/unsubscribe cycles that momentarily return null
    if (newAir !== null) prevRef.current.airTemp = newAir;
    if (newSea !== null) prevRef.current.seaTemp = newSea;

    return {
      hasData: true,
      airTemp: newAir !== null ? newAir : prevRef.current.airTemp,
      seaTemp: newSea !== null ? newSea : prevRef.current.seaTemp
    };
  }, [airValue, seaValue, debugMode]);

  // Determine temperature color based on value
  const getTemperatureColor = (temp) => {
    if (temp < 10) return 'text-oBlue';
    if (temp > 25) return 'text-oRed';
    return 'text-oGreen';
  };

  const getTemperatureStatus = (airTemp, seaTemp) => {
    const avgTemp = (airTemp + seaTemp) / 2;
    if (avgTemp < 15) return t('widgets.cold');
    if (avgTemp > 25) return t('widgets.warm');
    return t('widgets.moderate');
  };

  const { hasData, airTemp, seaTemp } = temperatureData;

  return (
    <BaseWidget
      title={t('widgets.temperatureMonitoring')}
      icon={faThermometerHalf}
      hasData={hasData}
      noDataMessage={t('widgets.signalLossThermal')}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Temperature readings - centered, spacious */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-6 w-full">
            <div className="text-center">
              <div className="text-hud-secondary text-xs uppercase font-black tracking-[0.2em] mb-3 opacity-60">{t('widgets.atmosphereLabel')}</div>
              <div className="text-5xl font-black text-hud-main leading-none gliding-value tracking-tighter">
                {airTemp !== null ? `${airTemp}°` : t('common.na')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-hud-secondary text-xs uppercase font-black tracking-[0.2em] mb-3 opacity-60">{t('widgets.hydrosphere')}</div>
              <div className="text-5xl font-black text-hud-main leading-none gliding-value tracking-tighter">
                {seaTemp !== null ? `${seaTemp}°` : t('common.na')}
              </div>
            </div>
          </div>
        </div>

        {/* Visual temperature bars */}
        <div className="space-y-4 shrink-0">
          {[
            { label: t('widgets.airSystem'), value: airTemp },
            { label: t('widgets.seaSystem'), value: seaTemp }
          ].map((item, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-hud-muted">
                <span>{item.label}</span>
                <span className="text-hud-main opacity-80">{item.value !== null ? `${item.value}${getTemperatureUnitLabel()}` : t('widgets.offline')}</span>
              </div>
              <div className="h-1 bg-hud-elevated rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${
                    item.value !== null && item.value < 10 ? 'bg-oBlue' : 
                    item.value !== null && item.value > 25 ? 'bg-oRed' : 'bg-oGreen'
                  }`}
                  style={{ width: `${item.value !== null ? Math.min(100, Math.max(0, (item.value + 10) * 2)) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Status row */}
        <div className="flex justify-between items-center mt-4 shrink-0">
          <div className={`text-xs font-black uppercase tracking-[0.2em] ${airTemp !== null && seaTemp !== null ? getTemperatureColor((airTemp + seaTemp) / 2) : 'text-hud-muted'}`}>
            {airTemp !== null && seaTemp !== null ? getTemperatureStatus(airTemp, seaTemp) : t('widgets.systemStandby')}
          </div>
          <div className="text-xs text-hud-secondary uppercase font-black tracking-widest">
            {t('widgets.delta')} <span className="text-hud-main gliding-value">{airTemp !== null && seaTemp !== null ? `${Math.abs(airTemp - seaTemp).toFixed(1)}°` : t('common.na')}</span>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
});

TemperatureWidget.displayName = 'TemperatureWidget';

export default TemperatureWidget;
