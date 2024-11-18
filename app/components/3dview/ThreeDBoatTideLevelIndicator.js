import { useThreeDView } from './context/ThreeDViewContext';
import { useOcearoContext } from '../context/OcearoContext';
import { useState, useEffect } from 'react';

const ThreeDBoatTideLevelIndicator = () => {
    const { nightMode } = useThreeDView();
    const { getSignalKValue } = useOcearoContext();

    const [tideLevel, setTideLevel] = useState(0);
    const [tideHigh, setTideHigh] = useState(0);
    const [tideLow, setTideLow] = useState(0);
    const [timeLow, setTimeLow] = useState("");
    const [timeHigh, setTimeHigh] = useState("");

    useEffect(() => {
        setTideLevel(getSignalKValue('environment.tide.heightNow') || 3.4);
        setTideHigh(getSignalKValue('environment.tide.heightHigh') || 5);
        setTideLow(getSignalKValue('environment.tide.heightLow') || 2.1);
        setTimeLow(getSignalKValue('environment.tide.timeLow') || "10:00");
        setTimeHigh(getSignalKValue('environment.tide.timeHigh') || "16:00");
    }, [getSignalKValue]);

    const textColor = nightMode ? 'text-oNight' : 'text-white';
    const isAscending = tideLevel >= tideLow && tideLevel <= tideHigh;
    const tideColor = isAscending ? 'bg-oGreen' : 'bg-oYellow';
    const tidePercentage = Math.min((tideLevel / 10) * 100, 100);

    return (
        <div >
            {/* High Tide Time */}
            <div className={`text-xs mb-2 ${textColor} text-center`}>
                {timeHigh}
            </div>

            {/* Vertical Tide Level Indicator with absolute text placement */}
            <div className="relative flex flex-col items-center h-60 w-20">
                {/* Tide Level Label */}
                <span
                    className={`absolute  ${textColor} text-xs font-medium flex justify-center items-center`}
                    style={{ top: `0%`, left: '60%' }}
                >
                    {tideHigh}m
                </span>


                <span
                    className={`absolute  ${textColor} text-xs font-medium flex justify-center items-center`}
                    style={{ bottom: `${tidePercentage}%`, left: '60%' }}
                >
                    {tideLevel}m
                </span>

                <span
                    className={`absolute  ${textColor} text-xs font-medium flex justify-center items-center`}
                    style={{ bottom: `0%`, left: '60%' }}
                >
                    {tideLow}m
                </span>

                {/* Vertical Progress Bar */}
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
            <div className={`text-xs mt-2 ${textColor} text-center`}>
                {timeLow}
            </div>
        </div>
    );
};

export default ThreeDBoatTideLevelIndicator;
