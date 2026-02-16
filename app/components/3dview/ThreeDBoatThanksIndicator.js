import { useOcearoContext } from '../context/OcearoContext';
import { BATTERY_CONFIG, estimateStateOfCharge, isBatteryCharging } from '../utils/BatteryUtils';
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
const TankIndicator = ({ level, type }) => {
    const { t } = useTranslation();
    const percentage = Math.max(0, Math.min(100, level));
    const { labelKey, icon, color } = TANK_TYPES[type];
    const isDanger = percentage <= TANK_CONFIG.DANGER_THRESHOLD;
    const textColor = color.replace('bg-', 'text-');
    
    return (
        <div className="flex items-center space-x-2" title={t(labelKey)}>
            <FontAwesomeIcon icon={icon} className={`text-xs ${textColor} opacity-60`} />
            <div className="relative w-14 h-[8px] rounded-full bg-hud-elevated/60 overflow-hidden">
                <div
                    className={`absolute left-0 top-0 h-full rounded-full ${isDanger ? 'bg-oRed' : color} transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className={`text-[10px] font-black tabular-nums min-w-[28px] text-right ${isDanger ? 'text-oRed animate-soft-pulse' : 'text-hud-main'}`}>
                {percentage}%
            </span>
        </div>
    );
};

const BatteryIndicator = ({ batteryLevel, batteryNumber, voltage }) => {
    const { t } = useTranslation();
    const percentage = Math.max(0, Math.min(100, batteryLevel));
    const isCharging = isBatteryCharging(voltage);
    const isDanger = percentage <= BATTERY_CONFIG.DANGER_THRESHOLD;
    const barColor = isDanger ? 'bg-oRed' : isCharging ? 'bg-oGreen' : 'bg-oBlue';

    return (
        <div className="flex items-center space-x-2" title={`${percentage}% — ${voltage?.toFixed(1)}V${isCharging ? ' ' + t('common.charging') : ''}`}>
            <FontAwesomeIcon icon={faBolt} className={`text-xs ${isCharging ? 'text-oYellow animate-pulse' : 'text-oGreen opacity-60'}`} />
            <div className="relative w-14 h-[8px] rounded-full bg-hud-elevated/60 overflow-hidden">
                <div
                    className={`absolute left-0 top-0 h-full rounded-full ${barColor} transition-all duration-1000 ease-out ${isCharging ? 'shadow-[0_0_6px_var(--color-oGreen)]' : ''}`}
                    style={{ width: `${percentage}%` }}
                />
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
            FRESH_WATER: freshWaterLevel !== null ? freshWaterLevel * 100 : 0,
            FUEL: fuelLevel !== null ? fuelLevel * 100 : 0,
            BLACK_WATER: blackWaterLevel !== null ? blackWaterLevel * 100 : 0
        };
    }, [skValues]);

    // Toggle between battery and tank display
    const toggleDisplayMode = () => {
        setDisplayMode(current =>
            current === INDICATOR_TYPES.BATTERIES ? INDICATOR_TYPES.TANKS : INDICATOR_TYPES.BATTERIES
        );
    };

    const isBatteryMode = displayMode === INDICATOR_TYPES.BATTERIES;

    return (
        <div
            className="p-1.5 rounded-2xl transition-all duration-300 cursor-pointer select-none"
            onClick={toggleDisplayMode}
            role="button"
            tabIndex={0}
            aria-label={`Toggle between ${isBatteryMode ? 'tanks' : 'batteries'} display`}
            onKeyDown={(e) => e.key === 'Enter' && toggleDisplayMode()} 
        >
            <div className="flex flex-col space-y-1">
                {isBatteryMode ? (
                    <>
                        {batteries.map(battery => (
                            <BatteryIndicator
                                key={battery.number}
                                batteryLevel={battery.level}
                                batteryNumber={battery.number}
                                voltage={battery.voltage}
                            />
                        ))}
                    </>
                ) : (
                    <>
                        {Object.keys(TANK_TYPES).map(key => (
                            <TankIndicator
                                key={key}
                                type={key}
                                level={tankLevels[key]}
                            />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

export default ThreeDBoatTankIndicator;