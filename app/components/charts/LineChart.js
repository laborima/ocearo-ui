import React from 'react';
import { useOcearoContext } from '../context/OcearoContext';

// Component for creating a line chart
const LineChart = ({ data, dataKey, color, scale, label, unit, showPoints = false, lineWidth = 1, fillGradient = false }) => {
  const { nightMode } = useOcearoContext();
  
  // Filter out null/undefined values and find the actual min and max values
  const validValues = data.filter(item => item[dataKey] !== null && item[dataKey] !== undefined);
  
  // If there are no valid values, use the scale
  if (validValues.length === 0) {
    return <div className="flex items-center justify-center h-full">No data available</div>;
  }
  
  const dataMin = Math.min(...validValues.map(item => item[dataKey]));
  const dataMax = Math.max(...validValues.map(item => item[dataKey]));
  
  // Determine the effective min/max for scaling
  // Use a bit of padding (10%) for better visualization
  const padding = 0.1;
  const effectiveMin = Math.max(scale.min, dataMin - (dataMax - dataMin) * padding);
  const effectiveMax = Math.min(scale.max, dataMax + (dataMax - dataMin) * padding);
  
  // If data range is very small, use the scale
  const useAutoscale = (dataMax - dataMin) > (scale.max - scale.min) * 0.05;
  const displayMin = useAutoscale ? effectiveMin : scale.min;
  const displayMax = useAutoscale ? effectiveMax : scale.max;
  
  // Calculate the points for the chart with improved scaling
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    if (item[dataKey] === null || item[dataKey] === undefined) {
      return { x, y: null, value: null, time: item.time };
    }
    const normalizedValue = ((item[dataKey] - displayMin) / (displayMax - displayMin)) * 100;
    const y = 100 - Math.min(100, Math.max(0, normalizedValue));
    return { x, y, value: item[dataKey], time: item.time };
  }).filter(point => point.y !== null);

  // Generate path for the SVG
  const linePath = points.reduce((path, point, i) => {
    return path + (i === 0 ? `M ${point.x},${point.y}` : ` L ${point.x},${point.y}`);
  }, '');

  // Calculate grid line values for a more dynamic scale
  const gridLines = Array.from({ length: 5 }).map((_, i) => {
    const value = displayMax - i * ((displayMax - displayMin) / 4);
    return { 
      position: (i / 4) * 100,
      value: value
    };
  });

  return (
    <div className="h-full w-full relative">
      {/* Grid lines */}
      <div className="absolute inset-0">
        {gridLines.map((line, i) => (
          <div
            key={i}
            className="absolute w-full border-t border-gray-300 opacity-20"
            style={{ top: `${line.position}%` }}
          >
            <span className={`absolute  text-xs ${nightMode ? 'text-oNight' : 'text-white'}`}>
              {line.value.toFixed(line.value < 10 ? 1 : 0)}{unit}
            </span>
          </div>
        ))}
      </div>
      
      {/* Time labels on x-axis */}
      <div className="absolute bottom-0 w-full">
        {data.filter((_, i) => i % 10 === 0).map((item, i, arr) => (
          <span 
            key={i} 
            className={`absolute text-xs ${nightMode ? 'text-oNight' : 'text-white'} transform -translate-x-1/2`}
            style={{ left: `${((i * 10) / (data.length - 1) * 100)+10}%`, bottom: '-20px' }}
          >
            {item.time.split(':').slice(1).join(':')}
          </span>
        ))}
      </div>
      
      {/* Chart background - make the active area stand out */}
      <div className={`absolute inset-0 ${fillGradient ? 'rightPaneBg bg-opacity-30' : 'bg-gray-800 bg-opacity-10'} rounded-lg`}></div>
      
      {/* Data range indicator */}
      {useAutoscale && (
        <div className="absolute top-0 right-0 bg-gray-800 bg-opacity-70 px-2 py-1 rounded-md text-xs text-white">
          {displayMin.toFixed(1)} - {displayMax.toFixed(1)}{unit}
        </div>
      )}
      
      {/* SVG Chart */}
      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        {/* Area under the line for subtle fill effect */}
        <defs>
          <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={fillGradient ? "0.5" : "0.3"} />
            <stop offset="100%" stopColor={color} stopOpacity={fillGradient ? "0.1" : "0.05"} />
          </linearGradient>
          {fillGradient && (
            <linearGradient id={`line-gradient-${dataKey}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
          )}
        </defs>
        
        {/* Area fill */}
        <path 
          d={`${linePath} L ${points[points.length-1].x},100 L ${points[0].x},100 Z`} 
          fill={`url(#gradient-${dataKey})`}
          className={fillGradient ? "filter drop-shadow-md" : ""}
        />
        
        {/* Line */}
        <path 
          d={linePath} 
          fill="none" 
          stroke={fillGradient ? `url(#line-gradient-${dataKey})` : color} 
          strokeWidth={fillGradient ? lineWidth * 1.5 : lineWidth} 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={fillGradient ? "filter drop-shadow-sm" : ""}
        />
        
        {/* Points */}
        {showPoints && points.map((point, i) => (
          <circle 
            key={i} 
            cx={point.x} 
            cy={point.y} 
            r={fillGradient ? 0.8 : 0.5} 
            fill={color}
            className={`hover:r-4 transition-all duration-150 ${fillGradient ? 'filter drop-shadow-md' : ''}`}
          >
            <title>{`${label}: ${point.value.toFixed(2)}${unit}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
};

export default LineChart;
