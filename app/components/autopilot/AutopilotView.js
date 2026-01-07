'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOcearoContext, toDegrees } from '../context/OcearoContext';
import { useSignalKPath, useSignalKPaths } from '../hooks/useSignalK';
import signalKService from '../services/SignalKService';
import configService from '../settings/ConfigService';
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

/**
 * Make API call to OcearoCore plugin for controller configuration
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} API response
 */
const ocearoCoreApiCall = async (endpoint, options = {}) => {
    const config = configService.getAll();
    const baseUrl = config.signalkUrl || 'http://localhost:3000';
    const url = `${baseUrl}/plugins/ocearo-core${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    // Add Basic Auth if configured
    if (config.useAuthentication && config.username) {
        const token = btoa(`${config.username}:${config.password || ''}`);
        headers['Authorization'] = `Basic ${token}`;
    }
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    if (!response.ok) {
        throw new Error(`OcearoCore API error: ${response.statusText}`);
    }
    
    return await response.json();
};

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

    const primaryTextClass = 'text-white';
    const secondaryTextClass = nightMode ? 'text-oNight' : 'text-gray-400';
    const mutedTextClass = nightMode ? 'text-oNight/70' : 'text-gray-500';

    const [autopilotData, setAutopilotData] = useState(null);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('default');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAutopilotAvailable, setIsAutopilotAvailable] = useState(false);
    
    // Controller config state
    const [controllerConfig, setControllerConfig] = useState(null);
    const [controllerConnected, setControllerConnected] = useState(false);

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
                // Use subscribed SignalK values as fallback
                const state = skValues['steering.autopilot.state'];
                const mode = skValues['steering.autopilot.mode'];
                const target = skValues['steering.autopilot.target.headingTrue'] || 
                              skValues['steering.autopilot.target.windAngleApparent'];
                
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
    }, [selectedDevice, skValues, debugMode]);

    /**
     * Fetch controller configuration from OcearoCore
     */
    const fetchControllerConfig = useCallback(async () => {
        try {
            const config = await ocearoCoreApiCall('/api/controller/config');
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
            setError(`Failed to engage: ${err.message}`);
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
            setError(`Failed to disengage: ${err.message}`);
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
            setError(`Failed to set mode: ${err.message}`);
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
            setError(`Failed to adjust heading: ${err.message}`);
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
            setError(`Failed to set heading: ${err.message}`);
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
            setError(`Failed to tack: ${err.message}`);
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
            setError(`Failed to gybe: ${err.message}`);
        }
    };

    /**
     * Save controller configuration to OcearoCore
     */
    const handleSaveControllerConfig = async (newConfig) => {
        try {
            await ocearoCoreApiCall('/api/controller/config', {
                method: 'PUT',
                body: JSON.stringify(newConfig)
            });
            setControllerConfig(newConfig);
        } catch (err) {
            setError(`Failed to save controller config: ${err.message}`);
        }
    };

    // Get state color
    const getStateColor = (state) => {
        switch (state) {
            case 'enabled': return 'text-oGreen';
            case 'standby': return 'text-oYellow';
            case 'disabled': return 'text-gray-500';
            case 'off-line': return 'text-oRed';
            default: return 'text-gray-500';
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
        <div className="p-4 space-y-6">
            {/* Status Display */}
            <div className="bg-oGray2 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                    {/* State */}
                    <div>
                        <div className={`text-3xl mb-1 ${getStateColor(autopilotData?.state)}`}>
                            <FontAwesomeIcon icon={getStateIcon(autopilotData?.state)} />
                        </div>
                        <div className={`text-sm ${secondaryTextClass}`}>State</div>
                        <div className={`font-medium ${primaryTextClass} capitalize`}>
                            {autopilotData?.state || 'Unknown'}
                        </div>
                    </div>
                    
                    {/* Mode */}
                    <div>
                        <div className="text-3xl mb-1 text-oBlue">
                            <FontAwesomeIcon icon={getModeIcon(autopilotData?.mode)} />
                        </div>
                        <div className={`text-sm ${secondaryTextClass}`}>Mode</div>
                        <div className={`font-medium ${primaryTextClass} capitalize`}>
                            {autopilotData?.mode || 'None'}
                        </div>
                    </div>
                    
                    {/* Target */}
                    <div>
                        <div className="text-3xl mb-1 text-oYellow">
                            <FontAwesomeIcon icon={faLocationArrow} />
                        </div>
                        <div className={`text-sm ${secondaryTextClass}`}>Target</div>
                        <div className={`font-medium ${primaryTextClass}`}>
                            {formatHeading(autopilotData?.target)}
                        </div>
                    </div>
                </div>
                
                {/* Current Heading */}
                <div className="mt-4 pt-4 border-t border-gray-600 text-center">
                    <div className={`text-sm ${secondaryTextClass}`}>Current Heading</div>
                    <div className={`text-4xl font-bold ${primaryTextClass}`}>
                        {formatHeading(currentHeading)}
                    </div>
                </div>
            </div>

            {/* Engage/Disengage */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={handleEngage}
                    disabled={autopilotData?.state === 'enabled' || autopilotData?.state === 'off-line'}
                    className={`py-4 rounded-lg font-bold text-lg transition-all ${
                        autopilotData?.state === 'enabled' 
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-oGreen hover:bg-green-600 text-white'
                    }`}
                >
                    <FontAwesomeIcon icon={faPlay} className="mr-2" />
                    Engage
                </button>
                <button
                    onClick={handleDisengage}
                    disabled={autopilotData?.state !== 'enabled'}
                    className={`py-4 rounded-lg font-bold text-lg transition-all ${
                        autopilotData?.state !== 'enabled'
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-oRed hover:bg-red-600 text-white'
                    }`}
                >
                    <FontAwesomeIcon icon={faStop} className="mr-2" />
                    Disengage
                </button>
            </div>

            {/* Mode Selection */}
            <div className="bg-oGray2 rounded-lg p-4">
                <div className={`text-sm ${secondaryTextClass} mb-3`}>Mode</div>
                <div className="grid grid-cols-4 gap-2">
                    {['compass', 'wind', 'gps', 'route'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => handleSetMode(mode)}
                            className={`py-3 rounded-lg font-medium transition-all flex flex-col items-center ${
                                autopilotData?.mode === mode
                                    ? 'bg-oBlue text-white'
                                    : 'bg-oGray text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            <FontAwesomeIcon icon={getModeIcon(mode)} className="text-xl mb-1" />
                            <span className="text-xs capitalize">{mode}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Heading Adjustment */}
            <div className="bg-oGray2 rounded-lg p-4">
                <div className={`text-sm ${secondaryTextClass} mb-3`}>Heading Adjustment</div>
                <div className="grid grid-cols-4 gap-2">
                    <button
                        onClick={() => handleAdjustHeading(-10)}
                        className="py-4 bg-oRed hover:bg-red-600 text-white rounded-lg font-bold text-lg"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
                        10°
                    </button>
                    <button
                        onClick={() => handleAdjustHeading(-1)}
                        className="py-4 bg-red-700 hover:bg-red-600 text-white rounded-lg font-bold text-lg"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
                        1°
                    </button>
                    <button
                        onClick={() => handleAdjustHeading(1)}
                        className="py-4 bg-green-700 hover:bg-green-600 text-white rounded-lg font-bold text-lg"
                    >
                        1°
                        <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
                    </button>
                    <button
                        onClick={() => handleAdjustHeading(10)}
                        className="py-4 bg-oGreen hover:bg-green-600 text-white rounded-lg font-bold text-lg"
                    >
                        10°
                        <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
                    </button>
                </div>
                
                {/* Set current heading button */}
                <button
                    onClick={() => currentHeading && handleSetHeading(toDegrees(currentHeading))}
                    disabled={!currentHeading}
                    className="w-full mt-3 py-3 bg-oGray hover:bg-gray-600 text-white rounded-lg font-medium"
                >
                    <FontAwesomeIcon icon={faCompass} className="mr-2" />
                    Set Current Heading
                </button>
            </div>

            {/* Tack & Gybe */}
            <div className="bg-oGray2 rounded-lg p-4">
                <div className={`text-sm ${secondaryTextClass} mb-3`}>Maneuvers</div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className={`text-xs ${mutedTextClass} mb-2 text-center`}>Tack</div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleTack('port')}
                                className="py-3 bg-oRed hover:bg-red-600 text-white rounded-lg font-medium"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
                                Port
                            </button>
                            <button
                                onClick={() => handleTack('starboard')}
                                className="py-3 bg-oGreen hover:bg-green-600 text-white rounded-lg font-medium"
                            >
                                Stbd
                                <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
                            </button>
                        </div>
                    </div>
                    <div>
                        <div className={`text-xs ${mutedTextClass} mb-2 text-center`}>Gybe</div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleGybe('port')}
                                className="py-3 bg-oRed hover:bg-red-600 text-white rounded-lg font-medium"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
                                Port
                            </button>
                            <button
                                onClick={() => handleGybe('starboard')}
                                className="py-3 bg-oGreen hover:bg-green-600 text-white rounded-lg font-medium"
                            >
                                Stbd
                                <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render controller config tab
    const renderControllerTab = () => (
        <div className="p-4 space-y-6">
            {/* Controller Status */}
            <div className="bg-oGray2 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <FontAwesomeIcon 
                            icon={faGamepad} 
                            className={`text-2xl ${controllerConnected ? 'text-oGreen' : 'text-gray-500'}`} 
                        />
                        <div>
                            <div className={`font-medium ${primaryTextClass}`}>PlayStation Controller</div>
                            <div className={`text-sm ${controllerConnected ? 'text-oGreen' : 'text-gray-500'}`}>
                                {controllerConnected ? 'Connected' : 'Not Connected'}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={fetchControllerConfig}
                        className="p-2 text-gray-400 hover:text-white"
                    >
                        <FontAwesomeIcon icon={faSync} />
                    </button>
                </div>
                
                {!controllerConnected && (
                    <div className={`text-sm ${mutedTextClass} bg-oGray rounded p-3`}>
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-oYellow mr-2" />
                        Connect a PlayStation controller to configure button mappings.
                        Controller support is managed by OcearoCore plugin.
                    </div>
                )}
            </div>

            {/* Button Mappings */}
            <div className="bg-oGray2 rounded-lg p-4">
                <div className={`text-sm ${secondaryTextClass} mb-4`}>Button Mappings</div>
                
                <div className="space-y-3">
                    {/* Autopilot Controls */}
                    <ControllerMappingRow
                        label="Engage Autopilot"
                        button={controllerConfig?.mappings?.engage || 'X'}
                        onChange={(btn) => handleSaveControllerConfig({
                            ...controllerConfig,
                            mappings: { ...controllerConfig?.mappings, engage: btn }
                        })}
                        primaryTextClass={primaryTextClass}
                        secondaryTextClass={secondaryTextClass}
                    />
                    <ControllerMappingRow
                        label="Disengage Autopilot"
                        button={controllerConfig?.mappings?.disengage || 'Circle'}
                        onChange={(btn) => handleSaveControllerConfig({
                            ...controllerConfig,
                            mappings: { ...controllerConfig?.mappings, disengage: btn }
                        })}
                        primaryTextClass={primaryTextClass}
                        secondaryTextClass={secondaryTextClass}
                    />
                    
                    {/* Heading Controls */}
                    <div className="border-t border-gray-600 pt-3 mt-3">
                        <div className={`text-xs ${mutedTextClass} mb-2`}>Heading Control</div>
                    </div>
                    <ControllerMappingRow
                        label="Heading -1°"
                        button={controllerConfig?.mappings?.headingMinus1 || 'D-Pad Left'}
                        onChange={(btn) => handleSaveControllerConfig({
                            ...controllerConfig,
                            mappings: { ...controllerConfig?.mappings, headingMinus1: btn }
                        })}
                        primaryTextClass={primaryTextClass}
                        secondaryTextClass={secondaryTextClass}
                    />
                    <ControllerMappingRow
                        label="Heading +1°"
                        button={controllerConfig?.mappings?.headingPlus1 || 'D-Pad Right'}
                        onChange={(btn) => handleSaveControllerConfig({
                            ...controllerConfig,
                            mappings: { ...controllerConfig?.mappings, headingPlus1: btn }
                        })}
                        primaryTextClass={primaryTextClass}
                        secondaryTextClass={secondaryTextClass}
                    />
                    <ControllerMappingRow
                        label="Heading -10°"
                        button={controllerConfig?.mappings?.headingMinus10 || 'L1'}
                        onChange={(btn) => handleSaveControllerConfig({
                            ...controllerConfig,
                            mappings: { ...controllerConfig?.mappings, headingMinus10: btn }
                        })}
                        primaryTextClass={primaryTextClass}
                        secondaryTextClass={secondaryTextClass}
                    />
                    <ControllerMappingRow
                        label="Heading +10°"
                        button={controllerConfig?.mappings?.headingPlus10 || 'R1'}
                        onChange={(btn) => handleSaveControllerConfig({
                            ...controllerConfig,
                            mappings: { ...controllerConfig?.mappings, headingPlus10: btn }
                        })}
                        primaryTextClass={primaryTextClass}
                        secondaryTextClass={secondaryTextClass}
                    />
                    
                    {/* Rudder Controls */}
                    <div className="border-t border-gray-600 pt-3 mt-3">
                        <div className={`text-xs ${mutedTextClass} mb-2`}>Rudder Control (Manual)</div>
                    </div>
                    <ControllerMappingRow
                        label="Rudder Left"
                        button={controllerConfig?.mappings?.rudderLeft || 'Left Stick Left'}
                        onChange={(btn) => handleSaveControllerConfig({
                            ...controllerConfig,
                            mappings: { ...controllerConfig?.mappings, rudderLeft: btn }
                        })}
                        primaryTextClass={primaryTextClass}
                        secondaryTextClass={secondaryTextClass}
                    />
                    <ControllerMappingRow
                        label="Rudder Right"
                        button={controllerConfig?.mappings?.rudderRight || 'Left Stick Right'}
                        onChange={(btn) => handleSaveControllerConfig({
                            ...controllerConfig,
                            mappings: { ...controllerConfig?.mappings, rudderRight: btn }
                        })}
                        primaryTextClass={primaryTextClass}
                        secondaryTextClass={secondaryTextClass}
                    />
                    
                    {/* Maneuvers */}
                    <div className="border-t border-gray-600 pt-3 mt-3">
                        <div className={`text-xs ${mutedTextClass} mb-2`}>Maneuvers</div>
                    </div>
                    <ControllerMappingRow
                        label="Tack Port"
                        button={controllerConfig?.mappings?.tackPort || 'L2'}
                        onChange={(btn) => handleSaveControllerConfig({
                            ...controllerConfig,
                            mappings: { ...controllerConfig?.mappings, tackPort: btn }
                        })}
                        primaryTextClass={primaryTextClass}
                        secondaryTextClass={secondaryTextClass}
                    />
                    <ControllerMappingRow
                        label="Tack Starboard"
                        button={controllerConfig?.mappings?.tackStarboard || 'R2'}
                        onChange={(btn) => handleSaveControllerConfig({
                            ...controllerConfig,
                            mappings: { ...controllerConfig?.mappings, tackStarboard: btn }
                        })}
                        primaryTextClass={primaryTextClass}
                        secondaryTextClass={secondaryTextClass}
                    />
                </div>
            </div>

            {/* Sensitivity Settings */}
            <div className="bg-oGray2 rounded-lg p-4">
                <div className={`text-sm ${secondaryTextClass} mb-4`}>Sensitivity</div>
                
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className={`text-sm ${primaryTextClass}`}>Rudder Sensitivity</span>
                            <span className={`text-sm ${secondaryTextClass}`}>
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
                            className="w-full"
                        />
                    </div>
                    
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className={`text-sm ${primaryTextClass}`}>Dead Zone</span>
                            <span className={`text-sm ${secondaryTextClass}`}>
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
                            className="w-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full rightPaneBg overflow-auto">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-800">
                <button
                    onClick={() => setActiveTab('control')}
                    className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center transition-all ${
                        activeTab === 'control'
                            ? 'text-green-500 border-b-2 border-green-500'
                            : 'text-gray-400 hover:text-gray-300'
                    }`}
                >
                    <FontAwesomeIcon icon={faCompass} className="mr-2" />
                    Control
                </button>
                <button
                    onClick={() => setActiveTab('controller')}
                    className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center transition-all ${
                        activeTab === 'controller'
                            ? 'text-green-500 border-b-2 border-green-500'
                            : 'text-gray-400 hover:text-gray-300'
                    }`}
                >
                    <FontAwesomeIcon icon={faGamepad} className="mr-2" />
                    Controller
                </button>
            </div>

            {/* Error display */}
            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-900 text-red-400 p-3 rounded-lg mx-4 mt-4"
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
                        className="bg-oGray text-white rounded px-3 py-2 w-full border border-gray-600 focus:border-green-500 focus:outline-none"
                    >
                        {devices.map(device => (
                            <option key={device} value={device}>{device}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center h-32"
                        >
                            <div className="text-white">Loading...</div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
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
                    className="bg-oGray text-white rounded px-2 py-1 text-sm border border-gray-600 focus:border-green-500 focus:outline-none"
                >
                    {buttonOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            ) : (
                <button
                    onClick={() => setIsEditing(true)}
                    className={`px-3 py-1 bg-oGray rounded text-sm ${secondaryTextClass} hover:bg-gray-600`}
                >
                    {button}
                </button>
            )}
        </div>
    );
};
