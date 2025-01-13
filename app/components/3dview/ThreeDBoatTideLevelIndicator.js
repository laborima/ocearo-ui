import { useOcearoContext } from '../context/OcearoContext';
import { useState, useEffect } from 'react';

const ThreeDBoatTideLevelIndicator = () => {
    const { nightMode, getSignalKValue } = useOcearoContext();

    const [tideLevel, setTideLevel] = useState(null);
    const [tideHigh, setTideHigh] = useState(null);
    const [tideLow, setTideLow] = useState(null);
    const [timeLow, setTimeLow] = useState(null);
    const [timeHigh, setTimeHigh] = useState(null);
    const [isRising, setIsRising] = useState(null);
    const [tideCoefficient, setTideCoefficient] = useState(null);

    // Compute tide percentage
    const computeTidePercentage = (tideLevel, tideLow, tideHigh) => {
        if (tideHigh <= tideLow) return 0; // Avoid division by zero or invalid range
        const percentage = ((tideLevel - tideLow) / (tideHigh - tideLow)) * 100;
        return Math.min(100, Math.max(0, percentage)); // Clamp to 0-100
    };

    // Determine if tide is rising based on current time
    const computeIsRising = (currentTime, timeLow, timeHigh) => {
        const timeToMinutes = (timeString) => {
            if (!timeString) {
                console.error("Invalid timeString:", timeString); // Debug log
                return null;
            }
            const [hours, minutes] = timeString.split(':').map(Number);
            return hours * 60 + minutes;
        };

        if (!timeLow || !timeHigh) {
            console.error("Invalid timeLow or timeHigh:", { timeLow, timeHigh });
            return false; // Default to false if times are invalid
        }

        const currentMinutes = timeToMinutes(currentTime);
        const lowMinutes = timeToMinutes(timeLow);
        const highMinutes = timeToMinutes(timeHigh);

        if (currentMinutes === null || lowMinutes === null || highMinutes === null) {
            console.error("Failed to compute minutes for times:", { currentTime, timeLow, timeHigh });
            return false; // Default to false if time conversion fails
        }

        if (lowMinutes < highMinutes) {
            // Standard case: low tide before high tide
            return currentMinutes >= lowMinutes && currentMinutes <= highMinutes;
        } else {
            // Edge case: high tide crosses midnight
            return currentMinutes >= lowMinutes || currentMinutes <= highMinutes;
        }
    };


    useEffect(() => {
        // Update local state with SignalK values if they exist
        const currentTime = new Date();
        const currentTimeString = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;

        const tideHeightNow = getSignalKValue('environment.tide.heightNow');
        const tideHeightHigh = getSignalKValue('environment.tide.heightHigh');
        const tideHeightLow = getSignalKValue('environment.tide.heightLow');
        const tideTimeLow = getSignalKValue('environment.tide.timeLow');
        const tideTimeHigh = getSignalKValue('environment.tide.timeHigh');
        const tideCoeff = getSignalKValue('environment.tide.coeffNow');

        if (
            tideHeightNow != null &&
            tideHeightHigh != null &&
            tideHeightLow != null &&
            tideTimeLow != null &&
            tideTimeHigh != null &&
            tideCoeff != null
        ) {
            setTideLevel(tideHeightNow);
            setTideHigh(tideHeightHigh);
            setTideLow(tideHeightLow);
            setTimeLow(tideTimeLow);
            setTimeHigh(tideTimeHigh);
            setTideCoefficient(tideCoeff);
            setIsRising(computeIsRising(currentTimeString, tideTimeLow, tideTimeHigh));
        } 


    }, [getSignalKValue]);

    const textColor = nightMode ? 'text-oNight' : 'text-white';

    // Only render tide information if all necessary data is present
    if (tideLevel === null || tideHigh === null || tideLow === null || timeLow === null || timeHigh === null || isRising === null || tideCoefficient === null) {
        return null; // Don't display anything if there's an error or no data
    }

    const tideColor = isRising ? 'bg-oGreen' : 'bg-oYellow';
    const tideIndicatorColor = isRising ? 'text-oGreen' : 'text-oYellow';
    const tidePercentage = computeTidePercentage(tideLevel, tideLow, tideHigh);

    return (
        <div>
            {/* High Tide Time */}
            <div className={`text-s ${textColor}`}>
            La Rochelle
            </div>
            <div className={`text-s mb-2 ${textColor}`}>
                {timeHigh}
                <span className={`inline-block ${isRising ? 'rotate-0' : 'rotate-180'} transform ${tideIndicatorColor}`}>
                    ▲
                </span>{tideCoefficient}
            </div>

            {/* Vertical Tide Level Indicator */}
            <div className="relative flex flex-col h-60 w-8">
                <span className={`absolute ${textColor} text-s font-medium flex`} style={{ top: `0%`, left: '60%' }}>
                    {tideHigh}m
                </span>
                <span className={`absolute ${textColor} text-s font-medium flex`} style={{ bottom: `${tidePercentage}%`, left: '60%' }}>
                    {tideLevel.toFixed(2)}m
                </span>
                <span className={`absolute ${textColor} text-s font-medium flex`} style={{ bottom: `0%`, left: '60%' }}>
                    {tideLow}m
                </span>
                <div className="flex flex-col justify-end bg-oGray rounded-3xl w-2 h-60 overflow-hidden">
                    <div
                        role="progressbar"
                        className={`${tideColor} w-2 rounded-3xl`}
                        aria-valuenow={tidePercentage}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        style={{ height: `${tidePercentage}%` }}
                    ></div>
                </div>
            </div>

            {/* Low Tide Time */}
            <div className={`text-s mt-2 ${textColor}`}>
                {timeLow}
            </div>
        </div>
    );
};

export default ThreeDBoatTideLevelIndicator;
