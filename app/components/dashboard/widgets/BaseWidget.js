'use client';
import React from 'react';
import Card from '../../ui/Card';

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
  // A function icon renders a custom icon element
  const headerIcon = typeof icon === 'function' ? icon() : icon;

  if (!hasData) {
    return (
      <Card title={title} icon={headerIcon} iconClass={iconColorClass} className={`h-full overflow-hidden ${className}`}>
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="text-center">
            <div className="text-hero font-medium text-hud-dim mb-2">N/A</div>
            <div className="text-caption font-semibold uppercase text-hud-muted">{noDataMessage}</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title={title} icon={headerIcon} iconClass={iconColorClass} className={`h-full overflow-hidden ${className}`}>
      <div className="flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
        {children}
      </div>
    </Card>
  );
};

export default BaseWidget;
