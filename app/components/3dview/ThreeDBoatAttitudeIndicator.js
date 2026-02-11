import React, { useState, useRef, useEffect, useMemo } from 'react';
import { toDegrees, oBlue, useOcearoContext, oRed, oYellow, oNight, oGray, oGray2 } from '../context/OcearoContext';
import { useSignalKPath } from '../hooks/useSignalK';
import { drawAttitudeInstrument } from '../../lib/AttitudeDrawing';
import { useTranslation } from 'react-i18next';

export default function ThreeDBoatAttitudeIndicator() {
  const { t } = useTranslation();
  const { nightMode } = useOcearoContext();
  const canvasRef = useRef(null);
  const [displayMode, setDisplayMode] = useState('canvas'); // 'canvas' or 'text'
  
  // Use specialized hook for attitude updates
  const attitude = useSignalKPath('navigation.attitude');

  // Memoize values to avoid unnecessary calculations
  const attitudeValues = useMemo(() => {
    return {
      roll: toDegrees(attitude?.roll) || 0,
      pitch: toDegrees(attitude?.pitch) || 0,
      yaw: toDegrees(attitude?.yaw) || 0
    };
  }, [attitude]);

  const CANVAS_WIDTH = 80;
  const CANVAS_HEIGHT = 80;

  useEffect(() => {
    if (displayMode !== 'canvas' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = CANVAS_WIDTH;
    const h = CANVAS_HEIGHT;
    const cx = w / 2;
    const cy = h / 2;
    const outerBezelRadius = Math.min(cx, cy) - 2;
    const bezelLineWidth = 2;
    const headingMarkRadius = outerBezelRadius - bezelLineWidth - 1;
    const radius = headingMarkRadius - 3;

    const { roll, pitch, yaw } = attitudeValues;

    drawAttitudeInstrument(ctx, {
        w: CANVAS_WIDTH,
        h: CANVAS_HEIGHT,
        roll,
        pitch,
        yaw,
        nightMode,
        compact: true,
        colors: {
            sky: 'transparent',
            sea: oGray2,
            horizon: oBlue,
            boat: oBlue,
            pitchMarks: oGray,
            oBlue,
            oRed,
            oYellow,
            oNight
        }
    });
  }, [attitudeValues, displayMode, nightMode]);

  const handleToggleClick = () => {
    setDisplayMode(prevMode => (prevMode === 'canvas' ? 'text' : 'canvas'));
  };

  return (
    <div
        className="mt-6 cursor-pointer select-none group"
        style={{
            width: `${CANVAS_WIDTH}px`,
            minHeight: `${CANVAS_HEIGHT}px`,
            boxSizing: 'content-box'
        }}
        onClick={handleToggleClick}
        title={t('indicators.clickToToggle')}
    >
      {displayMode === 'canvas' ? (
        <div className="relative p-1 rounded-xl transition-all duration-300">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className={`w-full h-full ${nightMode ? 'brightness-75 contrast-125' : 'drop-shadow-lg'}`}
          />
        </div>
      ) : (
        <div className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-end space-y-2 ${nightMode ? 'text-oNight' : 'text-hud-main'}`}>
          <div className="flex flex-col items-end">
            <span className={`text-xs font-black uppercase tracking-widest leading-none mb-1 ${nightMode ? 'text-oNight/40' : 'text-hud-dim'}`}>{t('indicators.roll')}</span>
            <span className={`text-xs font-mono font-bold ${nightMode ? 'text-oNight' : 'text-oRed'}`}>
              {attitudeValues.roll.toFixed(1)}°
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-xs font-black uppercase tracking-widest leading-none mb-1 ${nightMode ? 'text-oNight/40' : 'text-hud-dim'}`}>{t('indicators.pitch')}</span>
            <span className={`text-xs font-mono font-bold ${nightMode ? 'text-oNight' : 'text-oBlue'}`}>
              {attitudeValues.pitch.toFixed(1)}°
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-xs font-black uppercase tracking-widest leading-none mb-1 ${nightMode ? 'text-oNight/40' : 'text-hud-dim'}`}>{t('indicators.yaw')}</span>
            <span className={`text-xs font-mono font-bold ${nightMode ? 'text-oNight' : 'text-oYellow'}`}>
              {attitudeValues.yaw.toFixed(1)}°
            </span>
          </div>
        </div>
      )}
    </div>
  );
}