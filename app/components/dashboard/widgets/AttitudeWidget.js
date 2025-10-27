import React, { useRef, useEffect, useMemo } from 'react';
import { useOcearoContext, toDegrees, oBlue, oRed, oYellow, oGreen, oNight } from '../../context/OcearoContext';
import configService from '../../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass, faPlane, faWater } from '@fortawesome/free-solid-svg-icons';

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
  const canvasRef = useRef(null);
  const { getSignalKValue, nightMode } = useOcearoContext();
  const debugMode = configService.get('debugMode');
  const primaryTextClass = nightMode ? 'text-oNight' : 'text-white';
  const secondaryTextClass = nightMode ? 'text-oNight' : 'text-gray-400';
  const mutedTextClass = nightMode ? 'text-oNight' : 'text-gray-500';
  const accentIconClass = nightMode ? 'text-oNight' : 'text-oBlue';

  // Get attitude data for display
  const attitudeData = useMemo(() => {
    const attitude = getSignalKValue('navigation.attitude');
    const heading = getSignalKValue('navigation.headingTrue');

    const hasData = attitude !== null || heading !== null;

    if (!hasData && !debugMode) {
      return { hasData: false };
    }

    const attitudeValue = attitude || (debugMode ? { roll: 0, pitch: 0, yaw: 0 } : { roll: 0, pitch: 0, yaw: 0 });
    const headingValue = heading || (debugMode ? 0 : 0);
    
    return {
      hasData: true,
      roll: attitudeValue.roll !== undefined ? toDegrees(attitudeValue.roll) || 0 : 0,
      pitch: attitudeValue.pitch !== undefined ? toDegrees(attitudeValue.pitch) || 0 : 0,
      yaw: attitudeValue.yaw !== undefined ? toDegrees(attitudeValue.yaw) || 0 : 0,
      heading: headingValue !== null ? toDegrees(headingValue) || 0 : 0
    };
  }, [getSignalKValue, debugMode]);

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
      ctx.clearRect(0, 0, w, h);

      // Mobile part (sky/sea, horizon, pitch scale)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(roll * Math.PI / 180);
      ctx.translate(0, (pitch / 90) * cy);

      // Sky - enhanced gradient
      const skyGradient = ctx.createLinearGradient(0, -h, 0, 0);
      skyGradient.addColorStop(0, '#87CEEB');
      skyGradient.addColorStop(1, colors.oBlue);
      ctx.beginPath(); 
      ctx.rect(-w, -h * 2, w * 2, h);
      ctx.fillStyle = skyGradient; 
      ctx.fill();

      // Sea - enhanced gradient
      const seaGradient = ctx.createLinearGradient(0, 0, 0, h);
      seaGradient.addColorStop(0,  colors.oBlue);
      seaGradient.addColorStop(1, colors.rightPaneBg);
      ctx.beginPath(); 
      ctx.rect(-w, 0, w * 2, h * 2);
      ctx.fillStyle = seaGradient; 
      ctx.fill();

      // Horizon line - enhanced
      ctx.beginPath(); 
      ctx.moveTo(-w, 0); 
      ctx.lineTo(w, 0);
      ctx.strokeStyle = colors.oYellow; 
      ctx.lineWidth = slw(3); 
      ctx.stroke();

      // Pitch scale ±30°
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; 
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = `bold ${Math.round(12 * s)}px sans-serif`;
      ctx.textAlign = 'center';
      
      for (let p = -30; p <= 30; p += 10) {
        if (p === 0) continue;
        const y = - (p / 90) * cy;
        const lineLength = Math.abs(p) % 20 === 0 ? sw(50) : sw(30);
        
        ctx.beginPath(); 
        ctx.moveTo(-lineLength, y); 
        ctx.lineTo(lineLength, y);
        ctx.lineWidth = Math.abs(p) % 20 === 0 ? slw(3) : slw(2); 
        ctx.stroke();
        
        if (Math.abs(p) % 20 === 0) {
          ctx.fillText(Math.abs(p) + '°', 0, y - sw(8));
        }
      }
      ctx.restore();

      // Outer ring - enhanced
      ctx.beginPath(); 
      ctx.arc(cx, cy, cx - sw(8), 0, Math.PI * 2);
      ctx.strokeStyle = colors.oGray2; 
      ctx.lineWidth = slw(12); 
      ctx.stroke();

      // Inner ring
      ctx.beginPath(); 
      ctx.arc(cx, cy, cx - sw(20), 0, Math.PI * 2);
      ctx.strokeStyle = colors.oGray2; 
      ctx.lineWidth = slw(2); 
      ctx.stroke();

      // Heading graduations with labels
      ctx.fillStyle = 'white';
      ctx.font = `bold ${Math.round(10 * s)}px sans-serif`;
      ctx.textAlign = 'center';
      
      for (let deg = 0; deg < 360; deg += 10) {
        const ang = (deg - yaw - 90) * Math.PI / 180;
        const rOut = cx - sw(20);
        const len = (deg % 30 === 0) ? sw(20) : sw(10);
        const x1 = cx + rOut * Math.cos(ang);
        const y1 = cy + rOut * Math.sin(ang);
        const x2 = cx + (rOut - len) * Math.cos(ang);
        const y2 = cy + (rOut - len) * Math.sin(ang);
        
        ctx.beginPath(); 
        ctx.moveTo(x1, y1); 
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = deg % 30 === 0 ? 'white' : 'rgba(255, 255, 255, 0.6)'; 
        ctx.lineWidth = deg % 30 === 0 ? slw(3) : slw(2);
        ctx.stroke();
        
        // Add compass labels
        if (deg % 90 === 0) {
          const labels = ['N', 'E', 'S', 'W'];
          const labelX = cx + (rOut - sw(35)) * Math.cos(ang);
          const labelY = cy + (rOut - sw(35)) * Math.sin(ang) + sw(4);
          ctx.fillText(labels[deg / 90], labelX, labelY);
        }
      }

      // Fixed boat indicator - enhanced
      ctx.save();
      ctx.translate(cx, cy);
      
      // Boat shape
      ctx.beginPath();
      ctx.moveTo(0, -sw(25));
      ctx.lineTo(sw(12), sw(12));
      ctx.lineTo(0, sw(8));
      ctx.lineTo(-sw(12), sw(12));
      ctx.closePath();
      ctx.fillStyle = colors.oYellow; 
      ctx.fill();
      ctx.strokeStyle = 'white'; 
      ctx.lineWidth = slw(2); 
      ctx.stroke();
      
      // Center dot
      ctx.beginPath();
      ctx.arc(0, 0, sw(3), 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      
      ctx.restore();

      // Roll indicator
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(roll * Math.PI / 180);
      
      // Roll scale
      for (let r = -60; r <= 60; r += 30) {
        if (r === 0) continue;
        const ang = r * Math.PI / 180;
        const rOut = cx - sw(30);
        const x1 = rOut * Math.sin(ang);
        const y1 = -rOut * Math.cos(ang);
        const x2 = (rOut - sw(15)) * Math.sin(ang);
        const y2 = -(rOut - sw(15)) * Math.cos(ang);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = colors.oRed;
        ctx.lineWidth = slw(3);
        ctx.stroke();
      }
      
      ctx.restore();
    }

    // Animation loop
    let animationFrameId;
    
    function render() {
      drawInstrument(attitudeData.roll, attitudeData.pitch, attitudeData.yaw);
      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [attitudeData]);

  if (!attitudeData.hasData) {
    return (
      <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
        <div className="flex items-center space-x-2 mb-4">
          <FontAwesomeIcon icon={faCompass} className={accentIconClass} />
          <span className={`${primaryTextClass} font-medium`}>Attitude & Heading</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 mb-2">N/A</div>
            <div className={`text-sm ${mutedTextClass}`}>No attitude data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faCompass} className={accentIconClass} />
          <span className={`${primaryTextClass} font-medium`}>Attitude & Heading</span>
        </div>
        
        {/* Quick heading display */}
        <div className="flex items-center space-x-2 text-sm">
          <FontAwesomeIcon icon={faCompass} className="text-oYellow text-xs" />
          <span className={`${primaryTextClass} font-bold`}>{Math.round(attitudeData.heading)}°</span>
        </div>
      </div>
      
      {/* Attitude Instrument */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={200}
            height={200}
            className="rounded-full shadow-lg shadow-oBlue/30 bg-oGray2"
          />
          
          {/* Center crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-7 h-0.5 bg-oYellow absolute"></div>
            <div className="w-0.5 h-7 bg-oYellow absolute"></div>
          </div>
        </div>
      </div>
      
      {/* Bottom data display */}
      <div className="grid grid-cols-3 gap-4 mt-4 text-center text-sm">
        <div>
          <div className="flex items-center justify-center space-x-1 mb-1">
            <FontAwesomeIcon icon={faPlane} className="text-oRed text-xs transform rotate-90" />
            <span className={`${secondaryTextClass}`}>Roll</span>
          </div>
          <div className={`${primaryTextClass} font-bold`}>{Math.round(attitudeData.roll)}°</div>
        </div>
        
        <div>
          <div className="flex items-center justify-center space-x-1 mb-1">
            <FontAwesomeIcon icon={faPlane} className={`${accentIconClass} text-xs`} />
            <span className={`${secondaryTextClass}`}>Pitch</span>
          </div>
          <div className={`${primaryTextClass} font-bold`}>{Math.round(attitudeData.pitch)}°</div>
        </div>
        
        <div>
          <div className="flex items-center justify-center space-x-1 mb-1">
            <FontAwesomeIcon icon={faCompass} className="text-oYellow text-xs" />
            <span className={`${secondaryTextClass}`}>Heading</span>
          </div>
          <div className={`${primaryTextClass} font-bold`}>{Math.round(attitudeData.heading)}°</div>
        </div>
      </div>
    </div>
  );
}

