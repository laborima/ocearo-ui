'use client';
import React, { useRef, useEffect, useMemo } from 'react';
import { useSignalKPath } from '../../hooks/useSignalK';
import BaseWidget from './BaseWidget';
import { toDegrees, oBlue, oRed, oYellow, oGreen, oNight, useOcearoContext } from '../../context/OcearoContext';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass, faPlane } from '@fortawesome/free-solid-svg-icons';
import { drawAttitudeInstrument } from '../../../lib/AttitudeDrawing';

const colors = {
  leftPaneBg: '#0e0e0e',
  rightPaneBg: '#1e1e1e',
  oBlue,
  oRed,
  oYellow,
  oGreen,
  oGray: '#989898',
  oGray2: '#424242',
  oNight
};

export default function AttitudeWidget() {
  const { nightMode } = useOcearoContext();
  const canvasRef = useRef(null);
  const debugMode = configService.get('debugMode');

  // Use specialized hooks for better performance
  const attitude = useSignalKPath('navigation.attitude');
  const heading = useSignalKPath('navigation.headingTrue');

  // Get attitude data for display
  const attitudeData = useMemo(() => {
    const hasData = attitude !== null || heading !== null;

    if (!hasData && !debugMode) {
      return { hasData: false };
    }

    const attitudeValue = attitude || { roll: 0, pitch: 0, yaw: 0 };
    const headingValue = heading || 0;
    
    return {
      hasData: true,
      roll: attitudeValue.roll !== undefined ? toDegrees(attitudeValue.roll) || 0 : 0,
      pitch: attitudeValue.pitch !== undefined ? toDegrees(attitudeValue.pitch) || 0 : 0,
      yaw: attitudeValue.yaw !== undefined ? toDegrees(attitudeValue.yaw) || 0 : 0,
      heading: headingValue !== null ? toDegrees(headingValue) || 0 : 0
    };
  }, [attitude, heading, debugMode]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2, cy = h / 2;
    // Scale factor against reference design size
    const REF_SIZE = 230;
    const s = Math.min(w, h) / REF_SIZE;
    const sw = (v) => v * s; // scale width/length
    const slw = (v) => Math.max(1, v * s); // scaled line width with minimum 1px

    function drawInstrument(roll, pitch, yaw) {
      drawAttitudeInstrument(ctx, {
        w,
        h,
        roll,
        pitch,
        yaw,
        nightMode,
        showBezel: true,
        colors: {
            oBlue,
            oRed,
            oYellow,
            oGreen,
            oNight,
            rightPaneBg: colors.rightPaneBg
        }
      });
    }

    drawInstrument(attitudeData.roll, attitudeData.pitch, attitudeData.yaw);
  }, [attitudeData, nightMode]);

  return (
    <BaseWidget
      title="Attitude & Heading"
      icon={faCompass}
      hasData={attitudeData.hasData}
      noDataMessage="No attitude data available"
    >
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 text-sm">
        <FontAwesomeIcon icon={faCompass} className={`${nightMode ? 'text-oNight' : 'text-oYellow'} text-xs`} />
        <span className={`${nightMode ? 'text-oNight' : 'text-white'} font-bold`}>{Math.round(attitudeData.heading)}°</span>
      </div>
      
      {/* Attitude Instrument */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={240}
            height={240}
            className={` ${nightMode ? 'brightness-75 contrast-125' : ''}`}
          />
          
          {/* Center crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-7 h-0.5 ${nightMode ? 'bg-oNight' : 'bg-oYellow'} absolute`}></div>
            <div className={`w-0.5 h-7 ${nightMode ? 'bg-oNight' : 'bg-oYellow'} absolute`}></div>
          </div>
        </div>
      </div>
      
      {/* Bottom data display */}
      <div className="grid grid-cols-3 gap-4 mt-4 text-center text-sm">
        <div>
          <div className="flex items-center justify-center space-x-1 mb-1">
            <FontAwesomeIcon icon={faPlane} className={`${nightMode ? 'text-oNight' : 'text-oRed'} text-xs transform rotate-90`} />
            <span className={`${nightMode ? 'text-oNight/60' : 'text-gray-400'} uppercase text-[10px]`}>Roll</span>
          </div>
          <div className={`${nightMode ? 'text-oNight' : 'text-white'} font-bold`}>{Math.round(attitudeData.roll)}°</div>
        </div>
        
        <div>
          <div className="flex items-center justify-center space-x-1 mb-1">
            <FontAwesomeIcon icon={faPlane} className={`${nightMode ? 'text-oNight' : 'text-oBlue'} text-xs`} />
            <span className={`${nightMode ? 'text-oNight/60' : 'text-gray-400'} uppercase text-[10px]`}>Pitch</span>
          </div>
          <div className={`${nightMode ? 'text-oNight' : 'text-white'} font-bold`}>{Math.round(attitudeData.pitch)}°</div>
        </div>
        
        <div>
          <div className="flex items-center justify-center space-x-1 mb-1">
            <FontAwesomeIcon icon={faCompass} className={`${nightMode ? 'text-oNight' : 'text-oYellow'} text-xs`} />
            <span className={`${nightMode ? 'text-oNight/60' : 'text-gray-400'} uppercase text-[10px]`}>HDG</span>
          </div>
          <div className={`${nightMode ? 'text-oNight' : 'text-white'} font-bold`}>{Math.round(attitudeData.heading)}°</div>
        </div>
      </div>
    </BaseWidget>
  );
}

