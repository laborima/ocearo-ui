import { useOcearoContext } from '../context/OcearoContext';

const ThreeDBoatPositionDateIndicator = () => {
    const { nightMode, getSignalKValue } = useOcearoContext();
    
    // Get position data from SignalK
    const position = getSignalKValue('navigation.position');
    
    // Format position data
    const formatCoordinate = (value, isLatitude) => {
        if (value === undefined || value === null) return '--';
        const absolute = Math.abs(value);
        const degrees = Math.floor(absolute);
        const minutes = ((absolute - degrees) * 60).toFixed(3);
        const direction = isLatitude 
            ? (value >= 0 ? 'N' : 'S')
            : (value >= 0 ? 'E' : 'W');
        return `${degrees}°${minutes}'${direction}`;
    };
    
    // Get current date and time
    const getCurrentDateTime = () => {
        const now = new Date();
        return now.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };
    
    const textColor = nightMode ? 'text-oNight' : 'text-oGray';
    
    return (
        <div className={`text-center ${textColor}`}>
            <div className="text-xl font-semibold">
                {getCurrentDateTime()}
            </div>
            <div className="text-lg">
                {formatCoordinate(position.latitude, true)} {formatCoordinate(position.longitude, false)}
            </div>
        </div>
    );
};

export default ThreeDBoatPositionDateIndicator;