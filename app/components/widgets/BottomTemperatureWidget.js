import { useState, useEffect, useMemo } from 'react';
import { convertTemperature, useOcearoContext } from '../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faThermometerHalf, 
  faWater, 
  faFire, 
  faSnowflake 
} from '@fortawesome/free-solid-svg-icons';

const TEMPERATURE_MODES = {
  waterTemp: {
    key: 'waterTemp',
    path: 'environment.water.temperature',
    icon: faWater,
    label: 'Water Temperature',
    format: (value) => `${value}°C`,
    transform: convertTemperature
  },
  airTemp: {
    key: 'airTemp',
    path: 'environment.outside.temperature',
    icon: faThermometerHalf,
    label: 'Air Temperature',
    format: (value) => `${value}°C`,
    transform: convertTemperature
  },
  exhaustTemp: {
    key: 'exhaustTemp',
    path: 'propulsion.main.exhaustTemperature',
    icon: faFire,
    label: 'Exhaust Temperature',
    format: (value) => `${value}°C`,
    transform: convertTemperature
  },
  fridgeTemp: {
    key: 'fridgeTemp',
    path: 'environment.inside.fridge.temperature',
    icon: faSnowflake,
    label: 'Fridge Temperature',
    format: (value) => `${value}°C`,
    transform: convertTemperature
  }
};

const TemperatureDisplay = ({ mode, value, icon, nightMode }) => {
  const textColor = nightMode ? 'text-red-500' : 'text-white';
  
  if (!value && value !== 0) {
    return null;
  }

  return (
    <div className={`flex items-center text-2xl ${textColor}`}>
      <FontAwesomeIcon icon={icon} className="mr-2" />
      <span>{TEMPERATURE_MODES[mode].format(value)}</span>
    </div>
  );
};

const BottomTemperatureWidget = () => {
  const { nightMode, getSignalKValue } = useOcearoContext();
  const [availableModes, setAvailableModes] = useState([]);
  const [displayMode, setDisplayMode] = useState(null);

  // Get temperature data
  const temperatureData = useMemo(() => {
    return Object.entries(TEMPERATURE_MODES).reduce((acc, [key, config]) => {
      const value = getSignalKValue(config.path);
      acc[key] = value !== null ? config.transform(value) : null;
      return acc;
    }, {});
  }, [getSignalKValue]);

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

  const toggleDisplayMode = () => {
    if (availableModes.length <= 1) return;

    const currentIndex = availableModes.indexOf(displayMode);
    const nextIndex = (currentIndex + 1) % availableModes.length;
    setDisplayMode(availableModes[nextIndex]);
  };

  if (availableModes.length === 0) {
    return (
      <div className={`text-2xl ${nightMode ? 'text-red-500' : 'text-white'}`}>
        <span>NA</span>
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer flex items-center space-x-2"
      onClick={toggleDisplayMode}
      title={`Toggle Temperature Display (${availableModes.length} sensors available)`}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && toggleDisplayMode()}
      aria-label={displayMode ? TEMPERATURE_MODES[displayMode].label : 'No temperature data available'}
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