import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useOcearoContext } from '../context/OcearoContext';

const CSS_COLORS = {
  oRed: 'var(--color-oRed)',
  oYellow: 'var(--color-oYellow)',
  oGreen: 'var(--color-oGreen)',
  oGray: 'var(--color-oGray)',
};

/**
 * Circular gauge component for displaying numeric values with visual arc
 */
export const CircularGauge = ({ 
  label, 
  value, 
  unit, 
  min = 0, 
  max = 100, 
  icon, 
  warningThreshold, 
  criticalThreshold,
  size = 120,
  showValue = true
}) => {
  const displayValue = (value === null || value === undefined || isNaN(value)) ? 'N/A' : value;
  const hasValue = displayValue !== 'N/A';

  const percentage = hasValue ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;

  const getColor = () => {
    if (!hasValue) return CSS_COLORS.oGray;
    if (criticalThreshold !== undefined && value >= criticalThreshold) return CSS_COLORS.oRed;
    if (warningThreshold !== undefined && value >= warningThreshold) return CSS_COLORS.oYellow;
    return CSS_COLORS.oGreen;
  };

  const color = getColor();

  return (
    <div className="tesla-card p-2 tesla-hover flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg style={{ width: size, height: size }} className="transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="var(--hud-border)"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${hasValue ? 2 * Math.PI * 40 * (1 - percentage / 100) : 2 * Math.PI * 40}`}
            className="transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && <FontAwesomeIcon icon={icon} className="text-hud-muted text-sm mb-1" />}
          {showValue && (
            <div className={`text-2xl font-black tracking-tighter gliding-value ${hasValue ? 'text-hud-main' : 'text-hud-muted'} ${percentage >= 90 || (criticalThreshold && value >= criticalThreshold) ? 'animate-soft-pulse' : ''}`}>
              {displayValue}
            </div>
          )}
          {showValue && hasValue && unit && (
            <div className="text-xs font-black text-hud-secondary uppercase tracking-widest">{unit}</div>
          )}
        </div>
      </div>

      <div className="text-hud-muted text-xs font-black mt-1 text-center uppercase tracking-widest">{label}</div>
    </div>
  );
};

/**
 * Horizontal bar gauge component
 */
export const BarGauge = ({ 
  label, 
  value, 
  unit, 
  min = 0, 
  max = 100, 
  icon,
  warningThreshold,
  criticalThreshold,
  showMinMax = false
}) => {
  const displayValue = (value === null || value === undefined || isNaN(value)) ? 'N/A' : `${value}${unit ? ` ${unit}` : ''}`;
  const hasValue = displayValue !== 'N/A';
  
  const percentage = hasValue ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;
  
  const getColor = () => {
    if (!hasValue) return 'bg-hud-elevated';
    if (criticalThreshold !== undefined && value >= criticalThreshold) return 'bg-oRed';
    if (warningThreshold !== undefined && value >= warningThreshold) return 'bg-oYellow';
    return 'bg-oGreen';
  };
  
  return (
    <div className="tesla-card p-3 tesla-hover">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center text-hud-muted text-xs font-black uppercase tracking-widest">
          {icon && <FontAwesomeIcon icon={icon} className="mr-2 fa-fw opacity-50" />}
          {label}
        </div>
        <div className={`font-black text-lg gliding-value ${hasValue ? 'text-hud-main' : 'text-hud-dim'} ${percentage >= 90 || (criticalThreshold && value >= criticalThreshold) ? 'animate-soft-pulse' : ''}`}>
          {displayValue}
        </div>
      </div>
      
      <div className="relative w-full bg-hud-elevated rounded-full h-1.5 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {showMinMax && (
        <div className="flex justify-between text-xs font-black text-hud-dim mt-2 uppercase tracking-tighter">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Compact data field with icon and color status
 */
export const CompactDataField = ({ 
  label, 
  value, 
  unit, 
  icon, 
  warningThreshold,
  criticalThreshold,
  reversed = false
}) => {
  const displayValue = (value === null || value === undefined || isNaN(value)) ? 'N/A' : value;
  const hasValue = displayValue !== 'N/A';
  
  const getColor = () => {
    if (!hasValue) return 'text-hud-dim';
    if (reversed) {
      if (criticalThreshold !== undefined && value <= criticalThreshold) return 'text-oRed';
      if (warningThreshold !== undefined && value <= warningThreshold) return 'text-oYellow';
    } else {
      if (criticalThreshold !== undefined && value >= criticalThreshold) return 'text-oRed';
      if (warningThreshold !== undefined && value >= warningThreshold) return 'text-oYellow';
    }
    return 'text-oGreen';
  };
  
  return (
    <div className="tesla-card p-3 tesla-hover flex items-center justify-between">
      <div className="flex items-center text-hud-muted text-xs font-black uppercase tracking-widest">
        {icon && <FontAwesomeIcon icon={icon} className="mr-2 fa-fw opacity-50" />}
        {label}
      </div>
      <div className={`font-black text-lg gliding-value ${getColor()} ${(criticalThreshold && (reversed ? value <= criticalThreshold : value >= criticalThreshold)) ? 'animate-soft-pulse' : ''}`}>
        {displayValue !== 'N/A' ? `${displayValue}${unit ? ` ${unit}` : ''}` : 'N/A'}
      </div>
    </div>
  );
};

/**
 * Simple sparkline chart component
 */
export const MiniSparkline = ({ 
  data = [], 
  width = 100, 
  height = 30, 
  color = CSS_COLORS.oGreen,
  showDots = false
}) => {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-hud-elevated rounded-xl" 
        style={{ width, height }}
      >
        <span className="text-xs text-hud-dim">No data</span>
      </div>
    );
  }
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });
  
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots && points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r="2"
          fill={color}
        />
      ))}
    </svg>
  );
};

/**
 * Large display gauge for primary metrics (RPM, Speed, etc.)
 */
export const PrimaryGauge = ({ 
  label, 
  value, 
  unit, 
  icon, 
  max = 100,
  warningThreshold,
  criticalThreshold
}) => {
  const displayValue = (value === null || value === undefined || isNaN(value)) ? 'N/A' : Math.round(value);
  const hasValue = displayValue !== 'N/A';
  
  const getColor = () => {
    if (!hasValue) return 'text-hud-muted';
    if (criticalThreshold !== undefined && value >= criticalThreshold) return 'text-oRed';
    if (warningThreshold !== undefined && value >= warningThreshold) return 'text-oYellow';
    return 'text-oGreen';
  };
  
  const percentage = hasValue ? Math.min(100, (value / max) * 100) : 0;
  
  return (
    <div className="tesla-card p-4 text-center tesla-hover">
      {icon && (
        <FontAwesomeIcon icon={icon} className="text-lg text-hud-muted mb-2 opacity-50" />
      )}
      <div className={`text-4xl font-black mb-1 tracking-tighter gliding-value ${getColor()} ${percentage >= 90 || (criticalThreshold && value >= criticalThreshold) ? 'animate-soft-pulse' : ''}`}>
        {displayValue}
      </div>
      {hasValue && unit && (
        <div className="text-hud-secondary text-xs font-black uppercase tracking-widest mb-2">{unit}</div>
      )}
      <div className="text-hud-muted text-xs font-black uppercase tracking-widest mb-3">{label}</div>
      
      <div className="w-full bg-hud-elevated rounded-full h-1 overflow-hidden shadow-inner">
        <div 
          className={`h-full rounded-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${
            hasValue ? 
              (criticalThreshold && value >= criticalThreshold ? 'bg-oRed' :
               warningThreshold && value >= warningThreshold ? 'bg-oYellow' : 
               'bg-oGreen') 
            : 'bg-hud-elevated'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
