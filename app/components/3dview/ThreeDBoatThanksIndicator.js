import { useOcearoContext } from '../context/OcearoContext';
import { BATTERY_CONFIG, estimateStateOfCharge, isBatteryCharging, getBatteryColorClass } from '../utils/BatteryUtils';
import { useState, useMemo } from 'react';
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
const TankIndicator = ({ level, type }) => {
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
                <span className="text-sm"><FontAwesomeIcon icon={icon} /></span>
                <div className="relative w-8 h-4 bg-oGray rounded-sm border border-oGray flex items-center justify-center">
                    {/* Battery terminal */}
                    <div className="absolute -right-1 w-1 h-3 bg-oGray rounded-sm" />
                    {/* Fill level indicator */}
                    <div
                        className={`absolute left-0 top-0 h-full ${color} transition-all duration-300 rounded-sm`}
                        style={{ width: `${percentage}%` }}
                    />
                    {/* Percentage display */}
                    <span 
                        className={`relative z-10 text-xs text-white font-bold ${percentage <= TANK_CONFIG.DANGER_THRESHOLD ? 'text-oRed animate-pulse' : ''}`}
                    >
                        {percentage}%
                    </span>
                </div>
            </div>
            
            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute -left-20 top-6 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-20">
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
const BatteryIndicator = ({ batteryLevel, batteryNumber, voltage }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const percentage = Math.max(0, Math.min(100, batteryLevel));
    const isCharging = isBatteryCharging(voltage);
    const batteryColor = useMemo(() => getBatteryColorClass(percentage), [percentage]);

    return (
        <div
            className="flex items-center space-x-3  relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
                <div className="flex items-center space-x-2">
                <span className="text-sm"><FontAwesomeIcon icon={faBolt} /></span>
            <div className="relative w-8 h-4 bg-oGray rounded-sm border border-oGray flex items-center justify-center">
                {/* Battery terminal */}
                <div className="absolute -right-1 w-1 h-3 bg-oGray rounded-sm" />
                {/* Fill level indicator */}
                <div
                    className={`absolute left-0 top-0 h-full ${batteryColor} transition-all duration-300 rounded-sm`}
                    style={{ width: `${percentage}%` }}
                />
                {/* Display charging icon or percentage */}
                {isCharging ? (
                    <span className="relative z-10 text-xs text-white font-bold">⚡︎</span>
                ) : (
                    <span 
                        className={`relative z-10 text-xs text-white font-bold ${percentage <= BATTERY_CONFIG.DANGER_THRESHOLD ? 'text-oRed animate-pulse' : ''}`}
                    >
                        {percentage}%
                    </span>
                )}
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute -left-20 top-6 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-20">
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
    const { nightMode, getSignalKValue } = useOcearoContext();
    const [displayMode, setDisplayMode] = useState(INDICATOR_TYPES.BATTERIES);

    // Fetch battery data
    const batteries = useMemo(() => {
        const battery1SoC = getSignalKValue('electrical.batteries.1.capacity.stateOfCharge');
        const battery1Voltage = getSignalKValue('electrical.batteries.1.voltage');
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
    }, [getSignalKValue]);

    // Fetch tank data
    const tankLevels = useMemo(() => ({
        FRESH_WATER: getSignalKValue(TANK_TYPES.FRESH_WATER.path) || 40,
        FUEL: getSignalKValue(TANK_TYPES.FUEL.path) || 75,
        BLACK_WATER: getSignalKValue(TANK_TYPES.BLACK_WATER.path) || 20
    }), [getSignalKValue]);

    // Toggle between battery and tank display
    const toggleDisplayMode = () => {
        setDisplayMode(current =>
            current === INDICATOR_TYPES.BATTERIES ? INDICATOR_TYPES.TANKS : INDICATOR_TYPES.BATTERIES
        );
    };

    const textColor = nightMode ? 'text-oNight' : 'text-oGray';
    const isBatteryMode = displayMode === INDICATOR_TYPES.BATTERIES;

    return (
        <div
            className={`${textColor} rounded-lg transition-all duration-300 hover:bg-gray-800/10 cursor-pointer`}
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
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ThreeDBoatTankIndicator;