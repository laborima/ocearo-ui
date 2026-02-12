'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOcearoContext, toDegrees } from '../context/OcearoContext';
import { useSignalKPath, useSignalKPaths } from '../hooks/useSignalK';
import signalKService from '../services/SignalKService';
import configService from '../settings/ConfigService';
import { makeOcearoCoreApiCall } from '../utils/OcearoCoreUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faShip,
    faCompass,
    faWind,
    faRoute,
    faPlay,
    faPause,
    faStop,
    faArrowLeft,
    faArrowRight,
    faPlus,
    faMinus,
    faGamepad,
    faCog,
    faSync,
    faExclamationTriangle,
    faCheckCircle,
    faTimesCircle,
    faBan,
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
        'steering.autopilot.target.headingTrue',
        'steering.autopilot.target.windAngleApparent'
    ], []);

    const skValues = useSignalKPaths(autopilotPaths);
    
    const currentHeading = skValues['navigation.headingTrue'] || skValues['navigation.headingMagnetic'];
    const apparentWindAngle = skValues['environment.wind.angleApparent'];
    const rudderAngle = skValues['steering.rudderAngle'];

    // State
    const [activeTab, setActiveTab] = useState('control');
    const { nightMode } = useOcearoContext();

    const primaryTextClass = 'text-hud-main';
    const secondaryTextClass = nightMode ? 'text-oNight' : 'text-hud-secondary';
    const mutedTextClass = nightMode ? 'text-oNight/70' : 'text-hud-muted';

    const [autopilotData, setAutopilotData] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('default');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAutopilotAvailable, setIsAutopilotAvailable] = useState(false);
    
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
            setError(null);
            
            // Check if autopilot API is available
            const available = await signalKService.isAutopilotAvailable();
            setIsAutopilotAvailable(available);
            
            if (!available) {
                // Use subscribed SignalK values as fallback (via ref to avoid dep loop)
                const vals = skValuesRef.current;
                const state = vals['steering.autopilot.state'];
                const mode = vals['steering.autopilot.mode'];
                const target = vals['steering.autopilot.target.headingTrue'] || 
                              vals['steering.autopilot.target.windAngleApparent'];
                
                setAutopilotData({
                    state: state || (debugMode ? 'standby' : 'off-line'),
                    mode: mode || (debugMode ? 'compass' : null),
                    target: target || (debugMode ? 1.57 : null),
                    engaged: state === 'enabled'
                });
                return;
            }
            
            // Fetch devices
            const deviceList = await signalKService.getAutopilotDevices();
            setDevices(deviceList);
            
            if (deviceList.length > 0 && !deviceList.includes(selectedDevice)) {
                setSelectedDevice(deviceList[0]);
            }
            
            // Fetch autopilot data
            const data = await signalKService.getAutopilotData(selectedDevice);
            setAutopilotData(data);
            
        } catch (err) {
            console.error('AutopilotView: Failed to fetch autopilot data:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDevice, debugMode]);

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
        
        const interval = setInterval(() => {
            fetchAutopilotData();
        }, 2000);
        
        return () => clearInterval(interval);
    }, [fetchAutopilotData, fetchControllerConfig]);

    /**
     * Engage autopilot
     */
    const handleEngage = async () => {
        try {
            setError(null);
            await signalKService.engageAutopilot(selectedDevice);
            await fetchAutopilotData();
        } catch (err) {
            setError(t('autopilot.failedToEngage', { message: err.message }));
        }
    };

    /**
     * Disengage autopilot
     */
    const handleDisengage = async () => {
        try {
            setError(null);
            await signalKService.disengageAutopilot(selectedDevice);
            await fetchAutopilotData();
        } catch (err) {
            setError(t('autopilot.failedToDisengage', { message: err.message }));
        }
    };

    /**
     * Set autopilot mode
     */
    const handleSetMode = async (mode) => {
        try {
            setError(null);
            await signalKService.setAutopilotMode(mode, selectedDevice);
            await fetchAutopilotData();
        } catch (err) {
            setError(t('autopilot.failedToSetMode', { message: err.message }));
        }
    };

    /**
     * Adjust heading
     */
    const handleAdjustHeading = async (deltaDegrees) => {
        try {
            setError(null);
            const deltaRadians = deltaDegrees * Math.PI / 180;
            await signalKService.adjustAutopilotTarget(deltaRadians, selectedDevice);
            await fetchAutopilotData();
        } catch (err) {
            setError(t('autopilot.failedToAdjustHeading', { message: err.message }));
        }
    };

    /**
     * Set specific heading
     */
    const handleSetHeading = async (headingDegrees) => {
        try {
            setError(null);
            const headingRadians = headingDegrees * Math.PI / 180;
            await signalKService.setAutopilotTarget(headingRadians, selectedDevice);
            await fetchAutopilotData();
        } catch (err) {
            setError(t('autopilot.failedToSetHeading', { message: err.message }));
        }
    };

    /**
     * Execute tack
     */
    const handleTack = async (direction) => {
        try {
            setError(null);
            await signalKService.autopilotTack(direction, selectedDevice);
            await fetchAutopilotData();
        } catch (err) {
            setError(t('autopilot.failedToTack', { message: err.message }));
        }
    };

    /**
     * Execute gybe
     */
    const handleGybe = async (direction) => {
        try {
            setError(null);
            await signalKService.autopilotGybe(direction, selectedDevice);
            await fetchAutopilotData();
        } catch (err) {
            setError(t('autopilot.failedToGybe', { message: err.message }));
        }
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

    // Get state color
    const getStateColor = (state) => {
        switch (state) {
            case 'enabled': return 'text-oGreen';
            case 'standby': return 'text-oYellow';
            case 'disabled': return 'text-hud-muted';
            case 'off-line': return 'text-oRed';
            default: return 'text-hud-muted';
        }
    };

    // Get state icon
    const getStateIcon = (state) => {
        switch (state) {
            case 'enabled': return faCheckCircle;
            case 'standby': return faPause;
            case 'disabled': return faBan;
            case 'off-line': return faTimesCircle;
            default: return faExclamationTriangle;
        }
    };

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
            <div className="tesla-card p-3 border border-hud bg-hud-bg">
                <div className="grid grid-cols-3 gap-2 text-center">
                    {/* State */}
                    <div>
                        <div className={`text-2xl mb-1 ${getStateColor(autopilotData?.state)}`}>
                            <FontAwesomeIcon icon={getStateIcon(autopilotData?.state)} />
                        </div>
                        <div className={`text-xs ${secondaryTextClass} font-bold`}>{t('autopilot.state')}</div>
                        <div className={`text-sm ${primaryTextClass} font-black capitalize`}>
                            {autopilotData?.state || t('autopilot.unknown')}
                        </div>
                    </div>
                    
                    {/* Mode */}
                    <div>
                        <div className="text-2xl mb-1 text-oBlue">
                            <FontAwesomeIcon icon={getModeIcon(autopilotData?.mode)} />
                        </div>
                        <div className={`text-xs ${secondaryTextClass} font-bold`}>{t('autopilot.mode')}</div>
                        <div className={`text-sm ${primaryTextClass} font-black capitalize`}>
                            {autopilotData?.mode || t('autopilot.none')}
                        </div>
                    </div>
                    
                    {/* Target */}
                    <div>
                        <div className="text-2xl mb-1 text-oYellow">
                            <FontAwesomeIcon icon={faLocationArrow} />
                        </div>
                        <div className={`text-xs ${secondaryTextClass} font-bold`}>{t('autopilot.target')}</div>
                        <div className={`text-sm ${primaryTextClass} font-black`}>
                            {formatHeading(autopilotData?.target)}
                        </div>
                    </div>
                </div>
                
                {/* Current Heading */}
                <div className="mt-3 pt-3 border-t border-hud text-center">
                    <div className={`text-xs ${secondaryTextClass} font-bold uppercase`}>{t('autopilot.currentHeading')}</div>
                    <div className={`text-4xl font-black ${primaryTextClass}`}>
                        {formatHeading(currentHeading)}
                    </div>
                </div>
            </div>

            {/* Engage/Disengage */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={handleEngage}
                    disabled={autopilotData?.state === 'enabled' || autopilotData?.state === 'off-line'}
                    className={`py-3 rounded font-black text-base uppercase transition-all ${
                        autopilotData?.state === 'enabled' 
                            ? 'bg-hud-bg text-hud-dim cursor-not-allowed border border-hud'
                            : 'bg-oGreen hover:bg-green-600 text-hud-main shadow-lg shadow-oGreen/20'
                    }`}
                >
                    <FontAwesomeIcon icon={faPlay} className="mr-2" />
                    {t('autopilot.engage')}
                </button>
                <button
                    onClick={handleDisengage}
                    disabled={autopilotData?.state !== 'enabled'}
                    className={`py-3 rounded font-black text-base uppercase transition-all ${
                        autopilotData?.state !== 'enabled'
                            ? 'bg-hud-bg text-hud-dim cursor-not-allowed border border-hud'
                            : 'bg-oRed hover:bg-red-600 text-hud-main shadow-lg shadow-oRed/20'
                    }`}
                >
                    <FontAwesomeIcon icon={faStop} className="mr-2" />
                    {t('autopilot.disengage')}
                </button>
            </div>

            {/* Mode Selection */}
            <div className="tesla-card p-3 border border-hud bg-hud-bg">
                <div className={`text-xs font-black uppercase ${secondaryTextClass} mb-3`}>{t('autopilot.modeSelection')}</div>
                <div className="grid grid-cols-4 gap-2">
                    {['compass', 'wind', 'gps', 'route'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => handleSetMode(mode)}
                            className={`py-2 rounded font-bold transition-all flex flex-col items-center border ${
                                autopilotData?.mode === mode
                                    ? 'bg-oBlue text-hud-main border-oBlue shadow-lg shadow-oBlue/20'
                                    : 'bg-hud-bg text-hud-secondary border-hud hover:bg-hud-elevated'
                            }`}
                        >
                            <FontAwesomeIcon icon={getModeIcon(mode)} className="text-lg mb-1" />
                            <span className="text-xs uppercase">{mode}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Heading Adjustment */}
            <div className="tesla-card p-3 border border-hud bg-hud-bg">
                <div className={`text-xs font-black uppercase ${secondaryTextClass} mb-3`}>{t('autopilot.targetAdjustment')}</div>
                <div className="grid grid-cols-4 gap-2">
                    <button
                        onClick={() => handleAdjustHeading(-10)}
                        className="py-3 bg-oRed/40 hover:bg-oRed/60 text-hud-main rounded border border-oRed/50 font-black text-sm"
                    >
                        -10°
                    </button>
                    <button
                        onClick={() => handleAdjustHeading(-1)}
                        className="py-3 bg-oRed/20 hover:bg-oRed/40 text-hud-main rounded border border-oRed/30 font-black text-sm"
                    >
                        -1°
                    </button>
                    <button
                        onClick={() => handleAdjustHeading(1)}
                        className="py-3 bg-oGreen/20 hover:bg-oGreen/40 text-hud-main rounded border border-oGreen/30 font-black text-sm"
                    >
                        +1°
                    </button>
                    <button
                        onClick={() => handleAdjustHeading(10)}
                        className="py-3 bg-oGreen/40 hover:bg-oGreen/60 text-hud-main rounded border border-oGreen/50 font-black text-sm"
                    >
                        +10°
                    </button>
                </div>
                
                {/* Set current heading button */}
                <button
                    onClick={() => currentHeading && handleSetHeading(toDegrees(currentHeading))}
                    disabled={!currentHeading}
                    className="w-full mt-3 py-2.5 bg-hud-bg hover:bg-hud-elevated text-hud-main rounded border border-hud font-bold text-xs uppercase"
                >
                    <FontAwesomeIcon icon={faCompass} className="mr-2" />
                    {t('autopilot.syncTargetToHeading')}
                </button>
            </div>

            {/* Tack & Gybe */}
            <div className="tesla-card p-3 border border-hud bg-hud-bg">
                <div className={`text-xs font-black uppercase ${secondaryTextClass} mb-3`}>{t('autopilot.maneuvers')}</div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className={`text-xs font-black uppercase ${mutedTextClass} mb-2 text-center`}>{t('autopilot.tack')}</div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleTack('port')}
                                className="py-2 bg-hud-bg hover:bg-hud-elevated text-hud-main rounded border border-hud font-bold text-xs"
                            >
                                {t('autopilot.port')}
                            </button>
                            <button
                                onClick={() => handleTack('starboard')}
                                className="py-2 bg-hud-bg hover:bg-hud-elevated text-hud-main rounded border border-hud font-bold text-xs"
                            >
                                {t('autopilot.stbd')}
                            </button>
                        </div>
                    </div>
                    <div>
                        <div className={`text-xs font-black uppercase ${mutedTextClass} mb-2 text-center`}>{t('autopilot.gybe')}</div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleGybe('port')}
                                className="py-2 bg-hud-bg hover:bg-hud-elevated text-hud-main rounded border border-hud font-bold text-xs"
                            >
                                {t('autopilot.port')}
                            </button>
                            <button
                                onClick={() => handleGybe('starboard')}
                                className="py-2 bg-hud-bg hover:bg-hud-elevated text-hud-main rounded border border-hud font-bold text-xs"
                            >
                                {t('autopilot.stbd')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render controller config tab
    const renderControllerTab = () => (
        <div className="space-y-3">
            {/* Controller Status */}
            <div className="tesla-card p-3 border border-hud bg-hud-bg">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                        <FontAwesomeIcon 
                            icon={faGamepad} 
                            className={`text-xl ${controllerConnected ? 'text-oGreen' : 'text-hud-muted'}`} 
                        />
                        <div>
                            <div className={`text-sm font-bold ${primaryTextClass}`}>{t('autopilot.controller')}</div>
                            <div className={`text-xs ${controllerConnected ? 'text-oGreen' : 'text-hud-muted'} font-bold`}>
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
                    <div className={`text-xs ${mutedTextClass} bg-hud-elevated border border-hud rounded p-2.5 font-bold`}>
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-oYellow mr-2" />
                        {t('autopilot.connectController')}
                    </div>
                )}
            </div>

            {/* Button Mappings */}
            <div className="tesla-card p-3 border border-hud bg-hud-bg">
                <div className={`text-xs font-black uppercase ${secondaryTextClass} mb-3`}>{t('autopilot.buttonMappings')}</div>
                
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
                        <div className={`text-xs font-black uppercase ${mutedTextClass} mb-2`}>{t('autopilot.headingControl')}</div>
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
                        <div className={`text-xs font-black uppercase ${mutedTextClass} mb-2`}>{t('autopilot.rudderControl')}</div>
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
            <div className="tesla-card p-3 border border-hud bg-hud-bg">
                <div className={`text-xs font-black uppercase ${secondaryTextClass} mb-3`}>{t('autopilot.sensitivity')}</div>
                
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className={`text-xs font-bold ${primaryTextClass}`}>{t('autopilot.rudderSensitivity')}</span>
                            <span className={`text-xs font-bold ${secondaryTextClass}`}>
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
                            <span className={`text-xs font-bold ${primaryTextClass}`}>{t('autopilot.deadZone')}</span>
                            <span className={`text-xs font-bold ${secondaryTextClass}`}>
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
            <div className="flex border-b border-hud bg-hud-bg">
                {[
                    { id: 'control', label: t('autopilot.control'), icon: faCompass },
                    { id: 'controller', label: t('autopilot.controller'), icon: faGamepad }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-3 px-2 text-xs font-black uppercase flex items-center justify-center transition-all duration-500 ${
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
            {devices.length > 1 && (
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
            <span className={`text-sm ${primaryTextClass}`}>{label}</span>
            {isEditing ? (
                <select
                    value={button}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setIsEditing(false);
                    }}
                    onBlur={() => setIsEditing(false)}
                    autoFocus
                    className="bg-hud-elevated text-hud-main rounded px-2 py-1 text-sm border border-hud focus:border-oGreen/50 focus:outline-none transition-all"
                >
                    {buttonOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            ) : (
                <button
                    onClick={() => setIsEditing(true)}
                    className={`px-3 py-1 bg-hud-elevated rounded text-sm ${secondaryTextClass} hover:bg-hud-bg border border-hud transition-all`}
                >
                    {button}
                </button>
            )}
        </div>
    );
};
