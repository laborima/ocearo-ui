'use client';
import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { toDegrees, MS_TO_KNOTS, useOcearoContext } from '../../context/OcearoContext';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import { faTachometerAlt, faCompass, faWater, faWind } from '@fortawesome/free-solid-svg-icons';
import BaseWidget from './BaseWidget';

const SpeedWidget = React.memo(() => {
  const debugMode = configService.get('debugMode');
  
  const sogValue = useSignalKPath('navigation.speedOverGround');
  const stwValue = useSignalKPath('navigation.speedThroughWater');
  const headingValue = useSignalKPath('navigation.headingTrue');
  const cogValue = useSignalKPath('navigation.courseOverGroundTrue');
  const windSpeedValue = useSignalKPath('environment.wind.speedApparent');

  const { nightMode } = useOcearoContext();
  const speedData = useMemo(() => {
    const hasData = sogValue !== null || stwValue !== null || debugMode;

    if (!hasData) {
      return { hasData: false };
    }

    const sog = sogValue || (debugMode ? 5.2 : null);
    const stw = stwValue || (debugMode ? 4.8 : null);
    const heading = headingValue || (debugMode ? 0.52 : null);
    const cog = cogValue || (debugMode ? 0.61 : null);
    const windSpeed = windSpeedValue || (debugMode ? 12.5 : null);
    
    return {
      hasData: true,
      sog: sog !== null ? Math.round(sog * MS_TO_KNOTS * 10) / 10 : null,
      stw: stw !== null ? Math.round(stw * MS_TO_KNOTS * 10) / 10 : null,
      heading: heading !== null ? Math.round(toDegrees(heading)) : null,
      cog: cog !== null ? Math.round(toDegrees(cog)) : null,
      windSpeed: windSpeed !== null ? Math.round(windSpeed * MS_TO_KNOTS * 10) / 10 : null,
      drift: sog !== null && stw !== null ? Math.round((sog - stw) * MS_TO_KNOTS * 10) / 10 : null
    };
  }, [sogValue, stwValue, headingValue, cogValue, windSpeedValue, debugMode]);

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

  const secondaryTextClass = nightMode ? 'text-oNight' : 'text-gray-400';

  return (
    <BaseWidget
      title="Speed"
      icon={faTachometerAlt}
      hasData={speedData.hasData}
      noDataMessage="No speed data available"
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Main speed display */}
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-white mb-1">
            {speedData.sog !== null ? speedData.sog : 'N/A'}
            {speedData.sog !== null && <span className="text-xl text-gray-400 ml-1">kts</span>}
          </div>
          <div className={`text-xs font-bold uppercase tracking-widest ${speedData.sog !== null ? getSpeedColor(speedData.sog) : 'text-gray-500'}`}>
            {speedData.sog !== null ? getSpeedStatus(speedData.sog) : 'Unknown'}
          </div>
        </div>

        {/* Speed readings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-oGray p-3 rounded-lg text-center border border-gray-800">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <FontAwesomeIcon icon={faCompass} className="text-oBlue text-xs" />
              <div className="text-gray-400 text-[10px] uppercase font-bold">SOG</div>
            </div>
            <div className={`text-xl font-bold ${speedData.sog !== null ? getSpeedColor(speedData.sog) : 'text-gray-500'}`}>
              {speedData.sog !== null ? speedData.sog : 'N/A'}
            </div>
            <div className="text-gray-500 text-[10px] uppercase">knots</div>
          </div>
          
          <div className="bg-oGray p-3 rounded-lg text-center border border-gray-800">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <FontAwesomeIcon icon={faWater} className="text-oBlue text-xs" />
              <div className="text-gray-400 text-[10px] uppercase font-bold">STW</div>
            </div>
            <div className={`text-xl font-bold ${speedData.stw !== null ? getSpeedColor(speedData.stw) : 'text-gray-500'}`}>
              {speedData.stw !== null ? speedData.stw : 'N/A'}
            </div>
            <div className="text-gray-500 text-[10px] uppercase">knots</div>
          </div>
        </div>

        {/* Visual speed gauge */}
        <div className="mb-6 px-2">
          <div className="flex items-center space-x-3">
            <div className="text-gray-500 text-[10px] font-bold">0</div>
            <div className="flex-1 bg-oGray rounded-full h-3 overflow-hidden border border-gray-800 shadow-inner">
              <div 
                className={`h-full transition-all duration-1000 ease-out ${
                  speedData.sog < 2 ? 'bg-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.3)]' : 
                  speedData.sog < 5 ? 'bg-oBlue shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 
                  speedData.sog < 8 ? 'bg-oGreen shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 
                  'bg-oYellow shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                }`}
                style={{ width: `${speedData.sog !== null ? Math.min(100, (speedData.sog / 15) * 100) : 0}%` }}
              />
            </div>
            <div className="text-gray-500 text-[10px] font-bold">15+</div>
          </div>
        </div>

        {/* Course and heading */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="text-gray-400 text-[10px] uppercase mb-1 font-bold">Heading</div>
            <div className="text-white font-bold text-lg">{speedData.heading !== null ? `${speedData.heading}°` : 'N/A'}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-[10px] uppercase mb-1 font-bold">COG</div>
            <div className="text-white font-bold text-lg">{speedData.cog !== null ? `${speedData.cog}°` : 'N/A'}</div>
          </div>
        </div>

        {/* Additional info */}
        <div className="bg-oGray p-3 rounded-lg border border-gray-800 space-y-2">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold">
            <span className="text-gray-400">Current effect:</span>
            <span className={speedData.drift !== null && speedData.drift > 0 ? 'text-oGreen' : speedData.drift !== null && speedData.drift < 0 ? 'text-oRed' : 'text-gray-500'}>
              {speedData.drift !== null ? `${speedData.drift > 0 ? '+' : ''}${speedData.drift} kts` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] uppercase font-bold">
            <span className="text-gray-400">Apparent Wind:</span>
            <div className="flex items-center space-x-1">
              <FontAwesomeIcon icon={faWind} className="text-oBlue text-[8px]" />
              <span className="text-white">{speedData.windSpeed !== null ? `${speedData.windSpeed} kts` : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
});

SpeedWidget.displayName = 'SpeedWidget';

export default SpeedWidget;
