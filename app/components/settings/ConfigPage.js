import React, { useState, useEffect, useCallback } from 'react';
import configService from './ConfigService';

const ConfigPage = ({ onSave }) => {
    const initialConfig = configService.getAll();
    const computedSignalKUrl = configService.getComputedSignalKUrl();
    const boats = configService.getBoatsData(); // Get full list of boats

    const [config, setConfig] = useState(initialConfig);
    const [useAuthentication, setUseAuthentication] = useState(
        initialConfig.useAuthentication || !!initialConfig.username || !!initialConfig.password
    );
    const [signalKUrlSet, setSignalKUrlSet] = useState(initialConfig.signalKUrlSet || false);
    const [selectedBoat, setSelectedBoat] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saveIndicator, setSaveIndicator] = useState({ visible: false, message: '' });

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
            
            // Initialize states from config
            setSignalKUrlSet(configFromService.signalKUrlSet || false);
            setUseAuthentication(configFromService.useAuthentication || !!configFromService.username || !!configFromService.password);

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
        
        // Handle SignalK URL settings
        if (updates.hasOwnProperty('signalKUrlSet')) {
            // When toggling the signalKUrlSet checkbox
            if (updates.signalKUrlSet === false) {
                // If turning off custom URL, use computed URL
                updatedConfig.signalkUrl = computedSignalKUrl;
                updatedConfig.username = '';
                updatedConfig.password = '';
            }
            // If turning on custom URL, keep the current URL (don't overwrite)
        } else if (!signalKUrlSet && !updates.hasOwnProperty('signalkUrl')) {
            // Only apply computed URL if signalKUrlSet is false and we're not setting URL
            updatedConfig.signalkUrl = computedSignalKUrl;
            updatedConfig.username = '';
            updatedConfig.password = '';
        } else if (!useAuthentication) {
            // Keep URL but clear auth if authentication is disabled
            updatedConfig.username = '';
            updatedConfig.password = '';
        }
        
        // Save the config
        configService.saveConfig(updatedConfig);
        onSave?.(updatedConfig);
        setHasUnsavedChanges(false);
        
        // Show save indicator
        setSaveIndicator({ visible: true, message: 'Settings saved automatically' });
        setTimeout(() => setSaveIndicator({ visible: false, message: '' }), 2000);
    };

    const handleSave = () => {
        const updatedConfig = { ...config };

        // Should match updateConfig logic
        if (!signalKUrlSet) {
            // Only use computed URL when signalKUrlSet is false
            updatedConfig.signalkUrl = computedSignalKUrl;
            updatedConfig.username = '';
            updatedConfig.password = '';
        } else if (!useAuthentication) {
            // Keep custom URL but clear auth credentials
            updatedConfig.username = '';
            updatedConfig.password = '';
        }
        
        // Always save the state of configuration switches
        updatedConfig.signalKUrlSet = signalKUrlSet;
        updatedConfig.useAuthentication = useAuthentication;

        configService.saveConfig(updatedConfig);
        onSave?.(updatedConfig);
        setHasUnsavedChanges(false);
        
        // Show save indicator
        setSaveIndicator({ visible: true, message: 'Settings saved' });
        setTimeout(() => setSaveIndicator({ visible: false, message: '' }), 2000);
    };

    const handleReset = () => {
        const defaultConfig = configService.getDefaultConfig();
        setConfig(defaultConfig);
        // Reset authentication settings
        setUseAuthentication(false);
        defaultConfig.useAuthentication = false;
        // Reset SignalK URL settings
        setSignalKUrlSet(false);
        defaultConfig.signalKUrlSet = false;
        // Reset custom URLs settings
        defaultConfig.showCustomUrls = false;
        defaultConfig.customExternalUrls = {}; // Reset to empty object to use default URLs
        // Save the reset configuration
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
            <h1 className="text-2xl font-bold mb-4 flex justify-between items-center">
                Ocearo Configuration
                {saveIndicator.visible && (
                    <span className="text-sm font-normal bg-green-500 text-white px-3 py-1 rounded-full animate-pulse">
                        {saveIndicator.message}
                    </span>
                )}
            </h1>

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
                                    updateConfig({ signalKUrlSet: e.target.checked });
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
                                            updateConfig({ useAuthentication: e.target.checked });
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

                    {selectedBoat && (
                        <div className="space-y-2 text-sm text-gray-400">
                            <div>3D Model: {selectedBoat.modelPath}</div>
                            <div>Features: {selectedBoat.capabilities?.join(', ')}</div>
                        </div>
                    )}

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

                {/* Display Settings */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Display Settings</h2>

                    <div>
                        <label className="flex items-center text-base">
                            <input
                                type="checkbox"
                                className="mr-3 h-5 w-5" // Larger checkbox for better touch interaction
                                checked={config.compassNorthUp || false}
                                onChange={(e) => updateConfig({ compassNorthUp: e.target.checked })}
                            />
                            <span>
                                Compass Mode: North at Top
                                <div className="text-sm text-gray-400">
                                    {config.compassNorthUp ? 
                                        "North at top (land navigation style)" : 
                                        "North at bottom (marine navigation style)"}
                                </div>
                            </span>
                        </label>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">
                            AIS Length Scaling Factor
                            <div className="text-xs text-gray-500">Controls the scaling of AIS boats on the map (0.1 - 2.0)</div>
                        </label>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm">0.1</span>
                            <input
                                type="range"
                                className="w-full h-10 appearance-none bg-gray-700 rounded-lg outline-none cursor-pointer"
                                style={{
                                    WebkitAppearance: 'none',
                                    appearance: 'none',
                                    height: '20px',
                                    background: 'linear-gradient(to right, #1E3A8A, #3B82F6)',
                                    borderRadius: '10px',
                                }}
                                min="0.1"
                                max="2.0"
                                step="0.1"
                                value={config.aisLengthScalingFactor || 0.7}
                                onChange={(e) => updateConfig({
                                    aisLengthScalingFactor: parseFloat(e.target.value)
                                })}
                            />
                            <span className="text-sm">2.0</span>
                            <span className="text-base font-semibold bg-blue-500 px-3 py-1 rounded-lg min-w-[3.5rem] text-center">
                                {config.aisLengthScalingFactor || 0.7}
                            </span>
                        </div>
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
                    
                    <div>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                className="mr-2"
                                checked={config.showCustomUrls || false}
                                onChange={(e) => updateConfig({
                                    showCustomUrls: e.target.checked
                                })}
                            />
                            Set Custom External Tools URLs
                        </label>
                    </div>
                    
                    {config.showCustomUrls && (
                        <div className="space-y-4 p-4 border border-gray-700 rounded-lg">
                            <h3 className="text-lg font-medium">Custom External URLs</h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Customize URLs for external tools. Use <code>{'${signalkUrl}'}</code> as placeholder for the SignalK URL, 
                                and <code>{'${latitude}'}</code> or <code>{'${longitude}'}</code> for position values.
                                Leave empty to use the default URL.
                            </p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block font-medium mb-1">Navigation URL:</label>
                                    <input
                                        type="text"
                                        className="border p-2 w-full text-black rounded"
                                        placeholder={"${signalkUrl}/@signalk/freeboard-sk/"}
                                        value={(config.customExternalUrls?.navigation) || ''}
                                        onChange={(e) => {
                                            const customExternalUrls = { ...config.customExternalUrls } || {};
                                            customExternalUrls.navigation = e.target.value;
                                            updateConfig({ customExternalUrls });
                                        }}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block font-medium mb-1">Instrument URL:</label>
                                    <input
                                        type="text"
                                        className="border p-2 w-full text-black rounded"
                                        placeholder={"${signalkUrl}/@mxtommy/kip/"}
                                        value={(config.customExternalUrls?.instrument) || ''}
                                        onChange={(e) => {
                                            const customExternalUrls = { ...config.customExternalUrls } || {};
                                            customExternalUrls.instrument = e.target.value;
                                            updateConfig({ customExternalUrls });
                                        }}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block font-medium mb-1">Dashboard URL:</label>
                                    <input
                                        type="text"
                                        className="border p-2 w-full text-black rounded"
                                        placeholder={"${signalkUrl}/grafana"} 
                                        value={(config.customExternalUrls?.dashboard) || ''}
                                        onChange={(e) => {
                                            const customExternalUrls = { ...config.customExternalUrls } || {};
                                            customExternalUrls.dashboard = e.target.value;
                                            updateConfig({ customExternalUrls });
                                        }}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block font-medium mb-1">Webcam 1 URL:</label>
                                    <input
                                        type="text"
                                        className="border p-2 w-full text-black rounded"
                                        placeholder="https://example.com/webcam1"
                                        value={(config.customExternalUrls?.webcam1) || ''}
                                        onChange={(e) => {
                                            const customExternalUrls = { ...config.customExternalUrls } || {};
                                            customExternalUrls.webcam1 = e.target.value;
                                            updateConfig({ customExternalUrls });
                                        }}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block font-medium mb-1">Webcam 2 URL:</label>
                                    <input
                                        type="text"
                                        className="border p-2 w-full text-black rounded"
                                        placeholder="https://example.com/webcam2"
                                        value={(config.customExternalUrls?.webcam2) || ''}
                                        onChange={(e) => {
                                            const customExternalUrls = { ...config.customExternalUrls } || {};
                                            customExternalUrls.webcam2 = e.target.value;
                                            updateConfig({ customExternalUrls });
                                        }}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block font-medium mb-1">Weather URL:</label>
                                    <input
                                        type="text"
                                        className="border p-2 w-full text-black rounded"
                                        placeholder={"https://embed.windy.com/embed.html?location=coordinates&lat=${latitude}&lon=${longitude}"}
                                        value={(config.customExternalUrls?.weather) || ''}
                                        onChange={(e) => {
                                            const customExternalUrls = { ...config.customExternalUrls } || {};
                                            customExternalUrls.weather = e.target.value;
                                            updateConfig({ customExternalUrls });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    
                   

                   
                </div>
                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
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
