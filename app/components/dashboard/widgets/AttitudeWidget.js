'use client';
import React, { useRef, useEffect, useMemo } from 'react';
import { useSignalKPath } from '../../hooks/useSignalK';
import BaseWidget from './BaseWidget';
import { useTranslation } from 'react-i18next';
import { toDegrees, oBlue, oRed, oYellow, oGreen, oNight, oGray, oGray2, useOcearoContext } from '../../context/OcearoContext';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass, faPlane } from '@fortawesome/free-solid-svg-icons';
import { drawAttitudeInstrument } from '../../../lib/AttitudeDrawing';

const getThemeColors = () => {
  if (typeof document !== 'undefined') {
    const style = getComputedStyle(document.documentElement);
    return {
      leftPaneBg: style.getPropertyValue('--color-leftPaneBg').trim() || '#0e0e0e',
      rightPaneBg: style.getPropertyValue('--color-rightPaneBg').trim() || '#1e1e1e',
    };
  }
  return { leftPaneBg: '#0e0e0e', rightPaneBg: '#1e1e1e' };
};

export default function AttitudeWidget() {
  const { t } = useTranslation();
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

    const themeColors = getThemeColors();

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
            rightPaneBg: themeColors.rightPaneBg
        }
      });
    }

    drawInstrument(attitudeData.roll, attitudeData.pitch, attitudeData.yaw);
  }, [attitudeData, nightMode]);

  return (
    <BaseWidget
      title={t('widgets.attitudeInertial')}
      icon={faCompass}
      hasData={attitudeData.hasData}
      noDataMessage={t('widgets.signalLossIMU')}
    >
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        <FontAwesomeIcon icon={faCompass} className={`${nightMode ? 'text-oNight' : 'text-oYellow'} text-xs opacity-50`} />
        <span className={`${nightMode ? 'text-oNight' : 'text-hud-main'} text-xs font-black uppercase tracking-widest gliding-value`}>{Math.round(attitudeData.heading)}°</span>
      </div>
      
      {/* Attitude Instrument */}
      <div className="flex-1 flex items-center justify-center min-h-0 scale-95 group transition-transform duration-700">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={220}
            height={220}
            className={`${nightMode ? 'brightness-75 contrast-125' : ''} transition-all duration-700 group-hover:scale-105`}
          />
          
          {/* Center crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-8 h-px ${nightMode ? 'bg-oNight' : 'bg-oYellow/40'}`}></div>
            <div className={`w-px h-8 ${nightMode ? 'bg-oNight' : 'bg-oYellow/40'}`}></div>
          </div>
        </div>
      </div>
      
      {/* Bottom data display */}
      <div className="grid grid-cols-3 gap-4 mt-4 text-center">
        {[
          { label: 'ROLL', value: attitudeData.roll, color: 'text-oRed', icon: faPlane, rotate: 90 },
          { label: 'PITCH', value: attitudeData.pitch, color: 'text-oBlue', icon: faPlane, rotate: 0 },
          { label: 'HDG', value: attitudeData.heading, color: 'text-oYellow', icon: faCompass, rotate: 0 }
        ].map((item, idx) => (
          <div key={idx} className="tesla-card p-2 tesla-hover bg-hud-bg border border-hud">
            <div className="flex items-center justify-center space-x-2 mb-1 opacity-60">
              <FontAwesomeIcon icon={item.icon} className={`${nightMode ? 'text-oNight' : item.color} text-xs ${item.rotate ? `transform rotate-${item.rotate}` : ''}`} />
              <span className={`${nightMode ? 'text-oNight/60' : 'text-hud-muted'} uppercase text-xs font-black tracking-widest`}>{item.label}</span>
            </div>
            <div className={`${nightMode ? 'text-oNight' : 'text-hud-main'} font-black text-lg gliding-value tracking-tighter`}>{Math.round(item.value)}°</div>
          </div>
        ))}
      </div>
    </BaseWidget>
  );
}

