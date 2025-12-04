'use client';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import configService from '../../settings/ConfigService';
import signalKService from '../../services/SignalKService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCloudSun, 
  faSun, 
  faCloud, 
  faCloudRain, 
  faCloudShowersHeavy,
  faSnowflake,
  faWind,
  faSync
} from '@fortawesome/free-solid-svg-icons';

export default function WeatherWidget() {
  const { getSignalKValue, nightMode } = useOcearoContext();
  const debugMode = configService.get('debugMode');
  const primaryTextClass = nightMode ? 'text-oNight' : 'text-white';
  const secondaryTextClass = nightMode ? 'text-oNight' : 'text-gray-400';
  const mutedTextClass = nightMode ? 'text-oNight' : 'text-gray-500';
  const accentIconClass = nightMode ? 'text-oNight' : 'text-oBlue';
  
  // State for weather API forecast data
  const [forecastData, setForecastData] = useState(null);
  const [forecastError, setForecastError] = useState(null);
  const [isFetchingForecast, setIsFetchingForecast] = useState(false);
  const [weatherApiAvailable, setWeatherApiAvailable] = useState(null);

  /**
   * Fetch weather forecast from SignalK Weather API
   * Similar to freeboard-sk implementation
   */
  const fetchWeatherForecast = useCallback(async () => {
    const position = getSignalKValue('navigation.position');
    
    if (!position?.latitude || !position?.longitude) {
      return;
    }

    setIsFetchingForecast(true);
    setForecastError(null);

    try {
      // Check if weather API is available
      const isAvailable = await signalKService.checkWeatherApiAvailability();
      setWeatherApiAvailable(isAvailable);

      if (!isAvailable) {
        setForecastError('Weather API not available');
        return;
      }

      // Fetch forecast
      const rawForecast = await signalKService.getWeatherForecast(
        position.latitude,
        position.longitude
      );

      // Parse forecast data
      const parsedForecast = signalKService.parseWeatherForecast(rawForecast);
      setForecastData(parsedForecast);
    } catch (error) {
      console.error('WeatherWidget: Failed to fetch forecast:', error);
      setForecastError(error.message);
    } finally {
      setIsFetchingForecast(false);
    }
  }, [getSignalKValue]);

  // Fetch weather forecast on mount and periodically
  useEffect(() => {
    // Initial fetch after a short delay to allow position to be available
    const initialFetchTimeout = setTimeout(() => {
      fetchWeatherForecast();
    }, 5000);

    // Refresh forecast every 30 minutes
    const refreshInterval = setInterval(() => {
      fetchWeatherForecast();
    }, 30 * 60 * 1000);

    return () => {
      clearTimeout(initialFetchTimeout);
      clearInterval(refreshInterval);
    };
  }, [fetchWeatherForecast]);

  const weatherData = useMemo(() => {
    // First try to get data from SignalK sensors
    const temperature = getSignalKValue('environment.outside.temperature');
    const humidity = getSignalKValue('environment.outside.humidity');
    const pressure = getSignalKValue('environment.outside.pressure');
    const windSpeed = getSignalKValue('environment.wind.speedTrue');
    const windDirection = getSignalKValue('environment.wind.directionTrue');
    
    // Check if sensor data is available
    const hasSensorData = temperature !== null || humidity !== null || pressure !== null || windSpeed !== null;
    
    // If no sensor data, try to use forecast data as fallback
    const currentForecast = forecastData && forecastData.length > 0 ? forecastData[0] : null;
    
    // Determine data source
    let tempValue = temperature;
    let humidityValue = humidity;
    let pressureValue = pressure;
    let windSpeedValue = windSpeed;
    let windDirectionValue = windDirection;
    let description = null;
    let dataSource = 'sensors';

    // Use forecast data as fallback if no sensor data
    if (!hasSensorData && currentForecast) {
      tempValue = currentForecast.temperature !== null ? currentForecast.temperature + 273.15 : null;
      humidityValue = currentForecast.humidity !== null ? currentForecast.humidity / 100 : null;
      pressureValue = currentForecast.pressure;
      windSpeedValue = currentForecast.wind?.speed !== null ? currentForecast.wind.speed / 1.94384 : null;
      windDirectionValue = currentForecast.wind?.direction !== null ? currentForecast.wind.direction * Math.PI / 180 : null;
      description = currentForecast.description;
      dataSource = 'forecast';
    }

    // Check if we have any data now
    const hasData = tempValue !== null || humidityValue !== null || pressureValue !== null || windSpeedValue !== null;
    
    if (!hasData && !debugMode) {
      return { hasData: false, dataSource: null };
    }

    // Use defaults in debug mode if still no data
    if (!hasData && debugMode) {
      tempValue = 288.15;
      humidityValue = 0.65;
      pressureValue = 101325;
      windSpeedValue = 5.2;
      windDirectionValue = 2.1;
      dataSource = 'debug';
    }
    
    // Determine weather condition based on pressure, humidity, and description
    let condition = 'sunny';
    if (description) {
      const desc = description.toLowerCase();
      if (desc.includes('rain') || desc.includes('shower')) condition = 'rainy';
      else if (desc.includes('snow')) condition = 'snow';
      else if (desc.includes('cloud') || desc.includes('overcast')) condition = 'cloudy';
      else if (desc.includes('partly') || desc.includes('few clouds')) condition = 'partly-cloudy';
      else if (desc.includes('clear') || desc.includes('sun')) condition = 'sunny';
    } else if (pressureValue) {
      if (pressureValue < 100000) {
        if (humidityValue && humidityValue > 0.8) condition = 'rainy';
        else condition = 'cloudy';
      } else if (pressureValue > 102000) {
        condition = 'sunny';
      } else {
        condition = 'partly-cloudy';
      }
    }
    
    return {
      hasData: true,
      dataSource,
      description,
      temperature: tempValue ? Math.round((tempValue - 273.15) * 10) / 10 : null,
      humidity: humidityValue ? Math.round(humidityValue * 100) : null,
      pressure: pressureValue ? Math.round(pressureValue / 100) : null,
      windSpeed: windSpeedValue ? Math.round(windSpeedValue * 1.94384 * 10) / 10 : null,
      windDirection: windDirectionValue ? Math.round((windDirectionValue * 180 / Math.PI) % 360) : null,
      condition,
      forecast: forecastData
    };
  }, [getSignalKValue, debugMode, forecastData]);

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'sunny': return faSun;
      case 'partly-cloudy': return faCloudSun;
      case 'cloudy': return faCloud;
      case 'rainy': return faCloudRain;
      case 'heavy-rain': return faCloudShowersHeavy;
      case 'snow': return faSnowflake;
      default: return faCloudSun;
    }
  };

  const getWeatherColor = (condition) => {
    switch (condition) {
      case 'sunny': return 'text-oYellow';
      case 'partly-cloudy': return 'text-oBlue';
      case 'cloudy': return 'text-gray-400';
      case 'rainy': return 'text-oBlue';
      case 'heavy-rain': return 'text-blue-600';
      case 'snow': return 'text-white';
      default: return 'text-oBlue';
    }
  };

  const getWeatherDescription = (condition) => {
    switch (condition) {
      case 'sunny': return 'Clear skies';
      case 'partly-cloudy': return 'Partly cloudy';
      case 'cloudy': return 'Overcast';
      case 'rainy': return 'Light rain';
      case 'heavy-rain': return 'Heavy rain';
      case 'snow': return 'Snow';
      default: return 'Variable';
    }
  };

  const getPressureTrend = (pressure) => {
    if (pressure > 1020) return { trend: '↗', text: 'Rising', color: 'text-oGreen' };
    if (pressure < 1000) return { trend: '↘', text: 'Falling', color: 'text-oRed' };
    return { trend: '→', text: 'Stable', color: 'text-oBlue' };
  };

  const getWindDirection = (degrees) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return directions[Math.round(degrees / 22.5) % 16];
  };

  const pressureTrend = weatherData.hasData ? getPressureTrend(weatherData.pressure) : null;

  // Get data source label
  const getDataSourceLabel = () => {
    switch (weatherData.dataSource) {
      case 'sensors': return 'Live';
      case 'forecast': return 'Forecast';
      case 'debug': return 'Demo';
      default: return '';
    }
  };

  if (!weatherData.hasData) {
    return (
      <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faCloudSun} className={`${accentIconClass} text-lg`} />
            <span className={`${primaryTextClass} font-medium text-lg`}>Weather</span>
          </div>
          {weatherApiAvailable !== false && (
            <button 
              onClick={fetchWeatherForecast}
              disabled={isFetchingForecast}
              className={`${accentIconClass} hover:text-white transition-colors`}
              title="Refresh weather forecast"
            >
              <FontAwesomeIcon 
                icon={faSync} 
                className={`text-sm ${isFetchingForecast ? 'animate-spin' : ''}`} 
              />
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 mb-2">N/A</div>
            <div className={`text-sm ${mutedTextClass}`}>
              {isFetchingForecast ? 'Loading forecast...' : 'No weather data available'}
            </div>
            {forecastError && (
              <div className="text-xs text-oRed mt-1">{forecastError}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FontAwesomeIcon icon={getWeatherIcon(weatherData.condition)} className={`${accentIconClass} text-lg`} />
          <span className={`${primaryTextClass} font-medium text-lg`}>Weather</span>
          {weatherData.dataSource && (
            <span className={`text-xs px-2 py-0.5 rounded ${
              weatherData.dataSource === 'sensors' ? 'bg-oGreen text-white' :
              weatherData.dataSource === 'forecast' ? 'bg-oBlue text-white' :
              'bg-gray-500 text-white'
            }`}>
              {getDataSourceLabel()}
            </span>
          )}
        </div>
        {weatherApiAvailable !== false && (
          <button 
            onClick={fetchWeatherForecast}
            disabled={isFetchingForecast}
            className={`${accentIconClass} hover:text-white transition-colors`}
            title="Refresh weather forecast"
          >
            <FontAwesomeIcon 
              icon={faSync} 
              className={`text-sm ${isFetchingForecast ? 'animate-spin' : ''}`} 
            />
          </button>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Main weather display */}
        <div className="text-center mb-4">
          <FontAwesomeIcon 
            icon={getWeatherIcon(weatherData.condition)} 
            className={`text-4xl mb-2 ${getWeatherColor(weatherData.condition)}`} 
          />
          <div className={`text-3xl font-bold ${primaryTextClass} mb-1`}>
            {weatherData.temperature !== null ? `${weatherData.temperature}°C` : 'N/A'}
          </div>
          <div className={`text-base ${secondaryTextClass}`}>
            {weatherData.description || getWeatherDescription(weatherData.condition)}
          </div>
        </div>

        {/* Weather details grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Humidity */}
          <div className="text-center">
            <div className={`${secondaryTextClass} text-sm mb-1`}>Humidity</div>
            <div className={`${primaryTextClass} font-medium text-lg`}>{weatherData.humidity !== null ? `${weatherData.humidity}%` : 'N/A'}</div>
          </div>
          
          {/* Pressure */}
          <div className="text-center">
            <div className={`${secondaryTextClass} text-sm mb-1`}>Pressure</div>
            <div className="flex items-center justify-center space-x-1">
              <span className={`${primaryTextClass} font-medium text-lg`}>{weatherData.pressure !== null ? weatherData.pressure : 'N/A'}</span>
              {pressureTrend && <span className={`text-xs ${pressureTrend.color}`}>{pressureTrend.trend}</span>}
            </div>
            <div className={`${secondaryTextClass} text-sm`}>hPa</div>
          </div>
        </div>

        {/* Wind information */}
        <div className="bg-oGray1 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faWind} className={`${accentIconClass} text-sm`} />
              <span className={`${primaryTextClass} text-sm font-medium`}>Wind</span>
            </div>
            <div className="text-right">
              <div className={`${primaryTextClass} font-medium`}>
                {weatherData.windSpeed !== null ? `${weatherData.windSpeed} kts` : 'N/A'}
              </div>
              <div className={`${secondaryTextClass} text-xs`}>
                {weatherData.windDirection !== null ? `${getWindDirection(weatherData.windDirection)} (${weatherData.windDirection}°)` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
