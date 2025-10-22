'use client';
import React, { useState, useEffect } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import configService from '../../settings/ConfigService';

const computeIsRising = (currentTime, timeLow, timeHigh) => {
  if (!timeLow || !timeHigh) return false;
  
  const current = currentTime.split(':').map(Number);
  const low = timeLow.split(':').map(Number);
  const high = timeHigh.split(':').map(Number);
  
  const currentMinutes = current[0] * 60 + current[1];
  const lowMinutes = low[0] * 60 + low[1];
  const highMinutes = high[0] * 60 + high[1];
  
  if (highMinutes > lowMinutes) {
    return currentMinutes >= lowMinutes && currentMinutes <= highMinutes;
  } else {
    return currentMinutes >= lowMinutes || currentMinutes <= highMinutes;
  }
};

export default function TideWidget() {
  const { getSignalKValue } = useOcearoContext();
  const debugMode = configService.get('debugMode');
  const [tideData, setTideData] = useState({
    hasData: false,
    level: 0,
    high: 0,
    low: 0,
    timeLow: '--:--',
    timeHigh: '--:--',
    coefficient: 0,
    isRising: false
  });

  useEffect(() => {
    const currentTime = new Date().toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });

    const newTideData = {
      level: getSignalKValue('environment.tide.heightNow'),
      high: getSignalKValue('environment.tide.heightHigh'),
      low: getSignalKValue('environment.tide.heightLow'),
      timeLow: getSignalKValue('environment.tide.timeLow'),
      timeHigh: getSignalKValue('environment.tide.timeHigh'),
      coefficient: getSignalKValue('environment.tide.coeffNow')
    };

    const isDataComplete = Object.values(newTideData).every(value => 
      value !== null && value !== undefined
    );

    if (isDataComplete) {
      setTideData({
        hasData: true,
        ...newTideData,
        isRising: computeIsRising(currentTime, newTideData.timeLow, newTideData.timeHigh)
      });
    } else if (!debugMode) {
      setTideData({
        hasData: false,
        level: 0,
        high: 0,
        low: 0,
        timeLow: '--:--',
        timeHigh: '--:--',
        coefficient: 0,
        isRising: false
      });
    }
  }, [getSignalKValue, debugMode]);

  const {
    hasData,
    level,
    high,
    low,
    timeLow,
    timeHigh,
    coefficient,
    isRising
  } = tideData;

  // Animated phase for subtle flowing motion of the curve (startup only)
  const [animPhase, setAnimPhase] = useState(0);
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    let raf = 0;
    let start = 0;
    const durationMs = 1500; // animate ~1.5s at startup
    const dir = isRising ? 1 : -1;
    const initialPhase = 0;
    setAnimPhase(initialPhase);
    setAnimDone(false);

    const phaseFinal = isRising ? 0 : Math.PI; // centered resting phase based on trend

    const tick = (t) => {
      if (start === 0) start = t;
      const elapsed = t - start;
      const progress = Math.min(1, elapsed / durationMs);
      // ease out
      const eased = 1 - Math.pow(1 - progress, 2);
      const sweep = (Math.PI / 2) * dir; // quarter-turn sweep
      setAnimPhase(initialPhase + sweep * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        // snap to final resting phase
        setAnimPhase(phaseFinal);
        setAnimDone(true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isRising]);

  // Calculate the rotation angle for the tide indicator (0-360 degrees)
  const getRotationAngle = () => {
    if (!high || !low || !level) return 0;
    
    // Calculate percentage between low and high tide
    const range = high - low;
    const position = level - low;
    const percentage = (position / range) * 100;
    
    // Convert to degrees (180 degrees represents the range from low to high)
    return percentage * 1.8;
  };

  if (!hasData && !debugMode) {
    return (
      <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
        <div className="flex items-center space-x-2 mb-4">
          <svg className="w-6 h-6 text-oBlue" viewBox="0 0 24 24" fill="none">
            <path d="M3 11h18M3 6h18M3 16h18M3 21h18" 
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-white font-medium text-lg">Tide Information</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 mb-2">N/A</div>
            <div className="text-sm text-gray-500">No tide data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <svg className="w-6 h-6 text-oBlue" viewBox="0 0 24 24" fill="none">
          <path d="M3 11h18M3 6h18M3 16h18M3 21h18" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span className="text-white font-medium text-lg">Tide Information</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Current tide level */}
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-oBlue">
            {(level || 2.1).toFixed(1)}m
          </div>
          <div className="text-gray-400 text-base">
            {isRising ? '↗ Rising' : '↘ Falling'}
          </div>
        </div>

        {/* Visual tide chart - SVG curve */}
        <div className="flex-1 relative mb-4 min-h-0">
          {(() => {
            const width = 320; // logical width of the SVG viewBox
            const height = 128; // logical height of the SVG viewBox
            const cycles = 2; // fewer waves across the width for a calmer look
            const safeHigh = (high || 4.2);
            const safeLow = (low || 0.8);
            const safeLevel = (level || (safeLow + safeHigh) / 2);
            const range = Math.max(0.001, safeHigh - safeLow);
            const ratio = Math.max(0, Math.min(1, (safeLevel - safeLow) / range));
            // Map level ratio (0 low -> 1 high) to a vertical baseline within the box
            // Lower Y is higher visually, so invert ratio.
            const midY = height * (0.15 + 0.7 * (1 - ratio));
            const amplitude = height * 0.24; // slightly reduced amplitude for smoothness
            const phase = animDone ? (isRising ? 0 : Math.PI) : animPhase; // animate then rest centered
            const verticalShift = height * 0.08; // push the whole curve slightly downward
            const points = [];
            const samples = 32; // fewer samples; we'll smooth with Bezier
            for (let i = 0; i <= samples; i++) {
              const x = (i / samples) * width;
              const y = midY - amplitude * Math.sin((x / width) * cycles * 2 * Math.PI + phase) + verticalShift;
              points.push({ x, y });
            }

            // Helpers for Bezier smoothing (Catmull-Rom approximation)
            const line = (point) => `${point.x},${point.y}`;
            const controlPoint = (current, previous, next, reverse) => {
              const p = previous || current;
              const n = next || current;
              const smoothing = 0.18; // smaller is tighter, larger is smoother
              const dx = n.x - p.x;
              const dy = n.y - p.y;
              const angle = Math.atan2(dy, dx) + (reverse ? Math.PI : 0);
              const length = Math.hypot(dx, dy) * smoothing;
              const x = current.x + Math.cos(angle) * length;
              const y = current.y + Math.sin(angle) * length;
              return { x, y };
            };
            const bezierCommand = (point, i, pointsArr) => {
              const cps = controlPoint(pointsArr[i - 1], pointsArr[i - 2], point);
              const cpe = controlPoint(point, pointsArr[i - 1], pointsArr[i + 1], true);
              return `C ${line(cps)} ${line(cpe)} ${line(point)}`;
            };
            const strokePath = points.reduce((acc, p, i, a) => {
              return i === 0 ? `M ${line(p)}` : `${acc} ${bezierCommand(p, i, a)}`;
            }, '');

            // Build the fill path (close to bottom)
            const fillPath = `${strokePath} L ${width},${height} L 0,${height} Z`;

            // Peak/trough markers positions: every half-cycle
            const markers = [];
            for (let c = 0; c <= cycles; c++) {
              const x = (c / cycles) * width;
              const y = midY - amplitude * Math.sin((x / width) * cycles * 2 * Math.PI + phase) + verticalShift;
              markers.push({ x, y });
            }

            return (
              <svg className="w-full h-24 rounded-lg text-oBlue" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="tideFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.95" />
                  </linearGradient>
                  <linearGradient id="tideStroke" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
                  </linearGradient>
                </defs>

                {/* Filled area under the tide curve */}
                <path d={fillPath} fill="url(#tideFill)" />

                {/* Curve stroke */}
                <path d={strokePath} fill="none" stroke="url(#tideStroke)" strokeWidth="2.5" />

                {/* Peak/trough markers */}
                {markers.map((m, idx) => (
                  <g key={idx}>
                    <circle cx={m.x} cy={m.y} r="3.5" className="fill-white" />
                    <circle cx={m.x} cy={m.y} r="2.2" className="fill-current text-oGray2" fill="currentColor" />
                  </g>
                ))}

            
                {/* Time labels */}
                <text x="8" y={height - 20} className="fill-current text-black" fill="currentColor" fontSize="10">{timeLow || '--:--'}</text>
                <text x={width / 2 - 14} y={height - 20} className="fill-current text-black" fill="currentColor" fontSize="10">{timeHigh || '--:--'}</text>
                <text x={width - 42} y={height - 20} className="fill-current text-black" fill="currentColor" fontSize="10">{timeLow || '--:--'}</text>
              </svg>
            );
          })()}
        </div>

        {/* Tide times */}
        <div className="grid grid-cols-2 gap-4 text-base">
          <div className="text-center">
            <div className="text-gray-400">Next High</div>
            <div className="text-white font-medium text-lg">{timeHigh || '14:25'}</div>
            <div className="text-oBlue text-sm">{(high || 4.2).toFixed(1)}m</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Next Low</div>
            <div className="text-white font-medium text-lg">{timeLow || '20:15'}</div>
            <div className="text-orange-400 text-sm">{(low || 0.8).toFixed(1)}m</div>
          </div>
        </div>

        {/* Coefficient */}
        {coefficient && (
          <div className="text-center mt-2 text-xs">
            <span className="text-gray-400">Coefficient: </span>
            <span className="text-white">{coefficient}</span>
          </div>
        )}
      </div>
    </div>
  );
}
