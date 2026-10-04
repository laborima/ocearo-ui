'use client';
import React, { useState, useEffect } from 'react';
import { useSignalKPath } from '../../hooks/useSignalK';
import BaseWidget from './BaseWidget';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faGlobe, faSun, faMoon, faSatellite } from '@fortawesome/free-solid-svg-icons';
import { useVesselClock } from '../../utils/VesselClock';
import { computeSunEvents } from '../../utils/SunUtils';

const TimeWidget = React.memo(() => {
  const { t } = useTranslation();

  // The Pi has no RTC battery, so the system clock can be days off after a
  // power cut with no internet. Read the GPS-disciplined clock instead.
  const { now, corrected } = useVesselClock();
  const [currentTime, setCurrentTime] = useState(() => now());

  // Tick the clock every second (without an interval the display stays frozen at mount time)
  useEffect(() => {
    setCurrentTime(now());
    const id = setInterval(() => setCurrentTime(now()), 1000);
    return () => clearInterval(id);
  }, [now]);
  
  // Signal K positions are decimal degrees
  const position = useSignalKPath('navigation.position');
  const latitude = position?.latitude;
  const longitude = position?.longitude;
  const hasPosition = Number.isFinite(latitude) && Number.isFinite(longitude);
  const latDeg = hasPosition ? latitude.toFixed(4) : '--';
  const lonDeg = hasPosition ? longitude.toFixed(4) : '--';

  const formatTime = (date, includeSeconds = true, timeZone) => date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
    hour12: false,
    ...(timeZone && { timeZone }),
  });

  const formatDate = (date) => date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Nautical zone time: UTC + round(longitude / 15) hours, shown as UTC so the
  // display's own time zone doesn't apply twice
  const zoneOffsetHours = hasPosition ? Math.round(longitude / 15) : 0;
  const zoneTime = new Date(currentTime.getTime() + zoneOffsetHours * 3600000);

  // Day / night and next sun event from the actual position
  const sun = hasPosition ? computeSunEvents(latitude, longitude, currentTime) : null;
  const isDaytime = sun?.sunrise && sun?.sunset
    ? currentTime >= sun.sunrise && currentTime < sun.sunset
    : currentTime.getHours() >= 6 && currentTime.getHours() < 18;
  // After sunset the next sunrise is tomorrow's
  const nextSunEvent = !sun ? null
    : isDaytime ? sun.sunset
    : sun.sunrise && currentTime < sun.sunrise ? sun.sunrise
    : computeSunEvents(latitude, longitude, new Date(currentTime.getTime() + 86400000))?.sunrise ?? null;

  return (
    <BaseWidget
      title={t('widgets.temporalNode')}
      icon={faClock}
      hasData={true}
    >
      {/* Flagged explicitly: when this badge shows, the displayed time comes
          from the GPS because the system clock is more than a minute off. */}
      {corrected && (
        <div className="absolute top-4 right-4 z-10">
          <span className="text-caption px-2 py-0.5 rounded-sm uppercase font-semibold tracking-widest text-hud-main bg-oBlue/40 border border-oBlue/30 flex items-center space-x-1.5">
            <FontAwesomeIcon icon={faSatellite} className="text-xs opacity-70" />
            <span>GPS</span>
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0">
        {/* Main time display - centered */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center group mb-6">
            <div className="text-hero font-medium text-hud-main leading-none font-mono tracking-tight gliding-value">
              {formatTime(currentTime)}
            </div>
            <div className="text-hud-secondary text-caption font-semibold uppercase tracking-[0.3em] mt-4 opacity-60">
              {formatDate(currentTime)}
            </div>
          </div>

          {/* Local + UTC */}
          <div className="grid grid-cols-2 gap-4">
            <div className="tesla-card p-4 tesla-hover bg-hud-bg">
              <div className="flex items-center space-x-3 mb-2">
                <FontAwesomeIcon icon={faGlobe} className="text-oBlue text-xs opacity-50" />
                <span className="text-hud-muted text-caption font-semibold uppercase tracking-widest">{t('widgets.localSync')}</span>
              </div>
              <div className="text-hud-main font-mono font-semibold text-value gliding-value">{formatTime(zoneTime, false, 'UTC')}</div>
            </div>
            <div className="tesla-card p-4 tesla-hover bg-hud-bg">
              <div className="flex items-center space-x-3 mb-2">
                <FontAwesomeIcon icon={faGlobe} className="text-hud-muted text-xs opacity-50" />
                <span className="text-hud-muted text-caption font-semibold uppercase tracking-widest">{t('widgets.utcClock')}</span>
              </div>
              <div className="text-hud-main font-mono font-semibold text-value gliding-value">{formatTime(currentTime, false, 'UTC')}</div>
            </div>
          </div>
        </div>

        {/* Day/Night + Position at bottom */}
        <div className="shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon 
                icon={isDaytime ? faSun : faMoon} 
                className={isDaytime ? 'text-oYellow text-lg' : 'text-oBlue text-lg'} 
              />
              <span className="text-hud-main text-caption font-semibold uppercase tracking-widest">
                {isDaytime ? t('widgets.diurnalPhase') : t('widgets.nocturnalPhase')}
              </span>
            </div>
            <span className="text-hud-muted text-caption font-semibold font-mono opacity-60">
              {isDaytime ? '☀' : '☾'} {nextSunEvent ? formatTime(nextSunEvent, false) : '--:--'}
            </span>
          </div>
          <div className="flex items-center justify-between text-caption font-semibold uppercase opacity-60">
            <span className="text-hud-muted">
              <span className="tracking-widest">LAT</span> <span className="text-hud-main font-mono">{latDeg}°</span>
            </span>
            <span className="text-hud-muted">
              <span className="tracking-widest">LON</span> <span className="text-hud-main font-mono">{lonDeg}°</span>
            </span>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
});

TimeWidget.displayName = 'TimeWidget';

export default TimeWidget;
