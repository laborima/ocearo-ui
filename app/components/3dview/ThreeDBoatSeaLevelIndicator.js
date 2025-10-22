import { useOcearoContext } from '../context/OcearoContext';
import { useState, useEffect, useMemo, useCallback } from 'react';

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
  DAY: 'text-white'
};

const ThreeDBoatSeaLevelIndicator = () => {
  const { nightMode, getDepthData } = useOcearoContext();
  const [depth, setDepth] = useState(null);
  const [barHeight, setBarHeight] = useState(240); // Default height (equivalent to h-60)

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

  // Fetch depth data from SignalK using common helper
  useEffect(() => {
    const depthData = getDepthData();
    // Use belowKeel which already has fallback to belowTransducer
    setDepth(depthData.belowKeel);
  }, [getDepthData]);

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
    return `${depth} m`;
  }, []);

  // Render progress bar
  const ProgressBar = () => (
    <div
      className={`w-2 ${progressBarColor} rounded-lg overflow-hidden mb-4`}
      style={{ height: barHeight }}
      role="progressbar"
      aria-valuenow={depth}
      aria-valuemin="0"
      aria-valuemax={DEPTH_THRESHOLDS.MAX_DEPTH}
      aria-label={`Water depth: ${formattedDepth(depth)}`}
    >
      <div
        className="bg-oGray transition-all duration-500 ease-in-out"
        style={{ height: `${100 - depthPercentage}%` }}
      />
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      {/* Label */}
      <div className={`text-sm mb-2 ${textColor}`}>Depth</div>

      {/* Progress Bar */}
      <ProgressBar />

      {/* Depth Value */}
      <div
        className={`text-sm mt-2 ${textColor} ${depth < DEPTH_THRESHOLDS.DANGER ? 'animate-pulse' : ''}`}
      >
        {formattedDepth(depth)}
      </div>
    </div>
  );
};

export default ThreeDBoatSeaLevelIndicator;