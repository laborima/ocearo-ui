import React from 'react';

const BatteryIndicator = ({batteryLevel, batteryNumber}) => {
    const batteryPercentage = Math.max(0, Math.min(100, batteryLevel));

    const getBatteryColor = () => {
        if (batteryPercentage > 50) {
            return 'bg-green-400';
        } else if (batteryPercentage > 20) {
            return 'bg-yellow-400';
        } else {
            return 'bg-red-400';
        }
    };

    return (
        <div className="flex items-center space-x-3 my-2">
            <div
                className="relative w-8 h-4 bg-gray-200 rounded-sm border border-gray-300 flex items-center justify-center">
                <div className="absolute -right-1 w-1 h-2 bg-gray-300 rounded-sm"></div>
                <div
                    className={`absolute left-0 top-0 h-full ${getBatteryColor()} rounded-sm`}
                    style={{width: `${batteryPercentage}%`}}
                ></div>
                <span className="relative z-10 text-xs text-black">{batteryNumber}</span>
            </div>
            <span className="text-white text-xs font-medium">{batteryPercentage}%</span>
        </div>
    );
};

export default BatteryIndicator;
