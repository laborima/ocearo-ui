'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useOcearoContext } from '../context/OcearoContext';

/**
 * useSignalKPath - A hook to subscribe to a specific SignalK data path.
 * This helps avoid re-rendering components when unrelated SignalK data changes.
 * 
 * @param {string} path - The SignalK path to subscribe to
 * @param {any} defaultValue - Default value if path is not found
 * @returns {any} The value at the specified path
 */
export const useSignalKPath = (path, defaultValue = null) => {
  const { getSignalKValue, subscribe, unsubscribe } = useOcearoContext();
  const [value, setValue] = useState(() => getSignalKValue(path) ?? defaultValue);
  const pathRef = useRef(path);

  const updateValue = useCallback((newValue) => {
    setValue(newValue ?? defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    pathRef.current = path;
    
    // Subscribe to updates for this path
    if (subscribe) {
      subscribe(path, updateValue);
    }

    // Initial sync
    setValue(getSignalKValue(path) ?? defaultValue);

    return () => {
      if (unsubscribe) {
        unsubscribe(path, updateValue);
      }
    };
  }, [path, subscribe, unsubscribe, getSignalKValue, updateValue, defaultValue]);

  return value;
};

/**
 * useSignalKPaths - A hook to subscribe to multiple SignalK data paths.
 * 
 * @param {Array<string>} paths - Array of SignalK paths
 * @returns {Object} Map of paths to their values
 */
export const useSignalKPaths = (paths) => {
  const { getSignalKValue, subscribe, unsubscribe } = useOcearoContext();
  const [values, setValues] = useState(() => {
    const initial = {};
    paths.forEach(path => {
      initial[path] = getSignalKValue(path);
    });
    return initial;
  });

  const updateValues = useCallback((path, value) => {
    setValues(prev => ({
      ...prev,
      [path]: value
    }));
  }, []);

  useEffect(() => {
    if (subscribe) {
      paths.forEach(path => subscribe(path, (val) => updateValues(path, val)));
    }

    return () => {
      if (unsubscribe) {
        paths.forEach(path => unsubscribe(path, (val) => updateValues(path, val)));
      }
    };
  }, [paths, subscribe, unsubscribe, updateValues]);

  return values;
};
