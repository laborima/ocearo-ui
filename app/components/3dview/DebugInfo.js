import React, { Suspense, useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useSignalKPaths } from '../hooks/useSignalK';
import { useTranslation } from 'react-i18next';
import { Html } from '@react-three/drei';
import configService from '../settings/ConfigService';
import { useOcearoContext } from '../context/OcearoContext';
import { KNOTS_TO_MPS } from '../utils/UnitConversions';

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const DebugInfo = (sampleData = true) => {
    const { updateSignalKData } = useOcearoContext();
    const [windOverride, setWindOverride] = useState(() => configService.get('debugWindOverride') || false);
    const [overrideSpeed, setOverrideSpeed] = useState(() => configService.get('debugWindSpeed') ?? 10);
    const [overrideDirection, setOverrideDirection] = useState(() => configService.get('debugWindDirection') ?? 0);

    /**
     * Pushes overridden wind values into the SignalK data stream
     */
    const applyWindOverride = useCallback((speed, direction) => {
        const speedMps = speed * KNOTS_TO_MPS;
        const directionRad = (direction * Math.PI) / 180;
        updateSignalKData({
            'environment.wind.speedTrue': speedMps,
            'environment.wind.speedApparent': speedMps,
            'environment.wind.angleTrueWater': directionRad,
            'environment.wind.angleApparent': directionRad,
            'environment.wind.directionTrue': directionRad,
        });
    }, [updateSignalKData]);

    useEffect(() => {
        if (!windOverride) return;
        applyWindOverride(overrideSpeed, overrideDirection);
        const interval = setInterval(() => {
            applyWindOverride(overrideSpeed, overrideDirection);
        }, 1000);
        return () => clearInterval(interval);
    }, [windOverride, overrideSpeed, overrideDirection, applyWindOverride]);

    /**
     * @param {boolean} enabled
     */
    const handleWindOverrideToggle = (enabled) => {
        setWindOverride(enabled);
        configService.set('debugWindOverride', enabled);
    };

    /**
     * @param {number} speed - Wind speed in knots
     */
    const handleSpeedChange = (speed) => {
        setOverrideSpeed(speed);
        configService.set('debugWindSpeed', speed);
    };

    /**
     * @param {number} direction - Wind direction in degrees
     */
    const handleDirectionChange = (direction) => {
        setOverrideDirection(direction);
        configService.set('debugWindDirection', direction);
    };

    // Define all paths for subscription
    const debugPaths = useMemo(() => [
        'environment.wind.angleTrueWater',
        'environment.wind.speedTrue',
        'environment.wind.angleApparent',
        'environment.wind.speedApparent',
        'performance.beatAngle',
        'performance.gybeAngle',
        'performance.beatAngleVelocityMadeGood',
        'performance.gybeAngleVelocityMadeGood',
        'performance.targetAngle',
        'performance.polarSpeed',
        'performance.polarSpeedRatio',
        'performance.velocityMadeGood',
        'navigation.speedThroughWater',
        'performance.polarVelocityMadeGood',
        'performance.polarVelocityMadeGoodRatio',
        'navigation.headingTrue',
        'navigation.courseOverGroundTrue',
        'navigation.courseGreatCircle.nextPoint.bearingTrue',
        'performance.laylineAngle',
        'navigation.racing.lailine',
        'navigation.racing.layline.distance',
        'navigation.racing.layline.time',
        'navigation.racing.oppositeLayline',
        'navigation.racing.oppositeLayline.distance',
        'navigation.racing.oppositeLayline.time',
        'navigation.racing.startLineStb',
        'navigation.racing.startLinePort',
        'navigation.racing.distanceStartline',
        'navigation.racing.timeToStart',
        'navigation.racing.timePortDown',
        'navigation.racing.timePortUp',
        'navigation.racing.timeStbdDown',
        'navigation.racing.timeStbdUp'
    ], []);

    const skValues = useSignalKPaths(debugPaths);

    // Helper to get value with fallback
    const getVal = (path, fallback) => skValues[path] ?? fallback;

    // *** Données de vent ***
    const trueWindAngle = getVal('environment.wind.angleTrueWater', toRadians(25));
    const trueWindSpeed = getVal('environment.wind.speedTrue', 20);
    const appWindAngle = getVal('environment.wind.angleApparent', toRadians(23));
    const appWindSpeed = getVal('environment.wind.speedApparent', 25);

    // *** Performances de navigation ***
    const beatAngle = getVal('performance.beatAngle', toRadians(45));
    const gybeAngle = getVal('performance.gybeAngle', toRadians(135));
    const beatVMG = getVal('performance.beatAngleVelocityMadeGood', 6);
    const gybeVMG = getVal('performance.gybeAngleVelocityMadeGood', 5);
    const targetTWA = getVal('performance.targetAngle', beatAngle);
    const optimalWindAngle = targetTWA - trueWindAngle;
    const polarSpeed = getVal('performance.polarSpeed', 8);
    const polarSpeedRatio = getVal('performance.polarSpeedRatio', 0.95);
    
    // *** Données de vitesse et de performance ***
    const velocityMadeGood = getVal('performance.velocityMadeGood', 5);
    const speedThroughWater = getVal('navigation.speedThroughWater', 7);
    const polarVelocityMadeGood = getVal('performance.polarVelocityMadeGood', 6);
    const polarVelocityMadeGoodRatio = getVal('performance.polarVelocityMadeGoodRatio', 0.9);

    // *** Cap et angle par rapport au waypoint ***
    const headingTrue = getVal('navigation.headingTrue', toRadians(0));
    const courseOverGroundAngle = getVal('navigation.courseOverGroundTrue', toRadians(20));
    const nextWaypointBearing = getVal('navigation.courseGreatCircle.nextPoint.bearingTrue', toRadians(30));
    const laylineAngle = getVal('performance.laylineAngle', toRadians(10));

    // *** Layline pour navigation de régate ***
    const layline = getVal('navigation.racing.lailine', toRadians(10));
    const laylineDistance = getVal('navigation.racing.layline.distance', 100);
    const laylineTime = getVal('navigation.racing.layline.time', 180);

    // *** Layline opposée pour la navigation de régate ***
    const oppositeLayline = getVal('navigation.racing.oppositeLayline', toRadians(45));
    const oppositeLaylineDistance = getVal('navigation.racing.oppositeLayline.distance', 80);
    const oppositeLaylineTime = getVal('navigation.racing.oppositeLayline.time', 180);

    // *** Données de ligne de départ pour la régate ***
    const startLineStb = getVal('navigation.racing.startLineStb', { latitude: 0, longitude: 0, altitude: 0 });
    const startLinePort = getVal('navigation.racing.startLinePort', { latitude: 0, longitude: 0, altitude: 0 });
    const distanceToStartline = getVal('navigation.racing.distanceStartline', 50);
    const timeToStart = getVal('navigation.racing.timeToStart', 120);
    const timePortDown = getVal('navigation.racing.timePortDown', 60);
    const timePortUp = getVal('navigation.racing.timePortUp', 70);
    const timeStbdDown = getVal('navigation.racing.timeStbdDown', 65);
    const timeStbdUp = getVal('navigation.racing.timeStbdUp', 75);

    const { t } = useTranslation();

    return (
        <group>
            <axesHelper args={[100]} />

            <Html 
                position={[5, 5, 0]} 
                className="select-none"
            >
                <div className="tesla-card p-6 min-w-[350px] bg-hud-bg backdrop-blur-xl border border-hud shadow-2xl rounded-3xl space-y-6">
                    <header className="flex items-center justify-between border-b border-hud pb-2">
                        <div className="text-xs font-black uppercase tracking-[0.2em] mb-3 text-oBlue/80">{t('debug.systemDebug')}</div>
                        <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-oGreen animate-pulse" />
                            <div className="w-1.5 h-1.5 rounded-full bg-hud-elevated" />
                            <div className="w-1.5 h-1.5 rounded-full bg-hud-elevated" />
                        </div>
                    </header>

                    <div className="grid grid-cols-1 gap-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        {/* Wind Data */}
                        <section className="space-y-2">
                            <div className="text-xs font-black uppercase tracking-[0.15em] mb-2 text-hud-muted/60">{t('debug.windDynamics')}</div>
                            <div className="grid grid-cols-2 gap-2">
                                <DebugRow label="TWA" value={`${(trueWindAngle * (180 / Math.PI)).toFixed(1)}°`} />
                                <DebugRow label="TWS" value={`${trueWindSpeed.toFixed(1)} kn`} />
                                <DebugRow label="AWA" value={`${(appWindAngle * (180 / Math.PI)).toFixed(1)}°`} />
                                <DebugRow label="AWS" value={`${appWindSpeed.toFixed(1)} kn`} />
                            </div>
                        </section>

                        {/* Navigation Performance */}
                        <section className="space-y-2">
                            <div className="text-xs font-black uppercase tracking-[0.15em] mb-2 text-hud-muted/60">{t('debug.performanceMetrics')}</div>
                            <div className="grid grid-cols-2 gap-2">
                                <DebugRow label="Beat ∠" value={`${(beatAngle * (180 / Math.PI)).toFixed(1)}°`} />
                                <DebugRow label="Gybe ∠" value={`${(gybeAngle * (180 / Math.PI)).toFixed(1)}°`} />
                                <DebugRow label="VMG Beat" value={`${beatVMG.toFixed(1)} kn`} />
                                <DebugRow label="VMG Gybe" value={`${gybeVMG.toFixed(1)} kn`} />
                                <DebugRow label="Target TWA" value={`${(targetTWA * (180 / Math.PI)).toFixed(1)}°`} />
                                <DebugRow label="Opt ∠" value={`${(optimalWindAngle * (180 / Math.PI)).toFixed(1)}°`} />
                                <DebugRow label="Polar Spd" value={`${polarSpeed.toFixed(1)} kn`} />
                                <DebugRow label="Pol Ratio" value={polarSpeedRatio.toFixed(2)} />
                                <DebugRow label="VMG" value={`${velocityMadeGood.toFixed(1)} kn`} accent="text-oBlue" />
                                <DebugRow label="STW" value={`${speedThroughWater.toFixed(1)} kn`} />
                                <DebugRow label="Pol VMG" value={`${polarVelocityMadeGood.toFixed(1)} kn`} />
                                <DebugRow label="Pol VMG %" value={`${(polarVelocityMadeGoodRatio * 100).toFixed(1)}%`} />
                            </div>
                        </section>

                        {/* Waypoint and Heading */}
                        <section className="space-y-2">
                            <div className="text-xs font-black uppercase tracking-[0.15em] mb-2 text-hud-muted/60">{t('debug.navigation')}</div>
                            <div className="grid grid-cols-2 gap-2">
                                <DebugRow label="Heading" value={`${(headingTrue * (180 / Math.PI)).toFixed(1)}°`} />
                                <DebugRow label="COG" value={`${(courseOverGroundAngle * (180 / Math.PI)).toFixed(1)}°`} />
                                <DebugRow label="WPT Brg" value={`${(nextWaypointBearing * (180 / Math.PI)).toFixed(1)}°`} accent="text-oYellow" />
                                <DebugRow label="Layline ∠" value={`${(laylineAngle * (180 / Math.PI)).toFixed(1)}°`} accent="text-oGreen" />
                            </div>
                        </section>

                        {/* Layline Data */}
                        <section className="space-y-2">
                            <div className="text-xs font-black uppercase tracking-[0.15em] mb-2 text-hud-muted/60">{t('debug.laylineAnalysis')}</div>
                            <div className="grid grid-cols-2 gap-2">
                                <DebugRow label="Dist" value={`${laylineDistance.toFixed(0)}m`} />
                                <DebugRow label="Time" value={`${laylineTime}s`} />
                                <DebugRow label="Opp Dist" value={`${oppositeLaylineDistance.toFixed(0)}m`} />
                                <DebugRow label="Opp Time" value={`${oppositeLaylineTime}s`} />
                            </div>
                        </section>

                        {/* Starting Line Data */}
                        <section className="space-y-2">
                            <div className="text-xs font-black uppercase tracking-[0.15em] mb-2 text-hud-muted/60">{t('debug.regattaStart')}</div>
                            <div className="grid grid-cols-2 gap-2">
                                <DebugRow label="Start Dist" value={`${distanceToStartline.toFixed(1)}m`} accent="text-oRed" />
                                <DebugRow label="TT Start" value={`${timeToStart}s`} accent="text-oRed" />
                                <DebugRow label="Port DW" value={`${timePortDown}s`} />
                                <DebugRow label="Port UW" value={`${timePortUp}s`} />
                                <DebugRow label="Stbd DW" value={`${timeStbdDown}s`} />
                                <DebugRow label="Stbd UW" value={`${timeStbdUp}s`} />
                            </div>
                        </section>

                        {/* Wind Override Controls */}
                        <section className="space-y-3 pointer-events-auto">
                            <div className="flex items-center justify-between">
                                <div className="text-xs font-black uppercase tracking-[0.15em] text-oYellow/80">{t('settings.debugWindOverride')}</div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={windOverride}
                                        onChange={(e) => handleWindOverrideToggle(e.target.checked)}
                                    />
                                    <div className="relative w-9 h-5 bg-hud-bg-elevated rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-hud-main after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-hud-main after:border-hud-main after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-oYellow"></div>
                                </label>
                            </div>
                            {windOverride && (
                                <div className="space-y-3 p-3 rounded-xl bg-oYellow/5 border border-oYellow/20">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black uppercase tracking-widest text-hud-muted">{t('settings.debugWindSpeed')}</span>
                                            <span className="text-sm font-black text-oYellow bg-oYellow/10 px-2 py-0.5 rounded-md">{overrideSpeed} kn</span>
                                        </div>
                                        <input
                                            type="range"
                                            className="w-full h-1.5 bg-hud-bg-elevated rounded-lg appearance-none cursor-pointer accent-oYellow"
                                            min="0"
                                            max="60"
                                            step="0.5"
                                            value={overrideSpeed}
                                            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black uppercase tracking-widest text-hud-muted">{t('settings.debugWindDirection')}</span>
                                            <span className="text-sm font-black text-oYellow bg-oYellow/10 px-2 py-0.5 rounded-md">{overrideDirection}°</span>
                                        </div>
                                        <input
                                            type="range"
                                            className="w-full h-1.5 bg-hud-bg-elevated rounded-lg appearance-none cursor-pointer accent-oYellow"
                                            min="0"
                                            max="359"
                                            step="1"
                                            value={overrideDirection}
                                            onChange={(e) => handleDirectionChange(parseInt(e.target.value, 10))}
                                        />
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </Html>
        </group>
    );
};

const DebugRow = ({ label, value, accent = "text-hud-main" }) => (
    <div className="flex flex-col bg-hud-bg p-2 rounded-lg border border-hud">
        <span className="text-xs font-black uppercase tracking-widest text-hud-muted leading-none mb-1">{label}</span>
        <span className={`text-xs font-mono font-bold ${accent}`}>{value}</span>
    </div>
);

export default DebugInfo;

