import { useState, useEffect, useMemo, useCallback } from 'react';
import useTideCurve from '../hooks/useTideCurve';
import { useTranslation } from 'react-i18next';
import { vesselNow } from '../utils/VesselClock';

// Constants remain the same
const TIDE_DISPLAY_THRESHOLDS = {
  MIN: 10,
  MAX: 90
};

const COLORS = {
  RISING: {
    BACKGROUND: 'bg-oGreen',
    TEXT: 'text-oGreen'
  },
  FALLING: {
    BACKGROUND: 'bg-oYellow',
    TEXT: 'text-oYellow'
  }
};

const ThreeDBoatTideLevelIndicator = () => {
  const { t } = useTranslation();
  const [maxHeight, setMaxHeight] = useState(240); // Default height (equivalent to h-60)

  // Same source as the full-screen tide panel: Signal K, the tide REST
  // fallback, or the demo curve when nothing is measured
  const curve = useTideCurve();

  /**
   * Parse a tide time value (ISO timestamp or HH:MM) to a Date object
   */
  const parseTideTime = useCallback((timeValue) => {
    if (!timeValue) return null;
    if (typeof timeValue === 'string' && (timeValue.includes('T') || timeValue.includes('-'))) {
      const d = new Date(timeValue);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof timeValue === 'string') {
      const parts = timeValue.split(':').map(Number);
      if (parts.length < 2) return null;
      const d = vesselNow();
      d.setHours(parts[0], parts[1], 0, 0);
      return d;
    }
    return null;
  }, []);

  /**
   * Format a tide time value to HH:MM display string
   */
  const formatTideTime = useCallback((timeValue) => {
    if (!timeValue) return null;
    if (typeof timeValue === 'string' && (timeValue.includes('T') || timeValue.includes('-'))) {
      const d = new Date(timeValue);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    }
    return timeValue;
  }, []);

  /**
   * Determine if tide is rising: next high comes before next low
   */
  const computeIsRising = useCallback((timeLow, timeHigh) => {
    const highDate = parseTideTime(timeHigh);
    const lowDate = parseTideTime(timeLow);
    if (!highDate || !lowDate) return false;
    return highDate.getTime() < lowDate.getTime();
  }, [parseTideTime]);

  const computeTidePercentage = useCallback((level, low, high) => {
    if (high <= low || !level) return 0;
    const percentage = ((level - low) / (high - low)) * 100;
    return Math.min(100, Math.max(0, percentage));
  }, []);

  // New effect for responsive height
  useEffect(() => {
    const updateMaxHeight = () => {
      const vh = window.innerHeight;
      // For smaller screens (< 640px height), use 25% of viewport height
      // For larger screens, use 35% of viewport height
      // Both capped at 240px (original h-60 equivalent)
      const newHeight = vh < 640 
        ? Math.min(vh * 0.25, 240)
        : Math.min(vh * 0.35, 240);
      setMaxHeight(newHeight);
    };

    updateMaxHeight();
    window.addEventListener('resize', updateMaxHeight);
    return () => window.removeEventListener('resize', updateMaxHeight);
  }, []);

  const tideData = useMemo(() => {
    const { hasData, chartData, coefficient, timeLow, timeHigh } = curve;
    if (!hasData || chartData.length < 2) {
      return { level: null, high: null, low: null, timeLow: null, timeHigh: null, coefficient: null, isRising: null };
    }
    // Without a measured height, read the curve at "now"
    const start = chartData[0].ms;
    const end = chartData[chartData.length - 1].ms;
    const pos = Math.min(1, Math.max(0, (vesselNow().getTime() - start) / (end - start))) * (chartData.length - 1);
    const i = Math.min(chartData.length - 2, Math.floor(pos));
    const estimated = chartData[i].height + (chartData[i + 1].height - chartData[i].height) * (pos - i);
    const heights = chartData.map(p => p.height);
    return {
      level: Number.isFinite(curve.level) ? curve.level : estimated,
      high: curve.high ?? Math.max(...heights),
      low: curve.low ?? Math.min(...heights),
      timeLow, timeHigh, coefficient,
      // With no tide times, the slope of the curve now
      isRising: timeLow && timeHigh ? computeIsRising(timeLow, timeHigh) : chartData[i + 1].height > chartData[i].height
    };
  }, [curve, computeIsRising]);

  const {
    level,
    high,
    low,
    timeLow,
    timeHigh,
    coefficient,
    isRising
  } = tideData;

  // Computed values
  const textColor = 'text-hud-main';
  const tideColors = isRising ? COLORS.RISING : COLORS.FALLING;
  const tidePercentage = useMemo(() => 
    computeTidePercentage(level, low, high), 
    [level, low, high, computeTidePercentage]
  );

  // Only the core tide fields are required to render; coefficient/isRising are optional
  // (e.g. SignalK may not provide coeffNow) and must not hide the whole indicator.
  if (level === null || high === null || low === null) {
    return null;
  }

  const shouldShowTideLevel = tidePercentage > TIDE_DISPLAY_THRESHOLDS.MIN && 
                            tidePercentage < TIDE_DISPLAY_THRESHOLDS.MAX;

  return (
    <div className="flex flex-col items-center group p-3 transition-all duration-300">
      <div className={`text-caption font-semibold uppercase tracking-[0.2em] mb-1 opacity-40 group-hover:opacity-100 transition-opacity ${textColor}`}>
        {t('indicators.tide')}
      </div>
      <div className={`text-caption font-semibold uppercase tracking-widest mb-4 ${textColor} flex items-center gap-1.5 opacity-60`}>
        <span className="text-oBlue">{formatTideTime(timeHigh)}</span>
        <span className={`inline-block transform ${!isRising && 'rotate-180'} ${tideColors.TEXT} text-caption`}>
          ▲
        </span>
        {coefficient != null && <span className="text-hud-muted">C{coefficient}</span>}
      </div>

      <div className="relative flex flex-col w-12" style={{ height: maxHeight }}>
        {/* Progress Bar Container */}
        <div className="absolute left-0 top-0 w-1.5 h-full bg-hud-elevated rounded-full overflow-hidden">
          <div
            role="progressbar"
            className={`${tideColors.BACKGROUND} w-full rounded-full transition-all duration-1000 ease-in-out absolute bottom-0 left-0`}
            aria-valuenow={tidePercentage}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={`Tide level: ${level.toFixed(2)} meters`}
            style={{ height: `${tidePercentage}%` }}
          />
        </div>

        {/* Labels positioned to the right of the bar */}
        <div className="ml-4 h-full relative">
          <span className={`absolute ${textColor} text-caption font-semibold uppercase tracking-tighter opacity-30`} style={{ top: '0%' }}>
            {Number(high).toFixed(1)}m
          </span>
          
          {shouldShowTideLevel && (
            <div 
              className={`absolute transition-all duration-500 flex items-center space-x-1`} 
              style={{ bottom: `${tidePercentage}%`, transform: 'translateY(50%)' }}
            >
              <div className={`w-2 h-[1px] ${tideColors.BACKGROUND} opacity-50`} />
              <span className={`${textColor} text-caption font-semibold tracking-tight`}>
                {level.toFixed(2)}m
              </span>
            </div>
          )}
          
          <span className={`absolute ${textColor} text-caption font-semibold uppercase tracking-tighter opacity-30`} style={{ bottom: '0%' }}>
            {Number(low).toFixed(1)}m
          </span>
        </div>
      </div>

      <div className={`text-caption font-semibold uppercase tracking-widest mt-4 opacity-40 ${textColor}`}>
        {formatTideTime(timeLow)}
      </div>
    </div>
  );
};

export default ThreeDBoatTideLevelIndicator;