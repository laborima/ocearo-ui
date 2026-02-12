import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useOcearoContext, convertTemperature } from '../context/OcearoContext';
import { useSignalKPaths } from '../hooks/useSignalK';
import { BATTERY_CONFIG, estimateStateOfCharge, getBatteryColorClass, isBatteryCharging } from '../utils/BatteryUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBolt, faBatteryFull, faChargingStation, faMicrochip, faCube, faMemory, faCode, faTemperatureHalf,
  faCar, faSnowflake, faArrowUp, faArrowDown, faLeaf, faChartLine, faGaugeHigh, faQuestionCircle, faClock
} from '@fortawesome/free-solid-svg-icons';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Import extracted components
import LineChart from '../charts/LineChart';

import * as THREE from 'three';

const BatteryMonitor = () => {
  const { t } = useTranslation();
  const { nightMode } = useOcearoContext();
  const secondaryTextClass = nightMode ? 'text-oNight' : 'text-hud-secondary';
  const mutedTextClass = nightMode ? 'text-oNight/70' : 'text-hud-muted';
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
    const voltage = batteryValues[`electrical.batteries.${selectedBattery}.voltage`] ?? null;
    const current = batteryValues[`electrical.batteries.${selectedBattery}.current`] ?? 0;
    const stateOfCharge = batteryValues[`electrical.batteries.${selectedBattery}.capacity.stateOfCharge`];
    const temperatureKelvin = batteryValues[`electrical.batteries.${selectedBattery}.temperature`];
    
    return {
      voltage: voltage ?? 0,
      current,
      stateOfCharge: (stateOfCharge !== null && stateOfCharge !== undefined) ? (stateOfCharge * 100) : (voltage !== null ? estimateStateOfCharge(voltage) : 0),
      power: (voltage ?? 0) * current,
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

  const [availableBatteries] = useState([{ id: '1', nameKey: 'battery.houseBattery' }, { id: '0', nameKey: 'battery.starterBattery' }]);

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
    <div className="flex flex-col h-full bg-rightPaneBg overflow-hidden">
      {/* Tab Navigation - Tesla Style */}
      <div className="flex border-b border-hud bg-hud-bg">
        {[
          { id: 'battery', label: t('battery.energy'), icon: faLeaf },
          { id: 'graph', label: t('battery.usage'), icon: faChartLine },
          { id: 'performance', label: t('battery.perf'), icon: faGaugeHigh }
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
      
      <div className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === 'battery' && (
            <motion.div 
              key="battery"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="p-4 flex flex-col flex-1 min-h-0 overflow-auto scrollbar-hide"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-black text-hud-main uppercase tracking-[0.2em] flex items-center">
                  <div className="w-2 h-2 rounded-full bg-oGreen mr-3 animate-soft-pulse" />
                  {t('battery.powerGridStatus')}
                  <button 
                    className="ml-4 bg-hud-elevated rounded-full w-7 h-7 flex items-center justify-center text-hud-secondary tesla-hover focus:outline-none border border-hud shadow-soft"
                    onClick={() => setShowBatteryDetails(!showBatteryDetails)}
                    aria-label={t('battery.batteryDetails')}
                  >
                    <FontAwesomeIcon icon={faQuestionCircle} className="text-xs" />
                  </button>
                </h2>
                
                <select 
                  className="bg-hud-elevated px-4 py-1.5 rounded-sm text-hud-main text-xs font-black uppercase border border-hud focus:outline-none tesla-hover transition-all duration-500 shadow-soft"
                  value={selectedBattery}
                  onChange={(e) => setSelectedBattery(e.target.value)}
                >
                  {availableBatteries.map((battery) => (
                    <option key={battery.id} value={battery.id} className="bg-oNight">
                      {t(battery.nameKey)}
                    </option>
                  ))}
                </select>
              </div>
              
              <AnimatePresence>
                {showBatteryDetails && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="tesla-card p-4 mb-4 relative overflow-hidden bg-hud-elevated"
                  >
                    <button 
                      className="absolute top-2 right-3 text-hud-secondary hover:text-hud-main font-black text-xl"
                      onClick={() => setShowBatteryDetails(false)}
                      aria-label="Close details"
                    >
                      ×
                    </button>
                    <div className="text-hud-secondary text-xs font-black mb-4 uppercase tracking-widest">{t('battery.batterySpecs')}</div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: t('battery.identifier'), value: currentBatteryData.name },
                        { label: t('battery.chemistry'), value: currentBatteryData.chemistry },
                        { label: t('battery.manufacturer'), value: currentBatteryData.manufacturer },
                        { label: t('battery.position'), value: currentBatteryData.location },
                        { label: t('battery.busLink'), value: currentBatteryData.associatedBus },
                        { label: t('battery.condition'), value: currentBatteryData.stateOfHealth ? `${(currentBatteryData.stateOfHealth * 100).toFixed(0)}%` : null }
                      ].map((item, idx) => (
                        <div key={idx} className="flex flex-col">
                          <div className="text-xs text-hud-muted uppercase font-black tracking-widest mb-0.5">{item.label}</div>
                          <div className="text-xs text-hud-main font-black truncate uppercase gliding-value">{item.value || 'N/A'}</div>
                        </div>
                      ))}
                    </div>

                    {/* Capacity information if available */}
                    {(currentBatteryData.nominalCapacity || currentBatteryData.actualCapacity || currentBatteryData.remainingCapacity) && (
                      <div className="mt-4 pt-3 border-t border-hud">
                        <div className="text-hud-muted text-xs font-black mb-2 uppercase tracking-widest">{t('battery.energyCapacity')}</div>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: t('battery.nominal'), value: currentBatteryData.nominalCapacity },
                            { label: t('battery.actual'), value: currentBatteryData.actualCapacity },
                            { label: t('battery.remaining'), value: currentBatteryData.remainingCapacity }
                          ].map((cap, idx) => (
                            <div key={idx} className="bg-hud-bg p-2 rounded text-center tesla-hover">
                              <div className="text-xs text-hud-secondary uppercase font-black mb-1">{cap.label}</div>
                              <div className="text-xs text-hud-main font-black gliding-value">{cap.value ? `${(cap.value / 3600).toFixed(1)} Wh` : 'N/A'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex-1 flex flex-col space-y-4">
                <div className="relative tesla-card p-6 bg-hud-bg border border-hud">
                  <div className="mb-6 flex justify-between items-center">
                    <span className="text-hud-secondary text-xs font-black uppercase tracking-[0.2em] opacity-60">{t('battery.gridNodeStatus')}</span>
                    <div className={`px-3 py-1 rounded-sm text-xs font-black uppercase tracking-widest shadow-soft ${isCharging ? 'bg-oGreen/10 text-oGreen border border-oGreen/20 animate-soft-pulse' : 'bg-oRed/10 text-oRed border border-oRed/20'}`}>
                      {isCharging ? t('battery.systemInflow') : t('battery.systemOutflow')}
                    </div>
                  </div>
                  
                  <div className="h-24 relative mt-8 flex flex-col justify-between">
                    <div className="h-2 bg-hud-elevated relative rounded-full overflow-hidden shadow-inner">
                      <div className="absolute inset-0 bg-gradient-to-r from-oRed/10 via-oYellow/10 to-oGreen/10 opacity-30"></div>
                      
                      <div 
                        className={`h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${isCharging ? 'bg-gradient-to-r from-oGreen/60 to-oGreen shadow-[0_0_12px_var(--color-oGreen)]' : 'bg-gradient-to-r from-oRed/60 via-oYellow/60 to-oGreen/60 shadow-[0_0_12px_var(--color-oGreen)] shadow-opacity-30'}`}
                        style={{width: `${currentBatteryData.stateOfCharge}%`}}
                      />
                    </div>
                    {/* Floating indicator */}
                    <div 
                      className="absolute top-0 flex flex-col items-center transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)" 
                      style={{left: `clamp(10%, ${currentBatteryData.stateOfCharge}%, 90%)`, transform: 'translateX(-50%)', top: '-12px'}}
                    >
                      <div className="w-1 h-6 bg-hud-main shadow-[0_0_15px_var(--hud-text-main)] shadow-opacity-80 rounded-full"></div>
                      <div className="mt-8 text-lg font-black text-hud-main gliding-value tracking-tighter">{currentBatteryData.stateOfCharge.toFixed(0)}%</div>
                    </div>
                    
                    <div className="flex justify-between mt-12 text-xs font-black uppercase tracking-[0.2em]">
                      <div className="text-oRed opacity-40">{t('battery.criticalNode')}</div>
                      <div className="text-hud-main bg-hud-elevated px-4 py-1.5 rounded-sm flex items-center shadow-soft border border-hud">
                        <FontAwesomeIcon icon={isCharging ? faChargingStation : faClock} className="mr-3 text-xs text-oBlue opacity-60" />
                        <span className="gliding-value opacity-80 tracking-widest">
                          {isCharging 
                            ? t('battery.acquiringFullCharge') 
                            : currentBatteryData.timeRemaining 
                              ? t('battery.depletionIn', { hours: (currentBatteryData.timeRemaining / 3600).toFixed(1) }) 
                              : (currentBatteryData.voltage > 0 && Math.abs(currentBatteryData.current) > 0)
                                ? t('battery.endurance', { hours: (currentBatteryData.stateOfCharge / (Math.abs(currentBatteryData.current) / 100)).toFixed(1) })
                                : t('common.na')}
                        </span>
                      </div>
                      <div className="text-oGreen opacity-40">{t('battery.nominalGrid')}</div>
                    </div>
                  </div>
                </div>

                <div className="tesla-card p-6 flex-1 bg-hud-bg border border-hud">
                  <div className="text-hud-secondary text-xs font-black uppercase tracking-[0.2em] mb-8 flex items-center opacity-60">
                    <div className="w-1.5 h-1.5 rounded-full bg-oBlue mr-3" />
                    {t('battery.loadDistribution')}
                  </div>
                  
                  <div className="space-y-6">
                    {[
                      { icon: faMicrochip, label: t('battery.autopilotNode'), color: 'bg-oBlue', value: currentBatteryData.autopilotState ? (Math.abs(currentBatteryData.current) * 0.4) : 0, state: currentBatteryData.autopilotState },
                      { icon: faGaugeHigh, label: t('battery.telemetryArray'), color: 'bg-oGreen', value: (Math.abs(currentBatteryData.current) * 0.3), state: true }
                    ].map((load, idx) => (
                      <div key={idx} className="tesla-hover p-2 rounded-sm transition-all group">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center">
                            <FontAwesomeIcon icon={load.icon} className="text-hud-muted mr-3 text-xs opacity-50 group-hover:opacity-100 transition-opacity" />
                            <span className="text-hud-main text-xs font-black uppercase tracking-widest">{load.label}</span>
                            {load.state === 'auto' || load.state === true && load.label === 'Autopilot node' && (
                              <span className="ml-3 px-2 py-0.5 bg-oGreen/10 text-oGreen text-xs font-black uppercase rounded-sm animate-soft-pulse border border-oGreen/20">Sync</span>
                            )}
                          </div>
                          <div className="text-xs text-hud-main font-black gliding-value tracking-tighter">{load.value.toFixed(1)}%</div>
                        </div>
                        <div className="h-1 bg-hud-elevated rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full ${load.color} gliding-value opacity-60 group-hover:opacity-100 transition-all duration-700`} 
                            style={{width: `${Math.min(100, load.value * 2.5)}%`}}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-10">
                    {[
                      { label: t('battery.voltageNode'), value: `${currentBatteryData.voltage.toFixed(1)}V`, color: 'text-oBlue' },
                      { label: t('battery.amperageLoad'), value: `${currentBatteryData.current.toFixed(1)}A`, color: 'text-oYellow' },
                      { label: t('battery.gridOutput'), value: `${(currentBatteryData.voltage * currentBatteryData.current).toFixed(0)}W`, color: 'text-hud-main' }
                    ].map((stat, idx) => (
                      <div key={idx} className="bg-hud-elevated p-4 rounded-sm tesla-hover text-center border border-hud">
                        <div className="text-xs text-hud-muted uppercase font-black tracking-widest mb-2 opacity-60">{stat.label}</div>
                        <div className={`text-xl font-black gliding-value tracking-tighter ${stat.color}`}>{stat.value}</div>
                      </div>
                    ))}
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
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="p-4 flex flex-col flex-1 min-h-0"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-black text-hud-main uppercase tracking-[0.2em] flex items-center">
                  <div className="w-2 h-2 rounded-full bg-oBlue mr-3 animate-soft-pulse" />
                  {t('battery.telemetryHistory')}
                </h2>
                <div className="flex bg-hud-elevated rounded-sm p-1 border border-hud shadow-soft">
                  {['voltage', 'current', 'soc'].map((view) => (
                    <button
                      key={view}
                      onClick={() => setActiveView(view)}
                      className={`px-4 py-1 rounded-sm text-xs font-black uppercase transition-all duration-500 ${
                        activeView === view ? 'bg-oBlue text-hud-main shadow-lg shadow-oBlue/20' : 'text-hud-secondary hover:text-hud-main tesla-hover'
                      }`}
                    >
                      {view === 'soc' ? 'SOC %' : view}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 tesla-card p-6 min-h-[220px] bg-hud-bg border border-hud">
                <LineChart 
                  data={batteryHistory}
                  dataKey={activeView}
                  color={activeView === 'voltage' ? 'var(--color-oBlue)' : activeView === 'current' ? 'var(--color-oYellow)' : 'var(--color-oGreen)'}
                  unit={activeView === 'voltage' ? 'V' : activeView === 'current' ? 'A' : '%'}
                  scale={batteryScales[activeView]}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'performance' && (
            <motion.div 
              key="performance"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="p-4 flex flex-col flex-1 min-h-0 overflow-auto scrollbar-hide"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-black text-hud-main uppercase tracking-[0.2em] flex items-center">
                  <div className="w-2 h-2 rounded-full bg-oGreen mr-3 animate-soft-pulse" />
                  {t('battery.systemDiagnostic')}
                </h2>
                <div className="flex bg-hud-elevated rounded-sm p-1 border border-hud shadow-soft">
                  {['fps', 'ms', 'memory'].map((view) => (
                    <button
                      key={view}
                      onClick={() => setActivePerformanceView(view)}
                      className={`px-4 py-1 rounded-sm text-xs font-black uppercase transition-all duration-500 ${
                        activePerformanceView === view ? 'bg-oBlue text-hud-main shadow-lg shadow-oBlue/20' : 'text-hud-secondary hover:text-hud-main tesla-hover'
                      }`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 tesla-card p-6 min-h-[200px] mb-6 bg-hud-bg border border-hud">
                <LineChart 
                  data={performanceHistory}
                  dataKey={activePerformanceView}
                  color={'var(--color-oBlue)'}
                  unit={activePerformanceView === 'fps' ? '' : activePerformanceView === 'ms' ? 'ms' : 'MB'}
                  scale={performanceScales[activePerformanceView]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="tesla-card p-6 bg-hud-bg tesla-hover border border-hud">
                  <div className="text-xs text-hud-muted font-black uppercase mb-4 tracking-[0.2em] opacity-60">{t('battery.graphicsEngine')}</div>
                  <div className="flex justify-between items-center text-xs font-black text-hud-main uppercase mb-3">
                    <span className="text-hud-secondary tracking-widest">{t('battery.drawCalls')}</span>
                    <span className="gliding-value">{performanceHistory[performanceHistory.length-1].drawCalls}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-black text-hud-main uppercase">
                    <span className="text-hud-secondary tracking-widest">{t('battery.geometry')}</span>
                    <span className="gliding-value">{(performanceHistory[performanceHistory.length-1].triangles / 1000).toFixed(1)}k poly</span>
                  </div>
                </div>
                <div className="tesla-card p-6 bg-hud-bg tesla-hover border border-hud">
                  <div className="text-xs text-hud-muted font-black uppercase mb-4 tracking-[0.2em] opacity-60">{t('battery.memoryManagement')}</div>
                  <div className="flex justify-between items-center text-xs font-black text-hud-main uppercase mb-3">
                    <span className="text-hud-secondary tracking-widest">{t('battery.jsHeap')}</span>
                    <span className="gliding-value">{performanceHistory[performanceHistory.length-1].memory} MB</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-black text-hud-main uppercase">
                    <span className="text-hud-secondary tracking-widest">{t('battery.vramTextures')}</span>
                    <span className="gliding-value">{performanceHistory[performanceHistory.length-1].textures} units</span>
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