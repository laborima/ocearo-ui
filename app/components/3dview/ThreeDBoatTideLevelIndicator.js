import { useOcearoContext } from '../context/OcearoContext';
import { useState, useEffect, useMemo, useCallback } from 'react';

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
  DAY: 'text-white'
};

const ThreeDBoatTideLevelIndicator = () => {
  const { nightMode, getSignalKValue } = useOcearoContext();
  const [maxHeight, setMaxHeight] = useState(240); // Default height (equivalent to h-60)
  const [tideData, setTideData] = useState({
    level: null,
    high: null,
    low: null,
    timeLow: null,
    timeHigh: null,
    coefficient: null,
    isRising: null
  });

  // Existing helper functions remain the same
  const timeToMinutes = useCallback((timeString) => {
    if (!timeString) return null;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }, []);

  const computeIsRising = useCallback((currentTime, timeLow, timeHigh) => {
    const currentMinutes = timeToMinutes(currentTime);
    const lowMinutes = timeToMinutes(timeLow);
    const highMinutes = timeToMinutes(timeHigh);

    if (!currentMinutes || !lowMinutes || !highMinutes) return false;

    if (lowMinutes < highMinutes) {
      return currentMinutes >= lowMinutes && currentMinutes <= highMinutes;
    }
    return currentMinutes >= lowMinutes || currentMinutes <= highMinutes;
  }, [timeToMinutes]);

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

  // Existing tide data effect
  useEffect(() => {
    const currentTime = new Date();
    const currentTimeString = currentTime.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });

    const newTideData = {
      level: getSignalKValue('environment.tide.heightNow'),
      high: getSignalKValue('environment.tide.heightHigh'),
      low: getSignalKValue('environment.tide.heightLow'),
      timeLow: getSignalKValue('environment.tide.timeLow'),
      timeHigh: getSignalKValue('environment.tide.timeHigh'),
      coefficient: getSignalKValue('environment.tide.coeffNow')
    };

    const isDataComplete = Object.values(newTideData).every(value => 
      value !== null && value !== undefined
    );

    if (isDataComplete) {
      setTideData({
        ...newTideData,
        isRising: computeIsRising(currentTimeString, newTideData.timeLow, newTideData.timeHigh)
      });
    }
  }, [getSignalKValue, computeIsRising]);

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
    <div className="flex flex-col items-center">
      <div className={`text-sm ${textColor}`}>
        La Rochelle
      </div>
      <div className={`text-sm mb-2 ${textColor} flex items-center gap-1`}>
        {timeHigh}
        <span className={`inline-block transform ${!isRising && 'rotate-180'} ${tideColors.TEXT}`}>
          ▲
        </span>
        <span>{coefficient}</span>
      </div>

      <div className="relative flex flex-col w-8" style={{ height: maxHeight }}>
        <span className={`absolute ${textColor} text-sm font-medium`} style={{ top: '0%', left: '60%' }}>
          {high}m
        </span>
        
        {shouldShowTideLevel && (
          <span 
            className={`absolute ${textColor} text-sm font-medium transition-opacity duration-300`} 
            style={{ bottom: `${tidePercentage}%`, left: '60%' }}
          >
            {level.toFixed(2)}m
          </span>
        )}
        
        <span className={`absolute ${textColor} text-sm font-medium`} style={{ bottom: '0%', left: '60%' }}>
          {low}m
        </span>

        <div className="flex flex-col justify-end bg-oGray rounded-3xl w-2 overflow-hidden" style={{ height: maxHeight }}>
          <div
            role="progressbar"
            className={`${tideColors.BACKGROUND} w-2 rounded-3xl transition-all duration-500`}
            aria-valuenow={tidePercentage}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={`Tide level: ${level.toFixed(2)} meters`}
            style={{ height: `${tidePercentage}%` }}
          />
        </div>
      </div>

      <div className={`text-sm mt-2 ${textColor}`}>
        {timeLow}
      </div>
    </div>
  );
};

export default ThreeDBoatTideLevelIndicator;