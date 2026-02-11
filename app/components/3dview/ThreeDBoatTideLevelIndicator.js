import { useOcearoContext } from '../context/OcearoContext';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSignalKPaths } from '../hooks/useSignalK';
import { useTranslation } from 'react-i18next';

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

const TEXT_COLORS = {
  NIGHT: 'text-oNight',
  DAY: 'text-hud-main'
};

const ThreeDBoatTideLevelIndicator = () => {
  const { t } = useTranslation();
  const { nightMode } = useOcearoContext();
  const [maxHeight, setMaxHeight] = useState(240); // Default height (equivalent to h-60)
  
  const tidePaths = useMemo(() => [
    'environment.tide.heightNow',
    'environment.tide.heightHigh',
    'environment.tide.heightLow',
    'environment.tide.timeLow',
    'environment.tide.timeHigh',
    'environment.tide.coeffNow'
  ], []);

  const skValues = useSignalKPaths(tidePaths);

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
      const d = new Date();
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
    const level = skValues['environment.tide.heightNow'];
    const high = skValues['environment.tide.heightHigh'];
    const low = skValues['environment.tide.heightLow'];
    const timeLow = skValues['environment.tide.timeLow'];
    const timeHigh = skValues['environment.tide.timeHigh'];
    const coefficient = skValues['environment.tide.coeffNow'];

    const isDataComplete = [level, high, low, timeLow, timeHigh].every(value => 
      value !== null && value !== undefined
    );

    if (isDataComplete) {
      return {
        level, high, low, timeLow, timeHigh, coefficient,
        isRising: computeIsRising(timeLow, timeHigh)
      };
    }
    return {
      level: null, high: null, low: null, timeLow: null, timeHigh: null, coefficient: null, isRising: null
    };
  }, [skValues, computeIsRising]);

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
  const textColor = nightMode ? TEXT_COLORS.NIGHT : TEXT_COLORS.DAY;
  const tideColors = isRising ? COLORS.RISING : COLORS.FALLING;
  const tidePercentage = useMemo(() => 
    computeTidePercentage(level, low, high), 
    [level, low, high, computeTidePercentage]
  );

  if (Object.values(tideData).some(value => value === null)) {
    return null;
  }

  const shouldShowTideLevel = tidePercentage > TIDE_DISPLAY_THRESHOLDS.MIN && 
                            tidePercentage < TIDE_DISPLAY_THRESHOLDS.MAX;

  return (
    <div className="flex flex-col items-center group p-3 transition-all duration-300">
      <div className={`text-xs font-black uppercase tracking-[0.2em] mb-1 opacity-40 group-hover:opacity-100 transition-opacity ${textColor}`}>
        {t('indicators.tide')}
      </div>
      <div className={`text-xs font-black uppercase tracking-widest mb-4 ${textColor} flex items-center gap-1.5 opacity-60`}>
        <span className="text-oBlue">{formatTideTime(timeHigh)}</span>
        <span className={`inline-block transform ${!isRising && 'rotate-180'} ${tideColors.TEXT} text-xs`}>
          ▲
        </span>
        <span className="text-hud-muted">C{coefficient}</span>
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
          <span className={`absolute ${textColor} text-xs font-black uppercase tracking-tighter opacity-30`} style={{ top: '0%' }}>
            {high}m
          </span>
          
          {shouldShowTideLevel && (
            <div 
              className={`absolute transition-all duration-500 flex items-center space-x-1`} 
              style={{ bottom: `${tidePercentage}%`, transform: 'translateY(50%)' }}
            >
              <div className={`w-2 h-[1px] ${tideColors.BACKGROUND} opacity-50`} />
              <span className={`${textColor} text-xs font-black tracking-tight`}>
                {level.toFixed(2)}m
              </span>
            </div>
          )}
          
          <span className={`absolute ${textColor} text-xs font-black uppercase tracking-tighter opacity-30`} style={{ bottom: '0%' }}>
            {low}m
          </span>
        </div>
      </div>

      <div className={`text-xs font-black uppercase tracking-widest mt-4 opacity-40 ${textColor}`}>
        {formatTideTime(timeLow)}
      </div>
    </div>
  );
};

export default ThreeDBoatTideLevelIndicator;