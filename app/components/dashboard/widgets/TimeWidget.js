'use client';
import React, { useState, useEffect } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faGlobe, faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

export default function TimeWidget() {
  const { getSignalKValue } = useOcearoContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Get position for timezone calculation (mock data if not available)
  const latitude = getSignalKValue('navigation.position.latitude') || 0.7854; // ~45°N
  const longitude = getSignalKValue('navigation.position.longitude') || 0.1396; // ~8°E
  
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
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faClock} className="text-oBlue" />
        <span className="text-white font-medium">Time & Date</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Main time display */}
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-white mb-2 font-mono">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-gray-300">
            {formatDate(currentTime)}
          </div>
        </div>

        {/* Time zones */}
        <div className="space-y-3 mb-4">
          {/* Local Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faGlobe} className="text-oBlue text-sm" />
              <span className="text-gray-400 text-sm">Local</span>
            </div>
            <div className="text-white font-mono">{formatTime(localTime, false)}</div>
          </div>
          
          {/* UTC Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faGlobe} className="text-gray-400 text-sm" />
              <span className="text-gray-400 text-sm">UTC</span>
            </div>
            <div className="text-white font-mono">{formatTime(utcTime, false)}</div>
          </div>
        </div>

        {/* Day/Night indicator */}
        <div className="bg-oGray1 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon 
                icon={isDaytime ? faSun : faMoon} 
                className={`${isDaytime ? 'text-oYellow' : 'text-blue-300'} text-sm`} 
              />
              <span className="text-white text-sm font-medium">
                {isDaytime ? 'Daytime' : 'Nighttime'}
              </span>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-xs">
                {isDaytime ? 'Sunset' : 'Sunrise'}
              </div>
              <div className="text-white text-sm">
                {formatTime(isDaytime ? sunset : sunrise, false)}
              </div>
            </div>
          </div>
        </div>

        {/* Position info */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Latitude:</span>
            <span className="text-white font-mono">{latDeg}°</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Longitude:</span>
            <span className="text-white font-mono">{lonDeg}°</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Timezone:</span>
            <span className="text-white">UTC{localOffset >= 0 ? '+' : ''}{localOffset}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
