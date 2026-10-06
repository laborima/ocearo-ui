'use client';
import { useMemo } from 'react';
import { useTide } from '../context/TideContext';
import { useSignalKPaths } from './useSignalK';
import configService from '../settings/ConfigService';
import useTheme from '../theme/useTheme';
import { vesselNow } from '../utils/VesselClock';

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
export const formatTideTime = (timeValue) => {
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
  const d = vesselNow();
  d.setHours(parts[0], parts[1], 0, 0);
  return d;
};

/**
 * Tide now and over the day: Signal K values (signalk-tides) with the
 * TideContext REST fallback, and a 24 h curve every 30 minutes (rule of
 * twelfths between the known high and low). Shared by the tide widget and
 * the full-screen 3D tide panel.
 */
const useTideCurve = () => {
  const tokens = useTheme();
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
  const { tideData } = useTide();

  // Use SignalK WebSocket data if available, fallback to TideContext (which uses REST API)
  const level = skValues['environment.tide.heightNow'] ?? tideData?.level ?? null;
  const high = skValues['environment.tide.heightHigh'] ?? tideData?.high ?? null;
  const low = skValues['environment.tide.heightLow'] ?? tideData?.low ?? null;
  const timeLow = skValues['environment.tide.timeLow'] ?? tideData?.timeLow ?? null;
  const timeHigh = skValues['environment.tide.timeHigh'] ?? tideData?.timeHigh ?? null;
  const coefficient = skValues['environment.tide.coeffNow'] ?? tideData?.coefficient ?? null;

  const hasData = level !== null || high !== null || low !== null || debugMode;

  // Parse tide times to Date objects
  const highDate = useMemo(() => parseTideTime(timeHigh), [timeHigh]);
  const lowDate = useMemo(() => parseTideTime(timeLow), [timeLow]);


  // Generate tide curve data points using Rule of Twelfths
  const chartData = useMemo(() => {
    const safeHigh = high || 4.2;
    const safeLow = low || 0.8;
    const safeHighDate = highDate || (() => { const d = vesselNow(); d.setHours(14, 0, 0, 0); return d; })();
    const safeLowDate = lowDate || (() => { const d = vesselNow(); d.setHours(8, 0, 0, 0); return d; })();

    const data = [];
    const now = vesselNow();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Generate a point every 30 minutes for 24 hours
    for (let i = 0; i <= 48; i++) {
      const targetTime = new Date(startOfDay.getTime() + i * 30 * 60 * 1000);
      const height = estimateTideHeight(safeHigh, safeLow, targetTime, safeHighDate, safeLowDate);
      data.push({
        time: targetTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
        height,
        ms: targetTime.getTime(),
        isNow: Math.abs(targetTime.getTime() - now.getTime()) < 15 * 60 * 1000
      });
    }
    return data;
  }, [high, low, highDate, lowDate]);

  // Rising when the next high water comes before the next low water; without
  // both times, from the slope of the curve now
  const isRising = useMemo(() => {
    if (highDate && lowDate) return highDate.getTime() < lowDate.getTime();
    const now = vesselNow().getTime();
    const i = chartData.findIndex(p => p.ms > now);
    if (i <= 0) return false;
    return chartData[i].height > chartData[i - 1].height;
  }, [highDate, lowDate, chartData]);
  const tideColor = isRising ? tokens.ok : tokens.accent;

  return { hasData, level, high, low, timeHigh, timeLow, coefficient, isRising, tideColor, chartData };
};

export default useTideCurve;
