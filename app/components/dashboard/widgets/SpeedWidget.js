'use client';
import React, { useMemo } from 'react';
import { useOcearoContext, toDegrees } from '../../context/OcearoContext';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faCompass, faWater, faWind } from '@fortawesome/free-solid-svg-icons';

const SpeedWidget = React.memo(() => {
  const { getSignalKValue } = useOcearoContext();
  const debugMode = configService.get('debugMode');
  
  const speedData = useMemo(() => {
    const sogValue = getSignalKValue('navigation.speedOverGround');
    const stwValue = getSignalKValue('navigation.speedThroughWater');
    const headingValue = getSignalKValue('navigation.headingTrue');
    const cogValue = getSignalKValue('navigation.courseOverGroundTrue');
    const windSpeedValue = getSignalKValue('environment.wind.speedApparent');

    const hasData = sogValue !== null || stwValue !== null;

    if (!hasData && !debugMode) {
      return { hasData: false };
    }

    const sog = sogValue || (debugMode ? 0 : null);
    const stw = stwValue || (debugMode ? 0 : null);
    const heading = headingValue || (debugMode ? 0 : null);
    const cog = cogValue || (debugMode ? 0 : null);
    const windSpeed = windSpeedValue || (debugMode ? 0 : null);
    
    return {
      hasData: true,
      sog: sog !== null ? Math.round(sog * 1.94384 * 10) / 10 : null,
      stw: stw !== null ? Math.round(stw * 1.94384 * 10) / 10 : null,
      heading: heading !== null ? Math.round(toDegrees(heading)) : null,
      cog: cog !== null ? Math.round(toDegrees(cog)) : null,
      windSpeed: windSpeed !== null ? Math.round(windSpeed * 1.94384 * 10) / 10 : null,
      drift: sog !== null && stw !== null ? Math.round((sog - stw) * 1.94384 * 10) / 10 : null
    };
  }, [getSignalKValue, debugMode]);

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

  if (!speedData.hasData) {
    return (
      <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
        <div className="flex items-center space-x-2 mb-3">
          <FontAwesomeIcon icon={faTachometerAlt} className="text-oBlue text-lg" />
          <span className="text-white font-medium text-lg">Speed</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 mb-2">N/A</div>
            <div className="text-sm text-gray-500">No speed data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-3">
        <FontAwesomeIcon icon={faTachometerAlt} className="text-oBlue text-lg" />
        <span className="text-white font-medium text-lg">Speed</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Main speed display */}
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-white mb-1">
            {speedData.sog !== null ? speedData.sog : 'N/A'}
            {speedData.sog !== null && <span className="text-lg text-gray-400 ml-1">kts</span>}
          </div>
          <div className={`text-sm font-medium ${speedData.sog !== null ? getSpeedColor(speedData.sog) : 'text-gray-500'}`}>
            {speedData.sog !== null ? getSpeedStatus(speedData.sog) : 'Unknown'}
          </div>
        </div>

        {/* Speed readings */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Speed Over Ground */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-0.5">
              <FontAwesomeIcon icon={faCompass} className="text-oBlue text-sm" />
              <div className="text-gray-400 text-sm">SOG</div>
            </div>
            <div className={`text-xl font-bold ${speedData.sog !== null ? getSpeedColor(speedData.sog) : 'text-gray-500'}`}>
              {speedData.sog !== null ? speedData.sog : 'N/A'}
            </div>
            <div className="text-gray-400 text-sm">knots</div>
          </div>
          
          {/* Speed Through Water */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-0.5">
              <FontAwesomeIcon icon={faWater} className="text-oBlue text-sm" />
              <div className="text-gray-400 text-sm">STW</div>
            </div>
            <div className={`text-xl font-bold ${speedData.stw !== null ? getSpeedColor(speedData.stw) : 'text-gray-500'}`}>
              {speedData.stw !== null ? speedData.stw : 'N/A'}
            </div>
            <div className="text-gray-400 text-sm">knots</div>
          </div>
        </div>

        {/* Visual speed gauge */}
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            <div className="text-gray-400 text-xs w-8">0</div>
            <div className="flex-1 bg-gray-600 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  speedData.sog < 2 ? 'bg-gray-400' : 
                  speedData.sog < 5 ? 'bg-oBlue' : 
                  speedData.sog < 8 ? 'bg-oGreen' : 'bg-oYellow'
                }`}
                style={{ width: `${speedData.sog !== null ? Math.min(100, (speedData.sog / 15) * 100) : 0}%` }}
              />
            </div>
            <div className="text-gray-400 text-xs w-8">15+</div>
          </div>
        </div>

        {/* Course and heading */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">Heading</div>
            <div className="text-white font-medium">{speedData.heading !== null ? `${speedData.heading}°` : 'N/A'}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">COG</div>
            <div className="text-white font-medium">{speedData.cog !== null ? `${speedData.cog}°` : 'N/A'}</div>
          </div>
        </div>

        {/* Additional info */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Current effect:</span>
            <span className={`${speedData.drift !== null && speedData.drift > 0 ? 'text-oGreen' : speedData.drift !== null && speedData.drift < 0 ? 'text-oRed' : 'text-gray-400'}`}>
              {speedData.drift !== null ? `${speedData.drift > 0 ? '+' : ''}${speedData.drift} kts` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Wind speed:</span>
            <span className="text-white">{speedData.windSpeed !== null ? `${speedData.windSpeed} kts` : 'N/A'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Max speed:</span>
            <span className="text-white">15+ knots</span>
          </div>
        </div>
      </div>
    </div>
  );
});

SpeedWidget.displayName = 'SpeedWidget';

export default SpeedWidget;
