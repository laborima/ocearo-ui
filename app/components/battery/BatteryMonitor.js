import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useOcearoContext, convertTemperature } from '../context/OcearoContext';
import { useSignalKPaths } from '../hooks/useSignalK';
import { BATTERY_CONFIG, estimateStateOfCharge, getBatteryColorClass, isBatteryCharging } from '../utils/BatteryUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBolt, faBatteryFull, faChargingStation, faMicrochip, faCube, faMemory, faCode, faTemperatureHalf,
  faCar, faSnowflake, faArrowUp, faArrowDown, faLeaf, faChartLine, faGaugeHigh, faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence, motion } from 'framer-motion';

// Import extracted components
import LineChart from '../charts/LineChart';

import * as THREE from 'three';

const BatteryMonitor = () => {
  const { nightMode } = useOcearoContext();
  const [activeTab, setActiveTab] = useState('battery'); // battery, graph, performance
  const [activeView, setActiveView] = useState('voltage'); // voltage, current, soc
  const [activePerformanceView, setActivePerformanceView] = useState('fps'); // fps, drawCalls, triangles, memory
  const [selectedBattery, setSelectedBattery] = useState('1'); // Default to first battery
  const [showBatteryDetails, setShowBatteryDetails] = useState(false); // Control details popup

  // Subscribe to battery data paths
  const batteryPaths = useMemo(() => [
    `electrical.batteries.${selectedBattery}.voltage`,
    `electrical.batteries.${selectedBattery}.capacity.stateOfCharge`,
    `electrical.batteries.${selectedBattery}.current`,
    `electrical.batteries.${selectedBattery}.temperature`,
    `electrical.batteries.${selectedBattery}.chemistry`,
    `electrical.batteries.${selectedBattery}.name`,
    `electrical.batteries.${selectedBattery}.location`,
    `electrical.batteries.${selectedBattery}.dateInstalled`,
    `electrical.batteries.${selectedBattery}.manufacturer.name`,
    `electrical.batteries.${selectedBattery}.manufacturer.model`,
    `electrical.batteries.${selectedBattery}.manufacturer.URL`,
    `electrical.batteries.${selectedBattery}.associatedBus`,
    `electrical.batteries.${selectedBattery}.voltage.ripple`,
    `electrical.batteries.${selectedBattery}.capacity.nominal`,
    `electrical.batteries.${selectedBattery}.capacity.actual`,
    `electrical.batteries.${selectedBattery}.capacity.remaining`,
    `electrical.batteries.${selectedBattery}.capacity.dischargeLimit`,
    `electrical.batteries.${selectedBattery}.capacity.stateOfHealth`,
    `electrical.batteries.${selectedBattery}.capacity.dischargeSinceFull`,
    `electrical.batteries.${selectedBattery}.capacity.timeRemaining`,
    `electrical.batteries.${selectedBattery}.lifetimeDischarge`,
    `electrical.batteries.${selectedBattery}.lifetimeRecharge`,
    'steering.autopilot.state',
    'navigation.lights'
  ], [selectedBattery]);

  const batteryValues = useSignalKPaths(batteryPaths);

  // Process current battery data
  const currentBatteryData = useMemo(() => {
    const voltage = batteryValues[`electrical.batteries.${selectedBattery}.voltage`] || 12;
    const current = batteryValues[`electrical.batteries.${selectedBattery}.current`] || 0;
    const stateOfCharge = batteryValues[`electrical.batteries.${selectedBattery}.capacity.stateOfCharge`];
    const temperatureKelvin = batteryValues[`electrical.batteries.${selectedBattery}.temperature`];
    
    return {
      voltage,
      current,
      stateOfCharge: (stateOfCharge !== null && stateOfCharge !== undefined) ? (stateOfCharge * 100) : estimateStateOfCharge(voltage),
      power: voltage * current,
      temperature: temperatureKelvin !== null ? convertTemperature(temperatureKelvin) : null,
      chemistry: batteryValues[`electrical.batteries.${selectedBattery}.chemistry`],
      name: batteryValues[`electrical.batteries.${selectedBattery}.name`],
      location: batteryValues[`electrical.batteries.${selectedBattery}.location`],
      dateInstalled: batteryValues[`electrical.batteries.${selectedBattery}.dateInstalled`],
      manufacturer: batteryValues[`electrical.batteries.${selectedBattery}.manufacturer.name`],
      model: batteryValues[`electrical.batteries.${selectedBattery}.manufacturer.model`],
      manufacturerURL: batteryValues[`electrical.batteries.${selectedBattery}.manufacturer.URL`],
      associatedBus: batteryValues[`electrical.batteries.${selectedBattery}.associatedBus`],
      voltageRipple: batteryValues[`electrical.batteries.${selectedBattery}.voltage.ripple`],
      nominalCapacity: batteryValues[`electrical.batteries.${selectedBattery}.capacity.nominal`],
      actualCapacity: batteryValues[`electrical.batteries.${selectedBattery}.capacity.actual`],
      remainingCapacity: batteryValues[`electrical.batteries.${selectedBattery}.capacity.remaining`],
      dischargeLimit: batteryValues[`electrical.batteries.${selectedBattery}.capacity.dischargeLimit`],
      stateOfHealth: batteryValues[`electrical.batteries.${selectedBattery}.capacity.stateOfHealth`],
      dischargeSinceFull: batteryValues[`electrical.batteries.${selectedBattery}.capacity.dischargeSinceFull`],
      timeRemaining: batteryValues[`electrical.batteries.${selectedBattery}.capacity.timeRemaining`],
      lifetimeDischarge: batteryValues[`electrical.batteries.${selectedBattery}.lifetimeDischarge`],
      lifetimeRecharge: batteryValues[`electrical.batteries.${selectedBattery}.lifetimeRecharge`],
      autopilotState: batteryValues['steering.autopilot.state'] === 'auto',
      navigationLightsOn: batteryValues['navigation.lights'] || false,
    };
  }, [batteryValues, selectedBattery]);

  // Performance monitoring refs
  const prevTimeRef = useRef(performance.now());
  const framesRef = useRef(0);
  const rendererRef = useRef(null);

  // Graph history state
  const [batteryHistory, setBatteryHistory] = useState(() => 
    Array(60).fill(null).map(() => ({ 
      voltage: 12, 
      current: 0, 
      stateOfCharge: 100, 
      temperature: null, 
      time: new Date().toLocaleTimeString() 
    }))
  );
  
  const [performanceHistory, setPerformanceHistory] = useState(() => {
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

  // Find Three.js renderer
  useEffect(() => {
    if (window.__OCEARO_RENDERER) {
      rendererRef.current = window.__OCEARO_RENDERER;
    }
  }, []);

  // Update performance stats and battery history every second
  useEffect(() => {
    let intervalId;
    
    const updateStats = () => {
      framesRef.current++;
      const time = performance.now();
      
      if (time >= prevTimeRef.current + 1000) {
        const fps = (framesRef.current * 1000) / (time - prevTimeRef.current);
        const avgFrameTime = fps > 0 ? 1000 / fps : 0;
        const timeStr = new Date().toLocaleTimeString();
        
        let drawCalls = 0, triangles = 0, geometries = 0, textures = 0, memory = 0;
        
        if (window.performance && window.performance.memory) {
          memory = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
        }
        
        const info = rendererRef.current?.info || window.__OCEARO_RENDER_INFO;
        if (info) {
          drawCalls = info.render?.calls || 0;
          triangles = info.render?.triangles || 0;
          geometries = info.memory?.geometries || 0;
          textures = info.memory?.textures || 0;
        }

        setPerformanceHistory(prev => [...prev.slice(1), {
          time: timeStr, fps, ms: avgFrameTime, drawCalls, triangles, geometries, textures, memory
        }]);

        setBatteryHistory(prev => [...prev.slice(1), {
          ...currentBatteryData, time: timeStr
        }]);

        prevTimeRef.current = time;
        framesRef.current = 0;
      }
      
      intervalId = setTimeout(updateStats, 1000);
    };

    updateStats();
    return () => clearTimeout(intervalId);
  }, [currentBatteryData]);

  const [availableBatteries] = useState([{ id: '1', name: 'House Battery' }, { id: '0', name: 'Starter Battery' }]);

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
          <FontAwesomeIcon icon={faLeaf} className="mr-2" /> Energy
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center transition-all ${
            activeTab === 'graph'
              ? 'text-green-500 border-b-2 border-green-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <FontAwesomeIcon icon={faChartLine} className="mr-2" /> Consumption
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center transition-all ${
            activeTab === 'performance'
              ? 'text-green-500 border-b-2 border-green-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <FontAwesomeIcon icon={faGaugeHigh} className="mr-2" /> Performance
        </button>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === 'battery' && (
            <motion.div 
              key="battery"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-4 flex flex-col flex-1 min-h-0 rightPaneBg"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center">
                  Battery information {currentBatteryData.stateOfCharge.toFixed(0)}%
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
              
              <AnimatePresence>
                {showBatteryDetails && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-oGray2 p-4 rounded-lg mb-6 relative overflow-hidden"
                  >
                    <button 
                      className="absolute top-2 right-2 text-gray-400 hover:text-white"
                      onClick={() => setShowBatteryDetails(false)}
                      aria-label="Close details"
                    >
                      ×
                    </button>
                    <div className="text-gray-400 text-sm font-medium mb-4 uppercase">Battery Details</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start">
                        <div className="w-24 text-xs text-gray-400 uppercase">Name</div>
                        <div className="text-sm text-white">{currentBatteryData.name || 'N/A'}</div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-24 text-xs text-gray-400 uppercase">Chemistry</div>
                        <div className="text-sm text-white">{currentBatteryData.chemistry || 'N/A'}</div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-24 text-xs text-gray-400 uppercase">Manufacturer</div>
                        <div className="text-sm text-white">{currentBatteryData.manufacturer || 'N/A'}</div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-24 text-xs text-gray-400 uppercase">Location</div>
                        <div className="text-sm text-white">{currentBatteryData.location || 'N/A'}</div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-24 text-xs text-gray-400 uppercase">Bus</div>
                        <div className="text-sm text-white">{currentBatteryData.associatedBus || 'N/A'}</div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-24 text-xs text-gray-400 uppercase">Health</div>
                        <div className="text-sm text-white">{currentBatteryData.stateOfHealth ? `${(currentBatteryData.stateOfHealth * 100).toFixed(0)}%` : 'N/A'}</div>
                      </div>
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
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex-1 flex flex-col justify-between">
                <div className="relative bg-oGray2 rounded-lg p-4 mb-6">
                  <div className="mb-2 flex justify-between items-center">
                    <span className="text-gray-400 text-sm">BATTERY PERCENTAGE</span>
                    <div className={`px-3 py-1 rounded-lg text-sm ${isCharging ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                      <FontAwesomeIcon icon={isCharging ? faChargingStation : faBatteryFull} className="mr-2" />
                      {isCharging ? 'Charging' : 'Discharging'}
                    </div>
                  </div>
                  
                  <div className="h-24 relative mt-4 flex flex-col justify-between">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>State of Charge</span>
                      {currentBatteryData.dischargeLimit && (
                        <span>Discharge Limit: {(currentBatteryData.dischargeLimit * 100).toFixed(0)}%</span>
                      )}
                    </div>
                    
                    <div className="h-10 bg-oGray relative rounded-lg overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-20"></div>
                      
                      {/* Discharge limit marker if available */}
                      {currentBatteryData.dischargeLimit && (
                        <div className="absolute h-full border-r-2 border-yellow-500 border-dashed" 
                             style={{left: `${currentBatteryData.dischargeLimit * 100}%`}}>
                          <div className="absolute -right-1 top-0 w-2 h-2 bg-yellow-500 rounded-full"></div>
                        </div>
                      )}
                      
                      <div 
                        className={`h-full ${isCharging ? 'bg-gradient-to-r from-green-600 to-green-400' : 'bg-gradient-to-r from-orange-500 via-yellow-400 to-green-500'}`}
                        style={{width: `${currentBatteryData.stateOfCharge}%`}}
                      />
                      <div className="absolute top-0 h-full border-r-2 border-white" style={{left: `${currentBatteryData.stateOfCharge}%`}}>
                        <div className="absolute -right-1 top-0 w-2 h-2 bg-white rounded-full"></div>
                        <div className="absolute -right-6 -top-6 bg-oGray2 px-1 py-0.5 rounded text-xs text-white">
                          {currentBatteryData.stateOfCharge.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-2">
                      <div className="text-xs text-white flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div> Empty
                      </div>
                      <div className="text-xs text-white bg-oGray2 px-2 py-1 rounded">
                        {isCharging 
                          ? 'Charging' 
                          : currentBatteryData.timeRemaining 
                            ? `Time remaining: ${(currentBatteryData.timeRemaining / 3600).toFixed(1)} h` 
                            : `Est. time: ${(currentBatteryData.stateOfCharge / (Math.abs(currentBatteryData.current) / 100 || 1)).toFixed(1)} h`}
                      </div>
                      <div className="text-xs text-white flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div> Full
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-oGray2 rounded-lg p-4">
                  <div className="text-gray-400 text-sm font-medium mb-2">POWER CONSUMPTION</div>
                  
                  {/* Autopilot consumption */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={faMicrochip} className="text-gray-400 mr-2" />
                        <span className="text-white">Autopilot</span>
                        {currentBatteryData.autopilotState && <span className="ml-2 px-1.5 py-0.5 bg-green-900 text-green-400 text-xs rounded">Active</span>}
                      </div>
                      <div className="text-sm text-white font-bold">
                        {currentBatteryData.autopilotState ? (Math.abs(currentBatteryData.current) * 0.4).toFixed(1) : "0.0"}%
                      </div>
                    </div>
                    <div className="h-2 bg-oGray rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{width: `${currentBatteryData.autopilotState ? Math.min(80, Math.abs(currentBatteryData.current) * 0.8) : 0}%`}}
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
                        {(Math.abs(currentBatteryData.current) * 0.3).toFixed(1)}%
                      </div>
                    </div>
                    <div className="h-2 bg-oGray rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-500" 
                        style={{width: `${Math.min(60, Math.abs(currentBatteryData.current) * 0.6)}%`}}
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
            </motion.div>
          )}

          {activeTab === 'graph' && (
            <motion.div 
              key="graph"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-4 flex flex-col flex-1 min-h-0 rightPaneBg"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Consumption Graph</h2>
                <div className="flex space-x-2 bg-oGray2 rounded-lg overflow-hidden p-1">
                  {['voltage', 'current', 'soc', 'temperature'].map((view) => (
                    (view !== 'temperature' || hasTemperatureData) && (
                      <button 
                        key={view}
                        className={`px-3 py-1 rounded text-sm transition-all ${activeView === view ? 'bg-oGray text-white' : 'text-gray-400'}`}
                        onClick={() => setActiveView(view)}
                      >
                        {view.charAt(0).toUpperCase() + view.slice(1)}
                      </button>
                    )
                  ))}
                </div>
              </div>
              
              <div className="bg-oGray2 rounded-lg p-4 mb-6 flex-1 min-h-[300px]">
                <div className="h-full relative overflow-hidden">
                  <LineChart 
                    data={batteryHistory} 
                    dataKey={activeView === 'soc' ? 'stateOfCharge' : activeView} 
                    color={activeView === 'voltage' ? "#3b82f6" : activeView === 'current' ? "#ef4444" : activeView === 'soc' ? "#22c55e" : "#f97316"}
                    scale={batteryScales[activeView]}
                    label={activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                    unit={activeView === 'voltage' ? "V" : activeView === 'current' ? "A" : activeView === 'soc' ? "%" : "°C"}
                    showPoints
                    fillGradient
                  />
                </div>
              </div>
            </motion.div>
          )}
          
          {activeTab === 'performance' && (
            <motion.div 
              key="performance"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-4 flex flex-col flex-1 min-h-0 rightPaneBg"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Performance Metrics</h2>
                <div className="flex space-x-2 bg-oGray2 rounded-lg overflow-hidden p-1">
                  {['fps', 'drawCalls', 'triangles', 'memory'].map((view) => (
                    <button 
                      key={view}
                      className={`px-3 py-1 rounded text-sm transition-all ${activePerformanceView === view ? 'bg-oGray text-white' : 'text-gray-400'}`}
                      onClick={() => setActivePerformanceView(view)}
                    >
                      {view === 'drawCalls' ? 'Calls' : view.charAt(0).toUpperCase() + view.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-oGray2 rounded-lg p-4 mb-6 flex-1 min-h-[300px]">
                <div className="h-full relative overflow-hidden rounded-lg">
                  <LineChart 
                    data={performanceHistory} 
                    dataKey={activePerformanceView} 
                    color={activePerformanceView === 'fps' ? "#06b6d4" : activePerformanceView === 'drawCalls' ? "#8b5cf6" : activePerformanceView === 'triangles' ? "#6366f1" : "#10b981"}
                    scale={performanceScales[activePerformanceView]}
                    label={activePerformanceView.charAt(0).toUpperCase() + activePerformanceView.slice(1)}
                    unit={activePerformanceView === 'memory' ? " MB" : ""}
                    showPoints
                    fillGradient
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-oGray2 p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-400 uppercase mb-1">Current FPS</div>
                  <div className="text-xl font-bold text-cyan-400">
                    {performanceHistory[performanceHistory.length - 1].fps.toFixed(1)}
                  </div>
                </div>
                <div className="bg-oGray2 p-4 rounded-lg border border-gray-800">
                  <div className="text-xs text-gray-400 uppercase mb-1">Memory Usage</div>
                  <div className="text-xl font-bold text-green-400">
                    {performanceHistory[performanceHistory.length - 1].memory} MB
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BatteryMonitor;