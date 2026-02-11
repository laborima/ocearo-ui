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
  
  const primaryTextClass = nightMode ? 'text-oNight' : 'text-hud-main';
  const mutedTextClass = nightMode ? 'text-oNight' : 'text-hud-muted';
  const accentIconClass = nightMode ? 'text-oNight' : iconColorClass;

  const renderIcon = () => {
    if (typeof icon === 'function') {
      return icon();
    }
    return <FontAwesomeIcon icon={icon} className={`${accentIconClass} text-sm opacity-80`} />;
  };

  if (!hasData) {
    return (
      <div className={`tesla-card p-4 h-full flex flex-col tesla-hover overflow-hidden ${className}`}>
        <div className="flex items-center space-x-3 mb-3 shrink-0">
          {renderIcon()}
          <span className={`${primaryTextClass} text-xs font-black uppercase tracking-widest`}>{title}</span>
        </div>
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="text-center">
            <div className="text-4xl font-black text-hud-dim mb-2 gliding-value">N/A</div>
            <div className={`text-xs font-black uppercase tracking-tighter ${mutedTextClass}`}>{noDataMessage}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`tesla-card p-4 h-full flex flex-col tesla-hover overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-3 shrink-0">
        {renderIcon()}
        <span className={`${primaryTextClass} text-xs font-black uppercase tracking-widest`}>{title}</span>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default BaseWidget;
