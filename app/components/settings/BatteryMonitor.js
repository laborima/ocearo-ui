import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOcearoContext, convertTemperature } from '../context/OcearoContext';
import { BATTERY_CONFIG, estimateStateOfCharge, getBatteryColorClass, isBatteryCharging } from '../utils/BatteryUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faBatteryFull, faChargingStation, faMicrochip, faCube, faMemory, faCode, faTemperatureHalf } from '@fortawesome/free-solid-svg-icons';
import * as THREE from 'three';

// Component for creating a line chart
const LineChart = ({ data, dataKey, color, scale, label, unit, showPoints = false, lineWidth = 0.5 }) => {
  const { nightMode } = useOcearoContext();
  
  // Filter out null/undefined values and find the actual min and max values
  const validValues = data.filter(item => item[dataKey] !== null && item[dataKey] !== undefined);
  
  // If there are no valid values, use the scale
  if (validValues.length === 0) {
    return <div className="flex items-center justify-center h-full">No data available</div>;
  }
  
  const dataMin = Math.min(...validValues.map(item => item[dataKey]));
  const dataMax = Math.max(...validValues.map(item => item[dataKey]));
  
  // Determine the effective min/max for scaling
  // Use a bit of padding (10%) for better visualization
  const padding = 0.1;
  const effectiveMin = Math.max(scale.min, dataMin - (dataMax - dataMin) * padding);
  const effectiveMax = Math.min(scale.max, dataMax + (dataMax - dataMin) * padding);
  
  // If data range is very small, use the scale
  const useAutoscale = (dataMax - dataMin) > (scale.max - scale.min) * 0.05;
  const displayMin = useAutoscale ? effectiveMin : scale.min;
  const displayMax = useAutoscale ? effectiveMax : scale.max;
  
  // Calculate the points for the chart with improved scaling
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    if (item[dataKey] === null || item[dataKey] === undefined) {
      return { x, y: null, value: null, time: item.time };
    }
    const normalizedValue = ((item[dataKey] - displayMin) / (displayMax - displayMin)) * 100;
    const y = 100 - Math.min(100, Math.max(0, normalizedValue));
    return { x, y, value: item[dataKey], time: item.time };
  }).filter(point => point.y !== null);

  // Generate path for the SVG
  const linePath = points.reduce((path, point, i) => {
    return path + (i === 0 ? `M ${point.x},${point.y}` : ` L ${point.x},${point.y}`);
  }, '');

  // Calculate grid line values for a more dynamic scale
  const gridLines = Array.from({ length: 5 }).map((_, i) => {
    const value = displayMax - i * ((displayMax - displayMin) / 4);
    return { 
      position: (i / 4) * 100,
      value: value
    };
  });

  return (
    <div className="h-full w-full relative">
      {/* Grid lines */}
      <div className="absolute inset-0">
        {gridLines.map((line, i) => (
          <div
            key={i}
            className="absolute w-full border-t border-gray-300 opacity-20"
            style={{ top: `${line.position}%` }}
          >
            <span className={`absolute -left-10 text-xs ${nightMode ? 'text-oNight' : 'text-white'}`}>
              {line.value.toFixed(line.value < 10 ? 1 : 0)}{unit}
            </span>
          </div>
        ))}
      </div>
      
      {/* Time labels on x-axis */}
      <div className="absolute bottom-0 w-full">
        {data.filter((_, i) => i % 10 === 0).map((item, i, arr) => (
          <span 
            key={i} 
            className={`absolute text-xs ${nightMode ? 'text-oNight' : 'text-white'} transform -translate-x-1/2`}
            style={{ left: `${(i * 10) / (data.length - 1) * 100}%`, bottom: '-20px' }}
          >
            {item.time.split(':').slice(1).join(':')}
          </span>
        ))}
      </div>
      
      {/* Chart background - make the active area stand out */}
      <div className="absolute inset-0 bg-gray-800 bg-opacity-10 rounded"></div>
      
      {/* Data range indicator */}
      {useAutoscale && (
        <div className="absolute top-0 right-0 bg-gray-800 bg-opacity-70 px-2 py-1 rounded text-xs text-white">
          Auto: {displayMin.toFixed(1)} - {displayMax.toFixed(1)}{unit}
        </div>
      )}
      
      {/* SVG Chart */}
      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        {/* Area under the line for subtle fill effect */}
        <defs>
          <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path 
          d={`${linePath} L ${points[points.length-1].x},100 L ${points[0].x},100 Z`} 
          fill={`url(#gradient-${dataKey})`}
        />
        
        {/* Line */}
        <path 
          d={linePath} 
          fill="none" 
          stroke={color} 
          strokeWidth={lineWidth} 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        {/* Points */}
        {showPoints && points.map((point, i) => (
          <circle 
            key={i} 
            cx={point.x} 
            cy={point.y} 
            r={0.5} 
            fill={color}
            className="hover:r-4 transition-all duration-150"
          >
            <title>{`${label}: ${point.value.toFixed(2)}${unit}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
};

// Battery visualization component
const BatteryVisual = ({ socPercentage, voltage, current, temperature, isCharging }) => {
  const batteryColor = getBatteryColorClass(socPercentage);
  const showLowBatteryWarning = socPercentage <= BATTERY_CONFIG.DANGER_THRESHOLD;
  const hasTemperature = temperature !== null;
  
  return (
    <div className="flex flex-col items-center">
      {/* Battery Icon */}
      <div className="relative w-20 h-40 mb-4">
        {/* Battery body */}
        <div className="absolute w-full h-[90%] bottom-0 rounded-md border-2 border-white overflow-hidden">
          {/* Fill level */}
          <div 
            className={`absolute bottom-0 w-full transition-all duration-700 ${batteryColor}`} 
            style={{ height: `${socPercentage}%` }}
          ></div>
          
          {/* Battery level text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-white drop-shadow-lg">
              {Math.round(socPercentage)}%
            </span>
          </div>
          
          {/* Warning indicator */}
          {showLowBatteryWarning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl animate-pulse text-red-500 opacity-70">⚠️</span>
            </div>
          )}
        </div>
        
        {/* Battery terminal */}
        <div className="absolute w-[40%] h-[10%] top-0 left-1/2 -translate-x-1/2 bg-white rounded-t-sm"></div>
        
        {/* Charging indicator */}
        {isCharging && (
          <div className="absolute top-[-1.5rem] left-1/2 -translate-x-1/2 text-yellow-400 animate-pulse">
            <FontAwesomeIcon icon={faBolt} size="xl" />
          </div>
        )}
      </div>
      
      {/* Battery metrics */}
      <div className={`flex ${hasTemperature ? 'flex-wrap' : ''} gap-4 justify-center`}>
        <div className="text-center">
          <span className="text-xs opacity-70">Voltage</span>
          <p className="text-lg font-medium">{voltage.toFixed(1)}V</p>
        </div>
        <div className="text-center">
          <span className="text-xs opacity-70">Current</span>
          <p className="text-lg font-medium">{current.toFixed(1)}A</p>
        </div>
        {hasTemperature && (
          <div className="text-center">
            <span className="text-xs opacity-70">Temp</span>
            <p className="text-lg font-medium">{temperature.toFixed(1)}°C</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Gauge component
const Gauge = ({ value, min, max, label, color, icon }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  const angle = (percentage / 100) * 180;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 mb-2">
        {/* Gauge background */}
        <div className="absolute w-full h-full bg-gray-800 rounded-t-full overflow-hidden"></div>
        
        {/* Gauge fill */}
        <div 
          className="absolute bottom-0 left-0 w-full origin-bottom overflow-hidden"
          style={{ 
            height: '100%',
            transform: `rotate(${-90 + angle}deg)`,
            transformOrigin: 'bottom center'
          }}
        >
          <div 
            className={`absolute bottom-0 left-0 w-0.5 h-full ${color}`}
            style={{ 
              left: '50%',
              boxShadow: '0 0 8px 1px currentColor'
            }}
          ></div>
        </div>
        
        {/* Gauge marks */}
        {[0, 25, 50, 75, 100].map(mark => (
          <div 
            key={mark}
            className="absolute bottom-0 w-1 h-2 bg-white"
            style={{ left: `${mark}%` }}
          ></div>
        ))}
        
        {/* Icon */}
        {icon && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-white opacity-70">
            <FontAwesomeIcon icon={icon} />
          </div>
        )}
        
        {/* Value display */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="font-bold text-white">{value.toFixed(1)}</span>
        </div>
      </div>
      <span className="text-sm opacity-80">{label}</span>
    </div>
  );
};

const BatteryMonitor = () => {
  const { nightMode, getSignalKValue } = useOcearoContext();
  const beginTimeRef = useRef(performance.now());
  const prevTimeRef = useRef(performance.now());
  const framesRef = useRef(0);
  const [activeView, setActiveView] = useState('voltage'); // voltage, current, soc
  const [activePerformanceView, setActivePerformanceView] = useState('fps'); // fps, drawCalls, triangles, memory

  const getInitialBatteryData = useCallback(() => {
    const time = new Date().toLocaleTimeString();
    const voltage = getSignalKValue('electrical.batteries.1.voltage') || 12;
    const stateOfCharge = getSignalKValue('electrical.batteries.1.capacity.stateOfCharge');
    const current = getSignalKValue('electrical.batteries.1.current') || 5;
    const temperatureKelvin = getSignalKValue('electrical.batteries.1.temperature');
    const temperature = temperatureKelvin !== null ? convertTemperature(temperatureKelvin) : null;
    
    return {
      time,
      voltage,
      current,
      stateOfCharge: stateOfCharge !== null ? stateOfCharge : estimateStateOfCharge(voltage),
      power: voltage * current, // Calculate power in watts
      temperature, // Battery temperature in Celsius
    };
  }, [getSignalKValue]);

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
    const voltage = getSignalKValue('electrical.batteries.1.voltage') || lastData.voltage;
    const current = getSignalKValue('electrical.batteries.1.current') || lastData.current;
    const stateOfCharge = getSignalKValue('electrical.batteries.1.capacity.stateOfCharge');
    const estimatedSoC = stateOfCharge !== null ? stateOfCharge : estimateStateOfCharge(voltage);
    const temperatureKelvin = getSignalKValue('electrical.batteries.1.temperature');
    const temperature = temperatureKelvin !== null ? convertTemperature(temperatureKelvin) : null;

    return {
      time: timeStr,
      voltage,
      current,
      stateOfCharge: estimatedSoC,
      power: voltage * current, // Power in watts
      temperature: temperature, // Battery temperature in Celsius (can be null)
    };
  }, [getSignalKValue, batteryData]);

  // Reference to renderer for performance stats
  const rendererRef = useRef(null);
  
  // Find Three.js renderer if it exists in the window
  useEffect(() => {
    // Try to find the THREE.WebGLRenderer instance from the window
    if (window.__OCEARO_RENDERER) {
      rendererRef.current = window.__OCEARO_RENDERER;
    }
  }, []);

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
    <div className="p-6 flex flex-col h-full bg-rightPaneBg">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Primary Battery Visualization */}
        <div className="bg-oGray2 rounded-lg shadow-lg p-4 flex flex-col md:row-span-2">
          <h2 className={`text-lg font-semibold ${nightMode ? 'text-oNight' : 'text-white'} mb-6 text-center`}>
            <FontAwesomeIcon icon={faBatteryFull} className="mr-2" />
            Battery Status
          </h2>
          
          <div className="flex-1 flex flex-col justify-between">
            {/* Battery visualization */}
            <div className="flex-1 flex items-center justify-center">
              <BatteryVisual 
                socPercentage={currentBatteryData.stateOfCharge}
                voltage={currentBatteryData.voltage}
                current={currentBatteryData.current}
                temperature={currentBatteryData.temperature}
                isCharging={isCharging}
              />
            </div>
            
            {/* State indicators */}
            <div className="flex justify-center flex-wrap gap-6 mb-4">
              <Gauge 
                value={currentBatteryData.voltage} 
                min={batteryScales.voltage.min} 
                max={batteryScales.voltage.max}
                label="Voltage" 
                color="text-blue-500"
                icon={faBolt}
              />
              <Gauge 
                value={currentBatteryData.current} 
                min={batteryScales.current.min} 
                max={batteryScales.current.max}
                label="Current" 
                color="text-red-500"
                icon={faChargingStation}
              />
              {hasTemperatureData && (
                <Gauge 
                  value={currentBatteryData.temperature} 
                  min={batteryScales.temperature.min} 
                  max={batteryScales.temperature.max}
                  label="Temperature" 
                  color="text-orange-500"
                  icon={faTemperatureHalf}
                />
              )}
            </div>
            
            {/* Status badges */}
            <div className="flex justify-center space-x-3 pt-2 border-t border-gray-700">
              <div className={`px-3 py-1 rounded-full text-sm flex items-center 
                ${isCharging ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-300'}`}>
                <FontAwesomeIcon icon={faChargingStation} className="mr-1" />
                {isCharging ? 'Charging' : 'Not Charging'}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm flex items-center
                ${getBatteryColorClass(currentBatteryData.stateOfCharge) === 'bg-oGreen' ? 'bg-green-900 text-green-200' : 
                  getBatteryColorClass(currentBatteryData.stateOfCharge) === 'bg-oYellow' ? 'bg-yellow-700 text-yellow-100' : 
                  'bg-red-900 text-red-200'}`}>
                <FontAwesomeIcon icon={faBatteryFull} className="mr-1" />
                {currentBatteryData.stateOfCharge >= 75 ? 'Good' : 
                 currentBatteryData.stateOfCharge >= 30 ? 'Fair' : 'Low'}
              </div>
            </div>
          </div>
        </div>

        {/* Battery Graph */}
        <div className="bg-oGray2 rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg font-semibold ${nightMode ? 'text-oNight' : 'text-white'}`}>
              Battery Graph
            </h2>
            <div className="flex space-x-2">
              <button 
                className={`px-2 py-1 rounded text-xs ${activeView === 'voltage' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                onClick={() => setActiveView('voltage')}
              >
                Voltage
              </button>
              <button 
                className={`px-2 py-1 rounded text-xs ${activeView === 'current' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                onClick={() => setActiveView('current')}
              >
                Current
              </button>
              <button 
                className={`px-2 py-1 rounded text-xs ${activeView === 'soc' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                onClick={() => setActiveView('soc')}
              >
                SoC
              </button>
              {hasTemperatureData && (
                <button 
                  className={`px-2 py-1 rounded text-xs ${activeView === 'temperature' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                  onClick={() => setActiveView('temperature')}
                >
                  Temp
                </button>
              )}
            </div>
          </div>
          
          <div className="h-64 mt-6 mb-8 relative">
            {activeView === 'voltage' && (
              <LineChart 
                data={batteryData} 
                dataKey="voltage" 
                color="#3b82f6" // blue-500
                scale={batteryScales.voltage}
                label="Voltage"
                unit="V"
                showPoints
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
              />
            )}
          </div>
        </div>
        
        {/* Performance Metrics */}
        <div className="bg-oGray2 rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg font-semibold ${nightMode ? 'text-oNight' : 'text-white'} flex items-center`}>
              <FontAwesomeIcon icon={faMicrochip} className="mr-2" />
              3D Performance
            </h2>
            <div className="flex space-x-2">
              <button 
                className={`px-2 py-1 rounded text-xs ${activePerformanceView === 'fps' ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                onClick={() => setActivePerformanceView('fps')}
              >
                FPS
              </button>
              <button 
                className={`px-2 py-1 rounded text-xs ${activePerformanceView === 'drawCalls' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                onClick={() => setActivePerformanceView('drawCalls')}
              >
                Draw Calls
              </button>
              <button 
                className={`px-2 py-1 rounded text-xs ${activePerformanceView === 'triangles' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                onClick={() => setActivePerformanceView('triangles')}
              >
                Triangles
              </button>
              <button 
                className={`px-2 py-1 rounded text-xs ${activePerformanceView === 'memory' ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                onClick={() => setActivePerformanceView('memory')}
              >
                Memory
              </button>
            </div>
          </div>
          
          <div className="h-56 mt-4 mb-4 relative">
            {activePerformanceView === 'fps' && (
              <LineChart 
                data={performanceData} 
                dataKey="fps" 
                color="#06b6d4" // cyan-500
                scale={performanceScales.fps}
                label="FPS"
                unit=""
                lineWidth={0.5}
                showPoints
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
                lineWidth={0.5}
                showPoints
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
                lineWidth={0.5}
                showPoints
              />
            )}
            {activePerformanceView === 'memory' && (
              <LineChart 
                data={performanceData} 
                dataKey="memory" 
                color="#10b981" // emerald-500
                scale={performanceScales.memory}
                label="Memory"
                unit="MB"
                lineWidth={0.5}
                showPoints
              />
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faMicrochip} className={`text-cyan-500 text-lg`} />
              <div>
                <p className={`text-xs ${nightMode ? 'text-oNight' : 'text-white'} opacity-70`}>FPS / Frame Time</p>
                <p className={`text-base font-semibold ${nightMode ? 'text-oNight' : 'text-white'}`}>
                  {performanceData[performanceData.length - 1].fps.toFixed(1)} fps / 
                  {performanceData[performanceData.length - 1].ms.toFixed(1)}ms
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faCode} className="text-purple-500 text-lg" />
              <div>
                <p className={`text-xs ${nightMode ? 'text-oNight' : 'text-white'} opacity-70`}>Draw Calls</p>
                <p className={`text-base font-semibold ${nightMode ? 'text-oNight' : 'text-white'}`}>
                  {performanceData[performanceData.length - 1].drawCalls.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faCube} className="text-indigo-500 text-lg" />
              <div>
                <p className={`text-xs ${nightMode ? 'text-oNight' : 'text-white'} opacity-70`}>Triangles / Geometries</p>
                <p className={`text-base font-semibold ${nightMode ? 'text-oNight' : 'text-white'}`}>
                  {(performanceData[performanceData.length - 1].triangles / 1000).toFixed(1)}k / 
                  {performanceData[performanceData.length - 1].geometries}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon icon={faMemory} className="text-emerald-500 text-lg" />
              <div>
                <p className={`text-xs ${nightMode ? 'text-oNight' : 'text-white'} opacity-70`}>Memory / Textures</p>
                <p className={`text-base font-semibold ${nightMode ? 'text-oNight' : 'text-white'}`}>
                  {performanceData[performanceData.length - 1].memory} MB / 
                  {performanceData[performanceData.length - 1].textures || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatteryMonitor;