import React, { useState, useEffect, useMemo } from 'react';
import PDFList from "./docviewer/PDFList";
import ConfigPage from "./settings/ConfigPage";
import { useOcearoContext } from './context/OcearoContext';
import configService from './settings/ConfigService';

const RightPane = ({ view }) => {
    const { getSignalKValue } = useOcearoContext(); // Access SignalK data from the context

    const [myPosition, setMyPosition] = useState(null);
    const config = configService.getAll(); // Load config from the service

    const { signalkUrl } = config;

    useEffect(() => {
        const fetchPosition = () => {
            const position = getSignalKValue('navigation.position') || { latitude: 46.1591, longitude: -1.1522 };
            
            // Update position only if it has changed significantly
            setMyPosition((prev) => {
                
                if (!prev || Math.abs(prev.latitude - position.latitude) > 0.01 || Math.abs(prev.longitude - position.longitude) > 0.01) {
                    return position;
                }
                return prev;
            });
        };

        fetchPosition();

        const intervalId = setInterval(fetchPosition, 10000);

        return () => clearInterval(intervalId);
    }, [getSignalKValue]);


    // Memoize iframeSrc to prevent unnecessary recalculations
    const iframeSrc = useMemo(() => {
        console.log("myPosition updated:", myPosition);
        
        switch (view) {
            case 'navigation':
                return `${signalkUrl}/@signalk/freeboard-sk/`;
            case 'instrument':
                return `${signalkUrl}/@mxtommy/kip/`;
            case 'netflix':
                return 'https://www.netflix.com';
            case 'webcam1':
                return 'https://pv.viewsurf.com/2080/Chatelaillon-Port?i=NzU4Mjp1bmRlZmluZWQ';
            case 'webcam2':
                return 'https://pv.viewsurf.com/1478/Chatelaillon-Plage&lt?i=NTkyMDp1bmRlZmluZWQ';
            case 'weather':
                // Dynamically generate Windy embed URL if position is available
                if (myPosition) {
                    return `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=kt&zoom=10&overlay=wind&product=ecmwf&level=surface&lat=${myPosition.latitude}&lon=${myPosition.longitude}&message=true`;
                }
                return null; // Return null if position isn't available yet
            default:
                return null;
        }
    }, [view, myPosition]); // Dependencies

    return (
        <div className="flex flex-col w-full h-full"> {/* Use flex for layout */}
            {view === 'manual' ? <PDFList path="boats/dufour310/docs" /> : null}
            {view === 'settings' ? <ConfigPage /> : null}
        
            {iframeSrc ? (
                <iframe
                    className="flex-grow border-none"
                    src={iframeSrc} // Use memoized iframeSrc value
                    title="External Application"
                />
            ) : null}
        </div>
    );
};

export default RightPane;
