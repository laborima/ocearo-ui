import React, { useState, useEffect } from 'react';
import configService from './ConfigService'; // Import the ConfigService

const ConfigPage = ({ onSave }) => {
    // State for configuration inputs
    const [config, setConfig] = useState(configService.getAll()); // Load initial config from the service
    const [useAuthentication, setUseAuthentication] = useState(!!config.username || !!config.password); // Determine if authentication is enabled

    // Load configuration on mount
    useEffect(() => {
        setConfig(configService.getAll());
    }, []);

    const handleSave = () => {
        // Save the updated configuration to the service
        const updatedConfig = { ...config };

        // If useAuthentication is disabled, clear username and password
        if (!useAuthentication) {
            updatedConfig.username = '';
            updatedConfig.password = '';
        }

        configService.saveConfig(updatedConfig);

        if (onSave) onSave(updatedConfig); // Notify parent if needed
        alert('Configuration saved!');
    };

    const handleReset = () => {
        // Reset configuration to default values
        const defaultConfig = configService.getDefaultConfig();
        setConfig(defaultConfig);
        setUseAuthentication(!!defaultConfig.username || !!defaultConfig.password); // Update authentication toggle
        configService.saveConfig(defaultConfig); // Save default config
        alert('Configuration reset to default values!');
    };

    return (
        <div className="p-4 text-white">
            <h1 className="text-2xl font-bold mb-4">Ocearo Configuration</h1>
            <div className="space-y-4">
                {/* SignalK Server URL */}
                <div>
                    <label className="block font-medium">SignalK Server URL:</label>
                    <input
                        type="text"
                        className="border p-2 w-full text-black"
                        value={config.signalkUrl}
                        onChange={(e) =>
                            setConfig({ ...config, signalkUrl: e.target.value })
                        }
                    />
                </div>

                {/* Authentication Toggle */}
                <div>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            className="mr-2"
                            checked={useAuthentication}
                            onChange={(e) => setUseAuthentication(e.target.checked)}
                        />
                        Use Authentication
                    </label>
                </div>

                {/* Username Field (only show if authentication is enabled) */}
                {useAuthentication && (
                    <div>
                        <label className="block font-medium">Username:</label>
                        <input
                            type="text"
                            className="border p-2 w-full text-black"
                            value={config.username}
                            onChange={(e) =>
                                setConfig({ ...config, username: e.target.value })
                            }
                        />
                    </div>
                )}

                {/* Password Field (only show if authentication is enabled) */}
                {useAuthentication && (
                    <div>
                        <label className="block font-medium">Password:</label>
                        <input
                            type="password"
                            className="border p-2 w-full  text-black"
                            value={config.password}
                            onChange={(e) =>
                                setConfig({ ...config, password: e.target.value })
                            }
                        />
                    </div>
                )}

                {/* Debug Mode */}
                <div>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            className="mr-2"
                            checked={config.debugMode}
                            onChange={(e) =>
                                setConfig({ ...config, debugMode: e.target.checked })
                            }
                        />
                        Debug Mode
                    </label>
                </div>

                {/* Color Picker */}
                <div>
                    <label className="block font-medium">Primary Color:</label>
                    <input
                        type="color"
                        className="border p-2 w-full"
                        value={config.primaryColor || '#000000'} // Default to black if not set
                        onChange={(e) =>
                            setConfig({ ...config, primaryColor: e.target.value })
                        }
                    />
                </div>

                {/* Metallic Effect Toggle */}
                <div>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            className="mr-2"
                            checked={config.metallicEffect || false} // Default to false if not set
                            onChange={(e) =>
                                setConfig({ ...config, metallicEffect: e.target.checked })
                            }
                        />
                        Enable Metallic Effect
                    </label>
                </div>

                <div className="flex space-x-4">
                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        className="bg-oBlue text-white px-4 py-2 rounded"
                    >
                        Save Configuration
                    </button>

                    {/* Reset Button */}
                    <button
                        onClick={handleReset}
                        className="bg-oRed text-white px-4 py-2 rounded"
                    >
                        Reset Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfigPage;
