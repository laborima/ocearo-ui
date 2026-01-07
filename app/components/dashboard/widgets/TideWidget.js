import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useSignalKPaths } from '../../hooks/useSignalK';
import BaseWidget from './BaseWidget';
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
  const debugMode = configService.get('debugMode');
  
  const tidePaths = [
    'environment.tide.heightNow',
    'environment.tide.heightHigh',
    'environment.tide.heightLow',
    'environment.tide.timeLow',
    'environment.tide.timeHigh',
    'environment.tide.coeffNow'
  ];
  
  const skValues = useSignalKPaths(tidePaths);
  
  const level = skValues['environment.tide.heightNow'];
  const high = skValues['environment.tide.heightHigh'];
  const low = skValues['environment.tide.heightLow'];
  const timeLow = skValues['environment.tide.timeLow'];
  const timeHigh = skValues['environment.tide.timeHigh'];
  const coefficient = skValues['environment.tide.coeffNow'];

  const hasData = level !== null || high !== null || low !== null || debugMode;

  const isRising = React.useMemo(() => {
    if (!timeLow || !timeHigh) return false;
    const currentTime = new Date().toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    return computeIsRising(currentTime, timeLow, timeHigh);
  }, [timeLow, timeHigh]);

  // Generate data points for a smooth tide curve (sine wave)
  const chartData = useMemo(() => {
    const data = [];
    const safeHigh = high || 4.2;
    const safeLow = low || 0.8;
    const range = safeHigh - safeLow;
    const mid = (safeHigh + safeLow) / 2;
    const amplitude = range / 2;
    
    // Create a 24h curve approximation
    // High tide at timeHigh, low tide at timeLow
    for (let i = 0; i <= 24; i++) {
      const hour = i % 24;
      // Simple sine approximation: height = mid + amplitude * sin(t + phase)
      // This is a visual representation, not a harmonic tidal prediction
      const phase = isRising ? -Math.PI/2 : Math.PI/2;
      const val = mid + amplitude * Math.sin((i / 12) * Math.PI + phase);
      data.push({
        time: `${hour}:00`,
        height: val
      });
    }
    return data;
  }, [high, low, isRising]);

  return (
    <BaseWidget
      title="Tide Information"
      icon={() => (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path d="M3 11h18M3 6h18M3 16h18M3 21h18" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
      hasData={hasData}
      noDataMessage="No tide data available"
    >
      <div className="flex-1 flex flex-col min-h-0">
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-oBlue">
            {(level || 2.1).toFixed(1)}m
          </div>
          <div className="text-gray-400 text-sm uppercase">
            {isRising ? '↗ Rising' : '↘ Falling'}
          </div>
        </div>

        <div className="flex-1 min-h-[120px] mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTide" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="time" 
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={5}
              />
              <YAxis 
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Area 
                type="monotone" 
                dataKey="height" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorTide)" 
                isAnimationActive={true}
              />
              {level && (
                <ReferenceLine y={level} stroke="#ff4d4f" strokeDasharray="3 3" label={{ position: 'right', value: 'NOW', fill: '#ff4d4f', fontSize: 10 }} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center bg-oGray p-2 rounded-lg">
            <div className="text-gray-400 text-[10px] uppercase mb-1">Next High</div>
            <div className="text-white font-bold text-lg">{timeHigh || '--:--'}</div>
            <div className="text-oBlue text-xs">{(high || 0).toFixed(1)}m</div>
          </div>
          <div className="text-center bg-oGray p-2 rounded-lg">
            <div className="text-gray-400 text-[10px] uppercase mb-1">Next Low</div>
            <div className="text-white font-bold text-lg">{timeLow || '--:--'}</div>
            <div className="text-orange-400 text-xs">{(low || 0).toFixed(1)}m</div>
          </div>
        </div>

        {coefficient && (
          <div className="text-center mt-3 text-[10px]">
            <span className="text-gray-500 uppercase">Coefficient: </span>
            <span className="text-white font-bold">{coefficient}</span>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
