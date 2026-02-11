import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOcearoContext } from '../context/OcearoContext';
import { useSignalKPath } from '../hooks/useSignalK';

const ThreeDBoatRudderIndicator = () => {
    const { nightMode } = useOcearoContext();
    const rudderAngleRadians = useSignalKPath('steering.rudderAngle', 0);
    const rudderAngle = useMemo(() => (rudderAngleRadians * 180) / Math.PI, [rudderAngleRadians]);


    // Function to generate graduation markers
    const renderGraduations = () => {
        const markers = [];
        for (let i = -60; i <= 60; i += 10) {
            const position = (i / 120) * 100; // Convert angle to percentage
            markers.push(
                <div
                    key={i}
                    className="absolute h-1.5 w-[1px] bg-hud-muted opacity-20" // Graduation style
                    style={{
                        left: `${50 + position}%`, // Positioning the marker
                        bottom: '0',
                    }}
                >
                    <span
                        className={`absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-black uppercase tracking-tighter ${nightMode ? 'text-oNight/40' : 'text-hud-muted'}`}
                    >
                        {Math.abs(i)}
                    </span>
                </div>
            );
        }
        return markers;
    };

    return (
        <div style={{ width: '400px' }} className="mx-auto p-4 transition-all duration-300 group">

            <div className="w-full bg-hud-elevated h-1.5 rounded-full relative">
                {renderGraduations()}
                <motion.div
                    initial={false}
                    animate={{
                        width: `${Math.abs(rudderAngle) / 120 * 100}%`,
                        left: rudderAngle < 0 ? `${50 - (Math.abs(rudderAngle) / 120 * 100)}%` : '50%'
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`absolute top-0 h-full rounded-full ${rudderAngle < 0 ? 'bg-oRed' : 'bg-oGreen'} shadow-[0_0_15px_var(--hud-text-main)] shadow-opacity-20`}
                />
                {/* Center marker */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-3 bg-hud-muted opacity-20 rounded-full z-10" />
            </div>
        </div>
    );
};

export default ThreeDBoatRudderIndicator;
