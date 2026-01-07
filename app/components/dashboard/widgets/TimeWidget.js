'use client';
import React, { useState, useEffect } from 'react';
import { useSignalKPath } from '../../hooks/useSignalK';
import BaseWidget from './BaseWidget';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faGlobe, faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

const TimeWidget = React.memo(() => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
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
      title="Time & Date"
      icon={faClock}
      hasData={true}
    >
      <div className="flex-1 flex flex-col justify-center min-h-0">
        {/* Main time display */}
        <div className="text-center mb-6">
          <div className="text-5xl font-black text-white mb-1 font-mono tracking-tighter">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">
            {formatDate(currentTime)}
          </div>
        </div>

        {/* Time zones */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-oGray p-3 rounded-lg border border-gray-800">
            <div className="flex items-center space-x-2 mb-1">
              <FontAwesomeIcon icon={faGlobe} className="text-oBlue text-[10px]" />
              <span className="text-gray-500 text-[10px] font-black uppercase tracking-tight">Local</span>
            </div>
            <div className="text-white font-mono font-bold text-lg">{formatTime(localTime, false)}</div>
          </div>
          
          <div className="bg-oGray p-3 rounded-lg border border-gray-800">
            <div className="flex items-center space-x-2 mb-1">
              <FontAwesomeIcon icon={faGlobe} className="text-gray-500 text-[10px]" />
              <span className="text-gray-500 text-[10px] font-black uppercase tracking-tight">UTC</span>
            </div>
            <div className="text-white font-mono font-bold text-lg">{formatTime(utcTime, false)}</div>
          </div>
        </div>

        {/* Day/Night indicator */}
        <div className="bg-oGray p-3 rounded-lg border border-gray-800 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDaytime ? 'bg-oYellow/20' : 'bg-blue-900/20'}`}>
                <FontAwesomeIcon 
                  icon={isDaytime ? faSun : faMoon} 
                  className={isDaytime ? 'text-oYellow' : 'text-blue-300'} 
                />
              </div>
              <div className="flex flex-col">
                <span className="text-white text-sm font-black uppercase tracking-tight">
                  {isDaytime ? 'Daytime' : 'Nighttime'}
                </span>
                <span className="text-[9px] text-gray-500 font-bold uppercase">Solar Cycle</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-500 text-[9px] uppercase font-black mb-0.5">
                {isDaytime ? 'Sunset' : 'Sunrise'}
              </div>
              <div className="text-white font-mono font-bold">
                {formatTime(isDaytime ? sunset : sunrise, false)}
              </div>
            </div>
          </div>
        </div>

        {/* Position info */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-bold uppercase border-t border-gray-800 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Lat:</span>
            <span className="text-white font-mono">{latDeg}°</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Lon:</span>
            <span className="text-white font-mono">{lonDeg}°</span>
          </div>
          <div className="flex justify-between items-center col-span-2 mt-1">
            <span className="text-gray-500">Offset:</span>
            <span className="text-white font-mono">UTC{localOffset >= 0 ? '+' : ''}{localOffset}:00</span>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
});

TimeWidget.displayName = 'TimeWidget';

export default TimeWidget;
