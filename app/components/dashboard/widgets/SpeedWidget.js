'use client';
import React, { useMemo } from 'react';
import { useOcearoContext, toDegrees } from '../../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faCompass, faWater, faWind } from '@fortawesome/free-solid-svg-icons';

export default function SpeedWidget() {
  const { getSignalKValue } = useOcearoContext();
  
  const speedData = useMemo(() => {
    const sog = getSignalKValue('navigation.speedOverGround') || 0; // m/s
    const stw = getSignalKValue('navigation.speedThroughWater') || 0; // m/s
    const heading = getSignalKValue('navigation.headingTrue') || 0; // radians
    const cog = getSignalKValue('navigation.courseOverGroundTrue') || 0; // radians
    const windSpeed = getSignalKValue('environment.wind.speedApparent') || 0; // m/s
    
    return {
      sog: Math.round(sog * 1.94384 * 10) / 10, // knots
      stw: Math.round(stw * 1.94384 * 10) / 10, // knots
      heading: Math.round(toDegrees(heading)),
      cog: Math.round(toDegrees(cog)),
      windSpeed: Math.round(windSpeed * 1.94384 * 10) / 10, // knots
      drift: Math.round((sog - stw) * 1.94384 * 10) / 10 // current effect
    };
  }, [getSignalKValue]);

  const getSpeedColor = (speed) => {
    if (speed < 2) return 'text-gray-400';
    if (speed < 5) return 'text-oBlue';
    if (speed < 8) return 'text-oGreen';
    return 'text-oYellow';
  };

  const getSpeedStatus = (speed) => {
    if (speed < 1) return 'Stationary';
    if (speed < 3) return 'Slow';
    if (speed < 6) return 'Moderate';
    if (speed < 10) return 'Fast';
    return 'Very Fast';
  };

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faTachometerAlt} className="text-oBlue" />
        <span className="text-white font-medium">Speed</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Main speed display */}
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-white mb-2">
            {speedData.sog}
            <span className="text-lg text-gray-400 ml-1">kts</span>
          </div>
          <div className={`text-sm font-medium ${getSpeedColor(speedData.sog)}`}>
            {getSpeedStatus(speedData.sog)}
          </div>
        </div>

        {/* Speed readings */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Speed Over Ground */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <FontAwesomeIcon icon={faCompass} className="text-oBlue text-xs" />
              <div className="text-gray-400 text-sm">SOG</div>
            </div>
            <div className={`text-xl font-bold ${getSpeedColor(speedData.sog)}`}>
              {speedData.sog}
            </div>
            <div className="text-gray-400 text-xs">knots</div>
          </div>
          
          {/* Speed Through Water */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <FontAwesomeIcon icon={faWater} className="text-oBlue text-xs" />
              <div className="text-gray-400 text-sm">STW</div>
            </div>
            <div className={`text-xl font-bold ${getSpeedColor(speedData.stw)}`}>
              {speedData.stw}
            </div>
            <div className="text-gray-400 text-xs">knots</div>
          </div>
        </div>

        {/* Visual speed gauge */}
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <div className="text-gray-400 text-xs w-8">0</div>
            <div className="flex-1 bg-gray-600 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  speedData.sog < 2 ? 'bg-gray-400' : 
                  speedData.sog < 5 ? 'bg-oBlue' : 
                  speedData.sog < 8 ? 'bg-oGreen' : 'bg-oYellow'
                }`}
                style={{ width: `${Math.min(100, (speedData.sog / 15) * 100)}%` }}
              />
            </div>
            <div className="text-gray-400 text-xs w-8">15+</div>
          </div>
        </div>

        {/* Course and heading */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">Heading</div>
            <div className="text-white font-medium">{speedData.heading}°</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">COG</div>
            <div className="text-white font-medium">{speedData.cog}°</div>
          </div>
        </div>

        {/* Additional info */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Current effect:</span>
            <span className={`${speedData.drift > 0 ? 'text-oGreen' : speedData.drift < 0 ? 'text-oRed' : 'text-gray-400'}`}>
              {speedData.drift > 0 ? '+' : ''}{speedData.drift} kts
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Wind speed:</span>
            <span className="text-white">{speedData.windSpeed} kts</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Max speed:</span>
            <span className="text-white">15+ knots</span>
          </div>
        </div>
      </div>
    </div>
  );
}
