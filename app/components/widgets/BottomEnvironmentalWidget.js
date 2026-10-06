import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { convertPressure } from '../context/OcearoContext';
import { convertTemperatureUnit, getTemperatureUnitLabel } from '../utils/UnitConversions';
import { useSignalKPaths } from '../hooks/useSignalK';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloud, faDroplet, faWind, faLungs, faSmog, faTemperatureLow, faSun, faEye } from '@fortawesome/free-solid-svg-icons';
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
    // BME680 reports gas resistance in ohms — higher means cleaner air
    format: (value) => `${Math.round(value)} kΩ`,
    transform: (value) => value / 1000
  },
  co2: {
    key: 'co2',
    path: 'environment.inside.co2',
    icon: faLungs,
    labelKey: 'environmental.co2',
    format: (value) => `${Math.round(value)} ppm`,
    transform: (value) => value
  },
  pm25: {
    key: 'pm25',
    path: 'environment.inside.pm25',
    icon: faSmog,
    labelKey: 'environmental.pm25',
    format: (value) => `${Math.round(value)} µg/m³`,
    transform: (value) => value
  },
  dewPoint: {
    key: 'dewPoint',
    path: 'environment.inside.dewPoint',
    icon: faTemperatureLow,
    labelKey: 'environmental.dewPoint',
    format: (value) => `${value.toFixed(1)}${getTemperatureUnitLabel()}`,
    transform: convertTemperatureUnit
  },
  outsideHumidity: {
    key: 'outsideHumidity',
    path: 'environment.outside.relativeHumidity',
    icon: faDroplet,
    labelKey: 'environmental.outsideHumidity',
    format: (value) => `${Math.round(value)}%`,
    transform: (value) => value * 100
  },
  uvIndex: {
    key: 'uvIndex',
    path: 'environment.outside.uvIndex',
    icon: faSun,
    labelKey: 'environmental.uvIndex',
    format: (value) => value.toFixed(1),
    transform: (value) => value
  },
  visibility: {
    key: 'visibility',
    path: 'environment.outside.visibility',
    icon: faEye,
    labelKey: 'environmental.visibility',
    // Metres -> nautical miles
    format: (value) => `${value >= 10 ? Math.round(value) : value.toFixed(1)} NM`,
    transform: (value) => value / 1852
  }
};

const EnvironmentalDisplay = ({ mode, value, icon }) => {
  const { t } = useTranslation();
  const textColor = 'text-hud-main';
  
  if (!value && value !== 0) {
    return null;
  }

  return (
    <div className={`flex items-center flex-shrink-0 space-x-2 sm:space-x-3 px-2 sm:px-3 py-1.5 transition-all duration-300 ${textColor}`}>
      <FontAwesomeIcon icon={icon} className="text-base sm:text-lg opacity-80" />
      <div className="flex flex-col flex-shrink-0">
        <span className="ocearo-large-label text-caption font-semibold uppercase tracking-widest text-hud-muted leading-none mb-1">
          {t(ENVIRONMENTAL_MODES[mode].labelKey)}
        </span>
        <span className="text-label sm:text-value font-bold tracking-tight leading-none whitespace-nowrap">
          {ENVIRONMENTAL_MODES[mode].format(value)}
        </span>
      </div>
    </div>
  );
};

const BottomEnvironmentalWidget = () => {
  const [availableModes, setAvailableModes] = useState([]);
  const [displayMode, setDisplayMode] = useState(null);

  // Subscribe to all relevant environmental paths
  const paths = useMemo(() => Object.values(ENVIRONMENTAL_MODES).map(m => m.path), []);
  const signalkValues = useSignalKPaths(paths);

  // Get environmental data using specialized hooks for better performance
  const environmentalData = useMemo(() => {
    return Object.entries(ENVIRONMENTAL_MODES).reduce((acc, [key, config]) => {
      const value = signalkValues[config.path];
      acc[key] = value !== null && value !== undefined ? config.transform(value) : null;
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

  // No sensor reports it: no chip, rather than an "N/A" in the bar
  if (availableModes.length === 0) return null;

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
        />
      )}
    </div>
  );
};

export default BottomEnvironmentalWidget;