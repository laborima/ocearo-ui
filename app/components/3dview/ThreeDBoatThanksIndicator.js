import { useOcearoContext } from '../context/OcearoContext';
import { BATTERY_CONFIG, estimateStateOfCharge, isBatteryCharging, getBatteryColorClass } from '../utils/BatteryUtils';
import { useState, useMemo } from 'react';

// Constants
const INDICATOR_TYPES = {
    BATTERIES: 'batteries',
    TANKS: 'tanks'
};

const TANK_TYPES = {
    FRESH_WATER: {
        id: 'freshWater',
        label: 'Fresh Water',
        path: 'tanks.freshWater.0.currentLevel',
        icon: '💧',
        color: 'bg-oBlue'
    },
    FUEL: {
        id: 'fuel',
        label: 'Fuel',
        path: 'tanks.fuel.0.currentLevel',
        icon: '⛽',
        color: 'bg-oYellow'
    },
    BLACK_WATER: {
        id: 'blackWater',
        label: 'Black Water',
        path: 'tanks.blackWater.0.currentLevel',
        icon: '🚰',
        color: 'bg-oGray'
    }
};


// Tank Indicator Component
const TankIndicator = ({ level, type }) => {
    const percentage = Math.max(0, Math.min(100, level));
    const { label, icon, color } = TANK_TYPES[type];

    return (
        <div className="flex items-center space-x-3 my-2">
            <div className="flex items-center space-x-2">
                <span className="text-sm">{icon}</span>
                <div className="relative w-20 h-4 bg-oGray rounded-lg overflow-hidden">
                    <div
                        className={`absolute left-0 top-0 h-full ${color} transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
            <span className="text-sm font-medium">{label}: {percentage}%</span>
        </div>
    );
};

// Battery Indicator Component
const BatteryIndicator = ({ batteryLevel, batteryNumber, voltage }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const percentage = Math.max(0, Math.min(100, batteryLevel));
    const isCharging = isBatteryCharging(voltage);

    const batteryColor = useMemo(() => getBatteryColorClass(percentage), [percentage]);

    return (
        <div
            className="flex items-center space-x-3 my-2 relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className="relative w-8 h-4 bg-oGray rounded-sm border border-oGray flex items-center justify-center">
                <div className="absolute -right-1 w-1 h-3 bg-oGray rounded-sm" />
                <div
                    className={`absolute left-0 top-0 h-full ${batteryColor} transition-all duration-300 rounded-sm`}
                    style={{ width: `${percentage}%` }}
                />
                {isCharging && (
                    <span className="relative z-10 text-xs text-white  font-bold">⚡︎</span>
                )}

                {!isCharging && (
                    <span className={`relative z-10 text-xs text-white font-bold ${percentage <= BATTERY_CONFIG.DANGER_THRESHOLD ? 'text-oRed animate-pulse' : ''}`}>{percentage}%</span>

                )}

            </div>


            {showTooltip && (
                <div className="absolute -left-20 top-10 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                    Voltage: {voltage?.toFixed(1)}V {isCharging && '(Charging)'}
                </div>
            )}
        </div>
    );
};

const ThreeDBoatTankIndicator = () => {
    const { nightMode, getSignalKValue } = useOcearoContext();
    const [displayMode, setDisplayMode] = useState(INDICATOR_TYPES.BATTERIES);

    // Fetch battery data
    const batteries = useMemo(() => {
        const battery1SoC = getSignalKValue('electrical.batteries.1.capacity.stateOfCharge');
        const battery1Voltage = getSignalKValue('electrical.batteries.1.voltage');
        const battery1EstimatedSoC = battery1SoC === null ? estimateStateOfCharge(battery1Voltage) : battery1SoC;

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

    const toggleDisplayMode = () => {
        setDisplayMode(current =>
            current === INDICATOR_TYPES.BATTERIES ? INDICATOR_TYPES.TANKS : INDICATOR_TYPES.BATTERIES
        );
    };

    const textColor = nightMode ? 'text-oNight' : 'text-oGray';

    return (
        <div
            className={`${textColor} rounded-lg transition-all duration-300 hover:bg-gray-800/10 cursor-pointer`}
            onClick={toggleDisplayMode}
            role="button"
            tabIndex={0}
            aria-label={`Toggle between ${displayMode === INDICATOR_TYPES.BATTERIES ? 'tanks' : 'batteries'} display`}
            onKeyPress={(e) => e.key === 'Enter' && toggleDisplayMode()}
        >
            {displayMode === INDICATOR_TYPES.BATTERIES ? (
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
                    {Object.entries(TANK_TYPES).map(([key, _]) => (
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