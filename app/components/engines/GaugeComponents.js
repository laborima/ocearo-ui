import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
    if (!hasValue) return '#989898';
    if (criticalThreshold !== undefined && value >= criticalThreshold) return '#cc000c';
    if (warningThreshold !== undefined && value >= warningThreshold) return '#ffbe00';
    return '#0fcd4f';
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center justify-center bg-oGray2 rounded-lg p-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg style={{ width: size, height: size }} className="transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#424242"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${hasValue ? 2 * Math.PI * 40 * (1 - percentage / 100) : 2 * Math.PI * 40}`}
            className="transition-all duration-500"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && <FontAwesomeIcon icon={icon} className="text-oGray text-lg mb-1" />}
          {showValue && (
            <div className={`text-2xl font-bold ${hasValue ? 'text-white' : 'text-oGray'}`}>
              {displayValue}
            </div>
          )}
          {showValue && hasValue && unit && (
            <div className="text-xs text-oGray">{unit}</div>
          )}
        </div>
      </div>

      <div className="text-oGray text-sm mt-2 text-center">{label}</div>
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
    if (!hasValue) return 'bg-oGray2';
    if (criticalThreshold !== undefined && value >= criticalThreshold) return 'bg-oRed';
    if (warningThreshold !== undefined && value >= warningThreshold) return 'bg-oYellow';
    return 'bg-oGreen';
  };
  
  return (
    <div className="bg-oGray2 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center text-oGray text-sm">
          {icon && <FontAwesomeIcon icon={icon} className="mr-2 fa-fw" />}
          {label}
        </div>
        <div className={`font-bold text-lg ${hasValue ? 'text-white' : 'text-oGray'}`}>
          {displayValue}
        </div>
      </div>
      
      <div className="relative w-full bg-oGray rounded-full h-4">
        <div 
          className={`h-4 rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {showMinMax && (
        <div className="flex justify-between text-xs text-oGray mt-1">
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
    if (!hasValue) return 'text-oGray';
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
    <div className="bg-oGray2 rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center text-oGray text-sm">
        {icon && <FontAwesomeIcon icon={icon} className="mr-2 fa-fw" />}
        {label}
      </div>
      <div className={`font-bold text-xl ${getColor()}`}>
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
  color = '#0fcd4f',
  showDots = false
}) => {
  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-oGray rounded" 
        style={{ width, height }}
      >
        <span className="text-xs text-oGray">No data</span>
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
    if (!hasValue) return 'text-oGray';
    if (criticalThreshold !== undefined && value >= criticalThreshold) return 'text-oRed';
    if (warningThreshold !== undefined && value >= warningThreshold) return 'text-oYellow';
    return 'text-oGreen';
  };
  
  const percentage = hasValue ? Math.min(100, (value / max) * 100) : 0;
  
  return (
    <div className="bg-oGray2 rounded-lg p-6 text-center">
      {icon && (
        <FontAwesomeIcon icon={icon} className="text-3xl text-oGray mb-3" />
      )}
      <div className={`text-6xl font-bold mb-2 ${getColor()}`}>
        {displayValue}
      </div>
      {hasValue && unit && (
        <div className="text-oGray text-xl mb-4">{unit}</div>
      )}
      <div className="text-oGray text-lg mb-3">{label}</div>
      
      <div className="w-full bg-oGray rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${
            hasValue ? 
              (criticalThreshold && value >= criticalThreshold ? 'bg-oRed' :
               warningThreshold && value >= warningThreshold ? 'bg-oYellow' : 
               'bg-oGreen') 
            : 'bg-oGray2'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
