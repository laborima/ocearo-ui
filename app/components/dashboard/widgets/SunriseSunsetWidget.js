'use client';
import React, { useMemo } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';

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
  const { getSignalKValue, nightMode } = useOcearoContext();
  const debugMode = configService.get('debugMode');
  const primaryTextClass = nightMode ? 'text-oNight' : 'text-white';
  const secondaryTextClass = nightMode ? 'text-oNight' : 'text-gray-400';
  const mutedTextClass = nightMode ? 'text-oNight' : 'text-gray-500';
  const accentIconClass = nightMode ? 'text-oNight' : 'text-oBlue';
  const sunriseValue = getSignalKValue(SUN_CONFIG.sunrise.path);
  const sunsetValue = getSignalKValue(SUN_CONFIG.sunset.path);
  const latitudeValue = getSignalKValue('navigation.position.latitude');
  const longitudeValue = getSignalKValue('navigation.position.longitude');

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

  if (!sunData.hasData) {
    return (
      <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
        <div className="flex items-center space-x-2 mb-4">
          <FontAwesomeIcon icon={faSun} className={`${accentIconClass} text-lg`} />
          <span className={`${primaryTextClass} font-medium text-lg`}>Sun Times</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 mb-2">N/A</div>
            <div className={`text-sm ${mutedTextClass}`}>No sun times data available</div>
          </div>
        </div>
      </div>
    );
  }

  const { sunrise, sunset } = sunData;

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faSun} className={`${accentIconClass} text-lg`} />
        <span className={`${primaryTextClass} font-medium text-lg`}>Sun Times</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Visual representation */}
        <div className="relative mb-6">
          <div className="w-full h-16 relative overflow-hidden rounded-lg bg-gradient-to-r from-orange-900 via-orange-600 to-yellow-400">
            {/* Horizon line */}
            <div className="absolute bottom-0 w-full h-1 bg-oGray"></div>
            
            {/* Sun position indicator */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-oYellow rounded-full shadow-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faSun} className="text-orange-800 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Times display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className={`${secondaryTextClass} text-base mb-2`}>Sunrise</div>
            <div className="text-3xl font-bold text-oYellow mb-1">
              {sunrise !== null ? sunrise : 'N/A'}
            </div>
            <div className={`${secondaryTextClass} text-sm`}>Local Time</div>
          </div>
          
          <div className="text-center">
            <div className={`${secondaryTextClass} text-base mb-2`}>Sunset</div>
            <div className="text-3xl font-bold text-orange-400 mb-1">
              {sunset !== null ? sunset : 'N/A'}
            </div>
            <div className={`${secondaryTextClass} text-sm`}>Local Time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
