import React from 'react';
import { 
  LineChart as ReChartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { useOcearoContext } from '../context/OcearoContext';

const LineChart = ({ data, dataKey, color, scale, label, unit, showPoints = false, lineWidth = 2, fillGradient = false }) => {
  const { nightMode } = useOcearoContext();

  const validValues = data.filter(item => item[dataKey] !== null && item[dataKey] !== undefined);

  if (validValues.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        No data available
      </div>
    );
  }

  // Format time for XAxis (only show minutes:seconds or similar)
  const formatXAxis = (timeStr) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length >= 3) {
      return `${parts[1]}:${parts[2]}`;
    }
    return timeStr;
  };

  const domain = [
    scale?.min !== undefined ? scale.min : 'auto',
    scale?.max !== undefined ? scale.max : 'auto'
  ];

  const CustomTooltip = ({ active, payload, label: timeLabel }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-oGray2 border border-gray-700 p-2 rounded-md shadow-lg">
          <p className="text-gray-400 text-[10px] uppercase mb-1">{timeLabel}</p>
          <p className="text-white font-bold text-sm">
            {payload[0].value.toFixed(2)}{unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        {fillGradient ? (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis 
              dataKey="time" 
              tickFormatter={formatXAxis} 
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis 
              domain={domain}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              unit={unit}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={lineWidth}
              fillOpacity={1}
              fill={`url(#color-${dataKey})`}
              isAnimationActive={false}
              dot={showPoints ? { r: 2, fill: color, strokeWidth: 0 } : false}
            />
          </AreaChart>
        ) : (
          <ReChartsLineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis 
              dataKey="time" 
              tickFormatter={formatXAxis} 
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis 
              domain={domain}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              unit={unit}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={lineWidth}
              dot={showPoints ? { r: 2, fill: color, strokeWidth: 0 } : false}
              isAnimationActive={false}
            />
          </ReChartsLineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
