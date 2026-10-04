'use client';
import { useMemo } from 'react';
import { useSignalKPrefix } from '../hooks/useSignalK';
import useSignalKFeatures from '../hooks/useSignalKFeatures';
import { EARTH_RADIUS_METERS } from '../utils/UnitConversions';

// The server emits each MOB as notifications.mob.<id>; older senders use the bare path
const MOB_PATH = 'notifications.mob';

const isMobPath = (path) => path === MOB_PATH || path.startsWith(`${MOB_PATH}.`);

/**
 * Person Overboard alarms currently raised on the server, oldest first.
 * A cleared alarm stays in the data model with state `normal` and is dropped here.
 * @returns {Array<Object>} notification values, each with its `path`
 */
export const useActiveMobs = () => {
  const values = useSignalKPrefix(MOB_PATH);
  return useMemo(() => Object.entries(values)
    .filter(([path, value]) => isMobPath(path) && value?.state && value.state !== 'normal')
    .map(([path, value]) => ({ ...value, path }))
    .sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''))),
  [values]);
};

/**
 * Which MOB actions the server supports, from /signalk/v2/features.
 * `raise` needs the Notifications API (server >= 2.28), `navigate` the Course API.
 */
export const useMobSupport = () => {
  const features = useSignalKFeatures();
  return useMemo(() => ({
    raise: !!features?.apis.includes('notifications'),
    navigate: !!features?.apis.includes('course'),
  }), [features]);
};

const toRad = (deg) => deg * Math.PI / 180;

/**
 * Great-circle distance (m) and initial true bearing (deg) from `from` to `to`,
 * both Signal K positions ({ latitude, longitude }). Null if either is missing.
 */
export const distanceAndBearing = (from, to) => {
  if (!Number.isFinite(from?.latitude) || !Number.isFinite(from?.longitude) ||
      !Number.isFinite(to?.latitude) || !Number.isFinite(to?.longitude)) {
    return null;
  }
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const dLat = lat2 - lat1;
  const dLon = toRad(to.longitude - from.longitude);

  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const distance = 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;

  return { distance, bearing };
};
