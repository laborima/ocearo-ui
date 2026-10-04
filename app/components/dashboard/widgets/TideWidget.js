import React from 'react';
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
import BaseWidget from './BaseWidget';
import { useTranslation } from 'react-i18next';
import useTideCurve, { formatTideTime } from '../../hooks/useTideCurve';

export default function TideWidget() {
  const { t } = useTranslation();

  const { hasData, level, high, low, timeHigh, timeLow, coefficient, isRising, tideColor, chartData } = useTideCurve();

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
            <span className="text-hero font-medium text-hud-main leading-none gliding-value tracking-tight">
              {(level || 2.1).toFixed(1)}<span className="text-value text-hud-muted ml-1">m</span>
            </span>
            <span className={`text-caption font-semibold uppercase tracking-[0.2em] ${isRising ? 'text-oGreen' : 'text-oBlue'}`}>
              {isRising ? t('widgets.rising') : t('widgets.ebb')}
            </span>
          </div>
          {coefficient && <span className="text-hud-muted text-caption font-semibold">C{Math.round(coefficient)}</span>}
        </div>

        {/* Chart fills remaining space */}
        <div className="flex-1 min-h-0 mb-3 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTide" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={tideColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={tideColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--hud-border)" vertical={false} />
              <XAxis 
                dataKey="time" 
                tick={{ fill: 'var(--hud-text-muted)', fontSize: 10, fontWeight: 900 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={28}
              />
              <YAxis
                tick={{ fill: 'var(--hud-text-muted)', fontSize: 10, fontWeight: 900 }}
                axisLine={false}
                tickLine={false}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
                tickFormatter={(v) => Number(v).toFixed(1)}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--hud-bg)', border: '1px solid var(--hud-border)', borderRadius: '4px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}
                itemStyle={{ color: tideColor }}
              />
              <Area 
                type="monotone" 
                dataKey="height" 
                stroke={tideColor} 
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
            <span className="text-hud-muted text-caption font-semibold uppercase tracking-widest">{t('widgets.high')}</span>
            <span className="text-hud-main font-semibold text-label gliding-value">{formatTideTime(timeHigh) || '--:--'}</span>
            <span className="text-oGreen text-caption font-semibold">{(high || 0).toFixed(1)}m</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-hud-muted text-caption font-semibold uppercase tracking-widest">{t('widgets.low')}</span>
            <span className="text-hud-main font-semibold text-label gliding-value">{formatTideTime(timeLow) || '--:--'}</span>
            <span className="text-oBlue text-caption font-semibold">{(low || 0).toFixed(1)}m</span>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
