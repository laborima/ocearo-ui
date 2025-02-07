import React, { useState, useEffect } from 'react';
import configService from './ConfigService';

const ConfigPage = ({ onSave }) => {
  // Capture the initial configuration once.
  const initialConfig = configService.getAll();

  // Initialize state with the initial configuration.
  const [config, setConfig] = useState(initialConfig);
  const [useAuthentication, setUseAuthentication] = useState(!!initialConfig.username || !!initialConfig.password);
  const [boats, setBoats] = useState([]);
  const [selectedBoat, setSelectedBoat] = useState(null);

  // Load configuration and boats on mount.
  useEffect(() => {
    // Get fresh config from the service.
    const configFromService = configService.getAll();
    setConfig(configFromService);

    const loadBoats = async () => {
      const fetchedBoats = await configService.fetchBoats();
      setBoats(fetchedBoats);

      // Use the config fetched from the service rather than state.
      if (configFromService.selectedBoat) {
        const currentBoat = fetchedBoats.find((b) => b.name === configFromService.selectedBoat);
        setSelectedBoat(currentBoat || null);
      }
    };

    loadBoats();
  }, []);

  // Save updated configuration.
  const handleSave = () => {
    const updatedConfig = { ...config };

    // If authentication is disabled, clear the credentials.
    if (!useAuthentication) {
      updatedConfig.username = '';
      updatedConfig.password = '';
    }

    configService.saveConfig(updatedConfig);
    if (onSave) onSave(updatedConfig);
    alert('Configuration saved!');
  };

  // Reset configuration to the defaults.
  const handleReset = () => {
    const defaultConfig = configService.getDefaultConfig();
    setConfig(defaultConfig);
    setUseAuthentication(!!defaultConfig.username || !!defaultConfig.password);
    configService.saveConfig(defaultConfig);
    alert('Configuration reset to default values!');
  };

  // Handle boat selection changes.
  const handleBoatChange = (e) => {
    const selectedBoatName = e.target.value;
    setConfig((prev) => ({ ...prev, selectedBoat: selectedBoatName }));
    const currentBoat = boats.find((b) => b.name === selectedBoatName);
    setSelectedBoat(currentBoat || null);
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
            value={config.signalkUrl || ''}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, signalkUrl: e.target.value }))
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

        {/* Username and Password Fields */}
        {useAuthentication && (
          <>
            <div>
              <label className="block font-medium">Username:</label>
              <input
                type="text"
                className="border p-2 w-full text-black"
                value={config.username || ''}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, username: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block font-medium">Password:</label>
              <input
                type="password"
                className="border p-2 w-full text-black"
                value={config.password || ''}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>
          </>
        )}

        {/* Boat Selection */}
        <div>
          <label className="block font-medium">Select Boat:</label>
          <select
            className="border p-2 w-full text-black"
            value={config.selectedBoat || ''}
            onChange={handleBoatChange}
          >
            <option value="">-- Select a Boat --</option>
            {boats.map((boat) => (
              <option key={boat.name} value={boat.name}>
                {boat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block font-medium">Primary Color:</label>
          <input
            type="color"
            className="border p-2 w-full"
            value={config.primaryColor || '#000000'}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, primaryColor: e.target.value }))
            }
          />
        </div>

        {/* Metallic Effect Toggle */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={config.metallicEffect || false}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, metallicEffect: e.target.checked }))
              }
            />
            Enable Metallic Effect
          </label>
        </div>

        {/* Debug Mode */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={config.debugMode || false}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, debugMode: e.target.checked }))
              }
            />
            Debug Mode
          </label>
        </div>

        {/* Boat Details */}
        {selectedBoat && config.debugMode && (
          <div className="space-y-2">
            <div>
              <strong>Documentation Path:</strong> {selectedBoat.docPath}
            </div>
            <div>
              <strong>Polar Path:</strong> {selectedBoat.polarPath}
            </div>
            <div>
              <strong>Model Path:</strong> {selectedBoat.modelPath}
            </div>
            <div>
              <strong>Capabilities:</strong>{' '}
              {selectedBoat.capabilities && selectedBoat.capabilities.join(', ')}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button onClick={handleSave} className="bg-oBlue text-white px-4 py-2 rounded">
            Save Configuration
          </button>
          <button onClick={handleReset} className="bg-oRed text-white px-4 py-2 rounded">
            Reset Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPage;
