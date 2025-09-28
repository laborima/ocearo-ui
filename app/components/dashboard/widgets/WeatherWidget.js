'use client';
import React, { useMemo } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCloudSun, 
  faSun, 
  faCloud, 
  faCloudRain, 
  faCloudShowersHeavy,
  faSnowflake,
  faWind
} from '@fortawesome/free-solid-svg-icons';

export default function WeatherWidget() {
  const { getSignalKValue } = useOcearoContext();
  
  const weatherData = useMemo(() => {
    const temperature = getSignalKValue('environment.outside.temperature') || 288.15; // Kelvin
    const humidity = getSignalKValue('environment.outside.humidity') || 0.65;
    const pressure = getSignalKValue('environment.outside.pressure') || 101325; // Pascal
    const windSpeed = getSignalKValue('environment.wind.speedTrue') || 5.2; // m/s
    const windDirection = getSignalKValue('environment.wind.directionTrue') || 2.1; // radians
    
    // Mock weather condition based on pressure and humidity
    let condition = 'sunny';
    if (pressure < 100000) {
      if (humidity > 0.8) condition = 'rainy';
      else condition = 'cloudy';
    } else if (pressure > 102000) {
      condition = 'sunny';
    } else {
      condition = 'partly-cloudy';
    }
    
    return {
      temperature: Math.round((temperature - 273.15) * 10) / 10, // Celsius
      humidity: Math.round(humidity * 100),
      pressure: Math.round(pressure / 100), // hPa
      windSpeed: Math.round(windSpeed * 1.94384 * 10) / 10, // knots
      windDirection: Math.round((windDirection * 180 / Math.PI) % 360),
      condition
    };
  }, [getSignalKValue]);

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

  const pressureTrend = getPressureTrend(weatherData.pressure);

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={getWeatherIcon(weatherData.condition)} className="text-oBlue text-lg" />
        <span className="text-white font-medium text-lg">Weather</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Main weather display */}
        <div className="text-center mb-4">
          <FontAwesomeIcon 
            icon={getWeatherIcon(weatherData.condition)} 
            className={`text-4xl mb-2 ${getWeatherColor(weatherData.condition)}`} 
          />
          <div className="text-3xl font-bold text-white mb-1">
            {weatherData.temperature}°C
          </div>
          <div className="text-base text-gray-300">
            {getWeatherDescription(weatherData.condition)}
          </div>
        </div>

        {/* Weather details grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Humidity */}
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">Humidity</div>
            <div className="text-white font-medium text-lg">{weatherData.humidity}%</div>
          </div>
          
          {/* Pressure */}
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">Pressure</div>
            <div className="flex items-center justify-center space-x-1">
              <span className="text-white font-medium text-lg">{weatherData.pressure}</span>
              <span className={`text-xs ${pressureTrend.color}`}>{pressureTrend.trend}</span>
            </div>
            <div className="text-gray-400 text-sm">hPa</div>
          </div>
        </div>

        {/* Wind information */}
        <div className="bg-oGray1 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faWind} className="text-oBlue text-sm" />
              <span className="text-white text-sm font-medium">Wind</span>
            </div>
            <div className="text-right">
              <div className="text-white font-medium">
                {weatherData.windSpeed} kts
              </div>
              <div className="text-gray-400 text-xs">
                {getWindDirection(weatherData.windDirection)} ({weatherData.windDirection}°)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
