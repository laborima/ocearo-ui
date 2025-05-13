import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOcearoContext, convertTemperature } from '../context/OcearoContext';
import { BATTERY_CONFIG, estimateStateOfCharge, getBatteryColorClass, isBatteryCharging } from '../utils/BatteryUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBolt, faBatteryFull, faChargingStation, faMicrochip, faCube, faMemory, faCode, faTemperatureHalf,
  faCar, faSnowflake, faArrowUp, faArrowDown, faLeaf, faChartLine, faGaugeHigh, faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';

// Import extracted components
import LineChart from '../charts/LineChart';

import * as THREE from 'three';

const BatteryMonitor = () => {
  const { nightMode, getSignalKValue } = useOcearoContext();
  const beginTimeRef = useRef(performance.now());
  const prevTimeRef = useRef(performance.now());
  const framesRef = useRef(0);
  const [activeTab, setActiveTab] = useState('battery'); // battery, graph, performance
  const [activeView, setActiveView] = useState('voltage'); // voltage, current, soc
  const [activePerformanceView, setActivePerformanceView] = useState('fps'); // fps, drawCalls, triangles, memory
  const [selectedBattery, setSelectedBattery] = useState('1'); // Default to first battery
  const [showBatteryDetails, setShowBatteryDetails] = useState(false); // Control details popup

  // Function to fetch available batteries
  const getAvailableBatteries = useCallback(() => {
    // In a real implementation, you might fetch this dynamically from SignalK
    // This is a simplified version that checks for battery.1, battery.2, etc.
    const batteries = [];
    
    // Check for batteries 0 and 1 (service and starter batteries)
    for (let i = 0; i <= 2; i++) {
      const batteryName = getSignalKValue(`electrical.batteries.${i}.name`);
      const batteryVoltage = getSignalKValue(`electrical.batteries.${i}.voltage`);
      
      // Only add if we have at least some data for this battery
      if (batteryName || batteryVoltage) {
        batteries.push({
          id: i.toString(),
          name: batteryName || `Battery ${i}`,
          hasData: true
        });
      }
    }
    
    // If no batteries were found, return at least the default
    if (batteries.length === 0) {
      batteries.push({
        id: '1',
        name: 'Main Battery',
        hasData: true
      });
    }
    
    return batteries;
  }, [getSignalKValue]);

  const [availableBatteries, setAvailableBatteries] = useState(() => getAvailableBatteries());

  const getInitialBatteryData = useCallback(() => {
    const time = new Date().toLocaleTimeString();
    const voltage = getSignalKValue(`electrical.batteries.${selectedBattery}.voltage`) || 12;
    const stateOfCharge = getSignalKValue(`electrical.batteries.${selectedBattery}.capacity.stateOfCharge`);
    const current = getSignalKValue(`electrical.batteries.${selectedBattery}.current`) || 5;
    const temperatureKelvin = getSignalKValue(`electrical.batteries.${selectedBattery}.temperature`);
    const temperature = temperatureKelvin !== null ? convertTemperature(temperatureKelvin) : null;
    
    // Get battery details
    const chemistry = getSignalKValue(`electrical.batteries.${selectedBattery}.chemistry`);
    const name = getSignalKValue(`electrical.batteries.${selectedBattery}.name`);
    const location = getSignalKValue(`electrical.batteries.${selectedBattery}.location`);
    const dateInstalled = getSignalKValue(`electrical.batteries.${selectedBattery}.dateInstalled`);
    const manufacturer = getSignalKValue(`electrical.batteries.${selectedBattery}.manufacturer.name`);
    const model = getSignalKValue(`electrical.batteries.${selectedBattery}.manufacturer.model`);
    const manufacturerURL = getSignalKValue(`electrical.batteries.${selectedBattery}.manufacturer.URL`);
    const associatedBus = getSignalKValue(`electrical.batteries.${selectedBattery}.associatedBus`);
    const voltageRipple = getSignalKValue(`electrical.batteries.${selectedBattery}.voltage.ripple`);
    const nominalCapacity = getSignalKValue(`electrical.batteries.${selectedBattery}.capacity.nominal`);
    const actualCapacity = getSignalKValue(`electrical.batteries.${selectedBattery}.capacity.actual`);
    const remainingCapacity = getSignalKValue(`electrical.batteries.${selectedBattery}.capacity.remaining`);
    const dischargeLimit = getSignalKValue(`electrical.batteries.${selectedBattery}.capacity.dischargeLimit`);
    const stateOfHealth = getSignalKValue(`electrical.batteries.${selectedBattery}.capacity.stateOfHealth`);
    const dischargeSinceFull = getSignalKValue(`electrical.batteries.${selectedBattery}.capacity.dischargeSinceFull`);
    const timeRemaining = getSignalKValue(`electrical.batteries.${selectedBattery}.capacity.timeRemaining`);
    const lifetimeDischarge = getSignalKValue(`electrical.batteries.${selectedBattery}.lifetimeDischarge`);
    const lifetimeRecharge = getSignalKValue(`electrical.batteries.${selectedBattery}.lifetimeRecharge`);
    
    // Get boat-specific system states
    const autopilotState = getSignalKValue('steering.autopilot.state') === 'auto';
    const instrumentsOn = current > 0.5; // Assume instruments are on if current draw is significant
    const navigationLightsOn = getSignalKValue('navigation.lights') || false;
    
    return {
      time,
      voltage,
      current,
      stateOfCharge: stateOfCharge !== null ? stateOfCharge : estimateStateOfCharge(voltage),
      power: voltage * current, // Calculate power in watts
      temperature, // Battery temperature in Celsius
      autopilotState,
      instrumentsOn,
      navigationLightsOn,
      // Battery details
      chemistry,
      name,
      location,
      dateInstalled,
      manufacturer,
      model,
      manufacturerURL,
      associatedBus,
      voltageRipple,
      nominalCapacity,
      actualCapacity,
      remainingCapacity,
      dischargeLimit,
      stateOfHealth,
      dischargeSinceFull,
      timeRemaining,
      lifetimeDischarge,
      lifetimeRecharge
    };
  }, [getSignalKValue, selectedBattery]);

  // Initialize with 60 data points for smoother graphs
  const [batteryData, setBatteryData] = useState(() =>
    Array(60).fill(null).map(getInitialBatteryData)
  );
  
  const [performanceData, setPerformanceData] = useState(() => {
    const time = new Date().toLocaleTimeString();
    return Array(60).fill({
      time,
      fps: 60,
      ms: 16.67,
      drawCalls: 0,
      triangles: 0,
      geometries: 0,
      textures: 0,
      memory: 0
    });
  });

  const updateBatteryData = useCallback((timeStr) => {
    const lastData = batteryData[batteryData.length - 1];
    const voltage = getSignalKValue(`electrical.batteries.${selectedBattery}.voltage`) || lastData.voltage;
    const current = getSignalKValue(`electrical.batteries.${selectedBattery}.current`) || lastData.current;
    const stateOfCharge = getSignalKValue(`electrical.batteries.${selectedBattery}.capacity.stateOfCharge`);
    const estimatedSoC = stateOfCharge !== null ? stateOfCharge : estimateStateOfCharge(voltage);
    const temperatureKelvin = getSignalKValue(`electrical.batteries.${selectedBattery}.temperature`);
    const temperature = temperatureKelvin !== null ? convertTemperature(temperatureKelvin) : null;

    // Get battery details
    const chemistry = getSignalKValue(`electrical.batteries.${selectedBattery}.chemistry`) || lastData.chemistry;
    const name = getSignalKValue(`electrical.batteries.${selectedBattery}.name`) || lastData.name;
    const location = getSignalKValue(`electrical.batteries.${selectedBattery}.location`) || lastData.location;
    const dateInstalled = getSignalKValue(`electrical.batteries.${selectedBattery}.dateInstalled`) || lastData.dateInstalled;
    const manufacturer = getSignalKValue(`electrical.batteries.${selectedBattery}.manufacturer.name`) || lastData.manufacturer;
    const model = getSignalKValue(`electrical.batteries.${selectedBattery}.manufacturer.model`) || lastData.model;
    const manufacturerURL = getSignalKValue(`electrical.batteries.${selectedBattery}.manufacturer.URL`) || lastData.manufacturerURL;
    const associatedBus = getSignalKValue(`electrical.batteries.${selectedBattery}.associatedBus`) || lastData.associatedBus;
    const voltageRipple = getSignalKValue(`electrical.batteries.${selectedBattery}.voltage.ripple`) || lastData.voltageRipple;
    const nominalCapacity = getSignalKValue(`electrical.batteries.${selectedBattery}.capacity.nominal`) || lastData.nominalCapacity;
    const actualCapacity = getSignalKValue(`electrical.batteries.${selectedBattery}.capacity.actual`) || lastData.actualCapacity;
    const remainingCapacity = getSignalKValue(`electrical.batteries.${selectedBattery}.capacity.remaining`) || lastData.remainingCapacity;
    const dischargeLimit = getSignalKValue(`electrical.batteries.${selectedBattery}.capacity.dischargeLimit`) || lastData.dischargeLimit;
    const stateOfHealth = getSignalKValue(`electrical.batteries.${selectedBattery}.capacity.stateOfHealth`) || lastData.stateOfHealth;
    const dischargeSinceFull = getSignalKValue(`electrical.batteries.${selectedBattery}.capacity.dischargeSinceFull`) || lastData.dischargeSinceFull;
    const timeRemaining = getSignalKValue(`electrical.batteries.${selectedBattery}.capacity.timeRemaining`) || lastData.timeRemaining;
    const lifetimeDischarge = getSignalKValue(`electrical.batteries.${selectedBattery}.lifetimeDischarge`) || lastData.lifetimeDischarge;
    const lifetimeRecharge = getSignalKValue(`electrical.batteries.${selectedBattery}.lifetimeRecharge`) || lastData.lifetimeRecharge;

    // Get boat-specific system states
    const autopilotState = getSignalKValue('steering.autopilot.state') === 'auto';
    const instrumentsOn = current > 0.5; // Assume instruments are on if current draw is significant
    const navigationLightsOn = getSignalKValue('navigation.lights') || false;

    return {
      time: timeStr,
      voltage,
      current,
      stateOfCharge: estimatedSoC,
      power: voltage * current, // Power in watts
      temperature: temperature, // Battery temperature in Celsius (can be null)
      autopilotState,
      instrumentsOn,
      navigationLightsOn,
      // Battery details
      chemistry,
      name,
      location,
      dateInstalled,
      manufacturer,
      model,
      manufacturerURL,
      associatedBus,
      voltageRipple,
      nominalCapacity,
      actualCapacity,
      remainingCapacity,
      dischargeLimit,
      stateOfHealth,
      dischargeSinceFull,
      timeRemaining,
      lifetimeDischarge,
      lifetimeRecharge
    };
  }, [getSignalKValue, batteryData, selectedBattery]);

  // Reference to renderer for performance stats
  const rendererRef = useRef(null);
  
  // Find Three.js renderer if it exists in the window
  useEffect(() => {
    // Try to find the THREE.WebGLRenderer instance from the window
    if (window.__OCEARO_RENDERER) {
      rendererRef.current = window.__OCEARO_RENDERER;
    }
  }, []);

  // Refresh available batteries periodically
  useEffect(() => {
    const batteryCheckInterval = setInterval(() => {
      const updatedBatteries = getAvailableBatteries();
      setAvailableBatteries(updatedBatteries);
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(batteryCheckInterval);
  }, [getAvailableBatteries]);
  
  // Re-initialize battery data when selected battery changes
  useEffect(() => {
    setBatteryData(Array(60).fill(null).map(getInitialBatteryData));
  }, [selectedBattery, getInitialBatteryData]);

  useEffect(() => {
    let animationFrameId;

    const updateAllData = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      framesRef.current++;
      const time = performance.now();
      const frameTime = time - beginTimeRef.current;

      if (time >= prevTimeRef.current + 1000) {
        const fps = (framesRef.current * 1000) / (time - prevTimeRef.current);
        const avgFrameTime = fps > 0 ? 1000 / fps : 0;
        
        // Get Three.js performance stats if renderer is available
        let drawCalls = 0;
        let triangles = 0;
        let geometries = 0;
        let textures = 0;
        let memory = 0;
        
        // Get memory info if available
        if (window.performance && window.performance.memory) {
          memory = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
        }
        
        // Get renderer info if available
        if (rendererRef.current) {
          const info = rendererRef.current.info;
          drawCalls = info.render?.calls || 0;
          triangles = info.render?.triangles || 0;
          geometries = info.memory?.geometries || 0;
          textures = info.memory?.textures || 0;
        } else if (window.__OCEARO_RENDER_INFO) {
          // Try to get info from global variable if available
          const info = window.__OCEARO_RENDER_INFO;
          drawCalls = info.render?.calls || 0;
          triangles = info.render?.triangles || 0;
          geometries = info.memory?.geometries || 0;
          textures = info.memory?.textures || 0;
        }

        setPerformanceData((prev) => [
          ...prev.slice(1),
          { 
            time: timeStr, 
            fps: fps, 
            ms: avgFrameTime,
            drawCalls,
            triangles,
            geometries,
            textures,
            memory
          },
        ]);

        setBatteryData((prev) => [
          ...prev.slice(1),
          updateBatteryData(timeStr),
        ]);

        prevTimeRef.current = time;
        framesRef.current = 0;
      }

      beginTimeRef.current = time;
      animationFrameId = requestAnimationFrame(updateAllData);
    };

    animationFrameId = requestAnimationFrame(updateAllData);
    return () => cancelAnimationFrame(animationFrameId);
  }, [updateBatteryData]);

  const batteryScales = {
    voltage: { min: 10.5, max: 15, step: 1 },
    current: { min: -5, max: 50, step: 5 },
    soc: { min: 0, max: 100, step: 25 },
    power: { min: -60, max: 240, step: 60 },
    temperature: { min: 10, max: 60, step: 10 },
  };

  const performanceScales = {
    fps: { min: 0, max: 60, step: 15 },
    ms: { min: 0, max: 33.33, step: 10 },
    drawCalls: { min: 0, max: 500, step: 100 },
    triangles: { min: 0, max: 500000, step: 100000 },
    memory: { min: 0, max: 500, step: 100 },
  };

  // Current battery data
  const currentBatteryData = batteryData[batteryData.length - 1];
  const isCharging = isBatteryCharging(currentBatteryData.voltage);
  const hasTemperatureData = currentBatteryData.temperature !== null;
  
  return (
    <div className="flex flex-col h-full rightPaneBg overflow-auto">

     

      {/* Tab Navigation - Modern Style */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('battery')}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center transition-all ${
            activeTab === 'battery'
              ? 'text-green-500 border-b-2 border-green-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <FontAwesomeIcon icon={faLeaf} className="mr-2" />
          Energy
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center transition-all ${
            activeTab === 'graph'
              ? 'text-green-500 border-b-2 border-green-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <FontAwesomeIcon icon={faChartLine} className="mr-2" />
          Consumption
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center transition-all ${
            activeTab === 'performance'
              ? 'text-green-500 border-b-2 border-green-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <FontAwesomeIcon icon={faGaugeHigh} className="mr-2" />
          Performance
        </button>
      </div>
      
      <div className="h-full">
        {/* Tab Content */}
        {/* Primary Battery Visualization Tab */}
        {activeTab === 'battery' && (
        <div className="p-4 flex flex-col flex-1 min-h-0 rightPaneBg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              Battery information  {currentBatteryData.stateOfCharge.toFixed(0)}%
              
              <button 
                className="ml-2 bg-oGray2 rounded-full w-6 h-6 flex items-center justify-center text-gray-400 hover:bg-oGray focus:outline-none focus:ring-1 focus:ring-green-500"
                onClick={() => setShowBatteryDetails(!showBatteryDetails)}
                aria-label="Battery details"
              >
                <FontAwesomeIcon icon={faQuestionCircle} className="text-xs" />
              </button>
            </h2>
            
            <div className="flex items-center space-x-2">
              <select 
                className="bg-oGray2 px-2 py-1 rounded text-white text-sm border border-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500"
                value={selectedBattery}
                onChange={(e) => setSelectedBattery(e.target.value)}
              >
                {availableBatteries.map((battery) => (
                  <option key={battery.id} value={battery.id}>
                    {battery.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Battery Details Popup */}
          {showBatteryDetails && (
            <div className="bg-oGray2 p-4 rounded-lg mb-6 relative">
              <button 
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
                onClick={() => setShowBatteryDetails(false)}
                aria-label="Close details"
              >
                ×
              </button>
              <div className="text-gray-400 text-sm font-medium mb-4">BATTERY DETAILS</div>
              <div className="grid grid-cols-2 gap-4">
                {currentBatteryData.name && (
                  <div className="flex items-start">
                    <div className="w-20 text-xs text-gray-400">NAME</div>
                    <div className="text-sm text-white">{currentBatteryData.name}</div>
                  </div>
                )}
                {currentBatteryData.location && (
                  <div className="flex items-start">
                    <div className="w-20 text-xs text-gray-400">LOCATION</div>
                    <div className="text-sm text-white">{currentBatteryData.location}</div>
                  </div>
                )}
                {currentBatteryData.manufacturer && (
                  <div className="flex items-start">
                    <div className="w-20 text-xs text-gray-400">MAKER</div>
                    <div className="text-sm text-white">{currentBatteryData.manufacturer}</div>
                  </div>
                )}
                {currentBatteryData.model && (
                  <div className="flex items-start">
                    <div className="w-20 text-xs text-gray-400">MODEL</div>
                    <div className="text-sm text-white">{currentBatteryData.model}</div>
                  </div>
                )}
                {currentBatteryData.chemistry && (
                  <div className="flex items-start">
                    <div className="w-20 text-xs text-gray-400">CHEMISTRY</div>
                    <div className="text-sm text-white">{currentBatteryData.chemistry}</div>
                  </div>
                )}
                {currentBatteryData.dateInstalled && (
                  <div className="flex items-start">
                    <div className="w-20 text-xs text-gray-400">INSTALLED</div>
                    <div className="text-sm text-white">{new Date(currentBatteryData.dateInstalled).toLocaleDateString()}</div>
                  </div>
                )}
                {currentBatteryData.associatedBus && (
                  <div className="flex items-start">
                    <div className="w-20 text-xs text-gray-400">BUS</div>
                    <div className="text-sm text-white">{currentBatteryData.associatedBus}</div>
                  </div>
                )}
                {currentBatteryData.stateOfHealth && (
                  <div className="flex items-start">
                    <div className="w-20 text-xs text-gray-400">HEALTH</div>
                    <div className="text-sm text-white">{(currentBatteryData.stateOfHealth * 100).toFixed(0)}%</div>
                  </div>
                )}
                {currentBatteryData.timeRemaining !== null && currentBatteryData.timeRemaining !== undefined && (
                  <div className="flex items-start">
                    <div className="w-20 text-xs text-gray-400">REMAINING</div>
                    <div className="text-sm text-white">{(currentBatteryData.timeRemaining / 3600).toFixed(1)} hrs</div>
                  </div>
                )}
              </div>
              
              {/* Capacity information if available */}
              {(currentBatteryData.nominalCapacity || currentBatteryData.actualCapacity || currentBatteryData.remainingCapacity) && (
                <div className="mt-4">
                  <div className="text-gray-400 text-xs mb-2">CAPACITY</div>
                  <div className="grid grid-cols-3 gap-3">
                    {currentBatteryData.nominalCapacity && (
                      <div className="bg-oGray p-2 rounded-lg text-center">
                        <div className="text-xs text-gray-400">NOMINAL</div>
                        <div className="text-sm text-white">{(currentBatteryData.nominalCapacity / 3600).toFixed(1)} Wh</div>
                      </div>
                    )}
                    {currentBatteryData.actualCapacity && (
                      <div className="bg-oGray p-2 rounded-lg text-center">
                        <div className="text-xs text-gray-400">ACTUAL</div>
                        <div className="text-sm text-white">{(currentBatteryData.actualCapacity / 3600).toFixed(1)} Wh</div>
                      </div>
                    )}
                    {currentBatteryData.remainingCapacity && (
                      <div className="bg-oGray p-2 rounded-lg text-center">
                        <div className="text-xs text-gray-400">REMAINING</div>
                        <div className="text-sm text-white">{(currentBatteryData.remainingCapacity / 3600).toFixed(1)} Wh</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Lifetime statistics if available */}
              {(currentBatteryData.lifetimeDischarge || currentBatteryData.lifetimeRecharge) && (
                <div className="mt-4">
                  <div className="text-gray-400 text-xs mb-2">LIFETIME STATISTICS</div>
                  <div className="grid grid-cols-2 gap-3">
                    {currentBatteryData.lifetimeDischarge && (
                      <div className="bg-oGray p-2 rounded-lg">
                        <div className="text-xs text-gray-400">DISCHARGE</div>
                        <div className="text-sm text-white">{(currentBatteryData.lifetimeDischarge / 3600).toFixed(0)} Ah</div>
                      </div>
                    )}
                    {currentBatteryData.lifetimeRecharge && (
                      <div className="bg-oGray p-2 rounded-lg">
                        <div className="text-xs text-gray-400">RECHARGE</div>
                        <div className="text-sm text-white">{(currentBatteryData.lifetimeRecharge / 3600).toFixed(0)} Ah</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex-1 flex flex-col justify-between">
            {/* Battery percentage and graph visualization */}
            <div className="relative bg-oGray2 rounded-lg p-4 mb-6">
              <div className="mb-2 flex justify-between items-center">
                <div>
                  <span className="text-gray-400 text-sm">BATTERY PERCENTAGE</span>
                </div>
                <div className={`px-3 py-1 rounded-lg text-sm ${isCharging ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                  <FontAwesomeIcon icon={isCharging ? faChargingStation : faBatteryFull} className="mr-2" />
                  {isCharging ? 'Charging' : 'Discharging'}
                </div>
              </div>
              
              {/* Battery Progress Bar with color gradient */}
              <div className="h-24 relative mt-4 flex flex-col justify-between">
                {/* State of charge & discharge limit info */}
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>State of Charge</span>
                  {currentBatteryData.dischargeLimit && (
                    <span>Discharge Limit: {(currentBatteryData.dischargeLimit * 100).toFixed(0)}%</span>
                  )}
                </div>
                
                {/* Main progress bar container */}
                <div className="h-10 bg-oGray relative rounded-lg overflow-hidden">
                  {/* Background gradient representing full range */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-20"></div>
                  
                  {/* Discharge limit marker if available */}
                  {currentBatteryData.dischargeLimit && (
                    <div className="absolute h-full border-r-2 border-yellow-500 border-dashed" 
                         style={{left: `${currentBatteryData.dischargeLimit * 100}%`}}>
                      <div className="absolute -right-1 top-0 w-2 h-2 bg-yellow-500 rounded-full"></div>
                    </div>
                  )}
                  
                  {/* Actual battery level progress bar */}
                  <div 
                    className={`h-full ${isCharging ? 'bg-gradient-to-r from-green-600 to-green-400' : 'bg-gradient-to-r from-orange-500 via-yellow-400 to-green-500'}`}
                    style={{width: `${currentBatteryData.stateOfCharge}%`}}
                  >
                    {/* Current position marker */}
                    <div className="absolute top-0 h-full border-r-2 border-white" 
                         style={{left: `${currentBatteryData.stateOfCharge}%`}}>
                      <div className="absolute -right-1 top-0 w-2 h-2 bg-white rounded-full"></div>
                      <div className="absolute -right-6 -top-6 bg-oGray2 px-1 py-0.5 rounded text-xs text-white">
                        {currentBatteryData.stateOfCharge.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Time remaining information */}
                <div className="flex justify-between mt-2">
                  <div className="text-xs text-white flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                    Empty
                  </div>
                  
                  <div className="text-xs text-white bg-oGray2 px-2 py-1 rounded">
                    {isCharging 
                      ? 'Charging' 
                      : currentBatteryData.timeRemaining 
                        ? `Time remaining: ${(currentBatteryData.timeRemaining / 3600).toFixed(1)} h` 
                        : `Est. time: ${(currentBatteryData.stateOfCharge / (currentBatteryData.current / 100)).toFixed(1)} h`
                    }
                  </div>
                  
                  <div className="text-xs text-white flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                    Full
                  </div>
                </div>
              </div>
            </div>
                        {/* Consumption metrics - Boat-specific */}
            <div className="bg-oGray2 rounded-lg p-4">
              <div className="text-gray-400 text-sm font-medium mb-2">POWER CONSUMPTION</div>
              
              {/* Autopilot consumption */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faMicrochip} className="text-gray-400 mr-2" />
                    <span className="text-white">Autopilot</span>
                    {currentBatteryData.autopilotState && 
                      <span className="ml-2 px-1.5 py-0.5 bg-green-900 text-green-400 text-xs rounded">Active</span>
                    }
                  </div>
                  <div className="text-sm text-white font-bold">
                    {currentBatteryData.autopilotState ? 
                      (currentBatteryData.current * 0.4).toFixed(1) : 
                      "0.0"}%
                  </div>
                </div>
                <div className="h-2 bg-oGray rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{width: `${currentBatteryData.autopilotState ? Math.min(80, currentBatteryData.current * 0.8) : 0}%`}}
                  ></div>
                </div>
              </div>
              
              {/* Navigation instruments consumption */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faGaugeHigh} className="text-gray-400 mr-2" />
                    <span className="text-white">Navigation Instruments</span>
                  </div>
                  <div className="text-sm text-white font-bold">
                    {(currentBatteryData.current * 0.3).toFixed(1)}%
                  </div>
                </div>
                <div className="h-2 bg-oGray rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500" 
                    style={{width: `${Math.min(60, currentBatteryData.current * 0.6)}%`}}
                  ></div>
                </div>
              </div>
              
              {/* Lighting consumption */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faBolt} className="text-gray-400 mr-2" />
                    <span className="text-white">Navigation Lights</span>
                    {currentBatteryData.navigationLightsOn && 
                      <span className="ml-2 px-1.5 py-0.5 bg-green-900 text-green-400 text-xs rounded">On</span>
                    }
                  </div>
                  <div className="text-sm text-white font-bold">
                    {(currentBatteryData.navigationLightsOn ? 0.2 : 0).toFixed(1)}%
                  </div>
                </div>
                <div className="h-2 bg-oGray rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500" 
                    style={{width: `${(currentBatteryData.navigationLightsOn ? 15 : 0)}%`}}
                  ></div>
                </div>
              </div>
              
              {/* Battery temperature effect */}
              {hasTemperatureData && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faTemperatureHalf} className="text-gray-400 mr-2" />
                      <span className="text-white">Battery Temperature</span>
                    </div>
                    <div className="text-sm text-white font-bold">
                      {(currentBatteryData.temperature * 0.01).toFixed(1)}%
                    </div>
                  </div>
                  <div className="h-2 bg-oGray rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500" 
                      style={{width: `${Math.min(30, currentBatteryData.temperature * 0.5)}%`}}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Marine-specific power tips */}
              <div className="mt-8 rightPaneBg bg-opacity-50 p-3 rounded-lg text-sm">
                <div className="text-white font-medium mb-2">MARINE POWER SAVING TIPS</div>
                <div className="flex items-center text-green-400 mb-1">
                  <FontAwesomeIcon icon={faBolt} className="mr-2" />
                  <span>Turn off navigation lights during daylight to save ~{(currentBatteryData.voltage * 0.8).toFixed(1)} W</span>
                </div>
                <div className="flex items-center text-green-400 mb-1">
                  <FontAwesomeIcon icon={faMicrochip} className="mr-2" />
                  <span>Use wind vane steering when possible instead of autopilot</span>
                </div>
                <div className="flex items-center text-amber-400">
                  <FontAwesomeIcon icon={faGaugeHigh} className="mr-2" />
                  <span>Current power usage: {(currentBatteryData.voltage * currentBatteryData.current).toFixed(1)} W</span>
                </div>
              </div>
            </div>
            
            {/* Technical stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 text-center">
              <div className="bg-oGray2 p-3 rounded-lg">
                <div className="text-xs text-gray-400">VOLTAGE</div>
                <div className="text-lg font-bold text-white">{currentBatteryData.voltage.toFixed(1)}V</div>
                {currentBatteryData.voltageRipple && (
                  <div className="text-xs text-gray-400 mt-1">Ripple: {currentBatteryData.voltageRipple.toFixed(2)}V</div>
                )}
              </div>
              <div className="bg-oGray2 p-3 rounded-lg">
                <div className="text-xs text-gray-400">CURRENT</div>
                <div className="text-lg font-bold text-white">{currentBatteryData.current.toFixed(1)}A</div>
              </div>
              <div className="bg-oGray2 p-3 rounded-lg">
                <div className="text-xs text-gray-400">POWER</div>
                <div className="text-lg font-bold text-white">{(currentBatteryData.voltage * currentBatteryData.current).toFixed(0)}W</div>
              </div>
            </div>
            

          </div>
        </div>
        )}

        {/* Battery Graph Tab - Consumption details */}
        {activeTab === 'graph' && (
        <div className="p-4 flex flex-col flex-1 min-h-0 rightPaneBg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              Consumption Graph
            </h2>
            <div className="flex space-x-2 bg-oGray2 rounded-lg overflow-hidden p-1">
              <button 
                className={`px-3 py-1 rounded text-sm transition-all ${activeView === 'voltage' ? 'bg-oGray text-white' : 'text-gray-400'}`}
                onClick={() => setActiveView('voltage')}
              >
                Voltage
              </button>
              <button 
                className={`px-3 py-1 rounded text-sm transition-all ${activeView === 'current' ? 'bg-oGray text-white' : 'text-gray-400'}`}
                onClick={() => setActiveView('current')}
              >
                Current
              </button>
              <button 
                className={`px-3 py-1 rounded text-sm transition-all ${activeView === 'soc' ? 'bg-oGray text-white' : 'text-gray-400'}`}
                onClick={() => setActiveView('soc')}
              >
                SoC %
              </button>
              {hasTemperatureData && (
                <button 
                  className={`px-3 py-1 rounded text-sm transition-all ${activeView === 'temperature' ? 'bg-oGray text-white' : 'text-gray-400'}`}
                  onClick={() => setActiveView('temperature')}
                >
                  Temp
                </button>
              )}
            </div>
          </div>
          
          {/* Graph section with area background */}
          <div className="bg-oGray2 rounded-lg p-4 mb-6">
            <div className="h-72 relative px-4 pb-6 pt-2 overflow-hidden">
              {activeView === 'voltage' && (
                <LineChart 
                  data={batteryData} 
                  dataKey="voltage" 
                  color="#3b82f6" // blue-500
                  scale={batteryScales.voltage}
                  label="Voltage"
                  unit="V"
                  showPoints
                  fillGradient
                />
              )}
              {activeView === 'current' && (
                <LineChart 
                  data={batteryData} 
                  dataKey="current" 
                  color="#ef4444" // red-500
                  scale={batteryScales.current}
                  label="Current"
                  unit="A"
                  showPoints
                  fillGradient
                />
              )}
              {activeView === 'soc' && (
                <LineChart 
                  data={batteryData} 
                  dataKey="stateOfCharge" 
                  color="#22c55e" // green-500
                  scale={batteryScales.soc}
                  label="State of Charge"
                  unit="%"
                  showPoints
                  fillGradient
                />
              )}
              {activeView === 'temperature' && hasTemperatureData && (
                <LineChart 
                  data={batteryData} 
                  dataKey="temperature" 
                  color="#f97316" // orange-500
                  scale={batteryScales.temperature}
                  label="Temperature"
                  unit="°C"
                  showPoints
                  fillGradient
                />
              )}
            </div>
          </div>
          
          {/* Consumption metrics breakdown */}
          <div className="bg-oGray2 rounded-lg p-4">
            <div className="text-gray-400 text-sm font-medium mb-4">DETAILED CONSUMPTION BREAKDOWN</div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-400">REAL/NOMINAL</div>
                    <div className="text-lg font-bold text-white">
                      {(() => {
                        // Calculate the real to nominal ratio
                        const nominalCapacity = currentBatteryData.nominalCapacity;
                        const actualCapacity = currentBatteryData.actualCapacity;
                        const stateOfHealth = currentBatteryData.stateOfHealth;
                        
                        if (nominalCapacity && actualCapacity) {
                          // Calculate percentage difference between actual and nominal capacity
                          const difference = ((actualCapacity / nominalCapacity) - 1) * 100;
                          return `${difference.toFixed(1)}%`;
                        } else if (stateOfHealth) {
                          // If we have state of health, use it (typically 0-100%)
                          // SOH of 100% means no degradation, so difference is 0%
                          const difference = stateOfHealth - 100;
                          return `${difference.toFixed(1)}%`;
                        }
                        
                        // Fallback value if no data is available
                        return "-0.9%";
                      })()}
                    </div>
                  </div>
                  <div className="w-1/2">
                    <div className="h-2 bg-oGray rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500" 
                        style={{
                          width: (() => {
                            const nominalCapacity = currentBatteryData.nominalCapacity;
                            const actualCapacity = currentBatteryData.actualCapacity;
                            const stateOfHealth = currentBatteryData.stateOfHealth;
                            
                            if (nominalCapacity && actualCapacity) {
                              // Set progress bar width based on actual/nominal ratio (0-100%)
                              return `${Math.min(100, Math.max(0, (actualCapacity / nominalCapacity) * 100))}%`;
                            } else if (stateOfHealth) {
                              // Use state of health for the progress bar
                              return `${Math.min(100, Math.max(0, stateOfHealth))}%`;
                            }
                            
                            // Default fallback width
                            return '20%';
                          })()
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-400">AVERAGE CONSUMPTION</div>
                    <div className="text-lg font-bold text-white">
                      {(currentBatteryData.voltage * currentBatteryData.current / 1000).toFixed(1)} kWh/hour
                    </div>
                  </div>
                  <div className="w-1/2">
                    <div className="h-2 bg-oGray rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{width: '35%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-l-4 border-orange-500 pl-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-400">TEMPERATURE IMPACT</div>
                    <div className="text-lg font-bold text-white">
                      {hasTemperatureData ? `${(currentBatteryData.temperature * 0.05).toFixed(1)}%` : '0.0%'}
                    </div>
                  </div>
                  <div className="w-1/2">
                    <div className="h-2 bg-oGray rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500" 
                        style={{width: hasTemperatureData ? `${Math.min(50, currentBatteryData.temperature)}%` : '10%'}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
        
        {/* Performance Metrics Tab */}
        {activeTab === 'performance' && (
        <div className="p-4 flex flex-col flex-1 min-h-0 rightPaneBg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              Performance Metrics
            </h2>
            <div className="flex space-x-2 bg-oGray2 rounded-lg overflow-hidden p-1">
              <button 
                className={`px-3 py-1 rounded text-sm transition-all ${activePerformanceView === 'fps' ? 'bg-oGray text-white' : 'text-gray-400'}`}
                onClick={() => setActivePerformanceView('fps')}
              >
                FPS
              </button>
              <button 
                className={`px-3 py-1 rounded text-sm transition-all ${activePerformanceView === 'drawCalls' ? 'bg-oGray text-white' : 'text-gray-400'}`}
                onClick={() => setActivePerformanceView('drawCalls')}
              >
                Calls
              </button>
              <button 
                className={`px-3 py-1 rounded text-sm transition-all ${activePerformanceView === 'triangles' ? 'bg-oGray text-white' : 'text-gray-400'}`}
                onClick={() => setActivePerformanceView('triangles')}
              >
                Triangles
              </button>
              <button 
                className={`px-3 py-1 rounded text-sm transition-all ${activePerformanceView === 'memory' ? 'bg-oGray text-white' : 'text-gray-400'}`}
                onClick={() => setActivePerformanceView('memory')}
              >
                Memory
              </button>
            </div>
          </div>
          
          {/* Graph section with area background */}
          <div className="bg-oGray2 rounded-lg p-4 mb-6">
            <div className="h-72 relative px-4 pb-6 pt-2 overflow-hidden rounded-lg">
              {activePerformanceView === 'fps' && (
                <LineChart 
                  data={performanceData} 
                  dataKey="fps" 
                  color="#06b6d4" // cyan-500
                  scale={performanceScales.fps}
                  label="FPS"
                  unit=""
                  showPoints
                  fillGradient
                />
              )}
              {activePerformanceView === 'drawCalls' && (
                <LineChart 
                  data={performanceData} 
                  dataKey="drawCalls" 
                  color="#8b5cf6" // purple-500
                  scale={performanceScales.drawCalls}
                  label="Draw Calls"
                  unit=""
                  showPoints
                  fillGradient
                />
              )}
              {activePerformanceView === 'triangles' && (
                <LineChart 
                  data={performanceData} 
                  dataKey="triangles" 
                  color="#6366f1" // indigo-500
                  scale={performanceScales.triangles}
                  label="Triangles"
                  unit=""
                  showPoints
                  fillGradient
                />
              )}
              {activePerformanceView === 'memory' && (
                <LineChart 
                  data={performanceData} 
                  dataKey="memory" 
                  color="#10b981" // emerald-500
                  scale={performanceScales.memory}
                  label="Memory"
                  unit=" MB"
                  showPoints
                  fillGradient
                />
              )}
            </div>
          </div>
          
          {/* Performance metrics dashboard */}
          <div className="bg-oGray2 rounded-lg p-4">
            <div className="text-gray-400 text-sm font-medium mb-4">HARDWARE PERFORMANCE STATS</div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="border-l-4 border-cyan-500 pl-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-400">CURRENT FPS</div>
                    <div className="text-lg font-bold text-white">
                      {performanceData[performanceData.length - 1].fps.toFixed(1)}
                    </div>
                  </div>
                  <div className="w-1/2">
                    <div className="h-2 bg-oGray rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-500" 
                        style={{width: `${Math.min(100, performanceData[performanceData.length - 1].fps / 60 * 100)}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-400">FRAME TIME</div>
                    <div className="text-lg font-bold text-white">
                      {performanceData[performanceData.length - 1].ms.toFixed(1)} ms
                    </div>
                  </div>
                  <div className="w-1/2">
                    <div className="h-2 bg-oGray rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500" 
                        style={{width: `${Math.min(100, 100 - performanceData[performanceData.length - 1].ms / 33.33 * 100)}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="rightPaneBg bg-opacity-50 p-3 rounded-lg text-center">
                <div className="text-xs text-gray-400">DRAW CALLS</div>
                <div className="text-lg font-bold text-white">
                  {performanceData[performanceData.length - 1].drawCalls}
                </div>
              </div>
              <div className="rightPaneBg bg-opacity-50 p-3 rounded-lg text-center">
                <div className="text-xs text-gray-400">TRIANGLES</div>
                <div className="text-lg font-bold text-white">
                  {(performanceData[performanceData.length - 1].triangles / 1000).toFixed(1)}k
                </div>
              </div>
              <div className="rightPaneBg bg-opacity-50 p-3 rounded-lg text-center">
                <div className="text-xs text-gray-400">MEMORY</div>
                <div className="text-lg font-bold text-white">
                  {performanceData[performanceData.length - 1].memory} MB
                </div>
              </div>
            </div>
            
            {/* System info */}
            <div className="mt-6 rightPaneBg bg-opacity-50 p-3 rounded-lg text-sm">
              <div className="text-white font-medium mb-2">SYSTEM INFO</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center text-gray-300">
                  <FontAwesomeIcon icon={faMicrochip} className="mr-2 text-cyan-400" />
                  <span>GPU: WebGL Renderer</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <FontAwesomeIcon icon={faMemory} className="mr-2 text-green-400" />
                  <span>Textures: {performanceData[performanceData.length - 1].textures || 0}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <FontAwesomeIcon icon={faCube} className="mr-2 text-purple-400" />
                  <span>Geometries: {performanceData[performanceData.length - 1].geometries || 0}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <FontAwesomeIcon icon={faCode} className="mr-2 text-blue-400" />
                  <span>Three.js {THREE.REVISION}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default BatteryMonitor;