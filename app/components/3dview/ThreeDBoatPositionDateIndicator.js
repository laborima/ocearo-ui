import React, { useState, useEffect } from 'react';
import { useOcearoContext } from '../context/OcearoContext';
import { useSignalKPath } from '../hooks/useSignalK';

const ThreeDBoatPositionDateIndicator = () => {
  const { nightMode } = useOcearoContext();
  const position = useSignalKPath('navigation.position');
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
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

  const textColor = nightMode ? 'text-oNight' : 'text-oGray';
  const positionTextColor = nightMode ? 'text-oNight' : 'text-white';

  // Check if position is null or undefined
  if (!position) {
    return (
      <div className="mt-4">
        <div className={`text-3xl font-bold cursor-pointer flex gap-2 ${positionTextColor}`}>
          <span>--</span>
          <span>--</span>
        </div>
        <div className={`text-lg ${textColor}`}>{getCurrentDateTime()}</div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className={`text-3xl font-bold cursor-pointer flex gap-2 ${positionTextColor}`}>
        <span>{formatCoordinate(position.latitude, true)}</span>
        <span>{formatCoordinate(position.longitude, false)}</span>
      </div>
      <div className={`text-lg ${textColor}`}>{getCurrentDateTime()}</div>
    </div>
  );
};

export default ThreeDBoatPositionDateIndicator;