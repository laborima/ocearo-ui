'use client';
import React, { useState, useEffect } from 'react';
import { useOcearoContext, oNight, oBlue } from '../../context/OcearoContext';
import { useSignalKPath } from '../../hooks/useSignalK';
import BaseWidget from './BaseWidget';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faGlobe, faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

const TimeWidget = React.memo(() => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const { nightMode } = useOcearoContext();
  
  const latitude = useSignalKPath('navigation.position.latitude', 0.7854); // ~45°N
  const longitude = useSignalKPath('navigation.position.longitude', 0.1396); // ~8°E
  
  // Convert radians to degrees
  const latDeg = (latitude * 180 / Math.PI).toFixed(4);
  const lonDeg = (longitude * 180 / Math.PI).toFixed(4);
  
  // Calculate local time (simplified - in real app would use proper timezone API)
  const utcTime = new Date(currentTime.getTime());
  const localOffset = Math.round(longitude * 12 / Math.PI); // rough timezone offset
  const localTime = new Date(utcTime.getTime() + (localOffset * 60 * 60 * 1000));
  
  // Format times
  const formatTime = (date, includeSeconds = true) => {
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds && { second: '2-digit' }),
      hour12: false
    };
    return date.toLocaleTimeString('en-GB', options);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Determine if it's day or night (simplified)
  const hour = currentTime.getHours();
  const isDaytime = hour >= 6 && hour < 18;

  // Calculate sunrise/sunset times (very simplified)
  const sunrise = new Date(currentTime);
  sunrise.setHours(6, 30, 0, 0);
  const sunset = new Date(currentTime);
  sunset.setHours(18, 45, 0, 0);

  return (
    <BaseWidget
      title={t('widgets.temporalNode')}
      icon={faClock}
      hasData={true}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Main time display - centered */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center group mb-6">
            <div className="text-6xl font-black text-hud-main leading-none font-mono tracking-tighter gliding-value">
              {formatTime(currentTime)}
            </div>
            <div className="text-hud-secondary text-xs font-black uppercase tracking-[0.3em] mt-4 opacity-60">
              {formatDate(currentTime)}
            </div>
          </div>

          {/* Local + UTC */}
          <div className="grid grid-cols-2 gap-4">
            <div className="tesla-card p-4 tesla-hover bg-hud-bg">
              <div className="flex items-center space-x-3 mb-2">
                <FontAwesomeIcon icon={faGlobe} className="text-oBlue text-xs opacity-50" />
                <span className="text-hud-muted text-xs font-black uppercase tracking-widest">{t('widgets.localSync')}</span>
              </div>
              <div className="text-hud-main font-mono font-black text-xl gliding-value">{formatTime(localTime, false)}</div>
            </div>
            <div className="tesla-card p-4 tesla-hover bg-hud-bg">
              <div className="flex items-center space-x-3 mb-2">
                <FontAwesomeIcon icon={faGlobe} className="text-hud-muted text-xs opacity-50" />
                <span className="text-hud-muted text-xs font-black uppercase tracking-widest">{t('widgets.utcClock')}</span>
              </div>
              <div className="text-hud-main font-mono font-black text-xl gliding-value">{formatTime(utcTime, false)}</div>
            </div>
          </div>
        </div>

        {/* Day/Night + Position at bottom */}
        <div className="shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon 
                icon={isDaytime ? faSun : faMoon} 
                className={isDaytime ? 'text-oYellow text-lg' : (nightMode ? 'text-oNight text-lg' : 'text-oBlue text-lg')} 
              />
              <span className="text-hud-main text-xs font-black uppercase tracking-widest">
                {isDaytime ? t('widgets.diurnalPhase') : t('widgets.nocturnalPhase')}
              </span>
            </div>
            <span className="text-hud-muted text-xs font-black font-mono opacity-60">
              {isDaytime ? '☀' : '☾'} {formatTime(isDaytime ? sunset : sunrise, false)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-black uppercase opacity-60">
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
