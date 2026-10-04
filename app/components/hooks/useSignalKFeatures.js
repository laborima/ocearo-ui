'use client';
import { useState, useEffect } from 'react';
import signalKService from '../services/SignalKService';

// Server unreachable at startup (boat network still booting): try again later
const RETRY_MS = 30000;

/**
 * useSignalKFeatures - Server capabilities from /signalk/v2/features.
 * Lets a component show a control only when the server can serve it.
 *
 * @returns {{apis: string[], plugins: Array<{id: string, version: string}>}|null}
 *          null until the server has answered
 */
const useSignalKFeatures = () => {
  const [features, setFeatures] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const load = async () => {
      const result = await signalKService.getFeatures();
      if (cancelled) return;
      if (result) {
        setFeatures(result);
      } else {
        timer = setTimeout(load, RETRY_MS);
      }
    };
    load();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return features;
};

export default useSignalKFeatures;
