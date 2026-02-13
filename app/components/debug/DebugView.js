import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import configService from '../settings/ConfigService';
import { useOcearoContext } from '../context/OcearoContext';
import { useSignalKPaths } from '../hooks/useSignalK';
import { KNOTS_TO_MPS } from '../utils/UnitConversions';

const toRadians = (degrees) => (degrees * Math.PI) / 180;

/**
 * DebugView — Right-pane component shown when debug mode is active.
 * Provides wind override sliders, 3D axes toggle, and live SignalK debug data.
 */
const DebugView = () => {
    const { t } = useTranslation();
    const { updateSignalKData } = useOcearoContext();

    const [windOverride, setWindOverride] = useState(() => configService.get('debugWindOverride') || false);
    const [overrideSpeed, setOverrideSpeed] = useState(() => configService.get('debugWindSpeed') ?? 10);
    const [overrideDirection, setOverrideDirection] = useState(() => configService.get('debugWindDirection') ?? 0);
    const [showAxes, setShowAxes] = useState(() => configService.get('debugShowAxes') || false);

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

    const handleWindOverrideToggle = (enabled) => {
        setWindOverride(enabled);
        configService.set('debugWindOverride', enabled);
    };

    const handleSpeedChange = (speed) => {
        setOverrideSpeed(speed);
        configService.set('debugWindSpeed', speed);
    };

    const handleDirectionChange = (direction) => {
        setOverrideDirection(direction);
        configService.set('debugWindDirection', direction);
    };

    const handleAxesToggle = (enabled) => {
        setShowAxes(enabled);
        configService.set('debugShowAxes', enabled);
    };

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
    const getVal = (path, fallback) => skValues[path] ?? fallback;

    const trueWindAngle = getVal('environment.wind.angleTrueWater', toRadians(25));
    const trueWindSpeed = getVal('environment.wind.speedTrue', 20);
    const appWindAngle = getVal('environment.wind.angleApparent', toRadians(23));
    const appWindSpeed = getVal('environment.wind.speedApparent', 25);
    const beatAngle = getVal('performance.beatAngle', toRadians(45));
    const gybeAngle = getVal('performance.gybeAngle', toRadians(135));
    const beatVMG = getVal('performance.beatAngleVelocityMadeGood', 6);
    const gybeVMG = getVal('performance.gybeAngleVelocityMadeGood', 5);
    const targetTWA = getVal('performance.targetAngle', beatAngle);
    const optimalWindAngle = targetTWA - trueWindAngle;
    const polarSpeed = getVal('performance.polarSpeed', 8);
    const polarSpeedRatio = getVal('performance.polarSpeedRatio', 0.95);
    const velocityMadeGood = getVal('performance.velocityMadeGood', 5);
    const speedThroughWater = getVal('navigation.speedThroughWater', 7);
    const polarVelocityMadeGood = getVal('performance.polarVelocityMadeGood', 6);
    const polarVelocityMadeGoodRatio = getVal('performance.polarVelocityMadeGoodRatio', 0.9);
    const headingTrue = getVal('navigation.headingTrue', toRadians(0));
    const courseOverGroundAngle = getVal('navigation.courseOverGroundTrue', toRadians(20));
    const nextWaypointBearing = getVal('navigation.courseGreatCircle.nextPoint.bearingTrue', toRadians(30));
    const laylineAngle = getVal('performance.laylineAngle', toRadians(10));
    const laylineDistance = getVal('navigation.racing.layline.distance', 100);
    const laylineTime = getVal('navigation.racing.layline.time', 180);
    const oppositeLaylineDistance = getVal('navigation.racing.oppositeLayline.distance', 80);
    const oppositeLaylineTime = getVal('navigation.racing.oppositeLayline.time', 180);
    const distanceToStartline = getVal('navigation.racing.distanceStartline', 50);
    const timeToStart = getVal('navigation.racing.timeToStart', 120);
    const timePortDown = getVal('navigation.racing.timePortDown', 60);
    const timePortUp = getVal('navigation.racing.timePortUp', 70);
    const timeStbdDown = getVal('navigation.racing.timeStbdDown', 65);
    const timeStbdUp = getVal('navigation.racing.timeStbdUp', 75);

    const ToggleRow = ({ label, description, checked, onChange }) => (
        <div className="p-4 rounded-xl bg-hud-bg tesla-hover border border-hud">
            <label className="flex items-center justify-between cursor-pointer">
                <div className="space-y-1">
                    <span className="text-sm font-bold uppercase tracking-widest text-hud-secondary">{label}</span>
                    {description && (
                        <p className="text-xs text-hud-muted font-medium uppercase tracking-wider">{description}</p>
                    )}
                </div>
                <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
                <div className="relative w-11 h-6 bg-hud-bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-hud-main after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-hud-main after:border-hud-main after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-oYellow"></div>
            </label>
        </div>
    );

    return (
        <div className="p-8 text-hud-main w-full overflow-y-auto h-full">
            <header className="mb-8">
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">{t('menu.debug')}</h1>
                <p className="text-hud-secondary text-sm font-medium uppercase tracking-widest">{t('debug.systemDebug')}</p>
            </header>

            <div className="space-y-6">
                {/* 3D Axes Toggle */}
                <section className="tesla-card p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-black uppercase tracking-widest text-hud-main/90">3D</h2>
                        <div className="h-[1px] flex-grow bg-hud-border mx-4" />
                    </div>
                    <ToggleRow
                        label={t('settings.debugShowAxes')}
                        description={t('settings.debugShowAxesDesc')}
                        checked={showAxes}
                        onChange={handleAxesToggle}
                    />
                </section>

                {/* Wind Override */}
                <section className="tesla-card p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-black uppercase tracking-widest text-hud-main/90">{t('settings.debugWindOverride')}</h2>
                        <div className="h-[1px] flex-grow bg-hud-border mx-4" />
                    </div>
                    <ToggleRow
                        label={t('settings.debugWindOverride')}
                        description={t('settings.debugWindOverrideDesc')}
                        checked={windOverride}
                        onChange={handleWindOverrideToggle}
                    />
                    {windOverride && (
                        <div className="space-y-4 p-4 rounded-xl bg-oYellow/5 border border-oYellow/20">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black uppercase tracking-widest text-hud-secondary">{t('settings.debugWindSpeed')}</span>
                                    <span className="text-lg font-black text-oYellow bg-oYellow/10 px-3 py-1 rounded-lg">{overrideSpeed} kn</span>
                                </div>
                                <input
                                    type="range"
                                    className="w-full h-1.5 bg-hud-bg-elevated rounded-lg appearance-none cursor-pointer accent-oYellow"
                                    min="0" max="60" step="0.5"
                                    value={overrideSpeed}
                                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black uppercase tracking-widest text-hud-secondary">{t('settings.debugWindDirection')}</span>
                                    <span className="text-lg font-black text-oYellow bg-oYellow/10 px-3 py-1 rounded-lg">{overrideDirection}°</span>
                                </div>
                                <input
                                    type="range"
                                    className="w-full h-1.5 bg-hud-bg-elevated rounded-lg appearance-none cursor-pointer accent-oYellow"
                                    min="0" max="359" step="1"
                                    value={overrideDirection}
                                    onChange={(e) => handleDirectionChange(parseInt(e.target.value, 10))}
                                />
                            </div>
                        </div>
                    )}
                </section>

                {/* SignalK Debug Data */}
                <section className="tesla-card p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-black uppercase tracking-widest text-hud-main/90">{t('debug.windDynamics')}</h2>
                        <div className="h-[1px] flex-grow bg-hud-border mx-4" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <DebugRow label="TWA" value={`${(trueWindAngle * (180 / Math.PI)).toFixed(1)}°`} />
                        <DebugRow label="TWS" value={`${trueWindSpeed.toFixed(1)} kn`} />
                        <DebugRow label="AWA" value={`${(appWindAngle * (180 / Math.PI)).toFixed(1)}°`} />
                        <DebugRow label="AWS" value={`${appWindSpeed.toFixed(1)} kn`} />
                    </div>
                </section>

                <section className="tesla-card p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-black uppercase tracking-widest text-hud-main/90">{t('debug.performanceMetrics')}</h2>
                        <div className="h-[1px] flex-grow bg-hud-border mx-4" />
                    </div>
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

                <section className="tesla-card p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-black uppercase tracking-widest text-hud-main/90">{t('debug.navigation')}</h2>
                        <div className="h-[1px] flex-grow bg-hud-border mx-4" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <DebugRow label="Heading" value={`${(headingTrue * (180 / Math.PI)).toFixed(1)}°`} />
                        <DebugRow label="COG" value={`${(courseOverGroundAngle * (180 / Math.PI)).toFixed(1)}°`} />
                        <DebugRow label="WPT Brg" value={`${(nextWaypointBearing * (180 / Math.PI)).toFixed(1)}°`} accent="text-oYellow" />
                        <DebugRow label="Layline ∠" value={`${(laylineAngle * (180 / Math.PI)).toFixed(1)}°`} accent="text-oGreen" />
                    </div>
                </section>

                <section className="tesla-card p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-black uppercase tracking-widest text-hud-main/90">{t('debug.laylineAnalysis')}</h2>
                        <div className="h-[1px] flex-grow bg-hud-border mx-4" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <DebugRow label="Dist" value={`${laylineDistance.toFixed(0)}m`} />
                        <DebugRow label="Time" value={`${laylineTime}s`} />
                        <DebugRow label="Opp Dist" value={`${oppositeLaylineDistance.toFixed(0)}m`} />
                        <DebugRow label="Opp Time" value={`${oppositeLaylineTime}s`} />
                    </div>
                </section>

                <section className="tesla-card p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-black uppercase tracking-widest text-hud-main/90">{t('debug.regattaStart')}</h2>
                        <div className="h-[1px] flex-grow bg-hud-border mx-4" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <DebugRow label="Start Dist" value={`${distanceToStartline.toFixed(1)}m`} accent="text-oRed" />
                        <DebugRow label="TT Start" value={`${timeToStart}s`} accent="text-oRed" />
                        <DebugRow label="Port DW" value={`${timePortDown}s`} />
                        <DebugRow label="Port UW" value={`${timePortUp}s`} />
                        <DebugRow label="Stbd DW" value={`${timeStbdDown}s`} />
                        <DebugRow label="Stbd UW" value={`${timeStbdUp}s`} />
                    </div>
                </section>
            </div>
        </div>
    );
};

const DebugRow = ({ label, value, accent = "text-hud-main" }) => (
    <div className="flex flex-col bg-hud-bg p-2 rounded-lg border border-hud">
        <span className="text-xs font-black uppercase tracking-widest text-hud-muted leading-none mb-1">{label}</span>
        <span className={`text-xs font-mono font-bold ${accent}`}>{value}</span>
    </div>
);

export default DebugView;
