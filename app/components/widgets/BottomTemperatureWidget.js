import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOcearoContext } from '../context/OcearoContext';
import { convertTemperatureUnit, getTemperatureUnitLabel } from '../utils/UnitConversions';
import { useSignalKPaths } from '../hooks/useSignalK';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faThermometerHalf, 
  faWater, 
  faFire, 
  faSnowflake 
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const TEMPERATURE_MODES = {
  waterTemp: {
    key: 'waterTemp',
    path: 'environment.water.temperature',
    icon: faWater,
    labelKey: 'temperature.waterTemperature',
    format: (value) => `${value}${getTemperatureUnitLabel()}`,
    transform: convertTemperatureUnit
  },
  airTemp: {
    key: 'airTemp',
    path: 'environment.outside.temperature',
    icon: faThermometerHalf,
    labelKey: 'temperature.airTemperature',
    format: (value) => `${value}${getTemperatureUnitLabel()}`,
    transform: convertTemperatureUnit
  },
  exhaustTemp: {
    key: 'exhaustTemp',
    path: 'propulsion.main.exhaustTemperature',
    icon: faFire,
    labelKey: 'temperature.exhaustTemperature',
    format: (value) => `${value}${getTemperatureUnitLabel()}`,
    transform: convertTemperatureUnit
  },
  fridgeTemp: {
    key: 'fridgeTemp',
    path: 'environment.inside.fridge.temperature',
    icon: faSnowflake,
    labelKey: 'temperature.fridgeTemperature',
    format: (value) => `${value}${getTemperatureUnitLabel()}`,
    transform: convertTemperatureUnit
  }
};

const TemperatureDisplay = ({ mode, value, icon, nightMode }) => {
  const { t } = useTranslation();
  const textColor = nightMode ? 'text-oNight' : 'text-hud-main';
  
  if (!value && value !== 0) {
    return null;
  }

  const label = t(TEMPERATURE_MODES[mode].labelKey);

  return (
    <div className={`flex items-center space-x-3 px-3 py-1.5 transition-all duration-300 ${textColor}`}>
      <FontAwesomeIcon icon={icon} className="text-lg opacity-80" />
      <div className="flex flex-col">
        <span className="text-xs font-black uppercase tracking-widest text-hud-muted leading-none mb-1">
          {label.split(' ')[0]}
        </span>
        <span className="text-xl font-bold tracking-tight leading-none">
          {TEMPERATURE_MODES[mode].format(value)}
        </span>
      </div>
    </div>
  );
};

const BottomTemperatureWidget = () => {
  const { t } = useTranslation();
  const { nightMode } = useOcearoContext();
  const [availableModes, setAvailableModes] = useState([]);
  const [displayMode, setDisplayMode] = useState(null);

  // Subscribe to all relevant temperature paths
  const paths = useMemo(() => Object.values(TEMPERATURE_MODES).map(m => m.path), []);
  const signalkValues = useSignalKPaths(paths);

  // Get temperature data using specialized hooks for better performance
  const temperatureData = useMemo(() => {
    return Object.entries(TEMPERATURE_MODES).reduce((acc, [key, config]) => {
      const value = signalkValues[config.path];
      acc[key] = value !== null ? config.transform(value) : null;
      return acc;
    }, {});
  }, [signalkValues]);

  // Update available modes when data changes
  useEffect(() => {
    const modes = Object.entries(temperatureData)
      .filter(([_, value]) => value !== null)
      .map(([key]) => key);

    setAvailableModes(modes);
    
    if (modes.length > 0 && !modes.includes(displayMode)) {
      setDisplayMode(modes[0]);
    }
  }, [temperatureData, displayMode]);

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
      title={`Toggle Temperature Display (${availableModes.length} sensors available)`}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && toggleDisplayMode()}
      aria-label={displayMode ? t(TEMPERATURE_MODES[displayMode].labelKey) : t('common.na')}
    >
      {displayMode && (
        <TemperatureDisplay
          mode={displayMode}
          value={temperatureData[displayMode]}
          icon={TEMPERATURE_MODES[displayMode].icon}
          nightMode={nightMode}
        />
      )}
    </div>
  );
};

export default BottomTemperatureWidget;