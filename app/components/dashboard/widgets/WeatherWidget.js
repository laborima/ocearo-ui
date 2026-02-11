'use client';
import React, { useMemo } from 'react';
import BaseWidget from './BaseWidget';
import configService from '../../settings/ConfigService';
import { useWeather } from '../../context/WeatherContext';
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
import { useTranslation } from 'react-i18next';

export default function WeatherWidget() {
  const { t } = useTranslation();
  const debugMode = configService.get('debugMode');
  
  // Use centralized WeatherContext — single fetch shared with Ocean3D and other consumers
  const { forecasts, isLoading: isFetchingForecast, weatherApiAvailable, fetchWeatherForecast, getCurrentWeather } = useWeather();

  const weatherData = useMemo(() => {
    const weather = getCurrentWeather();
    const currentForecast = forecasts.length > 0 ? forecasts[0] : null;
    
    // Convert from SignalK raw units to display units
    const tempDisplay = weather.temperature != null ? Math.round((weather.temperature - 273.15) * 10) / 10 : null;
    const humidityDisplay = weather.humidity != null ? Math.round(weather.humidity * 100) : null;
    const pressureDisplay = weather.pressure != null ? Math.round(weather.pressure / 100) : null;
    const windSpeedDisplay = weather.windSpeed != null ? Math.round(weather.windSpeed * 1.94384 * 10) / 10 : null;
    const windDirDisplay = weather.windDirection != null ? Math.round((weather.windDirection * 180 / Math.PI) % 360) : null;
    const description = weather.description;
    let dataSource = weather.source;

    // Check if we have any data now
    const hasData = tempDisplay !== null || humidityDisplay !== null || pressureDisplay !== null || windSpeedDisplay !== null;
    
    if (!hasData && !debugMode) {
      return { hasData: false, dataSource: null };
    }

    // Use defaults in debug mode if still no data
    let finalTemp = tempDisplay;
    let finalHumidity = humidityDisplay;
    let finalPressure = pressureDisplay;
    let finalWindSpeed = windSpeedDisplay;
    let finalWindDir = windDirDisplay;
    if (!hasData && debugMode) {
      finalTemp = 15;
      finalHumidity = 65;
      finalPressure = 1013;
      finalWindSpeed = 5.2;
      finalWindDir = 120;
      dataSource = 'debug';
    }
    
    // Determine weather condition
    let condition = 'sunny';
    if (description) {
      const desc = description.toLowerCase();
      if (desc.includes('rain') || desc.includes('shower')) condition = 'rainy';
      else if (desc.includes('snow')) condition = 'snow';
      else if (desc.includes('cloud') || desc.includes('overcast')) condition = 'cloudy';
      else if (desc.includes('partly') || desc.includes('few clouds')) condition = 'partly-cloudy';
      else if (desc.includes('clear') || desc.includes('sun')) condition = 'sunny';
    } else if (finalPressure) {
      if (finalPressure < 1000) {
        if (finalHumidity && finalHumidity > 80) condition = 'rainy';
        else condition = 'cloudy';
      } else if (finalPressure > 1020) {
        condition = 'sunny';
      } else {
        condition = 'partly-cloudy';
      }
    }
    
    return {
      hasData: true,
      dataSource,
      description,
      temperature: finalTemp,
      humidity: finalHumidity,
      pressure: finalPressure,
      windSpeed: finalWindSpeed,
      windDirection: finalWindDir,
      condition,
      forecast: forecasts
    };
  }, [getCurrentWeather, forecasts, debugMode]);

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
      case 'cloudy': return 'text-hud-muted';
      case 'rainy': return 'text-oBlue';
      case 'heavy-rain': return 'text-blue-600';
      case 'snow': return 'text-hud-main';
      default: return 'text-oBlue';
    }
  };

  const getWeatherDescription = (condition) => {
    switch (condition) {
      case 'sunny': return t('widgets.clearSkies');
      case 'partly-cloudy': return t('widgets.partlyCloudy');
      case 'cloudy': return t('widgets.overcast');
      case 'rainy': return t('widgets.lightRain');
      case 'heavy-rain': return t('widgets.heavyRain');
      case 'snow': return t('widgets.snow');
      default: return t('widgets.variable');
    }
  };

  const getPressureTrend = (pressure) => {
    if (pressure > 1020) return { trend: '↗', text: t('widgets.pressureRising'), color: 'text-oGreen' };
    if (pressure < 1000) return { trend: '↘', text: t('widgets.pressureFalling'), color: 'text-oRed' };
    return { trend: '→', text: t('widgets.pressureStable'), color: 'text-oBlue' };
  };

  const getWindDirection = (degrees) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return directions[Math.round(degrees / 22.5) % 16];
  };

  const pressureTrend = weatherData.hasData ? getPressureTrend(weatherData.pressure) : null;

  // Get data source label
  const getDataSourceLabel = () => {
    switch (weatherData.dataSource) {
      case 'sensors': return t('widgets.dataSourceLive');
      case 'forecast': return t('widgets.dataSourceForecast');
      case 'debug': return t('widgets.dataSourceDemo');
      default: return '';
    }
  };

  return (
    <BaseWidget
      title={t('widgets.meteorologicalData')}
      icon={getWeatherIcon(weatherData.condition)}
      hasData={weatherData.hasData}
      noDataMessage={isFetchingForecast ? t('widgets.acquiringSatellite') : t('widgets.signalLossWeather')}
    >
      {/* Header Actions */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-3">
        {weatherData.dataSource && (
          <span className={`text-xs px-2 py-0.5 rounded-sm uppercase font-black tracking-widest text-hud-main shadow-soft ${
            weatherData.dataSource === 'sensors' ? 'bg-oGreen/40 border border-oGreen/30' :
            weatherData.dataSource === 'forecast' ? 'bg-oBlue/40 border border-oBlue/30' :
            'bg-hud-elevated border border-hud'
          }`}>
            {getDataSourceLabel()}
          </span>
        )}
        {weatherApiAvailable !== false && (
          <button 
            onClick={fetchWeatherForecast}
            disabled={isFetchingForecast}
            className="w-7 h-7 rounded-full bg-hud-elevated flex items-center justify-center text-hud-secondary hover:text-hud-main transition-all duration-500 tesla-hover"
            title={t('widgets.updateForecast')}
          >
            <FontAwesomeIcon 
              icon={faSync} 
              className={`text-xs ${isFetchingForecast ? 'animate-spin' : ''}`} 
            />
          </button>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Main weather display - centered */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center mb-6 group">
            <div className={`text-5xl mb-4 transition-transform duration-700 group-hover:scale-110 ${getWeatherColor(weatherData.condition)}`}>
              <FontAwesomeIcon 
                icon={getWeatherIcon(weatherData.condition)} 
                className={weatherData.condition !== 'sunny' ? 'animate-soft-pulse' : ''}
              />
            </div>
            <div className="text-5xl font-black text-hud-main leading-none gliding-value tracking-tighter">
              {weatherData.temperature !== null ? `${weatherData.temperature}°` : t('common.na')}
            </div>
            <div className="text-xs font-black text-hud-secondary uppercase tracking-[0.3em] mt-3 opacity-60">
              {weatherData.description || getWeatherDescription(weatherData.condition)}
            </div>
          </div>

        </div>

        {/* 3-day wind + weather forecast */}
        {weatherData.forecast && weatherData.forecast.length > 1 && (
          <div className="space-y-2 shrink-0">
            {weatherData.forecast.slice(1, 4).map((day, idx) => {
              const dayDate = day.date ? new Date(day.date) : new Date(Date.now() + (idx + 1) * 86400000);
              const dayName = !isNaN(dayDate.getTime()) ? dayDate.toLocaleDateString('en-GB', { weekday: 'short' }) : day.time || `+${idx + 1}d`;
              const dayCondition = day.description ? (
                day.description.toLowerCase().includes('rain') ? 'rainy' :
                day.description.toLowerCase().includes('cloud') ? 'cloudy' :
                day.description.toLowerCase().includes('snow') ? 'snow' : 'sunny'
              ) : 'partly-cloudy';
              const dayWindSpeed = day.wind?.speed != null ? Math.round(day.wind.speed * 10) / 10 : null;
              const dayWindDir = day.wind?.direction != null ? getWindDirection(Math.round(day.wind.direction)) : null;
              return (
                <div key={idx} className="flex items-center justify-between py-1.5 border-b border-hud/30 last:border-0">
                  <div className="flex items-center space-x-3">
                    <span className="text-hud-muted text-xs font-black uppercase tracking-widest w-8">{dayName}</span>
                    <FontAwesomeIcon icon={getWeatherIcon(dayCondition)} className={`text-sm w-5 ${getWeatherColor(dayCondition)}`} />
                    <span className="text-hud-main text-sm font-black gliding-value w-8">
                      {day.temperature !== null ? `${Math.round(day.temperature)}°` : '--'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FontAwesomeIcon icon={faWind} className="text-oBlue text-xs opacity-50" />
                    <span className="text-hud-main text-xs font-black gliding-value">
                      {dayWindSpeed !== null ? `${dayWindSpeed} kts` : '--'}
                    </span>
                    {dayWindDir && (
                      <span className="text-hud-muted text-xs font-black tracking-widest opacity-60">{dayWindDir}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Current wind row */}
        <div className="flex items-center justify-between shrink-0 mt-2">
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faWind} className="text-oBlue text-sm opacity-50" />
            <span className="text-hud-secondary text-xs uppercase font-black tracking-widest">{t('widgets.now')}</span>
          </div>
          <div className="text-right">
            <span className="text-hud-main text-sm font-black gliding-value tracking-tight">
              {weatherData.windSpeed !== null ? `${weatherData.windSpeed} kts` : t('common.na')}
            </span>
            <span className="text-hud-muted text-xs uppercase font-black tracking-widest ml-2 opacity-60">
              {weatherData.windDirection !== null ? getWindDirection(weatherData.windDirection) : ''}
            </span>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
