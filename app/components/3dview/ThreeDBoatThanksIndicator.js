import { useOcearoContext } from '../context/OcearoContext';
import { BATTERY_CONFIG, estimateStateOfCharge, isBatteryCharging, getBatteryColorClass } from '../utils/BatteryUtils';
import { useState, useMemo } from 'react';
import { useSignalKPaths } from '../hooks/useSignalK';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet, faGasPump, faToilet, faBolt } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

/**
 * Display mode options for the indicator
 */
const INDICATOR_TYPES = {
    BATTERIES: 'batteries',
    TANKS: 'tanks'
};

/**
 * Configuration settings for tank indicators
 */
const TANK_CONFIG = {
    DANGER_THRESHOLD: 20 // Percentage below which to show warning
};

/**
 * Configuration for different tank types including display properties
 */
const TANK_TYPES = {
    FRESH_WATER: {
        id: 'freshWater',
        labelKey: 'tanks.freshWater',
        path: 'tanks.freshWater.0.currentLevel',
        icon: faDroplet,
        color: 'bg-oBlue'
    },
    FUEL: {
        id: 'fuel',
        labelKey: 'tanks.fuel',
        path: 'tanks.fuel.0.currentLevel',
        icon: faGasPump,
        color: 'bg-oYellow'
    },
    BLACK_WATER: {
        id: 'blackWater',
        labelKey: 'tanks.blackWater',
        path: 'tanks.blackWater.0.currentLevel',
        icon: faToilet,
        color: 'bg-hud-muted'
    }
};


/**
 * Tank indicator component styled as a battery
 * @param {number} level - The tank level percentage (0-100)
 * @param {string} type - The tank type key from TANK_TYPES
 */
const TankIndicator = ({ level, type, styles }) => {
    const { t } = useTranslation();
    const [showTooltip, setShowTooltip] = useState(false);
    const percentage = Math.max(0, Math.min(100, level));
    const { labelKey, icon, color } = TANK_TYPES[type];
    const label = t(labelKey);
    
    return (
        <div 
            className="flex items-center space-x-3 relative group"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={icon} className={`text-xs ${styles.icon} opacity-40 group-hover:opacity-100 transition-opacity`} />
                <div className={`relative w-10 h-4 rounded-md flex items-center justify-center ${styles.indicatorShell} overflow-hidden`}>
                    <div
                        className={`absolute left-0 top-0 h-full ${color} transition-all duration-1000 ease-in-out`}
                        style={{ width: `${percentage}%` }}
                    />
                    <span 
                        className={`relative z-10 text-xs font-black uppercase tracking-tighter ${styles.indicatorValue} ${percentage <= TANK_CONFIG.DANGER_THRESHOLD ? 'text-oRed animate-soft-pulse' : ''}`}
                    >
                        {percentage}%
                    </span>
                </div>
            </div>
            
            {showTooltip && (
                <div className={`absolute left-0 top-full mt-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest whitespace-nowrap z-20 shadow-2xl backdrop-blur-md ${styles.tooltip}`}>
                    {label}: {percentage}%
                </div>
            )}
        </div>
    );
};

const BatteryIndicator = ({ batteryLevel, batteryNumber, voltage, styles }) => {
    const { t } = useTranslation();
    const [showTooltip, setShowTooltip] = useState(false);
    const percentage = Math.max(0, Math.min(100, batteryLevel));
    const isCharging = isBatteryCharging(voltage);
    const batteryColor = useMemo(() => getBatteryColorClass(percentage), [percentage]);

    return (
        <div
            className="flex items-center space-x-3 relative group"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faBolt} className={`text-xs ${styles.icon} ${isCharging ? 'text-oYellow animate-pulse' : 'opacity-40'} group-hover:opacity-100 transition-opacity`} />
                <div className={`relative w-10 h-4 rounded-md flex items-center justify-center ${styles.indicatorShell} overflow-hidden`}>
                    <div
                        className={`absolute left-0 top-0 h-full ${batteryColor} transition-all duration-1000 ease-in-out`}
                        style={{ width: `${percentage}%` }}
                    />
                    {isCharging ? (
                        <span className={`relative z-10 text-xs font-black ${styles.indicatorValue}`}>⚡︎</span>
                    ) : (
                        <span 
                            className={`relative z-10 text-xs font-black uppercase tracking-tighter ${styles.indicatorValue} ${percentage <= BATTERY_CONFIG.DANGER_THRESHOLD ? 'text-oRed animate-soft-pulse' : ''}`}
                        >
                            {percentage}%
                        </span>
                    )}
                </div>

                {showTooltip && (
                    <div className={`absolute left-0 top-full mt-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest whitespace-nowrap z-20 shadow-2xl backdrop-blur-md ${styles.tooltip}`}>
                        {voltage?.toFixed(1)}V {isCharging && t('common.charging')}
                    </div>
                )}
            </div>
        </div>
    );
};

const ThreeDBoatTankIndicator = () => {
    const { nightMode, getTankData } = useOcearoContext();
    const [displayMode, setDisplayMode] = useState(INDICATOR_TYPES.BATTERIES);

    // Subscribe to battery paths
    const batteryPaths = useMemo(() => [
        'electrical.batteries.1.capacity.stateOfCharge',
        'electrical.batteries.1.voltage'
    ], []);

    // Subscribe to tank paths
    const tankPaths = useMemo(() => [
        'tanks.freshWater.0.currentLevel',
        'tanks.fuel.0.currentLevel',
        'tanks.blackWater.0.currentLevel'
    ], []);

    const skValues = useSignalKPaths([...batteryPaths, ...tankPaths]);

    // Fetch battery data from subscribed values
    const batteries = useMemo(() => {
        const battery1SoC = skValues['electrical.batteries.1.capacity.stateOfCharge'];
        const battery1Voltage = skValues['electrical.batteries.1.voltage'];
        const battery1EstimatedSoC = battery1SoC === null 
            ? estimateStateOfCharge(battery1Voltage) 
            : battery1SoC;

        return [
            {
                level: battery1EstimatedSoC,
                number: 1,
                voltage: battery1Voltage
            }
        ].filter(battery => battery.level !== null);
    }, [skValues]);

    // Fetch tank data from subscribed values
    const tankLevels = useMemo(() => {
        const freshWaterLevel = skValues['tanks.freshWater.0.currentLevel'];
        const fuelLevel = skValues['tanks.fuel.0.currentLevel'];
        const blackWaterLevel = skValues['tanks.blackWater.0.currentLevel'];
        
        return {
            FRESH_WATER: freshWaterLevel !== null ? freshWaterLevel * 100 : 40,
            FUEL: fuelLevel !== null ? fuelLevel * 100 : 75,
            BLACK_WATER: blackWaterLevel !== null ? blackWaterLevel * 100 : 20
        };
    }, [skValues]);

    // Toggle between battery and tank display
    const toggleDisplayMode = () => {
        setDisplayMode(current =>
            current === INDICATOR_TYPES.BATTERIES ? INDICATOR_TYPES.TANKS : INDICATOR_TYPES.BATTERIES
        );
    };

    const styles = useMemo(() => ({
        container: 'bg-hud-bg/60',
        icon: 'text-hud-main',
        indicatorShell: 'bg-hud-elevated',
        indicatorValue: 'text-hud-main',
        tooltip: 'bg-hud-bg/90 text-hud-main border-hud'
    }), []);
    const isBatteryMode = displayMode === INDICATOR_TYPES.BATTERIES;

    return (
        <div
            className={`${styles.container} p-3 rounded-2xl backdrop-blur-md shadow-2xl transition-all duration-300 cursor-pointer select-none`}
            onClick={toggleDisplayMode}
            role="button"
            tabIndex={0}
            aria-label={`Toggle between ${isBatteryMode ? 'tanks' : 'batteries'} display`}
            onKeyDown={(e) => e.key === 'Enter' && toggleDisplayMode()} 
        >
            <div className="flex flex-col space-y-3">
                {isBatteryMode ? (
                    <div className="space-y-2">
                        {batteries.map(battery => (
                            <BatteryIndicator
                                key={battery.number}
                                batteryLevel={battery.level}
                                batteryNumber={battery.number}
                                voltage={battery.voltage}
                                styles={styles}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {Object.keys(TANK_TYPES).map(key => (
                            <TankIndicator
                                key={key}
                                type={key}
                                level={tankLevels[key]}
                                styles={styles}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ThreeDBoatTankIndicator;