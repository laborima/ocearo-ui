import React, { useState, useEffect, useRef } from 'react';
import { BATTERY_CONFIG, estimateStateOfCharge, useOcearoContext } from '../context/OcearoContext';



const BatteryMonitor = () => {
  const { nightMode, getSignalKValue } = useOcearoContext();
  const beginTimeRef = useRef(performance.now());
  const prevTimeRef = useRef(performance.now());
  const framesRef = useRef(0);

  const getInitialBatteryData = () => {
    const time = new Date().toLocaleTimeString();
    const voltage = getSignalKValue('electrical.batteries.1.voltage') || 12;
    const stateOfCharge = getSignalKValue('electrical.batteries.1.capacity.stateOfCharge');
    return {
      time,
      voltage,
      current: getSignalKValue('electrical.batteries.1.current') || 5,
      stateOfCharge: stateOfCharge !== null ? stateOfCharge : estimateStateOfCharge(voltage),
    };
  };

  // Initialize with 30 data points for smoother graphs
  const [batteryData, setBatteryData] = useState(
    Array(30).fill(null).map(getInitialBatteryData)
  );
  const [performanceData, setPerformanceData] = useState(() => {
    const time = new Date().toLocaleTimeString();
    return Array(30).fill({
      time,
      fps: 60,
      ms: 16.67,
    });
  });

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

        setPerformanceData((prev) => [
          ...prev.slice(1),
          { time: timeStr, fps: fps, ms: avgFrameTime },
        ]);

        const voltage = getSignalKValue('electrical.batteries.1.voltage') || batteryData[batteryData.length - 1].voltage;
        const current = getSignalKValue('electrical.batteries.1.current') || batteryData[batteryData.length - 1].current;
        const stateOfCharge = getSignalKValue('electrical.batteries.1.capacity.stateOfCharge');
        const estimatedSoC = stateOfCharge !== null ? stateOfCharge : estimateStateOfCharge(voltage);

        setBatteryData((prev) => [
          ...prev.slice(1),
          {
            time: timeStr,
            voltage,
            current,
            stateOfCharge: estimatedSoC,
          },
        ]);

        prevTimeRef.current = time;
        framesRef.current = 0;
      }

      beginTimeRef.current = time;
      animationFrameId = requestAnimationFrame(updateAllData);
    };

    animationFrameId = requestAnimationFrame(updateAllData);
    return () => cancelAnimationFrame(animationFrameId);
  }, [getSignalKValue]);

  // Scale definitions
  const batteryScales = {
    voltage: { min: 11, max: 15, step: 1 },
    current: { min: 0, max: 15, step: 5 },
    soc: { min: 0, max: 100, step: 25 },
  };

  const performanceScales = {
    fps: { min: 0, max: 60, step: 15 },
    ms: { min: 0, max: 33.33, step: 10 },
  };

  // Function to determine SoC color
  const getSoCColor = (percentage) => {
    if (percentage > BATTERY_CONFIG.WARNING_THRESHOLD) return 'bg-oGreen';
    if (percentage > BATTERY_CONFIG.DANGER_THRESHOLD) return 'bg-oYellow';
    return 'bg-oRed';
  };

  return (
    <div className={`p-6 flex flex-col h-full bg-rightPaneBg`}>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Battery Metrics */}
        <div className={`bg-oGray2 rounded-lg shadow-lg p-4`}>
          <h2 className={`text-lg font-semibold ${nightMode ? 'text-oNight' : 'text-white'} mb-4`}>
            Battery Status
          </h2>
          <div className="h-64 relative">
            {/* Grid lines and scales */}
            <div className="absolute inset-0">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className="absolute w-full border-t border-gray-300 opacity-20"
                  style={{ bottom: `${(i / 4) * 100}%` }}
                >
                  <span className={`absolute -left-10 text-xs ${nightMode ? 'text-oNight' : 'text-white'}`}>
                    {batteryScales.soc.min + i * batteryScales.soc.step}%
                  </span>
                </div>
              ))}
            </div>

            <div className="h-full flex items-end space-x-1">
              {batteryData.map((data, index) => (
                <div
                  key={`${data.time}-${index}`}
                  className="flex-1 flex flex-col justify-end h-full space-y-1 relative"
                >
                  <div
                    className="w-full bg-blue-500 transition-all duration-300"
                    style={{
                      height: `${
                        ((data.voltage - batteryScales.voltage.min) /
                          (batteryScales.voltage.max - batteryScales.voltage.min)) * 100
                      }%`,
                    }}
                    title={`Voltage: ${data.voltage.toFixed(1)}V`}
                  />
                  <div
                    className="w-full bg-red-500 transition-all duration-300"
                    style={{ height: `${(data.current / batteryScales.current.max) * 100}%` }}
                    title={`Current: ${data.current.toFixed(1)}A`}
                  />
                  <div
                    className={`w-full ${getSoCColor(data.stateOfCharge)} transition-all duration-300`}
                    style={{ height: `${data.stateOfCharge}%` }}
                    title={`SoC: ${data.stateOfCharge.toFixed(1)}%`}
                  />
                  {index % 5 === 0 && (
                    <span
                      className={`text-xs ${nightMode ? 'text-oNight' : 'text-white'} transform -rotate-45 origin-top-left absolute bottom-0 -mb-6`}
                    >
                      {data.time.split(':')[1]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              <span className={nightMode ? 'text-oNight' : 'text-white'}>Voltage (11-15V)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
              <span className={nightMode ? 'text-oNight' : 'text-white'}>Current (0-15A)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-oGreen rounded mr-2"></div>
              <span className={nightMode ? 'text-oNight' : 'text-white'}>SoC (0-100%)</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className={`bg-oGray2 rounded-lg shadow-lg p-4`}>
          <h2 className={`text-lg font-semibold ${nightMode ? 'text-oNight' : 'text-white'} mb-4`}>
            Performance Metrics
          </h2>
          <div className="h-64 relative">
            {/* Grid lines and scales */}
            <div className="absolute inset-0">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className="absolute w-full border-t border-gray-300 opacity-20"
                  style={{ bottom: `${(i / 4) * 100}%` }}
                >
                  <span className={`absolute -left-10 text-xs ${nightMode ? 'text-oNight' : 'text-white'}`}>
                    {performanceScales.fps.min + i * performanceScales.fps.step}
                  </span>
                </div>
              ))}
            </div>

            <div className="h-full flex items-end space-x-1">
              {performanceData.map((data, index) => (
                <div
                  key={`${data.time}-${index}`}
                  className="flex-1 flex flex-col justify-end h-full space-y-1 relative"
                >
                  <div
                    className="w-full bg-cyan-500 transition-all duration-300"
                    style={{ height: `${(data.fps / performanceScales.fps.max) * 100}%` }}
                    title={`FPS: ${data.fps.toFixed(1)}`}
                  />
                  <div
                    className="w-full bg-green-500 transition-all duration-300"
                    style={{ height: `${(data.ms / performanceScales.ms.max) * 100}%` }}
                    title={`MS: ${data.ms.toFixed(1)}`}
                  />
                  {index % 5 === 0 && (
                    <span
                      className={`text-xs ${nightMode ? 'text-oNight' : 'text-white'} transform -rotate-45 origin-top-left absolute bottom-0 -mb-6`}
                    >
                      {data.time.split(':')[1]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-cyan-500 rounded mr-2"></div>
              <span className={nightMode ? 'text-oNight' : 'text-white'}>FPS (0-60)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span className={nightMode ? 'text-oNight' : 'text-white'}>Frame Time (0-33ms)</span>
            </div>
          </div>
        </div>

        {/* Current Stats */}
        <div className={`bg-oGray2 rounded-lg shadow-lg p-4 md:col-span-2`}>
          <h2 className={`text-lg font-semibold ${nightMode ? 'text-oNight' : 'text-white'} mb-4`}>
            Current Readings
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className={`text-sm font-medium ${nightMode ? 'text-oNight' : 'text-white'}`}>Voltage</p>
              <p className={`text-2xl font-bold ${nightMode ? 'text-oNight' : 'text-white'}`}>
                {batteryData[batteryData.length - 1].voltage.toFixed(1)} V
              </p>
            </div>
            <div className="space-y-2">
              <p className={`text-sm font-medium ${nightMode ? 'text-oNight' : 'text-white'}`}>Current</p>
              <p className={`text-2xl font-bold ${nightMode ? 'text-oNight' : 'text-white'}`}>
                {batteryData[batteryData.length - 1].current.toFixed(1)} A
              </p>
            </div>
            <div className="space-y-2">
              <p className={`text-sm font-medium ${nightMode ? 'text-oNight' : 'text-white'}`}>State of Charge</p>
              <p className={`text-2xl font-bold ${nightMode ? 'text-oNight' : 'text-white'}`}>
                {batteryData[batteryData.length - 1].stateOfCharge.toFixed(1)}%
              </p>
            </div>
            <div className="space-y-2">
              <p className={`text-sm font-medium ${nightMode ? 'text-oNight' : 'text-white'}`}>Performance</p>
              <p className={`text-2xl font-bold ${nightMode ? 'text-oNight' : 'text-white'}`}>
                {performanceData[performanceData.length - 1].fps.toFixed(1)} FPS
                <span className="text-sm ml-2">
                  ({performanceData[performanceData.length - 1].ms.toFixed(1)} ms)
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatteryMonitor;