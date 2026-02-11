import React, { useMemo } from 'react';
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
import { oBlue, oGreen, useOcearoContext } from '../../context/OcearoContext';
import BaseWidget from './BaseWidget';
import configService from '../../settings/ConfigService';
import { useSignalKPaths } from '../../hooks/useSignalK';
import { useTranslation } from 'react-i18next';

/**
 * Estimate tide height using the Rule of Twelfths.
 * The rule states that in each sixth of the tidal cycle, the tide changes by
 * 1/12, 2/12, 3/12, 3/12, 2/12, 1/12 of the total range.
 * @param {number} highHeight - High tide height in meters
 * @param {number} lowHeight - Low tide height in meters
 * @param {Date} targetTime - Time to estimate height for
 * @param {Date} highTime - Time of high tide
 * @param {Date} lowTime - Time of low tide
 * @returns {number} Estimated tide height
 */
const HALF_CYCLE_MS = 6.21 * 60 * 60 * 1000;

/**
 * Build an array of alternating tide events (high/low) covering a 24h window.
 * Uses the known next high and next low times, then extrapolates previous/next
 * events using the average semi-diurnal period (~6h12m).
 */
const buildTideEvents = (highHeight, lowHeight, highTime, lowTime) => {
  const highMs = highTime.getTime();
  const lowMs = lowTime.getTime();
  const events = [];

  // Build enough events to cover the full 00:00–24:00 window.
  // We generate 4 half-cycles before and after the known pair.
  if (highMs < lowMs) {
    // Known order: high, then low → tide is currently rising toward high
    events.push(
      { time: highMs - 3 * HALF_CYCLE_MS, height: lowHeight, type: 'low' },
      { time: highMs - 2 * HALF_CYCLE_MS, height: highHeight, type: 'high' },
      { time: highMs - HALF_CYCLE_MS, height: lowHeight, type: 'low' },
      { time: highMs, height: highHeight, type: 'high' },
      { time: lowMs, height: lowHeight, type: 'low' },
      { time: lowMs + HALF_CYCLE_MS, height: highHeight, type: 'high' },
      { time: lowMs + 2 * HALF_CYCLE_MS, height: lowHeight, type: 'low' },
      { time: lowMs + 3 * HALF_CYCLE_MS, height: highHeight, type: 'high' }
    );
  } else {
    // Known order: low, then high → tide is currently falling toward low
    events.push(
      { time: lowMs - 3 * HALF_CYCLE_MS, height: highHeight, type: 'high' },
      { time: lowMs - 2 * HALF_CYCLE_MS, height: lowHeight, type: 'low' },
      { time: lowMs - HALF_CYCLE_MS, height: highHeight, type: 'high' },
      { time: lowMs, height: lowHeight, type: 'low' },
      { time: highMs, height: highHeight, type: 'high' },
      { time: highMs + HALF_CYCLE_MS, height: lowHeight, type: 'low' },
      { time: highMs + 2 * HALF_CYCLE_MS, height: highHeight, type: 'high' },
      { time: highMs + 3 * HALF_CYCLE_MS, height: lowHeight, type: 'low' }
    );
  }
  return events;
};

const estimateTideHeight = (highHeight, lowHeight, targetTime, highTime, lowTime) => {
  const targetMs = targetTime.getTime();
  const events = buildTideEvents(highHeight, lowHeight, highTime, lowTime);

  // Find the two surrounding events
  for (let i = 0; i < events.length - 1; i++) {
    if (targetMs >= events[i].time && targetMs <= events[i + 1].time) {
      const startHeight = events[i].height;
      const endHeight = events[i + 1].height;
      const cycleDuration = events[i + 1].time - events[i].time;
      if (cycleDuration <= 0) return (highHeight + lowHeight) / 2;

      const progress = (targetMs - events[i].time) / cycleDuration;
      const cosineProgress = (1 - Math.cos(progress * Math.PI)) / 2;
      return parseFloat((startHeight + (endHeight - startHeight) * cosineProgress).toFixed(2));
    }
  }

  return (highHeight + lowHeight) / 2;
};

/**
 * Format an ISO timestamp or HH:MM string to display time
 * @param {string} timeValue - ISO timestamp or HH:MM string
 * @returns {string} Formatted time string (HH:MM)
 */
const formatTideTime = (timeValue) => {
  if (!timeValue) return null;
  // If it looks like an ISO date string, parse it
  if (timeValue.includes('T') || timeValue.includes('-')) {
    const d = new Date(timeValue);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
  }
  // Already in HH:MM format
  return timeValue;
};

/**
 * Parse a tide time value to a Date object
 * @param {string} timeValue - ISO timestamp or HH:MM string
 * @returns {Date|null} Parsed Date object
 */
const parseTideTime = (timeValue) => {
  if (!timeValue) return null;
  if (timeValue.includes('T') || timeValue.includes('-')) {
    const d = new Date(timeValue);
    return isNaN(d.getTime()) ? null : d;
  }
  // HH:MM format - create a Date for today
  const parts = timeValue.split(':').map(Number);
  if (parts.length < 2) return null;
  const d = new Date();
  d.setHours(parts[0], parts[1], 0, 0);
  return d;
};

export default function TideWidget() {
  const { t } = useTranslation();
  const debugMode = configService.get('debugMode');
  
  const tidePaths = useMemo(() => [
    'environment.tide.heightNow',
    'environment.tide.heightHigh',
    'environment.tide.heightLow',
    'environment.tide.timeLow',
    'environment.tide.timeHigh',
    'environment.tide.coeffNow'
  ], []);
  
  const skValues = useSignalKPaths(tidePaths);
  
  const level = skValues['environment.tide.heightNow'];
  const high = skValues['environment.tide.heightHigh'];
  const low = skValues['environment.tide.heightLow'];
  const timeLow = skValues['environment.tide.timeLow'];
  const timeHigh = skValues['environment.tide.timeHigh'];
  const coefficient = skValues['environment.tide.coeffNow'];

  const hasData = level !== null || high !== null || low !== null || debugMode;

  // Parse tide times to Date objects
  const highDate = useMemo(() => parseTideTime(timeHigh), [timeHigh]);
  const lowDate = useMemo(() => parseTideTime(timeLow), [timeLow]);

  // Determine if tide is rising: next high tide comes before next low tide
  const isRising = useMemo(() => {
    if (!highDate || !lowDate) return false;
    return highDate.getTime() < lowDate.getTime();
  }, [highDate, lowDate]);

  // Generate tide curve data points using Rule of Twelfths
  const chartData = useMemo(() => {
    const safeHigh = high || 4.2;
    const safeLow = low || 0.8;
    const safeHighDate = highDate || (() => { const d = new Date(); d.setHours(14, 0, 0, 0); return d; })();
    const safeLowDate = lowDate || (() => { const d = new Date(); d.setHours(8, 0, 0, 0); return d; })();

    const data = [];
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Generate a point every 30 minutes for 24 hours
    for (let i = 0; i <= 48; i++) {
      const targetTime = new Date(startOfDay.getTime() + i * 30 * 60 * 1000);
      const height = estimateTideHeight(safeHigh, safeLow, targetTime, safeHighDate, safeLowDate);
      data.push({
        time: targetTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
        height,
        isNow: Math.abs(targetTime.getTime() - now.getTime()) < 15 * 60 * 1000
      });
    }
    return data;
  }, [high, low, highDate, lowDate]);

  return (
    <BaseWidget
      title={t('widgets.tidalTelemetry')}
      icon={() => (
        <svg className="w-5 h-5 opacity-50" viewBox="0 0 24 24" fill="none">
          <path d="M3 11h18M3 6h18M3 16h18M3 21h18" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
      hasData={hasData}
      noDataMessage={t('widgets.signalLossTidal')}
    >
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header row: level + phase */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-baseline space-x-3">
            <span className="text-4xl font-black text-hud-main leading-none gliding-value tracking-tighter">
              {(level || 2.1).toFixed(1)}<span className="text-lg text-hud-muted ml-1">m</span>
            </span>
            <span className={`text-xs font-black uppercase tracking-[0.2em] ${isRising ? 'text-oGreen' : 'text-oBlue'}`}>
              {isRising ? t('widgets.rising') : t('widgets.ebb')}
            </span>
          </div>
          {coefficient && <span className="text-hud-muted text-xs font-black">C{coefficient}</span>}
        </div>

        {/* Chart fills remaining space */}
        <div className="flex-1 min-h-0 mb-3 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTide" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isRising ? oGreen : oBlue} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isRising ? oGreen : oBlue} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--hud-border)" vertical={false} />
              <XAxis 
                dataKey="time" 
                tick={{ fill: 'var(--hud-text-muted)', fontSize: 10, fontWeight: 900 }}
                axisLine={false}
                tickLine={false}
                interval={6}
              />
              <YAxis 
                tick={{ fill: 'var(--hud-text-muted)', fontSize: 10, fontWeight: 900 }}
                axisLine={false}
                tickLine={false}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--hud-bg)', border: '1px solid var(--hud-border)', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}
                itemStyle={{ color: isRising ? oGreen : oBlue }}
              />
              <Area 
                type="monotone" 
                dataKey="height" 
                stroke={isRising ? oGreen : oBlue} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTide)" 
                isAnimationActive={true}
                animationDuration={2000}
              />
              {level && (
                <ReferenceLine 
                  y={level} 
                  stroke="var(--hud-border)" 
                  strokeDasharray="4 4" 
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* High/Low inline row */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-hud-muted text-xs font-black uppercase tracking-widest">{t('widgets.high')}</span>
            <span className="text-hud-main font-black text-sm gliding-value">{formatTideTime(timeHigh) || '--:--'}</span>
            <span className="text-oGreen text-xs font-black">{(high || 0).toFixed(1)}m</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-hud-muted text-xs font-black uppercase tracking-widest">{t('widgets.low')}</span>
            <span className="text-hud-main font-black text-sm gliding-value">{formatTideTime(timeLow) || '--:--'}</span>
            <span className="text-oBlue text-xs font-black">{(low || 0).toFixed(1)}m</span>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
