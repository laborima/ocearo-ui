import React, { useState, useEffect } from 'react';
import { useSignalKPath } from '../hooks/useSignalK';
import { vesselNow } from '../utils/VesselClock';

const ThreeDBoatPositionDateIndicator = () => {
  const position = useSignalKPath('navigation.position');
  const [dateTime, setDateTime] = useState(() => vesselNow());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(vesselNow());
    }, 10000); // Update every 10 seconds is enough for this display
    return () => clearInterval(timer);
  }, []);

  const formatCoordinate = (value, isLatitude) => {
    if (value === undefined || value === null) return '--';
    const absolute = Math.abs(value);
    const degrees = Math.floor(absolute);
    const minutes = ((absolute - degrees) * 60).toFixed(3);
    const direction = isLatitude
      ? (value >= 0 ? 'N' : 'S')
      : (value >= 0 ? 'E' : 'W');
    return `${degrees}°${minutes}'${direction}`;
  };

  const getCurrentDateTime = () => {
    try {
      const userLocale = navigator.language || 'en-US';
      return dateTime.toLocaleString(userLocale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.warn('Error formatting date with user locale, falling back to en-US', error);
      return dateTime.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const positionTextColor = 'text-hud-main';

  // Check if position is null or undefined
  if (!position) {
    return (
      <div className="mt-6 ml-2 p-3 transition-all duration-300">
        <div className={`text-value font-semibold flex gap-4 ${positionTextColor} opacity-10 tracking-tight mb-2`}>
          <span>--°--&apos;--</span>
          <span>--°--&apos;--</span>
        </div>
        <div className={`text-caption font-semibold uppercase tracking-[0.2em] opacity-40 text-hud-main`}>
          {getCurrentDateTime()}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 ml-2 group p-4 transition-all duration-300 select-none">
      <div className={`text-value font-semibold flex gap-4 ${positionTextColor} tracking-tight drop-shadow-lg mb-3`}>
        <div className="flex flex-col">
          <span className={`text-caption font-semibold uppercase tracking-[0.2em] mb-1 text-hud-dim`}>LAT</span>
          <span>{formatCoordinate(position.latitude, true)}</span>
        </div>
        <div className="w-[1px] bg-hud-border self-stretch my-1" />
        <div className="flex flex-col">
          <span className={`text-caption font-semibold uppercase tracking-[0.2em] mb-1 text-hud-dim`}>LON</span>
          <span>{formatCoordinate(position.longitude, false)}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="h-[2px] w-4 bg-oBlue/40 rounded-full" />
        <div className={`text-caption font-semibold uppercase tracking-[0.3em] text-hud-secondary`}>
          {getCurrentDateTime()}
        </div>
      </div>
    </div>
  );
};

export default ThreeDBoatPositionDateIndicator;