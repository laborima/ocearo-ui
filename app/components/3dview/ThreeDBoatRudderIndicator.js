import { useOcearoContext } from '../context/OcearoContext';

const ThreeDBoatRudderIndicator = () => {
    const { nightMode } = useOcearoContext();
    const { getSignalKValue } = useOcearoContext();

    const rudderAngleRadians = getSignalKValue('steering.rudderAngle') || 0; // Example: -0.5585 radians
    const rudderAngle = (rudderAngleRadians * 180) / Math.PI; // Convert to degrees


    // Function to generate graduation markers
    const renderGraduations = () => {
        const markers = [];
        for (let i = -60; i <= 60; i += 10) {
            const position = (i / 120) * 100; // Convert angle to percentage
            markers.push(
                <div
                    key={i}
                    className="absolute h-2 w-px bg-oGray" // Graduation style
                    style={{
                        left: `${50 + position}%`, // Positioning the marker
                        transform: 'translateX(-20%)', // Center the marker on the calculated position
                    }}
                >
                    <span
                        className={`text-xs ${nightMode ? 'text-oNight' : 'text-oGray'}`} // Graduation label color
                        style={{ transform: 'translateY(-50%)' }} // Position the label above the marker
                    >
                        {i}
                    </span>
                </div>
            );
        }
        return markers;
    };

    return (
        <div style={{ width: '480px', paddingBottom: '25px' }} className="mx-auto">
            <div className="w-full bg-oGray h-1 rounded-full relative  mt-2">
                {renderGraduations()} {/* Render graduation markers */}
                <div
                    className={`absolute top-0 h-1 rounded-full transition-all duration-300 ease-in-out ${rudderAngle < 0 ? 'bg-oRed' : 'bg-oGreen'}`}
                    style={{
                        width: `${Math.abs(rudderAngle) / 120 * 100}%`, // Scale width to max out at 100% for ±60 degrees
                        left: '50%', // Start from center
                        transform: rudderAngle < 0 ? 'translateX(-100%)' : 'translateX(0)' // Move left or right
                    }}
                />
            </div>
        </div>
    );
};

export default ThreeDBoatRudderIndicator;
