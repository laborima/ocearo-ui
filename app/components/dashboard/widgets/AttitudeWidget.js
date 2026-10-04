'use client';
import React, { useRef, useEffect, useMemo } from 'react';
import { useSignalKPath } from '../../hooks/useSignalK';
import BaseWidget from './BaseWidget';
import { useTranslation } from 'react-i18next';
import { toDegrees } from '../../context/OcearoContext';
import useTheme from '../../theme/useTheme';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass, faPlane } from '@fortawesome/free-solid-svg-icons';
import { drawAttitudeInstrument } from '../../../lib/AttitudeDrawing';

export default function AttitudeWidget() {
  const { t } = useTranslation();
  const tokens = useTheme();
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

    function drawInstrument(roll, pitch, yaw) {
      drawAttitudeInstrument(ctx, {
        w,
        h,
        roll,
        pitch,
        yaw,
        tokens,
        showBezel: true,
      });
    }

    drawInstrument(attitudeData.roll, attitudeData.pitch, attitudeData.yaw);
  }, [attitudeData, tokens]);

  return (
    <BaseWidget
      title={t('widgets.attitudeInertial')}
      icon={faCompass}
      hasData={attitudeData.hasData}
      noDataMessage={t('widgets.signalLossIMU')}
    >
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        <FontAwesomeIcon icon={faCompass} className={`text-oYellow text-xs opacity-50`} />
        <span className={`text-hud-main text-caption font-semibold uppercase tracking-widest gliding-value`}>{Math.round(attitudeData.heading)}°</span>
      </div>
      
      {/* Attitude Instrument */}
      <div className="flex-1 flex items-center justify-center min-h-0 scale-95 group transition-transform duration-700">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={220}
            height={220}
            className={` transition-all duration-700 group-hover:scale-105`}
          />
          
          {/* Center crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-8 h-px bg-oYellow/40`}></div>
            <div className={`w-px h-8 bg-oYellow/40`}></div>
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
              <FontAwesomeIcon icon={item.icon} className={`${item.color} text-xs`} style={{ transform: `rotate(${item.rotate}deg)` }} />
              <span className={`text-hud-muted uppercase text-caption font-semibold tracking-widest`}>{item.label}</span>
            </div>
            <div className={`text-hud-main font-semibold text-value gliding-value tracking-tight`}>{Math.round(item.value)}°</div>
          </div>
        ))}
      </div>
    </BaseWidget>
  );
}

