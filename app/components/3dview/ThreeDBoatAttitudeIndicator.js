import React, { useState, useRef, useEffect } from 'react';
import { useOcearoContext, toDegrees, oBlue, oRightPaneBg, oGray, oGray2 } from '../context/OcearoContext';

export default function ThreeDBoatAttitudeIndicator() {
  const canvasRef = useRef(null);
  const {nightMode,  getSignalKValue } = useOcearoContext();

  const [displayMode, setDisplayMode] = useState('canvas'); // 'canvas' or 'text'
  const [rollValue, setRollValue] = useState(0);
  const [pitchValue, setPitchValue] = useState(0);
  const [yawValue, setYawValue] = useState(0);

  const CANVAS_WIDTH = 80;
  const CANVAS_HEIGHT = 80;

  useEffect(() => {
    if (displayMode !== 'canvas') {
        // Optional: Could potentially stop canvas-specific logic here if needed
    }

    const canvas = canvasRef.current;
    let ctx = null;
    if (canvas && displayMode === 'canvas') {
        ctx = canvas.getContext('2d');
        if (!ctx) return;
    }

    const w = CANVAS_WIDTH;
    const h = CANVAS_HEIGHT;
    const cx = w / 2;
    const cy = h / 2;
    const outerBezelRadius = Math.min(cx, cy) - 2;
    const bezelLineWidth = 2;
    const headingMarkRadius = outerBezelRadius - bezelLineWidth - 1;
    const radius = headingMarkRadius - 3;
    const rollMarkRadius = radius + 1;

    function drawInstrument(roll, pitch, yaw) {
        if (!ctx) return;

        ctx.clearRect(0, 0, w, h);
        ctx.lineWidth = 1;

        // Bezel
        ctx.strokeStyle = oGray2 ; 
        ctx.lineWidth = bezelLineWidth;
        ctx.beginPath();
        ctx.arc(cx, cy, outerBezelRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Heading Indicator
        ctx.save();
        ctx.translate(cx, cy);
        ctx.strokeStyle =  '#FFFFFF'; 
        ctx.lineWidth = 1;
        for (let deg = 0; deg < 360; deg += 15) {
            const angleRad = deg * Math.PI / 180;
            const isMajor = deg % 90 === 0;
            const tickLength = isMajor ? 5 : 2;
            const rInner = headingMarkRadius;
            const rOuter = rInner - tickLength;
            const x1 = rInner * Math.cos(angleRad);
            const y1 = rInner * Math.sin(angleRad);
            const x2 = rOuter * Math.cos(angleRad);
            const y2 = rOuter * Math.sin(angleRad);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = isMajor ? 1.5 : 0.75;
            ctx.stroke();
        }
        ctx.restore();

        // Roll Scale Markings have been removed

        // Mobile Part
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.translate(cx, cy);
        ctx.rotate(roll * Math.PI / 180);
        const pitchRange = 90;
        const pitchPixelsPerDegree = radius / pitchRange;
        ctx.translate(0, pitch * pitchPixelsPerDegree);
        ctx.fillStyle = oGray2 ; // Ground
        ctx.fillRect(-radius * 1.5, 0, radius * 3, radius * 2);
        ctx.beginPath(); // Horizon
        ctx.moveTo(-radius * 1.5, 0);
        ctx.lineTo(radius * 1.5, 0);
        ctx.strokeStyle = oBlue ; 
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.strokeStyle = oGray ; 
        ctx.lineWidth = 0.75;
        const pitchMarkSpacing = 20;
        const maxPitchMark = 60;
        for (let p = -maxPitchMark; p <= maxPitchMark; p += pitchMarkSpacing) {
            if (p === 0) continue;
            const y = -p * pitchPixelsPerDegree;
            const markLength = 15;
            ctx.beginPath();
            ctx.moveTo(-markLength / 2, y);
            ctx.lineTo(markLength / 2, y);
            ctx.stroke();
        }
        ctx.restore(); // End mobile part

        // Triangle Indicator that rotates with yaw
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(yaw * Math.PI / 180); // Make triangle rotate with yaw - positive rotation
        ctx.lineWidth = 1;
        ctx.beginPath(); // Triangle
        ctx.moveTo(0, -10);
        ctx.lineTo(5, 5);
        ctx.lineTo(-5, 5);
        ctx.closePath();
        ctx.fillStyle = oBlue;
        ctx.fill();
        ctx.strokeStyle = oGray;
        ctx.stroke();
        ctx.restore(); // End triangle indicator
    }

    let animationFrameId;
    function renderLoop() {
      const attitude = getSignalKValue('navigation.attitude') || {};
      const currentRoll = toDegrees(attitude?.roll) || 0;
      const currentPitch = toDegrees(attitude?.pitch) || 0;
      const currentYaw = toDegrees(attitude?.yaw) || 0;

      setRollValue(currentRoll);
      setPitchValue(currentPitch);
      setYawValue(currentYaw);

      if (displayMode === 'canvas') {
        drawInstrument(currentRoll, currentPitch, currentYaw);
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    }

    renderLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [getSignalKValue, displayMode]); // Removed color variables as they don't affect re-rendering

  const handleToggleClick = () => {
    setDisplayMode(prevMode => (prevMode === 'canvas' ? 'text' : 'canvas'));
  };

  const textColor = nightMode ? 'text-oNight' : 'text-white';

  return (
    <div
        className="mt-4 cursor-pointer" // Added border class
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
        />
      ) : (

        <div
            className={`text-sm font-bold cursor-pointer flex flex-col items-end w-full ${textColor}`}
        >
          <div className="text-right">Roll: {rollValue.toFixed(1)}°</div>
          <div className="text-right">Pitch: {pitchValue.toFixed(1)}°</div>
          <div className="text-right">Yaw: {yawValue.toFixed(1)}°</div>
        </div>
      )}
    </div>
  );
}