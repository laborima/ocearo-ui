'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toDegrees } from '../context/OcearoContext';
import { useSignalKPaths } from '../hooks/useSignalK';
import signalKService from '../services/SignalKService';
import configService from '../settings/ConfigService';
import { makeOcearoCoreApiCall } from '../utils/OcearoCoreUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCompass,
    faWind,
    faRoute,
    faPlay,
    faPause,
    faStop,
    faGamepad,
    faSync,
    faExclamationTriangle,
    faCheckCircle,
    faTimesCircle,
    faAnchor,
    faLocationArrow,
    faSatellite
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

/**
 * AutopilotView - Complete autopilot control interface
 * 
 * Features:
 * - Autopilot status display (state, mode, target)
 * - Engage/disengage controls
 * - Mode selection (compass, wind, GPS, route)
 * - Heading adjustment (+/- 1°, 10°)
 * - Tack and gybe maneuvers
 * - PlayStation controller configuration (via OcearoCore)
 */
// Time window to confirm a tack or gybe after arming it
const CONFIRM_WINDOW_MS = 4000;
const DEFAULT_MODES = ['compass', 'wind', 'gps', 'route'];

/**
 * Device-advertised option list. The spec example uses `state`/`mode`, the
 * actions section `states`/`modes`: accept both.
 */
const optionList = (options, singular, plural) => {
    const list = options?.[plural] ?? options?.[singular];
    return Array.isArray(list) ? list.map(item => (typeof item === 'string' ? item : item?.value ?? item?.name)).filter(Boolean) : null;
};

export default function AutopilotView() {
    const { t } = useTranslation();
    const debugMode = configService.get('debugMode');
    
    // Use subscription model for real-time data
    const autopilotPaths = useMemo(() => [
        'navigation.headingTrue',
        'navigation.headingMagnetic',
        'environment.wind.angleApparent',
        'steering.rudderAngle',
        'steering.autopilot.state',
        'steering.autopilot.mode',
        'steering.autopilot.engaged',
        'steering.autopilot.target',
        'steering.autopilot.target.headingTrue',
        'steering.autopilot.target.windAngleApparent'
    ], []);

    const skValues = useSignalKPaths(autopilotPaths);
    
    const currentHeading = skValues['navigation.headingTrue'] ?? skValues['navigation.headingMagnetic'];
    const apparentWindAngle = skValues['environment.wind.angleApparent'];
    const rudderAngle = skValues['steering.rudderAngle'];

    // State
    const [activeTab, setActiveTab] = useState('control');

    const primaryTextClass = 'text-hud-main';
    const secondaryTextClass = 'text-hud-secondary';
    const mutedTextClass = 'text-hud-muted';

    const [autopilotData, setAutopilotData] = useState(null);
    const [devices, setDevices] = useState([]);
    // '_default' is the Signal K v2 autopilot API's reserved id for the primary pilot.
    const [selectedDevice, setSelectedDevice] = useState('_default');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Controller config state
    const [controllerConfig, setControllerConfig] = useState(null);
    const [controllerConnected, setControllerConnected] = useState(false);

    // Keep a ref to skValues so the polling callback doesn't depend on it
    const skValuesRef = React.useRef(skValues);
    skValuesRef.current = skValues;

    /**
     * Fetch autopilot data from SignalK
     */
    const fetchAutopilotData = useCallback(async () => {
        try {
            // An empty device list means no v2 provider (or none registered)
            const deviceList = await signalKService.getAutopilotDevices();
            const available = deviceList.length > 0;
            setDevices(deviceList);

            if (!available) {
                // Read-only fallback on the v1 data paths (via ref to avoid dep loop).
                // A pilot on the NMEA2000 bus publishes `state` even with no v2
                // provider, so the view can still *show* something — but nothing
                // is controllable. Say so instead of silently rendering an inert
                // panel: this is exactly the "it doesn't work" case.
                const vals = skValuesRef.current;
                const state = vals['steering.autopilot.state'];
                const mode = vals['steering.autopilot.mode'];
                const target = vals['steering.autopilot.target.headingTrue'] ||
                              vals['steering.autopilot.target.windAngleApparent'];

                setError(debugMode ? null : (state
                    ? t('autopilot.providerMissingButDetected')
                    : t('autopilot.providerMissing')));

                setAutopilotData({
                    state: state ?? (debugMode ? 'standby' : 'off-line'),
                    mode: mode ?? (debugMode ? 'compass' : null),
                    target: target ?? (debugMode ? 1.57 : null),
                    engaged: vals['steering.autopilot.engaged'] ?? false
                });
                return;
            }

            const device = deviceList.includes(selectedDevice) || selectedDevice === '_default'
                ? selectedDevice
                : deviceList[0];
            if (device !== selectedDevice) setSelectedDevice(device);

            const data = await signalKService.getAutopilotData(device);
            setAutopilotData(data);
            setError(null);
        } catch (err) {
            console.error('AutopilotView: Failed to fetch autopilot data:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDevice, debugMode, t]);

    /**
     * Fetch controller configuration from OcearoCore
     */
    const fetchControllerConfig = useCallback(async () => {
        try {
            const config = await makeOcearoCoreApiCall('/api/controller/config');
            setControllerConfig(config);
            setControllerConnected(config?.connected || false);
        } catch (err) {
            console.warn('AutopilotView: Could not fetch controller config:', err.message);
            setControllerConfig(null);
        }
    }, []);

    // Initial fetch and periodic refresh
    useEffect(() => {
        fetchAutopilotData();
        fetchControllerConfig();
        
        // Live heading/wind/rudder come from the SignalK subscription; this REST poll
        // only refreshes device list + autopilot state/mode/target, so 5s is plenty
        // (and far lighter on a RPi5 than 2s).
        const interval = setInterval(() => {
            fetchAutopilotData();
        }, 5000);
        
        return () => clearInterval(interval);
    }, [fetchAutopilotData, fetchControllerConfig]);

    // One command at a time: a double tap must not send engage twice or stack
    // two mode changes. Heading adjustments stay usable (they are cumulative).
    const [busy, setBusy] = useState(false);
    const runCommand = useCallback(async (command, errorKey, { lock = true } = {}) => {
        if (lock && busy) return;
        if (lock) setBusy(true);
        try {
            setError(null);
            await command();
            await fetchAutopilotData();
        } catch (err) {
            setError(t(errorKey, { message: err.message }));
        } finally {
            if (lock) setBusy(false);
        }
    }, [busy, fetchAutopilotData, t]);

    const handleEngage = () => runCommand(() => signalKService.engageAutopilot(selectedDevice), 'autopilot.failedToEngage');
    const handleDisengage = () => runCommand(() => signalKService.disengageAutopilot(selectedDevice), 'autopilot.failedToDisengage');
    const handleSetMode = (mode) => runCommand(() => signalKService.setAutopilotMode(mode, selectedDevice), 'autopilot.failedToSetMode');
    // The v2 API takes a value plus its unit; sending bare radians made
    // providers interpret the delta as degrees.
    const handleAdjustHeading = (deltaDegrees) => runCommand(
        () => signalKService.adjustAutopilotTarget(deltaDegrees, selectedDevice),
        'autopilot.failedToAdjustHeading', { lock: false });
    const handleSetHeading = (headingDegrees) => runCommand(
        () => signalKService.setAutopilotTarget(headingDegrees * Math.PI / 180, selectedDevice),
        'autopilot.failedToSetHeading');
    const handleDodge = (options) => runCommand(() => signalKService.autopilotDodge(options, selectedDevice), 'autopilot.failedToDodge');
    const handleCourseAction = (action) => runCommand(() => signalKService.autopilotCourseAction(action, selectedDevice), 'autopilot.failedToSteerCourse');

    // Tack / gybe turn the boat through the wind: first tap arms, a second tap
    // on the same button within CONFIRM_WINDOW_MS executes.
    const [armedManeuver, setArmedManeuver] = useState(null);
    useEffect(() => {
        if (!armedManeuver) return undefined;
        const id = setTimeout(() => setArmedManeuver(null), CONFIRM_WINDOW_MS);
        return () => clearTimeout(id);
    }, [armedManeuver]);

    const handleManeuver = (maneuver, direction) => {
        const key = `${maneuver}:${direction}`;
        if (armedManeuver !== key) {
            setArmedManeuver(key);
            return;
        }
        setArmedManeuver(null);
        runCommand(
            () => signalKService.autopilotManeuver(maneuver, direction, selectedDevice),
            maneuver === 'tack' ? 'autopilot.failedToTack' : 'autopilot.failedToGybe'
        );
    };

    /**
     * Save controller configuration to OcearoCore
     */
    const handleSaveControllerConfig = async (newConfig) => {
        try {
            await makeOcearoCoreApiCall('/api/controller/config', {
                method: 'PUT',
                body: JSON.stringify(newConfig)
            });
            setControllerConfig(newConfig);
        } catch (err) {
            setError(t('autopilot.failedToSaveConfig', { message: err.message }));
        }
    };

    // Live v2 deltas (default pilot) update instantly after a command; the REST
    // poll covers other devices and the option lists.
    const useLive = selectedDevice === '_default' || devices.length <= 1;
    const liveValue = (path) => (useLive ? skValues[path] : undefined);
    const pilotState = liveValue('steering.autopilot.state') ?? autopilotData?.state;
    const pilotMode = liveValue('steering.autopilot.mode') ?? autopilotData?.mode;
    const liveTarget = liveValue('steering.autopilot.target');
    const pilotTarget = typeof liveTarget === 'number' ? liveTarget : autopilotData?.target;
    // `engaged` is the API's answer to "is it steering"; state names are vendor
    // specific (Raymarine reports auto/wind/route, never 'enabled').
    const engaged = liveValue('steering.autopilot.engaged') ?? autopilotData?.engaged ?? (pilotState === 'enabled');
    const offline = pilotState === 'off-line';
    const modes = optionList(autopilotData?.options, 'mode', 'modes') ?? DEFAULT_MODES;
    const actions = Array.isArray(autopilotData?.options?.actions) ? autopilotData.options.actions : null;
    // Without an action list (older providers) keep tack/gybe, hide the rest
    const isActionAvailable = (id) => (actions
        ? actions.some(a => a.id === id && a.available)
        : id === 'tack' || id === 'gybe');

    // State colour/icon from `engaged`, not vendor-specific state names
    const getStateColor = () => (offline ? 'text-oRed' : engaged ? 'text-oGreen' : pilotState ? 'text-oYellow' : 'text-hud-muted');
    const getStateIcon = () => (offline ? faTimesCircle : engaged ? faCheckCircle : pilotState ? faPause : faExclamationTriangle);

    // Get mode icon
    const getModeIcon = (mode) => {
        switch (mode) {
            case 'compass': return faCompass;
            case 'wind': return faWind;
            case 'gps': return faSatellite;
            case 'route': return faRoute;
            case 'dodge': return faAnchor;
            default: return faCompass;
        }
    };

    // Format heading
    const formatHeading = (radians) => {
        if (radians === null || radians === undefined) return '---°';
        const degrees = toDegrees(radians);
        return `${degrees}°`;
    };

    // Render control tab
    const renderControlTab = () => (
        <div className="space-y-3">
            {/* Status Display */}
            <div className="tesla-card ">
                <div className="grid grid-cols-3 gap-3 text-center">
                    {/* State */}
                    <div>
                        <div className={`text-value mb-1 ${getStateColor()}`}>
                            <FontAwesomeIcon icon={getStateIcon()} />
                        </div>
                        <div className={`text-caption ${secondaryTextClass} font-bold`}>{t('autopilot.state')}</div>
                        <div className={`text-label ${primaryTextClass} font-semibold capitalize`}>
                            {pilotState || t('autopilot.unknown')}
                        </div>
                    </div>
                    
                    {/* Mode */}
                    <div>
                        <div className="text-value mb-1 text-oBlue">
                            <FontAwesomeIcon icon={getModeIcon(pilotMode)} />
                        </div>
                        <div className={`text-caption ${secondaryTextClass} font-bold`}>{t('autopilot.mode')}</div>
                        <div className={`text-label ${primaryTextClass} font-semibold capitalize`}>
                            {pilotMode || t('autopilot.none')}
                        </div>
                    </div>
                    
                    {/* Target */}
                    <div>
                        <div className="text-value mb-1 text-oYellow">
                            <FontAwesomeIcon icon={faLocationArrow} />
                        </div>
                        <div className={`text-caption ${secondaryTextClass} font-bold`}>{t('autopilot.target')}</div>
                        <div className={`text-label ${primaryTextClass} font-semibold`}>
                            {formatHeading(pilotTarget)}
                        </div>
                    </div>
                </div>
                
                {/* Current value of what the pilot steers to: AWA in wind mode, heading otherwise */}
                <div className="mt-3 pt-3 border-t border-hud text-center">
                    <div className={`text-caption ${secondaryTextClass} font-bold uppercase`}>
                        {pilotMode === 'wind' ? t('autopilot.apparentWindAngle') : t('autopilot.currentHeading')}
                    </div>
                    <div className={`text-hero font-medium ${primaryTextClass}`}>
                        {formatHeading(pilotMode === 'wind' ? apparentWindAngle : currentHeading)}
                    </div>
                    {typeof rudderAngle === 'number' && (
                        <div className={`text-caption mt-1 ${mutedTextClass} font-bold uppercase`}>
                            {t('autopilot.rudder')} {Math.abs(toDegrees(rudderAngle))}° {rudderAngle < 0 ? t('autopilot.port') : rudderAngle > 0 ? t('autopilot.stbd') : ''}
                        </div>
                    )}
                </div>
            </div>

            {/* Engage/Disengage */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={handleEngage}
                    disabled={busy || engaged || offline}
                    className={`py-3 rounded font-semibold text-label uppercase transition-all ${
                        busy || engaged || offline
                            ? 'bg-hud-bg text-hud-dim cursor-not-allowed border border-hud'
                            : 'bg-oGreen hover:bg-oGreen/80 text-hud-main shadow-lg shadow-oGreen/20'
                    }`}
                >
                    <FontAwesomeIcon icon={faPlay} className="mr-2" />
                    {t('autopilot.engage')}
                </button>
                <button
                    onClick={handleDisengage}
                    disabled={busy || !engaged}
                    className={`py-3 rounded font-semibold text-label uppercase transition-all ${
                        busy || !engaged
                            ? 'bg-hud-bg text-hud-dim cursor-not-allowed border border-hud'
                            : 'bg-oRed hover:bg-oRed/80 text-hud-main shadow-lg shadow-oRed/20'
                    }`}
                >
                    <FontAwesomeIcon icon={faStop} className="mr-2" />
                    {t('autopilot.disengage')}
                </button>
            </div>

            {/* Mode Selection */}
            <div className="tesla-card ">
                <div className={`text-caption font-semibold uppercase ${secondaryTextClass} mb-3`}>{t('autopilot.modeSelection')}</div>
                <div className="grid grid-cols-4 gap-3">
                    {modes.map(mode => (
                        <button
                            key={mode}
                            onClick={() => handleSetMode(mode)}
                            disabled={busy || offline}
                            className={`py-2 rounded font-bold transition-all flex flex-col items-center border disabled:opacity-50 ${
                                pilotMode === mode
                                    ? 'bg-oBlue text-hud-main border-oBlue shadow-lg shadow-oBlue/20'
                                    : 'bg-hud-bg text-hud-secondary border-hud hover:bg-hud-elevated'
                            }`}
                        >
                            <FontAwesomeIcon icon={getModeIcon(mode)} className="text-lg mb-1" />
                            <span className="text-caption uppercase">{mode}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Heading Adjustment */}
            <div className="tesla-card ">
                <div className={`text-caption font-semibold uppercase ${secondaryTextClass} mb-3`}>{t('autopilot.targetAdjustment')}</div>
                <div className="grid grid-cols-4 gap-3">
                    <button
                        onClick={() => handleAdjustHeading(-10)}
                        className="py-3 bg-oRed/40 hover:bg-oRed/60 text-hud-main rounded border border-oRed/50 font-semibold text-label"
                    >
                        -10°
                    </button>
                    <button
                        onClick={() => handleAdjustHeading(-1)}
                        className="py-3 bg-oRed/20 hover:bg-oRed/40 text-hud-main rounded border border-oRed/30 font-semibold text-label"
                    >
                        -1°
                    </button>
                    <button
                        onClick={() => handleAdjustHeading(1)}
                        className="py-3 bg-oGreen/20 hover:bg-oGreen/40 text-hud-main rounded border border-oGreen/30 font-semibold text-label"
                    >
                        +1°
                    </button>
                    <button
                        onClick={() => handleAdjustHeading(10)}
                        className="py-3 bg-oGreen/40 hover:bg-oGreen/60 text-hud-main rounded border border-oGreen/50 font-semibold text-label"
                    >
                        +10°
                    </button>
                </div>
                
                {/* Set current heading button */}
                <button
                    onClick={() => currentHeading != null && handleSetHeading(toDegrees(currentHeading))}
                    disabled={currentHeading == null}
                    className="w-full mt-3 py-2.5 bg-hud-bg hover:bg-hud-elevated text-hud-main rounded border border-hud font-bold text-caption uppercase"
                >
                    <FontAwesomeIcon icon={faCompass} className="mr-2" />
                    {t('autopilot.syncTargetToHeading')}
                </button>
            </div>

            {/* Tack & Gybe — two-tap confirmation */}
            <div className="tesla-card ">
                <div className={`text-caption font-semibold uppercase ${secondaryTextClass} mb-3`}>{t('autopilot.maneuvers')}</div>
                <div className="grid grid-cols-2 gap-4">
                    {['tack', 'gybe'].map(maneuver => (
                        <div key={maneuver}>
                            <div className={`text-caption font-semibold uppercase ${mutedTextClass} mb-2 text-center`}>{t(`autopilot.${maneuver}`)}</div>
                            <div className="grid grid-cols-2 gap-3">
                                {['port', 'starboard'].map(direction => {
                                    const armed = armedManeuver === `${maneuver}:${direction}`;
                                    return (
                                        <button
                                            key={direction}
                                            onClick={() => handleManeuver(maneuver, direction)}
                                            disabled={busy || !engaged || !isActionAvailable(maneuver)}
                                            className={`py-2 rounded border font-bold text-caption transition-all disabled:opacity-40 ${
                                                armed
                                                    ? 'bg-oYellow text-hud-bg border-oYellow animate-soft-pulse'
                                                    : 'bg-hud-bg hover:bg-hud-elevated text-hud-main border-hud'
                                            }`}
                                        >
                                            {armed ? t('autopilot.confirm') : t(direction === 'port' ? 'autopilot.port' : 'autopilot.stbd')}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dodge & route actions — only those the pilot advertises */}
            {(isActionAvailable('dodge') || isActionAvailable('courseCurrentPoint') || isActionAvailable('courseNextPoint')) && (
                <div className="tesla-card ">
                    <div className="grid grid-cols-2 gap-3">
                        {isActionAvailable('dodge') && (pilotMode === 'dodge' ? (
                            <button onClick={() => handleDodge({ exit: true })} disabled={busy}
                                className="py-2 rounded border border-oYellow bg-oYellow/20 text-hud-main font-bold text-caption uppercase disabled:opacity-40">
                                {t('autopilot.exitDodge')}
                            </button>
                        ) : (
                            <button onClick={() => handleDodge()} disabled={busy || !engaged}
                                className="py-2 rounded border border-hud bg-hud-bg hover:bg-hud-elevated text-hud-main font-bold text-caption uppercase disabled:opacity-40">
                                {t('autopilot.dodge')}
                            </button>
                        ))}
                        {isActionAvailable('courseCurrentPoint') && (
                            <button onClick={() => handleCourseAction('courseCurrentPoint')} disabled={busy}
                                className="py-2 rounded border border-hud bg-hud-bg hover:bg-hud-elevated text-hud-main font-bold text-caption uppercase disabled:opacity-40">
                                {t('autopilot.steerToWaypoint')}
                            </button>
                        )}
                        {isActionAvailable('courseNextPoint') && (
                            <button onClick={() => handleCourseAction('courseNextPoint')} disabled={busy}
                                className="py-2 rounded border border-hud bg-hud-bg hover:bg-hud-elevated text-hud-main font-bold text-caption uppercase disabled:opacity-40">
                                {t('autopilot.nextWaypoint')}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    // Render controller config tab
    const renderControllerTab = () => (
        <div className="space-y-3">
            {/* Controller Status */}
            <div className="tesla-card ">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                        <FontAwesomeIcon 
                            icon={faGamepad} 
                            className={`text-xl ${controllerConnected ? 'text-oGreen' : 'text-hud-muted'}`} 
                        />
                        <div>
                            <div className={`text-label font-bold ${primaryTextClass}`}>{t('autopilot.controller')}</div>
                            <div className={`text-caption ${controllerConnected ? 'text-oGreen' : 'text-hud-muted'} font-bold`}>
                                {controllerConnected ? t('autopilot.connected') : t('autopilot.notConnected')}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={fetchControllerConfig}
                        className="p-2 text-hud-secondary hover:text-hud-main"
                    >
                        <FontAwesomeIcon icon={faSync} className="text-sm" />
                    </button>
                </div>
                
                {!controllerConnected && (
                    <div className={`text-caption ${mutedTextClass} bg-hud-elevated border border-hud rounded p-2.5 font-bold`}>
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-oYellow mr-2" />
                        {t('autopilot.connectController')}
                    </div>
                )}
            </div>

            {/* Button Mappings */}
            <div className="tesla-card ">
                <div className={`text-caption font-semibold uppercase ${secondaryTextClass} mb-3`}>{t('autopilot.buttonMappings')}</div>
                
                <div className="space-y-2">
                    {/* Autopilot Controls */}
                    <ControllerMappingRow
                        label={t('autopilot.engageAutopilot')}
                        button={controllerConfig?.mappings?.engage || 'X'}
                        onChange={(btn) => handleSaveControllerConfig({
                            ...controllerConfig,
                            mappings: { ...controllerConfig?.mappings, engage: btn }
                        })}
                        primaryTextClass={primaryTextClass}
                        secondaryTextClass={secondaryTextClass}
                    />
                    <ControllerMappingRow
                        label={t('autopilot.disengageAutopilot')}
                        button={controllerConfig?.mappings?.disengage || 'Circle'}
                        onChange={(btn) => handleSaveControllerConfig({
                            ...controllerConfig,
                            mappings: { ...controllerConfig?.mappings, disengage: btn }
                        })}
                        primaryTextClass={primaryTextClass}
                        secondaryTextClass={secondaryTextClass}
                    />
                    
                    {/* Heading Controls */}
                    <div className="border-t border-hud pt-2 mt-2">
                        <div className={`text-caption font-semibold uppercase ${mutedTextClass} mb-2`}>{t('autopilot.headingControl')}</div>
                    </div>
                    <ControllerMappingRow
                        label={t('autopilot.headingMinus1')}
                        button={controllerConfig?.mappings?.headingMinus1 || 'D-Pad Left'}
                        onChange={(btn) => handleSaveControllerConfig({
                            ...controllerConfig,
                            mappings: { ...controllerConfig?.mappings, headingMinus1: btn }
                        })}
                        primaryTextClass={primaryTextClass}
                        secondaryTextClass={secondaryTextClass}
                    />
                    <ControllerMappingRow
                        label={t('autopilot.headingPlus1')}
                        button={controllerConfig?.mappings?.headingPlus1 || 'D-Pad Right'}
                        onChange={(btn) => handleSaveControllerConfig({
                            ...controllerConfig,
                            mappings: { ...controllerConfig?.mappings, headingPlus1: btn }
                        })}
                        primaryTextClass={primaryTextClass}
                        secondaryTextClass={secondaryTextClass}
                    />
                    <ControllerMappingRow
                        label={t('autopilot.headingMinus10')}
                        button={controllerConfig?.mappings?.headingMinus10 || 'L1'}
                        onChange={(btn) => handleSaveControllerConfig({
                            ...controllerConfig,
                            mappings: { ...controllerConfig?.mappings, headingMinus10: btn }
                        })}
                        primaryTextClass={primaryTextClass}
                        secondaryTextClass={secondaryTextClass}
                    />
                    <ControllerMappingRow
                        label={t('autopilot.headingPlus10')}
                        button={controllerConfig?.mappings?.headingPlus10 || 'R1'}
                        onChange={(btn) => handleSaveControllerConfig({
                            ...controllerConfig,
                            mappings: { ...controllerConfig?.mappings, headingPlus10: btn }
                        })}
                        primaryTextClass={primaryTextClass}
                        secondaryTextClass={secondaryTextClass}
                    />
                    
                    {/* Rudder Controls */}
                    <div className="border-t border-hud pt-2 mt-2">
                        <div className={`text-caption font-semibold uppercase ${mutedTextClass} mb-2`}>{t('autopilot.rudderControl')}</div>
                    </div>
                    <ControllerMappingRow
                        label={t('autopilot.rudderLeft')}
                        button={controllerConfig?.mappings?.rudderLeft || 'Left Stick Left'}
                        onChange={(btn) => handleSaveControllerConfig({
                            ...controllerConfig,
                            mappings: { ...controllerConfig?.mappings, rudderLeft: btn }
                        })}
                        primaryTextClass={primaryTextClass}
                        secondaryTextClass={secondaryTextClass}
                    />
                    <ControllerMappingRow
                        label={t('autopilot.rudderRight')}
                        button={controllerConfig?.mappings?.rudderRight || 'Left Stick Right'}
                        onChange={(btn) => handleSaveControllerConfig({
                            ...controllerConfig,
                            mappings: { ...controllerConfig?.mappings, rudderRight: btn }
                        })}
                        primaryTextClass={primaryTextClass}
                        secondaryTextClass={secondaryTextClass}
                    />
                </div>
            </div>

            {/* Sensitivity Settings */}
            <div className="tesla-card ">
                <div className={`text-caption font-semibold uppercase ${secondaryTextClass} mb-3`}>{t('autopilot.sensitivity')}</div>
                
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className={`text-caption font-bold ${primaryTextClass}`}>{t('autopilot.rudderSensitivity')}</span>
                            <span className={`text-caption font-bold ${secondaryTextClass}`}>
                                {controllerConfig?.sensitivity?.rudder || 50}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={controllerConfig?.sensitivity?.rudder || 50}
                            onChange={(e) => handleSaveControllerConfig({
                                ...controllerConfig,
                                sensitivity: { 
                                    ...controllerConfig?.sensitivity, 
                                    rudder: parseInt(e.target.value) 
                                }
                            })}
                            className="w-full h-1.5 bg-hud-elevated rounded-full appearance-none cursor-pointer accent-oGreen"
                        />
                    </div>
                    
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className={`text-caption font-bold ${primaryTextClass}`}>{t('autopilot.deadZone')}</span>
                            <span className={`text-caption font-bold ${secondaryTextClass}`}>
                                {controllerConfig?.sensitivity?.deadZone || 10}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="30"
                            value={controllerConfig?.sensitivity?.deadZone || 10}
                            onChange={(e) => handleSaveControllerConfig({
                                ...controllerConfig,
                                sensitivity: { 
                                    ...controllerConfig?.sensitivity, 
                                    deadZone: parseInt(e.target.value) 
                                }
                            })}
                            className="w-full h-1.5 bg-hud-elevated rounded-full appearance-none cursor-pointer accent-oGreen"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-rightPaneBg overflow-hidden">
            {/* Tab Navigation - Tesla Style */}
            <div className="flex border-b border-hud bg-hud-bg overflow-x-auto scrollbar-hide">
                {[
                    { id: 'control', label: t('autopilot.control'), icon: faCompass },
                    { id: 'controller', label: t('autopilot.controller'), icon: faGamepad }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-3 px-3 whitespace-nowrap text-caption font-semibold uppercase flex items-center justify-center transition-all duration-500 ${
                            activeTab === tab.id
                                ? 'text-oGreen border-b-2 border-oGreen bg-hud-bg'
                                : 'text-hud-secondary hover:text-hud-main tesla-hover'
                        }`}
                    >
                        <FontAwesomeIcon icon={tab.icon} className="mr-2" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Error display */}
            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-oRed/20 text-oRed p-3 rounded-lg mx-4 mt-4 border border-oRed/30"
                    >
                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Device selector - show if multiple devices */}
            {devices.length > 0 && (
                <div className="px-4 pt-4">
                    <select
                        value={selectedDevice}
                        onChange={(e) => setSelectedDevice(e.target.value)}
                        className="bg-hud-elevated text-hud-main rounded px-3 py-2 w-full border border-hud focus:border-oGreen/50 focus:outline-none transition-all"
                    >
                        {devices.map(device => (
                            <option key={device} value={device}>{device}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-auto scrollbar-hide">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center h-32"
                        >
                            <div className="text-hud-main">Loading...</div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="p-3"
                        >
                            {activeTab === 'control' ? renderControlTab() : renderControllerTab()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

/**
 * Controller mapping row component
 */
const ControllerMappingRow = ({ label, button, onChange, primaryTextClass, secondaryTextClass }) => {
    const [isEditing, setIsEditing] = useState(false);
    
    const buttonOptions = [
        'X', 'Circle', 'Square', 'Triangle',
        'L1', 'R1', 'L2', 'R2',
        'D-Pad Up', 'D-Pad Down', 'D-Pad Left', 'D-Pad Right',
        'Left Stick Up', 'Left Stick Down', 'Left Stick Left', 'Left Stick Right',
        'Right Stick Up', 'Right Stick Down', 'Right Stick Left', 'Right Stick Right',
        'L3', 'R3', 'Options', 'Share', 'PS'
    ];
    
    return (
        <div className="flex items-center justify-between py-2">
            <span className={`text-label ${primaryTextClass}`}>{label}</span>
            {isEditing ? (
                <select
                    value={button}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setIsEditing(false);
                    }}
                    onBlur={() => setIsEditing(false)}
                    autoFocus
                    className="bg-hud-elevated text-hud-main rounded px-2 py-1 text-label border border-hud focus:border-oGreen/50 focus:outline-none transition-all"
                >
                    {buttonOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            ) : (
                <button
                    onClick={() => setIsEditing(true)}
                    className={`px-3 py-1 bg-hud-elevated rounded text-label ${secondaryTextClass} hover:bg-hud-bg border border-hud transition-all`}
                >
                    {button}
                </button>
            )}
        </div>
    );
};
