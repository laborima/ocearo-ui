import React, { useState, useEffect, useCallback } from 'react';
import configService from './ConfigService';

const ConfigPage = ({ onSave }) => {
    const initialConfig = configService.getAll();
    const computedSignalKUrl = configService.getComputedSignalKUrl();
    const boats = configService.getBoatsData(); // Get full list of boats

    const [config, setConfig] = useState(initialConfig);
    const [useAuthentication, setUseAuthentication] = useState(
        !!initialConfig.username || !!initialConfig.password
    );
    const [signalKUrlSet, setSignalKUrlSet] = useState(false);
    const [selectedBoat, setSelectedBoat] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Track changes by comparing current config with initial config
    const checkForChanges = useCallback(
        (newConfig) => {
            const hasChanges = JSON.stringify(newConfig) !== JSON.stringify(initialConfig);
            setHasUnsavedChanges(hasChanges);
        },
        [initialConfig]
    );

    useEffect(() => {
        const loadConfiguration = async () => {
            const configFromService = configService.getAll();
            setConfig(configFromService);

            if (configFromService.selectedBoat) {
                const currentBoat = boats.find((boat) => boat.name === configFromService.selectedBoat);
                setSelectedBoat(currentBoat || null);
            }
        };

        loadConfiguration();
    }, [boats]);

    // Update config, check for changes, and auto-save
    const updateConfig = (updates) => {
        const newConfig = { ...config, ...updates };
        setConfig(newConfig);
        checkForChanges(newConfig);
        
        // Auto-save when settings change
        const updatedConfig = { ...newConfig };
        
        // Apply special logic from handleSave
        if (!signalKUrlSet) {
            updatedConfig.signalkUrl = computedSignalKUrl;
            updatedConfig.username = '';
            updatedConfig.password = '';
        } else if (!useAuthentication) {
            updatedConfig.username = '';
            updatedConfig.password = '';
        }
        
        // Save the config
        configService.saveConfig(updatedConfig);
        onSave?.(updatedConfig);
        setHasUnsavedChanges(false);
    };

    const handleSave = () => {
        const updatedConfig = { ...config };

        if (!signalKUrlSet) {
            updatedConfig.signalkUrl = computedSignalKUrl;
            updatedConfig.username = '';
            updatedConfig.password = '';
        } else if (!useAuthentication) {
            updatedConfig.username = '';
            updatedConfig.password = '';
        }

        configService.saveConfig(updatedConfig);
        onSave?.(updatedConfig);
        setHasUnsavedChanges(false);
    };

    const handleReset = () => {
        const defaultConfig = configService.getDefaultConfig();
        setConfig(defaultConfig);
        setUseAuthentication(false);
        setSignalKUrlSet(false);
        configService.saveConfig(defaultConfig);
        setHasUnsavedChanges(false);
    };

    const handleBoatChange = (e) => {
        const boatName = e.target.value;
        const boat = boats.find((b) => b.name === boatName);
        setSelectedBoat(boat || null);
        updateConfig({ selectedBoat: boatName });
    };

    return (
        <div className="p-4 text-white">
            <h1 className="text-2xl font-bold mb-4">Ocearo Configuration</h1>

            <div className="space-y-4">
                {/* Connection Settings */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Connection Settings</h2>

                    <div>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                className="mr-2"
                                checked={signalKUrlSet}
                                onChange={(e) => {
                                    setSignalKUrlSet(e.target.checked);
                                    checkForChanges(config);
                                }}
                            />
                            Set SignalK URL
                            {!signalKUrlSet && <span className="ml-2">({computedSignalKUrl})</span>}
                        </label>
                    </div>

                    {signalKUrlSet && (
                        <>
                            <div>
                                <label className="block font-medium mb-1">SignalK Server URL:</label>
                                <input
                                    type="text"
                                    className="border p-2 w-full text-black rounded"
                                    value={config.signalkUrl || ''}
                                    onChange={(e) => updateConfig({ signalkUrl: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="mr-2"
                                        checked={useAuthentication}
                                        onChange={(e) => {
                                            setUseAuthentication(e.target.checked);
                                            checkForChanges(config);
                                        }}
                                    />
                                    Use Authentication
                                </label>
                            </div>

                            {useAuthentication && (
                                <>
                                    <div>
                                        <label className="block font-medium mb-1">Username:</label>
                                        <input
                                            type="text"
                                            className="border p-2 w-full text-black rounded"
                                            value={config.username || ''}
                                            onChange={(e) => updateConfig({ username: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Password:</label>
                                        <input
                                            type="password"
                                            className="border p-2 w-full text-black rounded"
                                            value={config.password || ''}
                                            onChange={(e) => updateConfig({ password: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* Vessel Settings */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Vessel Settings</h2>

                    <div>
                        <label className="block font-medium mb-1">Select Vessel:</label>
                        <select
                            className="border p-2 w-full text-black rounded"
                            value={config.selectedBoat || ''}
                            onChange={handleBoatChange}
                        >
                            <option value="">-- Select a Vessel --</option>
                            {boats.map((boat) => (
                                <option key={boat.name} value={boat.name}>
                                    {boat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block font-medium mb-1">Vessel Color:</label>
                        <input
                            type="color"
                            className="w-full h-10 rounded"
                            value={config.primaryColor || '#000000'}
                            onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                className="mr-2"
                                checked={config.metallicEffect || false}
                                onChange={(e) => updateConfig({ metallicEffect: e.target.checked })}
                            />
                            Enable Metallic Effect
                        </label>
                    </div>
                </div>

                {/* Advanced Settings */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Advanced Settings</h2>

                    <div>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                className="mr-2"
                                checked={config.debugMode || false}
                                onChange={(e) => updateConfig({
                                    debugMode: e.target.checked,
                                    signalkUrl: computedSignalKUrl
                                })}
                            />
                            Debug Mode
                        </label>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">
                            AIS Length Scaling Factor
                            <div className="text-xs text-gray-500">Controls the scaling of AIS boats on the map (default: 0.7)</div>
                        </label>
                        <input
                            type="number"
                            className="w-full p-2 border rounded text-black"
                            value={config.aisLengthScalingFactor || 0.7}
                            step="0.1"
                            min="0.1"
                            max="2.0"
                            onChange={(e) => updateConfig({
                                aisLengthScalingFactor: parseFloat(e.target.value)
                            })}
                        />
                    </div>

                    {selectedBoat && config.debugMode && (
                        <div className="space-y-2 text-sm text-gray-400">
                            <div>3D Model: {selectedBoat.modelPath}</div>
                            <div>Features: {selectedBoat.capabilities?.join(', ')}</div>
                        </div>
                    )}
                </div>
                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                    <button
                        onClick={handleSave}
                        disabled={!hasUnsavedChanges}
                        className={`px-4 py-2 rounded ${hasUnsavedChanges ? 'bg-oBlue text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    >
                        {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
                    </button>
                    <button
                        onClick={handleReset}
                        className="bg-oRed text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                        Reset Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfigPage;
