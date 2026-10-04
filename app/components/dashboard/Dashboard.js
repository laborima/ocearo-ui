import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExpand, faCompress } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import AISRadarWidget from './widgets/AISRadarWidget';
import TankLevelsWidget from './widgets/TankLevelsWidget';
import WeatherWidget from './widgets/WeatherWidget';
import CourseWidget from './widgets/CourseWidget';
import { NavigationContextProvider } from '../context/NavigationContext';

const WidgetWrapper = React.memo(({ children, widgetName, className = "", fullscreenWidget, toggleFullscreen }) => (
  <motion.div 
    layout
    variants={{
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0 }
    }}
    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    className={`relative group ${className}`}
  >
    {children}
    <button
      onClick={() => toggleFullscreen(widgetName)}
      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-hud-bg backdrop-blur-md hover:bg-hud-elevated rounded-full w-8 h-8 flex items-center justify-center text-hud-muted hover:text-hud-main z-10 shadow-soft"
      title={fullscreenWidget === widgetName ? "Exit fullscreen" : "Fullscreen"}
    >
      <FontAwesomeIcon icon={fullscreenWidget === widgetName ? faCompress : faExpand} className="text-xs" />
    </button>
  </motion.div>
));

WidgetWrapper.displayName = 'WidgetWrapper';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

/**
 * Dashboard: only what the 3D view does not already show — AIS targets
 * beyond the 3D range, the forecast, route control and tank levels. Speed,
 * heading, attitude, depth, tide, temperatures, pressure, battery and time
 * live in the 3D HUD.
 */
export default function Dashboard() {
  const [fullscreenWidget, setFullscreenWidget] = useState(null);

  const toggleFullscreen = React.useCallback((widgetName) => {
    setFullscreenWidget(prev => (prev === widgetName ? null : widgetName));
  }, []);

  const wrap = (name, content, className = '') => (
    <WidgetWrapper
      widgetName={name}
      fullscreenWidget={fullscreenWidget}
      toggleFullscreen={toggleFullscreen}
      className={fullscreenWidget && fullscreenWidget !== name ? 'hidden' : fullscreenWidget === name ? 'w-full h-full' : className}
    >
      {content}
    </WidgetWrapper>
  );

  return (
    <div className="flex flex-col h-full bg-rightPaneBg overflow-hidden">
      <div className="flex-1 p-4 min-h-0 overflow-auto scrollbar-hide">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className={fullscreenWidget ? 'flex h-full' : 'card-grid'}
        >
          {/* The radar gets the room: two columns and two rows when they exist */}
          {wrap('aisradar', <AISRadarWidget />, 'sm:col-span-2 sm:row-span-2')}
          {wrap('weather', <WeatherWidget />)}
          {wrap('course', (
            <NavigationContextProvider>
              <CourseWidget />
            </NavigationContextProvider>
          ))}
          {wrap('tanks', <TankLevelsWidget />)}
        </motion.div>
      </div>
    </div>
  );
}
