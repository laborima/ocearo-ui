'use client';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useOcearoContext } from '../../context/OcearoContext';

/**
 * BaseWidget - A shared component for dashboard widgets to ensure UI consistency
 * and reduce code duplication.
 */
const BaseWidget = ({ 
  title, 
  icon, 
  iconColorClass = 'text-oBlue',
  hasData = true,
  noDataMessage = 'No data available',
  children,
  className = ""
}) => {
  const { nightMode } = useOcearoContext();
  
  const primaryTextClass = nightMode ? 'text-oNight' : 'text-white';
  const mutedTextClass = nightMode ? 'text-oNight' : 'text-gray-500';
  const accentIconClass = nightMode ? 'text-oNight' : iconColorClass;

  const renderIcon = () => {
    if (typeof icon === 'function') {
      return icon();
    }
    return <FontAwesomeIcon icon={icon} className={`${accentIconClass} text-lg`} />;
  };

  if (!hasData) {
    return (
      <div className={`bg-oGray2 rounded-lg p-4 h-full flex flex-col ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          {renderIcon()}
          <span className={`${primaryTextClass} font-medium text-lg`}>{title}</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-600 mb-2">N/A</div>
            <div className={`text-sm ${mutedTextClass}`}>{noDataMessage}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-oGray2 rounded-lg p-4 h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        {renderIcon()}
        <span className={`${primaryTextClass} font-medium text-lg`}>{title}</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center min-h-0">
        {children}
      </div>
    </div>
  );
};

export default BaseWidget;
