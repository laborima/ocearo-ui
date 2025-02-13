import React, { useState, useEffect, useCallback } from 'react';
import configService from './ConfigService';

const ConfigPage = ({ onSave }) => {
  const initialConfig = configService.getAll();
  const computedSignalKUrl = configService.getComputedSignalKUrl();

  const [config, setConfig] = useState(initialConfig);
  const [useAuthentication, setUseAuthentication] = useState(
    !!initialConfig.username || !!initialConfig.password
  );
  const [setSignalKUrl, setSetSignalKUrl] = useState(false);
  const [boats, setBoats] = useState([]);
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track changes by comparing current config with initial config
  const checkForChanges = useCallback((newConfig) => {
    const hasChanges = JSON.stringify(newConfig) !== JSON.stringify(initialConfig);
    setHasUnsavedChanges(hasChanges);
  }, [initialConfig]);

  useEffect(() => {
    const loadConfiguration = async () => {
      const configFromService = configService.getAll();
      setConfig(configFromService);

      const fetchedBoats = await configService.fetchBoats();
      setBoats(fetchedBoats);

      if (configFromService.selectedBoat) {
        const currentBoat = fetchedBoats.find(
          (b) => b.name === configFromService.selectedBoat
        );
        setSelectedBoat(currentBoat || null);
      }
    };

    loadConfiguration();
  }, []);

  // Update config and check for changes
  const updateConfig = (updates) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    checkForChanges(newConfig);
  };

  const handleSave = () => {
    const updatedConfig = { ...config };

    if (!setSignalKUrl) {
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
    setSetSignalKUrl(false);
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
      {hasUnsavedChanges && (
        <div className="bg-oBlue text-white px-4 py-2 rounded mb-4 flex justify-between items-center">
          <span>You have unsaved changes</span>
          <button
            onClick={handleSave}
            className="bg-white text-black px-3 py-1 rounded text-sm hover:bg-gray-100"
          >
            Save Now
          </button>
        </div>
      )}

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
                checked={setSignalKUrl}
                onChange={(e) => {
                  setSetSignalKUrl(e.target.checked);
                  checkForChanges(config);
                }}
              />
              Set SignalK URL
              {!setSignalKUrl && <span className="ml-2">({computedSignalKUrl})</span>}
            </label>
          </div>

          {setSignalKUrl && (
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
            className="bg-oBlue text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Save Configuration
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