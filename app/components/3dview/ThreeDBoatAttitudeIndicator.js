import React, { useState, useRef, useEffect, useMemo } from 'react';
import { toDegrees, oBlue, oGray, oGray2, useOcearoContext, oRed, oYellow, oNight } from '../context/OcearoContext';
import { useSignalKPath } from '../hooks/useSignalK';
import { drawAttitudeInstrument } from '../../lib/AttitudeDrawing';

export default function ThreeDBoatAttitudeIndicator() {
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
            oGray,
            oGray2,
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
        className="mt-4 cursor-pointer"
        style={{
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            boxSizing: 'content-box'
        }}
        onClick={handleToggleClick}
        title="Click to toggle view"
    >
      {displayMode === 'canvas' ? (
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={nightMode ? 'brightness-75 contrast-125' : ''}
        />
      ) : (
        <div className={`text-[10px] font-black uppercase flex flex-col items-end w-full tracking-tighter ${nightMode ? 'text-oNight' : 'text-white'}`}>
          <div className="text-right">Roll: <span className={`${nightMode ? 'text-oNight' : 'text-oRed'} font-mono`}>{attitudeValues.roll.toFixed(1)}°</span></div>
          <div className="text-right">Pitch: <span className={`${nightMode ? 'text-oNight' : 'text-oBlue'} font-mono`}>{attitudeValues.pitch.toFixed(1)}°</span></div>
          <div className="text-right">Yaw: <span className={`${nightMode ? 'text-oNight' : 'text-oYellow'} font-mono`}>{attitudeValues.yaw.toFixed(1)}°</span></div>
        </div>
      )}
    </div>
  );
}