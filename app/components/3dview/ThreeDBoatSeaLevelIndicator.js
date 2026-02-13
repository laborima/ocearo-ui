import { useOcearoContext } from '../context/OcearoContext';
import { convertDepthUnit, getDepthUnitLabel } from '../utils/UnitConversions';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSignalKPath } from '../hooks/useSignalK';
import { useTranslation } from 'react-i18next';

const DEPTH_THRESHOLDS = {
  DANGER: 3,
  WARNING: 5,
  MAX_DEPTH: 50
};

const DEPTH_COLORS = {
  DANGER: 'bg-oRed',
  WARNING: 'bg-oYellow',
  SAFE: 'bg-oBlue'
};

const TEXT_COLORS = {
  NIGHT: 'text-oNight',
  DAY: 'text-hud-main'
};

const ThreeDBoatSeaLevelIndicator = () => {
  const { t } = useTranslation();
  const { nightMode } = useOcearoContext();
  const [barHeight, setBarHeight] = useState(240); // Default height (equivalent to h-60)

  // Use specialized hooks for better performance and targeted subscriptions
  const depthKeel = useSignalKPath('environment.depth.belowKeel');
  const depthTransducer = useSignalKPath('environment.depth.belowTransducer');

  // Derive depth with fallback logic
  const depth = useMemo(() => {
    // Mirroring getDepthData fallback logic from OcearoContext
    return depthKeel ?? depthTransducer ?? null;
  }, [depthKeel, depthTransducer]);

  // Handle responsive height
  useEffect(() => {
    const updateBarHeight = () => {
      const vh = window.innerHeight;
      // For smaller screens (< 640px height), use 25% of viewport height
      // For larger screens, use 35% of viewport height
      // Both capped at 240px (original h-60 equivalent)
      const newHeight = vh < 640 
        ? Math.min(vh * 0.25, 240)
        : Math.min(vh * 0.35, 240);
      setBarHeight(newHeight);
    };

    updateBarHeight();
    window.addEventListener('resize', updateBarHeight);
    return () => window.removeEventListener('resize', updateBarHeight);
  }, []);

  // Calculate depth percentage for progress bar
  const depthPercentage = useMemo(() => {
    if (depth === null) return 0;
    return Math.min((depth / DEPTH_THRESHOLDS.MAX_DEPTH) * 100, 100);
  }, [depth]);

  // Determine progress bar color based on depth
  const progressBarColor = useMemo(() => {
    if (depth === null) return DEPTH_COLORS.SAFE;
    if (depth < DEPTH_THRESHOLDS.DANGER) return DEPTH_COLORS.DANGER;
    if (depth < DEPTH_THRESHOLDS.WARNING) return DEPTH_COLORS.WARNING;
    return DEPTH_COLORS.SAFE;
  }, [depth]);

  // Get text color based on night mode
  const textColor = nightMode ? TEXT_COLORS.NIGHT : TEXT_COLORS.DAY;

  // Format depth display
  const formattedDepth = useCallback((depth) => {
    if (depth === null) return '--';
    return `${convertDepthUnit(depth)} ${getDepthUnitLabel()}`;
  }, []);

  // Render progress bar
  const ProgressBar = () => (
    <div
      className="w-1.5 bg-hud-elevated rounded-full overflow-hidden mb-2 relative"
      style={{ height: barHeight }}
      role="progressbar"
      aria-valuenow={depth}
      aria-valuemin="0"
      aria-valuemax={DEPTH_THRESHOLDS.MAX_DEPTH}
      aria-label={`${t('indicators.waterDepth')}: ${formattedDepth(depth)}`}
    >
      <div
        className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ease-in-out ${progressBarColor} ${depth < DEPTH_THRESHOLDS.DANGER ? 'animate-pulse' : ''}`}
        style={{ height: `${depthPercentage}%` }}
      />
    </div>
  );

  return (
    <div className="flex flex-col items-center group p-3 transition-all duration-300">
      {/* Label */}
      <div className={`text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-40 group-hover:opacity-100 transition-opacity ${textColor}`}>
        {t('indicators.depth')}
      </div>

      {/* Progress Bar */}
      <ProgressBar />

      {/* Depth Value */}
      <div
        className={`text-xs font-black tracking-widest mt-2 ${textColor} ${depth < DEPTH_THRESHOLDS.DANGER ? 'text-oRed animate-soft-pulse' : ''}`}
      >
        {formattedDepth(depth)}
      </div>
    </div>
  );
};

export default ThreeDBoatSeaLevelIndicator;