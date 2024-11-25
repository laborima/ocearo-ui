import PDFList from "./docviewer/PDFList";
import ConfigPage from "./settings/ConfigPage";
import { useOcearoContext } from './context/OcearoContext';
import React, { useState, useEffect } from 'react';

const RightPane = ({ view }) => {
    const { getSignalKValue } = useOcearoContext(); // Access SignalK data from the context
    // Get the user's current position from SignalK
    
    const [myPosition, setMyPosition] = useState(null);

    // Fetch position every minute (60000 ms)
    useEffect(() => {
        const fetchPosition = () => {
            const position = getSignalKValue('navigation.position') || { latitude: 46.195, longitude: 2.329 }; // Default position if unavailable
            setMyPosition(position);
        };

        // Initial fetch
        fetchPosition();

        // Set up interval to fetch position every minute (60,000 ms)
        const intervalId = setInterval(fetchPosition, 60000); 

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
    }, []); // 

      // Determine what content to display based on the view
         const iframeSrc = () => {
             switch (view) {
                 case 'navigation':
                     return 'https://demo.signalk.org/@signalk/freeboard-sk/';
                 case 'instrument':
                     return 'https://demo.signalk.org/@mxtommy/kip/#/page/0';
                 case 'netflix':
                     return 'https://www.netflix.com';
                 case 'webcam1':
                     return 'https://pv.viewsurf.com/2080/Chatelaillon-Port?i=NzU4Mjp1bmRlZmluZWQ';
                 case 'webcam2':
                     return 'https://pv.viewsurf.com/1478/Chatelaillon-Plage&lt?i=NTkyMDp1bmRlZmluZWQ';
                 case 'weather':
                     // If myPosition is available, dynamically generate the Windy embed URL
                     if (myPosition) {
                         return `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=kt&zoom=5&overlay=wind&product=ecmwf&level=surface&lat=${myPosition.latitude}&lon=${myPosition.longitude}&message=true`;
                     }
                     return null; // Return null if position isn't available yet
                 default:
                     return null;
             }
         };
         
         
    return (
        <div className="flex flex-col w-full h-full"> {/* Use flex for layout */}
            {view == 'manual' ? ( <PDFList path="boats/dufour310/docs"/>): ""}
            {view == 'settings' ? (   <ConfigPage />) : ""}
        
            {iframeSrc() ? (
                <iframe
                    className="flex-grow border-none"
                    src={iframeSrc()} // Load dynamic content based on the selected view
                    title="External Application"
                />
            ) :"" }
        </div>
    );
};

export default RightPane;
