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
  const defaultValueRef = useRef(defaultValue);
  const lastKnownRef = useRef(value);
  defaultValueRef.current = defaultValue;

  const updateValue = useCallback((newValue) => {
    const resolved = newValue ?? defaultValueRef.current;
    lastKnownRef.current = resolved;
    setValue(resolved);
  }, []);

  useEffect(() => {
    if (subscribe) {
      subscribe(path, updateValue);
    }

    // Initial sync — only update if we get a real value, otherwise keep last known
    const current = getSignalKValue(path);
    if (current != null) {
      lastKnownRef.current = current;
      setValue(current);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe(path, updateValue);
      }
    };
  }, [path, subscribe, unsubscribe, getSignalKValue, updateValue]);

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

  // Stabilize paths array by content — prevents infinite re-render loops
  // when callers pass a new array reference with the same paths each render
  const pathsKey = JSON.stringify(paths);
  const stablePaths = useRef(paths);
  if (JSON.stringify(stablePaths.current) !== pathsKey) {
    stablePaths.current = paths;
  }

  const [values, setValues] = useState(() => {
    const initial = {};
    stablePaths.current.forEach(path => {
      initial[path] = getSignalKValue(path);
    });
    return initial;
  });

  useEffect(() => {
    const currentPaths = stablePaths.current;
    // Create one stable callback per path
    const callbacks = {};
    currentPaths.forEach(path => {
      callbacks[path] = (val) => {
        setValues(prev => {
          if (prev[path] === val) return prev;
          return { ...prev, [path]: val };
        });
      };
    });

    if (subscribe) {
      currentPaths.forEach(path => subscribe(path, callbacks[path]));
    }

    // Initial sync
    const initial = {};
    let changed = false;
    currentPaths.forEach(path => {
      const current = getSignalKValue(path);
      if (current != null) {
        initial[path] = current;
        changed = true;
      }
    });
    if (changed) {
      setValues(prev => ({ ...prev, ...initial }));
    }

    return () => {
      if (unsubscribe) {
        currentPaths.forEach(path => {
          if (callbacks[path]) {
            unsubscribe(path, callbacks[path]);
          }
        });
      }
    };
  }, [pathsKey, subscribe, unsubscribe, getSignalKValue]);

  return values;
};
