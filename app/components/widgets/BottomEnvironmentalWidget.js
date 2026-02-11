import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { convertPressure, useOcearoContext } from '../context/OcearoContext';
import { useSignalKPaths } from '../hooks/useSignalK';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloud, faDroplet, faWind } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const ENVIRONMENTAL_MODES = {
  pressure: {
    key: 'pressure',
    path: 'environment.outside.pressure',
    icon: faCloud,
    labelKey: 'environmental.pressure',
    format: (value) => `${value} hPa`,
    transform: convertPressure
  },
  humidity: {
    key: 'humidity',
    path: 'environment.inside.relativeHumidity',
    icon: faDroplet,
    labelKey: 'environmental.humidity',
    format: (value) => `${(value).toFixed(1)}%`,
    transform: (value) => value * 100
  },
  voc: {
    key: 'voc',
    path: 'environment.inside.voc',
    icon: faWind,
    labelKey: 'environmental.voc',
    format: (value) => `${value} ppm`,
    transform: (value) => value
  }
};

const EnvironmentalDisplay = ({ mode, value, icon, nightMode }) => {
  const { t } = useTranslation();
  const textColor = nightMode ? 'text-oNight' : 'text-hud-main';
  
  if (!value && value !== 0) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-3 px-3 py-1.5 transition-all duration-300 ${textColor}`}>
      <FontAwesomeIcon icon={icon} className="text-lg opacity-80" />
      <div className="flex flex-col">
        <span className="text-xs font-black uppercase tracking-widest text-hud-muted leading-none mb-1">
          {t(ENVIRONMENTAL_MODES[mode].labelKey)}
        </span>
        <span className="text-xl font-bold tracking-tight leading-none">
          {ENVIRONMENTAL_MODES[mode].format(value)}
        </span>
      </div>
    </div>
  );
};

const BottomEnvironmentalWidget = () => {
  const { nightMode } = useOcearoContext();
  const [availableModes, setAvailableModes] = useState([]);
  const [displayMode, setDisplayMode] = useState(null);

  // Subscribe to all relevant environmental paths
  const paths = useMemo(() => Object.values(ENVIRONMENTAL_MODES).map(m => m.path), []);
  const signalkValues = useSignalKPaths(paths);

  // Get environmental data using specialized hooks for better performance
  const environmentalData = useMemo(() => {
    return Object.entries(ENVIRONMENTAL_MODES).reduce((acc, [key, config]) => {
      const value = signalkValues[config.path];
      acc[key] = value !== null ? config.transform(value) : null;
      return acc;
    }, {});
  }, [signalkValues]);

  // Update available modes when data changes
  useEffect(() => {
    const modes = Object.entries(environmentalData)
      .filter(([_, value]) => value !== null)
      .map(([key]) => key);

    setAvailableModes(modes);
    
    if (modes.length > 0 && !modes.includes(displayMode)) {
      setDisplayMode(modes[0]);
    }
  }, [environmentalData, displayMode]);

  const toggleDisplayMode = useCallback(() => {
    if (availableModes.length <= 1) return;

    const currentIndex = availableModes.indexOf(displayMode);
    const nextIndex = (currentIndex + 1) % availableModes.length;
    setDisplayMode(availableModes[nextIndex]);
  }, [availableModes, displayMode]);

  if (availableModes.length === 0) {
    return (
      <div className={`px-3 py-1.5 ${nightMode ? 'text-oNight' : 'text-hud-muted'}`}>
        <span className="text-sm font-black uppercase tracking-widest">N/A</span>
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer flex items-center group"
      onClick={toggleDisplayMode}
      title={`Toggle Environmental Display (${availableModes.length} modes available)`}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && toggleDisplayMode()}
    >
      {displayMode && (
        <EnvironmentalDisplay
          mode={displayMode}
          value={environmentalData[displayMode]}
          icon={ENVIRONMENTAL_MODES[displayMode].icon}
          nightMode={nightMode}
        />
      )}
    </div>
  );
};

export default BottomEnvironmentalWidget;