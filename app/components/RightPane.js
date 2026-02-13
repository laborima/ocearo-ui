import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useOcearoContext } from './context/OcearoContext';
import { useTranslation } from 'react-i18next';
import { useSignalKPath } from './hooks/useSignalK';
import configService from './settings/ConfigService';

/**
 * Loading fallback component used by dynamic imports.
 */
const LoadingFallback = ({ messageKey }) => {
    const { t } = useTranslation();
    return (
        <div className="w-full h-full flex items-center justify-center text-hud-main">
            {t(messageKey)}
        </div>
    );
};

// Dynamic imports for lazy-loaded components
const PDFList = dynamic(() => import('./docviewer/PDFList'), {
  loading: () => <LoadingFallback messageKey="common.loadingDocuments" />
});

const ConfigPage = dynamic(() => import('./settings/ConfigPage'), {
  loading: () => <LoadingFallback messageKey="common.loadingSettings" />
});

const MediaPlayer = dynamic(() => import('./mediaplayer/MediaPlayer'), {
  loading: () => <LoadingFallback messageKey="common.loadingMediaPlayer" />
});

const BatteryMonitor = dynamic(() => import('./battery/BatteryMonitor'), {
  loading: () => <LoadingFallback messageKey="common.loadingBatteryMonitor" />
});

const MotorView = dynamic(() => import('./engines/MotorView'), {
  loading: () => <LoadingFallback messageKey="common.loadingEngineMonitor" />
});

const Dashboard = dynamic(() => import('./dashboard/Dashboard'), {
  loading: () => <LoadingFallback messageKey="common.loadingDashboard" />
});

const LogbookView = dynamic(() => import('./logbook/LogbookView'), {
  loading: () => <LoadingFallback messageKey="common.loadingLogbook" />
});

const AutopilotView = dynamic(() => import('./autopilot/AutopilotView'), {
  loading: () => <LoadingFallback messageKey="common.loadingAutopilot" />
});

const DebugView = dynamic(() => import('./debug/DebugView'), {
  loading: () => <LoadingFallback messageKey="common.loading" />
});


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
    dashboard: (signalkUrl) => signalkUrl.replace(':3000', ':3001') + '/grafana',
    webcam1: () => 'https://pv.viewsurf.com/2080/Chatelaillon-Port?i=NzU4Mjp1bmRlZmluZWQ',
    webcam2: () => 'https://pv.viewsurf.com/1478/Chatelaillon-Plage&lt?i=NTkyMDp1bmRlZmluZWQ',
    weather: (_, position) => position && `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=kt&zoom=10&overlay=wind&product=ecmwf&level=surface&lat=${position.latitude}&lon=${position.longitude}&message=true`
};

const RightPane = ({ view }) => {
    const { t } = useTranslation();
    const { nightMode } = useOcearoContext();
    const [myPosition, setMyPosition] = useState(DEFAULT_POSITION);
    const [error, setError] = useState(null);
    const config = configService.getAll();
    const { signalkUrl } = config;

    // Use subscription model for position updates
    const skPosition = useSignalKPath('navigation.position');

    // Update internal position state only when significant change occurs
    useEffect(() => {
        if (!skPosition) return;

        setMyPosition((prev) => {
            if (!prev) return skPosition;

            const hasSignificantChange =
                Math.abs(prev.latitude - skPosition.latitude) > POSITION_CHANGE_THRESHOLD ||
                Math.abs(prev.longitude - skPosition.longitude) > POSITION_CHANGE_THRESHOLD;

            return hasSignificantChange ? skPosition : prev;
        });
    }, [skPosition]);

    // URL generation
    const iframeSrc = useMemo(() => {
        // Check if there's a custom URL for this view
        const config = configService.getAll();
        const customUrls = config.customExternalUrls || {};
        
        // Use custom URL if available and custom URLs are enabled
        if (config.showCustomUrls && customUrls[view]) {
            try {
                // If custom URL is a function string, evaluate it
                if (typeof customUrls[view] === 'string' && customUrls[view].includes('${signalkUrl}')) {
                    return customUrls[view].replace('${signalkUrl}', signalkUrl)
                        .replace('${latitude}', myPosition?.latitude || DEFAULT_POSITION.latitude)
                        .replace('${longitude}', myPosition?.longitude || DEFAULT_POSITION.longitude);
                }
                // Otherwise just use it as a static URL
                return customUrls[view];
            } catch (err) {
                console.error('Error using custom URL:', err);
                // Fall back to default URL generator
            }
        }
        
        // Use default URL generator
        const urlGenerator = EXTERNAL_URLS[view];
        if (!urlGenerator) return null;

        try {
            return urlGenerator(signalkUrl, myPosition);
        } catch (err) {
            console.error('Error generating URL:', err);
            setError(t('errors.errorGeneratingUrl'));
            return null;
        }
    }, [view, myPosition, signalkUrl]);

    // Views that manage their own internal scrolling (flex layout with overflow-auto content area)
    const FULL_HEIGHT_VIEWS = ['motor', 'logbook', 'autopilot', 'battery', 'dashboard', 'debug'];

    // Render component based on view type
    const renderContent = () => {
        if (error) {
            return <div className="text-oRed p-4 font-black uppercase text-xs">{error}</div>;
        }

        switch (view) {
            case 'manual':
                return <PDFList path="/docs" />;
            case 'settings':
                return <ConfigPage />;
            case 'mediaplayer':
                return <MediaPlayer />;
            case 'battery':
                return <BatteryMonitor />;
            case 'motor':
                return <MotorView />;
            case 'dashboard':
                return <Dashboard />;
            case 'logbook':
                return <LogbookView />;
            case 'autopilot':
                return <AutopilotView />;
            case 'debug':
                return <DebugView />;
            default:
                return iframeSrc && (
                    <iframe
                        className="flex-grow border-none"
                        src={iframeSrc}
                        title="External Application"
                        onError={() => setError(t('errors.failedToLoadExternal'))}
                    />
                );
        }
    };

    const isFullHeight = FULL_HEIGHT_VIEWS.includes(view);

    return (
        <div className="flex flex-col w-full h-full overflow-hidden bg-hud-bg backdrop-blur-sm">
            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, x: 10, scale: 0.99 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -10, scale: 0.99 }}
                    transition={{ 
                        duration: 0.4, 
                        ease: [0.16, 1, 0.3, 1] // Custom ease-out cubic for "gliding" feel
                    }}
                    style={{ flex: '1 1 0%', minHeight: 0 }}
                    className={`flex flex-col w-full ${isFullHeight ? 'overflow-hidden' : 'overflow-auto'}`}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default RightPane;