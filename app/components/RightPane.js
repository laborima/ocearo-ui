import React, { useState, useEffect, useMemo } from 'react';
import PDFList from "./docviewer/PDFList";
import ConfigPage from "./settings/ConfigPage";
import { useOcearoContext } from './context/OcearoContext';
import configService from './settings/ConfigService';

// Constants
const POSITION_UPDATE_INTERVAL = 10000; // 10 seconds
const POSITION_CHANGE_THRESHOLD = 0.01;
const DEFAULT_POSITION = {
  latitude: 46.1591,
  longitude: -1.1522
};

// External URLs configuration
const EXTERNAL_URLS = {
  navigation: (signalkUrl) => `${signalkUrl}/@signalk/freeboard-sk/`,
  instrument: (signalkUrl) => `${signalkUrl}/@mxtommy/kip/`,
  netflix: () => 'https://www.netflix.com',
  battery: () => ':3000/grafana',
  webcam1: () => 'https://pv.viewsurf.com/2080/Chatelaillon-Port?i=NzU4Mjp1bmRlZmluZWQ',
  webcam2: () => 'https://pv.viewsurf.com/1478/Chatelaillon-Plage&lt?i=NTkyMDp1bmRlZmluZWQ',
  weather: (_, position) => position && `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=kt&zoom=6&overlay=wind&product=ecmwf&level=surface&lat=${position.latitude}&lon=${position.longitude}&message=true`
};

const RightPane = ({ view }) => {
  const { getSignalKValue } = useOcearoContext();
  const [myPosition, setMyPosition] = useState(null);
  const [error, setError] = useState(null);
  const config = configService.getAll();
  const { signalkUrl } = config;

  // Position update effect
  useEffect(() => {
    const fetchPosition = () => {
      try {
        const position = getSignalKValue('navigation.position') || DEFAULT_POSITION;

        setMyPosition((prev) => {
          if (!prev) return position;
          
          const hasSignificantChange = 
            Math.abs(prev.latitude - position.latitude) > POSITION_CHANGE_THRESHOLD ||
            Math.abs(prev.longitude - position.longitude) > POSITION_CHANGE_THRESHOLD;

          return hasSignificantChange ? position : prev;
        });
        
        setError(null);
      } catch (err) {
        setError('Error fetching position data');
        console.error('Position fetch error:', err);
      }
    };

    fetchPosition();
    const intervalId = setInterval(fetchPosition, POSITION_UPDATE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [getSignalKValue]);

  // URL generation
  const iframeSrc = useMemo(() => {
    const urlGenerator = EXTERNAL_URLS[view];
    if (!urlGenerator) return null;
    
    try {
      return urlGenerator(signalkUrl, myPosition);
    } catch (err) {
      console.error('Error generating URL:', err);
      setError('Error generating application URL');
      return null;
    }
  }, [view, myPosition, signalkUrl]);

  // Render component based on view type
  const renderContent = () => {
    if (error) {
      return <div className="text-red-500 p-4">{error}</div>;
    }

    switch (view) {
      case 'manual':
        return <PDFList path="boats/dufour310/docs" />;
      case 'settings':
        return <ConfigPage />;
      default:
        return iframeSrc && (
          <iframe
            className="flex-grow border-none"
            src={iframeSrc}
            title="External Application"
            onError={() => setError('Failed to load external content')}
          />
        );
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      {renderContent()}
    </div>
  );
};

export default RightPane;