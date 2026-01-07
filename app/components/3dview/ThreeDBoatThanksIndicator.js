import { useOcearoContext } from '../context/OcearoContext';
import { BATTERY_CONFIG, estimateStateOfCharge, isBatteryCharging, getBatteryColorClass } from '../utils/BatteryUtils';
import { useState, useMemo } from 'react';
import { useSignalKPaths } from '../hooks/useSignalK';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet, faGasPump, faToilet, faBolt } from '@fortawesome/free-solid-svg-icons';

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
        label: 'Fresh Water',
        path: 'tanks.freshWater.0.currentLevel',
        icon: faDroplet,
        color: 'bg-oBlue'
    },
    FUEL: {
        id: 'fuel',
        label: 'Fuel',
        path: 'tanks.fuel.0.currentLevel',
        icon: faGasPump,
        color: 'bg-oYellow'
    },
    BLACK_WATER: {
        id: 'blackWater',
        label: 'Black Water',
        path: 'tanks.blackWater.0.currentLevel',
        icon: faToilet,
        color: 'bg-oGray'
    }
};


/**
 * Tank indicator component styled as a battery
 * @param {number} level - The tank level percentage (0-100)
 * @param {string} type - The tank type key from TANK_TYPES
 */
const TankIndicator = ({ level, type, styles }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const percentage = Math.max(0, Math.min(100, level));
    const { label, icon, color } = TANK_TYPES[type];
    
    return (
        <div 
            className="flex items-center space-x-3 relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className="flex items-center space-x-2">
                <span className={`text-sm ${styles.icon}`}><FontAwesomeIcon icon={icon} /></span>
                <div className={`relative w-8 h-4 rounded-sm flex items-center justify-center ${styles.indicatorShell}`}>
                    {/* Battery terminal */}
                    <div className={`absolute -right-1 w-1 h-3 rounded-sm ${styles.indicatorTerminal}`} />
                    {/* Fill level indicator */}
                    <div
                        className={`absolute left-0 top-0 h-full ${color} transition-all duration-300 rounded-sm`}
                        style={{ width: `${percentage}%` }}
                    />
                    {/* Percentage display */}
                    <span 
                        className={`relative z-10 text-xs font-bold ${styles.indicatorValue} ${percentage <= TANK_CONFIG.DANGER_THRESHOLD ? 'text-oRed animate-pulse' : ''}`}
                    >
                        {percentage}%
                    </span>
                </div>
            </div>
            
            {/* Tooltip */}
            {showTooltip && (
                <div className={`absolute -left-20 top-6 px-2 py-1 rounded text-xs whitespace-nowrap z-20 ${styles.tooltip}`}>
                    {label}: {percentage}%
                </div>
            )}
        </div>
    );
};

/**
 * Battery indicator component
 * @param {number} batteryLevel - The battery level percentage (0-100)
 * @param {number} batteryNumber - The battery identifier number
 * @param {number} voltage - The battery voltage
 */
const BatteryIndicator = ({ batteryLevel, batteryNumber, voltage, styles }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const percentage = Math.max(0, Math.min(100, batteryLevel));
    const isCharging = isBatteryCharging(voltage);
    const batteryColor = useMemo(() => getBatteryColorClass(percentage), [percentage]);

    return (
        <div
            className="flex items-center space-x-3 relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
                <div className="flex items-center space-x-2">
                <span className={`text-sm ${styles.icon}`}><FontAwesomeIcon icon={faBolt} /></span>
            <div className={`relative w-8 h-4 rounded-sm border flex items-center justify-center ${styles.indicatorShell}`}>
                {/* Battery terminal */}
                <div className={`absolute -right-1 w-1 h-3 rounded-sm ${styles.indicatorTerminal}`} />
                {/* Fill level indicator */}
                <div
                    className={`absolute left-0 top-0 h-full ${batteryColor} transition-all duration-300 rounded-sm`}
                    style={{ width: `${percentage}%` }}
                />
                {/* Display charging icon or percentage */}
                {isCharging ? (
                    <span className={`relative z-10 text-xs font-bold ${styles.indicatorValue}`}>⚡︎</span>
                ) : (
                    <span 
                        className={`relative z-10 text-xs font-bold ${styles.indicatorValue} ${percentage <= BATTERY_CONFIG.DANGER_THRESHOLD ? 'text-oRed animate-pulse' : ''}`}
                    >
                        {percentage}%
                    </span>
                )}
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <div className={`absolute -left-20 top-6 px-2 py-1 rounded text-xs whitespace-nowrap z-20 ${styles.tooltip}`}>
                    Voltage: {voltage?.toFixed(1)}V {isCharging && '(Charging)'}
                </div>
            )}
            </div>
        </div>
    );
};

/**
 * Main component for displaying battery and tank indicators
 * Allows toggling between battery and tank views
 */
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
        container: nightMode ? 'text-oNight bg-white/5 hover:bg-white/10' : 'text-oGray hover:bg-gray-800/10',
        icon: nightMode ? 'text-oNight' : 'text-oGray',
        indicatorShell: nightMode ? 'bg-white/90 border border-oNight/30' : 'bg-oGray border border-oGray',
        indicatorTerminal: nightMode ? 'bg-white/70' : 'bg-oGray',
        indicatorValue: nightMode ? 'text-oNight' : 'text-white',
        tooltip: nightMode ? 'bg-white text-oNight border border-oNight/30 shadow-lg shadow-oNight/10' : 'bg-gray-800 text-white'
    }), [nightMode]);
    const isBatteryMode = displayMode === INDICATOR_TYPES.BATTERIES;

    return (
        <div
            className={`${styles.container} rounded-lg transition-all duration-300 cursor-pointer`}
            onClick={toggleDisplayMode}
            role="button"
            tabIndex={0}
            aria-label={`Toggle between ${isBatteryMode ? 'tanks' : 'batteries'} display`}
            onKeyDown={(e) => e.key === 'Enter' && toggleDisplayMode()} // Using onKeyDown instead of deprecated onKeyPress
        >
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
    );
};

export default ThreeDBoatTankIndicator;