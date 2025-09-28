'use client';
import React, { useMemo } from 'react';
import { useOcearoContext } from '../../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faFog, faSun, faCloud } from '@fortawesome/free-solid-svg-icons';

export default function VisibilityWidget() {
  const { getSignalKValue } = useOcearoContext();
  
  const visibilityData = useMemo(() => {
    const visibility = getSignalKValue('environment.outside.visibility') || 8000; // meters
    const humidity = getSignalKValue('environment.outside.humidity') || 0.65;
    const temperature = getSignalKValue('environment.outside.temperature') || 288.15; // Kelvin
    
    return {
      distance: Math.round(visibility / 100) / 10, // km with 1 decimal
      distanceNM: Math.round((visibility / 1852) * 10) / 10, // nautical miles
      humidity: Math.round(humidity * 100),
      temperature: Math.round((temperature - 273.15) * 10) / 10 // Celsius
    };
  }, [getSignalKValue]);

  const getVisibilityStatus = (distance) => {
    if (distance < 1) return 'Dense Fog';
    if (distance < 2) return 'Thick Fog';
    if (distance < 5) return 'Moderate Fog';
    if (distance < 10) return 'Light Haze';
    if (distance < 20) return 'Good';
    return 'Excellent';
  };

  const getVisibilityColor = (distance) => {
    if (distance < 1) return 'text-oRed';
    if (distance < 2) return 'text-orange-400';
    if (distance < 5) return 'text-oYellow';
    if (distance < 10) return 'text-oBlue';
    return 'text-oGreen';
  };

  const getVisibilityIcon = (distance) => {
    if (distance < 2) return faFog;
    if (distance < 10) return faCloud;
    return faSun;
  };

  const getVisibilityDescription = (distance) => {
    if (distance < 0.05) return 'Extremely dense fog';
    if (distance < 0.2) return 'Very dense fog';
    if (distance < 0.5) return 'Dense fog';
    if (distance < 1) return 'Thick fog';
    if (distance < 2) return 'Moderate fog';
    if (distance < 4) return 'Light fog';
    if (distance < 10) return 'Mist or haze';
    if (distance < 20) return 'Slight haze';
    if (distance < 40) return 'Clear';
    return 'Very clear';
  };

  return (
    <div className="bg-oGray2 rounded-lg p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <FontAwesomeIcon icon={faEye} className="text-oBlue" />
        <span className="text-white font-medium">Visibility</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Main visibility reading */}
        <div className="text-center mb-6">
          <FontAwesomeIcon 
            icon={getVisibilityIcon(visibilityData.distance)} 
            className={`text-4xl mb-3 ${getVisibilityColor(visibilityData.distance)}`} 
          />
          <div className="text-3xl font-bold text-white mb-1">
            {visibilityData.distance}
            <span className="text-lg text-gray-400 ml-1">km</span>
          </div>
          <div className={`text-sm font-medium ${getVisibilityColor(visibilityData.distance)}`}>
            {getVisibilityStatus(visibilityData.distance)}
          </div>
        </div>

        {/* Distance readings */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">Kilometers</div>
            <div className={`text-xl font-bold ${getVisibilityColor(visibilityData.distance)}`}>
              {visibilityData.distance} km
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">Nautical Miles</div>
            <div className={`text-xl font-bold ${getVisibilityColor(visibilityData.distance)}`}>
              {visibilityData.distanceNM} NM
            </div>
          </div>
        </div>

        {/* Visual visibility bar */}
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <div className="text-gray-400 text-xs w-8">0km</div>
            <div className="flex-1 bg-gray-600 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  visibilityData.distance < 1 ? 'bg-oRed' : 
                  visibilityData.distance < 5 ? 'bg-oYellow' : 
                  visibilityData.distance < 10 ? 'bg-oBlue' : 'bg-oGreen'
                }`}
                style={{ width: `${Math.min(100, (visibilityData.distance / 20) * 100)}%` }}
              />
            </div>
            <div className="text-gray-400 text-xs w-12">20km+</div>
          </div>
        </div>

        {/* Additional info */}
        <div className="space-y-2">
          <div className="text-center text-sm text-gray-300">
            {getVisibilityDescription(visibilityData.distance)}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
            <div className="text-center">
              <div>Humidity</div>
              <div className="text-white">{visibilityData.humidity}%</div>
            </div>
            <div className="text-center">
              <div>Temperature</div>
              <div className="text-white">{visibilityData.temperature}°C</div>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-400 mt-2">
            Range: 0-20+ km
          </div>
        </div>
      </div>
    </div>
  );
}
