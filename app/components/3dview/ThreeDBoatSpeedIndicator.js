import { convertSpeedUnit, getSpeedUnitLabel, useOcearoContext } from '../context/OcearoContext';
import { useState, useMemo, useCallback } from 'react';
import { useSignalKPaths } from '../hooks/useSignalK';
import { useTranslation } from 'react-i18next';

// Define speed types and their corresponding SignalK paths
const SPEED_CONFIG = {
    SOG: 'navigation.speedOverGround',
    VMG: 'performance.velocityMadeGood',
    STW: 'navigation.speedThroughWater',
    POL: 'performance.polarSpeedRatio'
};

const ThreeDBoatSpeedIndicator = () => {
    const { t } = useTranslation();
    const { nightMode } = useOcearoContext();
    const [speedType, setSpeedType] = useState('SOG');

    // Subscribe to all relevant speed paths
    const paths = useMemo(() => Object.values(SPEED_CONFIG), []);
    const skValues = useSignalKPaths(paths);

    // Use useMemo to derived available speed types from subscribed data
    const speedTypes = useMemo(() => {
        const types = {};
        for (const [type, path] of Object.entries(SPEED_CONFIG)) {
            const value = skValues[path];
            // Only include speed type if data is available
            if (value !== undefined && value !== null) {
                // Polar ratio is already a percentage/ratio, no need for speed conversion if it's POL
                types[type] = type === 'POL' ? value * 100 : convertSpeedUnit(value);
            }
        }
        return types;
    }, [skValues]);

    // Use the first available speed type as default if current type has no data
    const availableTypes = Object.keys(speedTypes);
    const currentSpeedType = speedTypes[speedType] !== undefined ? 
        speedType : 
        availableTypes[0];

    const currentSpeed = speedTypes[currentSpeedType];

    // Memoize the toggle function
    const toggleSpeedType = useCallback(() => {
        if (availableTypes.length === 0) return; // Don't toggle if no data available

        const currentIndex = availableTypes.indexOf(currentSpeedType);
        const nextIndex = (currentIndex + 1) % availableTypes.length;
        const nextType = availableTypes[nextIndex];
        setSpeedType(nextType);
    }, [availableTypes, currentSpeedType]);

    const speedTextColor = nightMode ? 'text-oNight' : 'text-hud-main';

    // If no speed data is available at all
    if (availableTypes.length === 0) {
        return (
            <div className="mt-6 ml-2">
                <div className="text-7xl font-black text-hud-dim tracking-tighter">--</div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-hud-muted ml-1">{t('common.na')}</div>
            </div>
        );
    }

    return (
        <div className="mt-6 ml-2 select-none group">
            <div
                className={`text-7xl font-black cursor-pointer tracking-tighter drop-shadow-2xl transition-all duration-300 group-hover:scale-105 active:scale-95 ${speedTextColor}`}
                onClick={toggleSpeedType}
                role="button"
                tabIndex={0}
                aria-label={`Current speed: ${currentSpeed} ${currentSpeedType}. Click to change speed type.`}
            >
                {currentSpeed?.toFixed(1) || '--'}
            </div>
            <div className="flex items-center space-x-2 ml-1">
                <div className={`text-xs font-black uppercase tracking-[0.3em] ${nightMode ? 'text-oNight' : 'text-hud-secondary'}`}>
                    {currentSpeedType}
                </div>
                <div className="h-[2px] w-4 bg-oBlue/40 rounded-full" />
                <div className={`text-xs font-bold uppercase tracking-widest ${nightMode ? 'text-oNight/60' : 'text-hud-muted'}`}>
                    {currentSpeedType === 'POL' ? '%' : getSpeedUnitLabel()}
                </div>
            </div>
        </div>
    );
};

export default ThreeDBoatSpeedIndicator;