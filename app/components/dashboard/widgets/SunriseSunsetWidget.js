'use client';
import React, { useMemo } from 'react';
import { useSignalKPaths } from '../../hooks/useSignalK';
import BaseWidget from './BaseWidget';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const SUN_CONFIG = {
  sunrise: {
    path: 'environment.sun.sunrise',
    transform: value => value || '07:25'
  },
  sunset: {
    path: 'environment.sun.sunset',
    transform: value => value || '18:06'
  }
};

const SUN_ZENITH = 90.833;
const DEGREES_PER_HOUR = 15;

const toRadians = (degrees) => degrees * (Math.PI / 180);
const toDegrees = (radians) => radians * (180 / Math.PI);

const normalizeDegrees = (value) => {
  const remainder = value % 360;
  return remainder < 0 ? remainder + 360 : remainder;
};

const normalizeHours = (value) => {
  const remainder = value % 24;
  return remainder < 0 ? remainder + 24 : remainder;
};

const dayOfYear = (date) => {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const current = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((current - start) / 86400000) + 1;
};

const calculateSunHour = (latitudeDegrees, longitudeDegrees, date, isSunrise) => {
  if (latitudeDegrees === null || latitudeDegrees === undefined || longitudeDegrees === null || longitudeDegrees === undefined) {
    return null;
  }

  const day = dayOfYear(date);
  const longitudeHour = longitudeDegrees / DEGREES_PER_HOUR;
  const approximateTime = day + ((isSunrise ? 6 : 18) - longitudeHour) / 24;
  const meanAnomaly = 0.9856 * approximateTime - 3.289;
  const sunLongitude = normalizeDegrees(meanAnomaly + 1.916 * Math.sin(toRadians(meanAnomaly)) + 0.020 * Math.sin(2 * toRadians(meanAnomaly)) + 282.634);

  let rightAscension = normalizeDegrees(toDegrees(Math.atan(0.91764 * Math.tan(toRadians(sunLongitude)))));
  const sunQuadrant = Math.floor(sunLongitude / 90) * 90;
  const raQuadrant = Math.floor(rightAscension / 90) * 90;
  rightAscension = (rightAscension + (sunQuadrant - raQuadrant)) / DEGREES_PER_HOUR;

  const sinDeclination = 0.39782 * Math.sin(toRadians(sunLongitude));
  const cosDeclination = Math.cos(Math.asin(sinDeclination));
  const cosineHourAngle = (Math.cos(toRadians(SUN_ZENITH)) - (sinDeclination * Math.sin(toRadians(latitudeDegrees)))) / (cosDeclination * Math.cos(toRadians(latitudeDegrees)));

  if (cosineHourAngle > 1 || cosineHourAngle < -1) {
    return null;
  }

  let hourAngle = isSunrise ? 360 - toDegrees(Math.acos(cosineHourAngle)) : toDegrees(Math.acos(cosineHourAngle));
  hourAngle /= DEGREES_PER_HOUR;

  const localMeanTime = hourAngle + rightAscension - 0.06571 * approximateTime - 6.622;
  const universalTime = normalizeHours(localMeanTime - longitudeHour);
  const timezoneOffset = Math.round(longitudeDegrees / DEGREES_PER_HOUR);
  return normalizeHours(universalTime + timezoneOffset);
};

const formatTimeFromHours = (hours) => {
  if (hours === null || hours === undefined) {
    return null;
  }

  const normalized = normalizeHours(hours);
  const hour = Math.floor(normalized);
  let roundedMinutes = Math.round((normalized - hour) * 60);
  let adjustedHour = hour;

  if (roundedMinutes === 60) {
    roundedMinutes = 0;
    adjustedHour = (adjustedHour + 1) % 24;
  }

  return `${adjustedHour.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
};

const computeSunTimes = (latitudeRadians, longitudeRadians, date) => {
  if (latitudeRadians === null || latitudeRadians === undefined || longitudeRadians === null || longitudeRadians === undefined) {
    return null;
  }

  const latitudeDegrees = latitudeRadians * (180 / Math.PI);
  const longitudeDegrees = longitudeRadians * (180 / Math.PI);
  const sunriseHours = calculateSunHour(latitudeDegrees, longitudeDegrees, date, true);
  const sunsetHours = calculateSunHour(latitudeDegrees, longitudeDegrees, date, false);

  const sunrise = sunriseHours !== null ? formatTimeFromHours(sunriseHours) : null;
  const sunset = sunsetHours !== null ? formatTimeFromHours(sunsetHours) : null;

  if (sunrise === null && sunset === null) {
    return null;
  }

  return { sunrise, sunset };
};

export default function SunriseSunsetWidget() {
  const { t } = useTranslation();
  const debugMode = configService.get('debugMode');
  
  const sunPaths = [
    SUN_CONFIG.sunrise.path,
    SUN_CONFIG.sunset.path,
    'navigation.position.latitude',
    'navigation.position.longitude'
  ];
  
  const skValues = useSignalKPaths(sunPaths);
  
  const sunriseValue = skValues[SUN_CONFIG.sunrise.path];
  const sunsetValue = skValues[SUN_CONFIG.sunset.path];
  const latitudeValue = skValues['navigation.position.latitude'];
  const longitudeValue = skValues['navigation.position.longitude'];

  const sunData = useMemo(() => {
    const sunriseFromSignal = sunriseValue !== null ? SUN_CONFIG.sunrise.transform(sunriseValue) : null;
    const sunsetFromSignal = sunsetValue !== null ? SUN_CONFIG.sunset.transform(sunsetValue) : null;
    const computed = computeSunTimes(latitudeValue, longitudeValue, new Date());
    const fallbackSunrise = debugMode ? SUN_CONFIG.sunrise.transform(null) : null;
    const fallbackSunset = debugMode ? SUN_CONFIG.sunset.transform(null) : null;

    const sunrise = sunriseFromSignal ?? (computed ? computed.sunrise : null) ?? fallbackSunrise;
    const sunset = sunsetFromSignal ?? (computed ? computed.sunset : null) ?? fallbackSunset;

    if (sunrise === null && sunset === null) {
      return { hasData: false };
    }

    return {
      hasData: true,
      sunrise,
      sunset
    };
  }, [sunriseValue, sunsetValue, latitudeValue, longitudeValue, debugMode]);

  const { hasData, sunrise, sunset } = sunData;

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
          <div className="w-full h-16 relative overflow-hidden rounded-sm bg-gradient-to-r from-orange-950 via-orange-600/20 to-yellow-900/40 shadow-inner border border-hud transition-all duration-700 group-hover:scale-[1.02]">
            {/* Horizon line */}
            <div className="absolute bottom-4 w-full h-px bg-hud-muted opacity-20 shadow-[0_-4px_10px_var(--hud-text-main)] shadow-opacity-10"></div>
            
            {/* Sun position indicator */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-10 h-10 bg-oYellow rounded-full shadow-[0_0_25px_var(--color-oYellow)] shadow-opacity-40 flex items-center justify-center border border-hud animate-soft-pulse">
                <FontAwesomeIcon icon={faSun} className="text-orange-900 text-sm" />
              </div>
            </div>

            {/* Atmosphere glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-orange-500/5 pointer-events-none"></div>
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
            <div className="text-3xl font-black text-orange-500 leading-none gliding-value tracking-tighter">
              {sunset !== null ? sunset : t('common.na')}
            </div>
            <div className="text-hud-muted text-xs uppercase mt-3 font-black tracking-widest opacity-60">{t('widgets.localMeridian')}</div>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
