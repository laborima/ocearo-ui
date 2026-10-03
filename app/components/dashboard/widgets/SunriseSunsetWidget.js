'use client';
import React, { useMemo } from 'react';
import { useSignalKPaths } from '../../hooks/useSignalK';
import BaseWidget from './BaseWidget';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { vesselNow } from '../../utils/VesselClock';
import { computeSunEvents, parseSunTime, formatClockTime } from '../../utils/SunUtils';

const SUNRISE_PATH = 'environment.sun.sunrise';
const SUNSET_PATH = 'environment.sun.sunset';
// Demo values when debug mode has neither a sun plugin nor a position
const DEBUG_SUNRISE = '07:25';
const DEBUG_SUNSET = '18:06';

const SUN_PATHS = [SUNRISE_PATH, SUNSET_PATH, 'navigation.position'];

export default function SunriseSunsetWidget() {
  const { t } = useTranslation();
  const debugMode = configService.get('debugMode');
  
  const skValues = useSignalKPaths(SUN_PATHS);
  const sunriseValue = skValues[SUNRISE_PATH];
  const sunsetValue = skValues[SUNSET_PATH];
  const position = skValues['navigation.position'];

  const sunData = useMemo(() => {
    const now = vesselNow();
    // Prefer the server's values (derived-data plugin), else compute from position
    const computed = computeSunEvents(position?.latitude, position?.longitude, now);
    const sunriseDate = parseSunTime(sunriseValue, now) ?? computed?.sunrise
      ?? (debugMode ? parseSunTime(DEBUG_SUNRISE, now) : null);
    const sunsetDate = parseSunTime(sunsetValue, now) ?? computed?.sunset
      ?? (debugMode ? parseSunTime(DEBUG_SUNSET, now) : null);

    if (!sunriseDate && !sunsetDate) {
      return { hasData: false, sunrise: null, sunset: null };
    }
    return { hasData: true, sunrise: formatClockTime(sunriseDate), sunset: formatClockTime(sunsetDate) };
  }, [sunriseValue, sunsetValue, position, debugMode]);

  const { sunrise, sunset } = sunData;

  return (
    <BaseWidget
      title={t('widgets.solarCycle')}
      icon={faSun}
      hasData={sunData.hasData}
      noDataMessage={t('widgets.signalLossCelestial')}
    >
      <div className="flex-1 flex flex-col justify-center py-4">
        {/* Visual representation */}
        <div className="relative mb-8 group">
          <div className="w-full h-16 relative overflow-hidden rounded-sm bg-gradient-to-r from-oYellow/20 via-oYellow/10 to-oYellow/5 shadow-inner border border-hud transition-all duration-700 group-hover:scale-[1.02]">
            {/* Horizon line */}
            <div className="absolute bottom-4 w-full h-px bg-hud-muted opacity-20 shadow-[0_-4px_10px_var(--hud-text-main)]"></div>
            
            {/* Sun position indicator */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-10 h-10 bg-oYellow rounded-full shadow-[0_0_25px_var(--color-oYellow)] flex items-center justify-center border border-hud animate-soft-pulse">
                <FontAwesomeIcon icon={faSun} className="text-oYellow text-sm" />
              </div>
            </div>

            {/* Atmosphere glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-oYellow/5 pointer-events-none"></div>
          </div>
        </div>

        {/* Times display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center tesla-card bg-hud-bg p-4 tesla-hover border border-hud">
            <div className="text-hud-muted text-xs uppercase mb-3 font-black tracking-widest">{t('widgets.solarIngress')}</div>
            <div className="text-3xl font-black text-oYellow leading-none gliding-value tracking-tighter">
              {sunrise !== null ? sunrise : t('common.na')}
            </div>
            <div className="text-hud-muted text-xs uppercase mt-3 font-black tracking-widest opacity-60">{t('widgets.localMeridian')}</div>
          </div>
          
          <div className="text-center tesla-card bg-hud-bg p-4 tesla-hover border border-hud">
            <div className="text-hud-muted text-xs uppercase mb-3 font-black tracking-widest">{t('widgets.solarEgress')}</div>
            <div className="text-3xl font-black text-oYellow leading-none gliding-value tracking-tighter">
              {sunset !== null ? sunset : t('common.na')}
            </div>
            <div className="text-hud-muted text-xs uppercase mt-3 font-black tracking-widest opacity-60">{t('widgets.localMeridian')}</div>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
