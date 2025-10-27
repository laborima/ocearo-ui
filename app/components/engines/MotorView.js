import React, { useState, useEffect, useCallback } from 'react';
import { useOcearoContext } from '../context/OcearoContext';
import configService from '../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt, faClock, faTemperatureHalf, faGaugeHigh, faGasPump,
  faWrench, faCogs, faBolt, faExclamationTriangle, faCheckCircle,
  faCar, faOilCan, faFire, faSnowflake, faBatteryFull, faChartLine,
  faWater, faRuler, faArrowUp, faArrowDown, faRotate, faFlask
} from '@fortawesome/free-solid-svg-icons';

// Import utilities from MotorUtils.js
import * as MotorUtils from '../utils/MotorUtils';
// Import gauge components
import { CircularGauge, BarGauge, CompactDataField, PrimaryGauge } from './GaugeComponents';

// Helper component for displaying individual data points
const DataField = ({ label, value, unit, icon, statusClass = 'text-white' }) => {
  const displayValue = (value === null || value === undefined || value === 'NaN') ? 'N/A' : `${value}${unit ? ` ${unit}` : ''}`;
  
  return (
    <div className="bg-oGray2 p-3 rounded-lg shadow">
      <div className="flex items-center text-gray-400 text-sm mb-1">
        {icon && <FontAwesomeIcon icon={icon} className="mr-2 fa-fw" />}
        {label}
      </div>
      <div className={`font-bold text-xl ${statusClass}`}>
        {displayValue}
      </div>
    </div>
  );
};

const MotorView = () => {
  const { getSignalKValue } = useOcearoContext();
  const debugMode = configService.get('debugMode');
  const [selectedEngine, setSelectedEngine] = useState('0');
  const [activeTab, setActiveTab] = useState('engine'); // engine, transmission, electrical, fuel, warnings
  const [availableEngines, setAvailableEngines] = useState([]);
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  // Get available engines
  const getAvailableEngines = useCallback(() => {
    const engines = [];
    for (let i = 0; i <= 3; i++) {
      let rpm = getSignalKValue(`propulsion.${i}.revolutions`);
      let runTime = getSignalKValue(`propulsion.${i}.runTime`);
      
      // Check named instances if numeric not found
      if (i === 0 && (rpm === null && runTime === null)) {
        rpm = getSignalKValue('propulsion.port.revolutions') ?? getSignalKValue('propulsion.main.revolutions');
        runTime = getSignalKValue('propulsion.port.runTime') ?? getSignalKValue('propulsion.main.runTime');
      } else if (i === 1 && (rpm === null && runTime === null)) {
        rpm = getSignalKValue('propulsion.starboard.revolutions');
        runTime = getSignalKValue('propulsion.starboard.runTime');
      }
      
      if (rpm !== null || runTime !== null || debugMode) {
        engines.push({
          id: i.toString(),
          name: i === 0 ? 'Port/Main Engine' : i === 1 ? 'Starboard Engine' : `Engine ${i}`,
          hasData: true
        });
      }
    }
    return engines.length > 0 ? engines : [{ id: '0', name: 'Main Engine', hasData: false }];
  }, [getSignalKValue, debugMode]);

  useEffect(() => {
    setAvailableEngines(getAvailableEngines());
  }, [getAvailableEngines]);

  // Helper function to get value from either numeric or named instance path
  const getEngineValue = useCallback((path) => {
    const instance = selectedEngine;
    // Try numeric instance first (e.g., propulsion.0.revolutions)
    let value = getSignalKValue(`propulsion.${instance}.${path}`);
    
    // If not found and instance is 0, try named alternatives (port, main)
    if (value === null && instance === '0') {
      value = getSignalKValue(`propulsion.port.${path}`);
      if (value === null) {
        value = getSignalKValue(`propulsion.main.${path}`);
      }
    }
    // If instance is 1, try starboard
    else if (value === null && instance === '1') {
      value = getSignalKValue(`propulsion.starboard.${path}`);
    }
    
    return value;
  }, [selectedEngine, getSignalKValue]);

  // Get comprehensive engine data
  const getEngineData = useCallback(() => {
    const instance = selectedEngine;
    const coolantTemperatureKelvin = getEngineValue('coolantTemperature');
    const engineTemperatureKelvin = getEngineValue('temperature');
    const portTemperatureKelvin = getSignalKValue('propulsion.port.temperature');
    let effectiveCoolantTemperature = coolantTemperatureKelvin;
    if (effectiveCoolantTemperature === null || effectiveCoolantTemperature === undefined) {
      effectiveCoolantTemperature = engineTemperatureKelvin;
    }
    if (effectiveCoolantTemperature === null || effectiveCoolantTemperature === undefined) {
      effectiveCoolantTemperature = portTemperatureKelvin;
    }
    const exhaustTemperatureKelvin = getEngineValue('exhaustTemperature');
    const mainExhaustTemperatureKelvin = getSignalKValue('propulsion.main.exhaustTemperature');
    const effectiveExhaustTemperature = (exhaustTemperatureKelvin !== null && exhaustTemperatureKelvin !== undefined)
      ? exhaustTemperatureKelvin
      : mainExhaustTemperatureKelvin;
    return {
      // Primary Engine Data
      rpm: MotorUtils.hzToRPM(getEngineValue('revolutions')),
      runTime: MotorUtils.formatEngineHours(getEngineValue('runTime')),
      coolantTemp: MotorUtils.kelvinToCelsius(effectiveCoolantTemperature),
      coolantPressure: MotorUtils.pascalsToBar(getEngineValue('coolantPressure')),
      boostPressure: MotorUtils.pascalsToBar(getEngineValue('boostPressure')),
      oilPressure: MotorUtils.pascalsToBar(getEngineValue('oilPressure')),
      oilTemp: MotorUtils.kelvinToCelsius(getEngineValue('oilTemperature')),
      fuelRate: MotorUtils.m3sToLitersPerHour(getEngineValue('fuel.rate')),
      fuelPressure: MotorUtils.pascalsToBar(getEngineValue('fuel.pressure')),
      load: MotorUtils.ratioToPercent(getEngineValue('load')),
      torque: MotorUtils.ratioToPercent(getEngineValue('torque')),
      exhaustTemp: MotorUtils.kelvinToCelsius(effectiveExhaustTemperature),
      intakeTemp: MotorUtils.kelvinToCelsius(getEngineValue('intakeManifoldTemperature')),
      tilt: MotorUtils.radiansToDegrees(getEngineValue('tilt')),
      state: getEngineValue('state'),
      
      // Transmission Data
      gear: getEngineValue('transmission.gear'),
      transOilPressure: MotorUtils.pascalsToBar(getEngineValue('transmission.oilPressure')),
      transOilTemp: MotorUtils.kelvinToCelsius(getEngineValue('transmission.oilTemperature')),
      
      // Electrical Data
      batteryVoltage: getSignalKValue('electrical.batteries.0.voltage'),
      batteryCurrent: getSignalKValue('electrical.batteries.0.current'),
      alternatorVoltage: getSignalKValue(`electrical.alternators.${instance}.voltage`) ?? getSignalKValue('propulsion.port.alternatorVoltage'),
      alternatorCurrent: getSignalKValue(`electrical.alternators.${instance}.current`) ?? getSignalKValue('propulsion.port.alternatorCurrent'),
      
      // Fuel Tank Data
      fuelLevel: MotorUtils.ratioToPercent(getSignalKValue('tanks.fuel.0.currentLevel')),
      fuelCapacity: getSignalKValue('tanks.fuel.0.capacity'),
    };
  }, [selectedEngine, getSignalKValue, getEngineValue]);
  
  const engineData = getEngineData();
  const houseBatteryCurrentRaw = getSignalKValue('electrical.batteries.1.current');
  const houseBatteryCurrent = typeof houseBatteryCurrentRaw === 'number'
    ? Math.round(houseBatteryCurrentRaw * 10) / 10
    : houseBatteryCurrentRaw;

  return (
    <div className="flex flex-col h-full rightPaneBg overflow-auto">
      {/* Tab Navigation */}
      <div className="flex border-b border-oGray2">
        {[
          { id: 'engine', label: 'Engine', icon: faCar },
          { id: 'transmission', label: 'Transmission', icon: faCogs },
          { id: 'electrical', label: 'Electrical', icon: faBolt },
          { id: 'fuel', label: 'Fuel System', icon: faGasPump },
          { id: 'warnings', label: 'Warnings', icon: faExclamationTriangle }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center transition-all ${
              activeTab === tab.id
                ? 'text-oGreen border-b-2 border-oGreen'
                : 'text-oGray hover:text-oBlue'
            }`}
          >
            <FontAwesomeIcon icon={tab.icon} className="mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === 'engine' && (
          <div className="space-y-6">
            {/* Engine Selection and Primary Metrics */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <FontAwesomeIcon icon={faCar} className="mr-2 text-oBlue" />
                Engine Systems
              </h2>

              <select
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value)}
                className="bg-oGray2 px-3 py-2 rounded text-white border border-oGray focus:outline-none focus:ring-1 focus:ring-oBlue"
              >
                {availableEngines.map((engine) => (
                  <option key={engine.id} value={engine.id}>
                    {engine.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <PrimaryGauge
                label="Engine RPM"
                value={engineData.rpm}
                unit="RPM"
                icon={faTachometerAlt}
                max={4000}
                warningThreshold={3000}
                criticalThreshold={3500}
              />
              <div className="bg-oGray2 rounded-lg p-6 text-center">
                <FontAwesomeIcon icon={faClock} className="text-3xl text-gray-400 mb-3" />
                <div className="text-6xl font-bold text-white mb-2">
                  {engineData.runTime || 'N/A'}
                </div>
                <div className="text-gray-400 text-lg">Engine Hours</div>
              </div>
              <CircularGauge
                label="Engine Load"
                value={engineData.load}
                unit="%"
                min={0}
                max={100}
                icon={faChartLine}
                warningThreshold={70}
                criticalThreshold={85}
                size={180}
              />
              <CircularGauge
                label="Torque"
                value={engineData.torque}
                unit="%"
                min={0}
                max={100}
                icon={faRotate}
                warningThreshold={75}
                criticalThreshold={90}
                size={180}
              />
            </div>

            {/* Temperature Monitoring - Circular Gauges */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faTemperatureHalf} className="mr-2 text-orange-500" />
                Temperature Monitoring
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <CircularGauge
                  label="Coolant"
                  value={engineData.coolantTemp}
                  unit="°C"
                  min={0}
                  max={120}
                  icon={faSnowflake}
                  warningThreshold={85}
                  criticalThreshold={95}
                  size={160}
                />
                <CircularGauge
                  label="Oil"
                  value={engineData.oilTemp}
                  unit="°C"
                  min={0}
                  max={150}
                  icon={faOilCan}
                  warningThreshold={110}
                  criticalThreshold={130}
                  size={160}
                />
                <CircularGauge
                  label="Exhaust"
                  value={engineData.exhaustTemp}
                  unit="°C"
                  min={0}
                  max={600}
                  icon={faFire}
                  warningThreshold={450}
                  criticalThreshold={550}
                  size={160}
                />
                <CircularGauge
                  label="Intake"
                  value={engineData.intakeTemp}
                  unit="°C"
                  min={0}
                  max={100}
                  icon={faArrowDown}
                  warningThreshold={60}
                  criticalThreshold={80}
                  size={160}
                />
              </div>
            </div>

            {/* Pressure Systems - Bar Gauges */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faGaugeHigh} className="mr-2 text-oBlue" />
                Pressure Systems
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BarGauge
                  label="Oil Pressure"
                  value={engineData.oilPressure}
                  unit="bar"
                  min={0}
                  max={6}
                  icon={faOilCan}
                  warningThreshold={2.5}
                  criticalThreshold={2}
                  showMinMax={true}
                />
                <BarGauge
                  label="Coolant Pressure"
                  value={engineData.coolantPressure}
                  unit="bar"
                  min={0}
                  max={3}
                  icon={faWater}
                  showMinMax={true}
                />
                <BarGauge
                  label="Boost Pressure"
                  value={engineData.boostPressure}
                  unit="bar"
                  min={0}
                  max={2.5}
                  icon={faArrowUp}
                  showMinMax={true}
                />
                <BarGauge
                  label="Fuel Pressure"
                  value={engineData.fuelPressure}
                  unit="bar"
                  min={0}
                  max={5}
                  icon={faGasPump}
                  warningThreshold={2.5}
                  criticalThreshold={2}
                  showMinMax={true}
                />
              </div>
            </div>

            {/* Additional Engine Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CompactDataField
                label="Engine State"
                value={engineData.state || 'Unknown'}
                icon={faCar}
              />
              <CompactDataField
                label="Tilt Angle"
                value={engineData.tilt}
                unit="°"
                icon={faRuler}
              />
              <CompactDataField
                label="Intake Manifold"
                value={engineData.intakeTemp}
                unit="°C"
                icon={faArrowDown}
              />
            </div>
          </div>
        )}

        {activeTab === 'transmission' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-oGray2 rounded-lg p-6 text-center">
                <FontAwesomeIcon icon={faCogs} className="text-5xl text-blue-400 mb-4" />
                <div className="text-oGray text-lg mb-2">Current Gear</div>
                <div className="text-4xl font-bold text-white">
                  {engineData.gear === -1 ? 'Reverse' : 
                   engineData.gear === 0 ? 'Neutral' : 
                   engineData.gear ? `Forward ${engineData.gear}` : 'N/A'}
                </div>
              </div>
              
              <CircularGauge
                label="Oil Pressure"
                value={engineData.transOilPressure}
                unit="bar"
                min={0}
                max={6}
                icon={faOilCan}
                warningThreshold={2.5}
                criticalThreshold={2}
                size={180}
              />
              
              <CircularGauge
                label="Oil Temperature"
                value={engineData.transOilTemp}
                unit="°C"
                min={0}
                max={120}
                icon={faTemperatureHalf}
                warningThreshold={85}
                criticalThreshold={95}
                size={180}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BarGauge
                label="Transmission Oil Pressure"
                value={engineData.transOilPressure}
                unit="bar"
                min={0}
                max={6}
                icon={faOilCan}
                warningThreshold={2.5}
                criticalThreshold={2}
                showMinMax={true}
              />
              <BarGauge
                label="Transmission Oil Temperature"
                value={engineData.transOilTemp}
                unit="°C"
                min={0}
                max={120}
                icon={faTemperatureHalf}
                warningThreshold={85}
                criticalThreshold={95}
                showMinMax={true}
              />
            </div>
          </div>
        )}

        {activeTab === 'electrical' && (
          <div className="space-y-6">
            {/* Battery Systems */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faBatteryFull} className="mr-2 text-blue-500" />
                Battery Systems
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="text-lg text-oGray">Starter Battery</h4>
                  <BarGauge
                    label="Voltage"
                    value={engineData.batteryVoltage}
                    unit="V"
                    min={10}
                    max={15}
                    icon={faBatteryFull}
                    warningThreshold={11.8}
                    criticalThreshold={11.5}
                    showMinMax={true}
                  />
                  <BarGauge
                    label="Current"
                    value={engineData.batteryCurrent}
                    unit="A"
                    min={-50}
                    max={50}
                    icon={faBolt}
                    showMinMax={true}
                  />
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg text-oGray">House Battery</h4>
                  <BarGauge
                    label="Voltage"
                    value={getSignalKValue('electrical.batteries.1.voltage')}
                    unit="V"
                    min={10}
                    max={15}
                    icon={faBatteryFull}
                    warningThreshold={11.8}
                    criticalThreshold={11.5}
                    showMinMax={true}
                  />
                  <BarGauge
                    label="Current"
                    value={houseBatteryCurrent}
                    unit="A"
                    min={-50}
                    max={50}
                    icon={faBolt}
                    showMinMax={true}
                  />
                </div>
              </div>
            </div>

            {/* Alternator Systems */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faBolt} className="mr-2 text-oYellow" />
                Alternator System
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CircularGauge
                  label="Alternator Voltage"
                  value={engineData.alternatorVoltage}
                  unit="V"
                  min={10}
                  max={16}
                  icon={faBolt}
                  warningThreshold={15}
                  criticalThreshold={15.5}
                  size={180}
                />
                <CircularGauge
                  label="Alternator Current"
                  value={engineData.alternatorCurrent}
                  unit="A"
                  min={0}
                  max={100}
                  icon={faBolt}
                  size={180}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fuel' && (
          <div className="space-y-6">
            {/* Fuel Consumption */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faGasPump} className="mr-2 text-oYellow" />
                Fuel System
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CircularGauge
                  label="Fuel Rate"
                  value={engineData.fuelRate}
                  unit="L/h"
                  min={0}
                  max={50}
                  icon={faGasPump}
                  size={180}
                />
                <CircularGauge
                  label="Fuel Pressure"
                  value={engineData.fuelPressure}
                  unit="bar"
                  min={0}
                  max={5}
                  icon={faGaugeHigh}
                  warningThreshold={2.5}
                  criticalThreshold={2}
                  size={180}
                />
                <CircularGauge
                  label="Tank Level"
                  value={engineData.fuelLevel}
                  unit="%"
                  min={0}
                  max={100}
                  icon={faFlask}
                  warningThreshold={30}
                  criticalThreshold={15}
                  size={180}
                />
              </div>
            </div>

            {/* Fuel Tank Details */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faFlask} className="mr-2 text-oBlue" />
                Fuel Tank Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BarGauge
                  label="Fuel Level"
                  value={engineData.fuelLevel}
                  unit="%"
                  min={0}
                  max={100}
                  icon={faFlask}
                  warningThreshold={30}
                  criticalThreshold={15}
                  showMinMax={true}
                />
                <CompactDataField
                  label="Tank Capacity"
                  value={engineData.fuelCapacity?.toFixed(0)}
                  unit="L"
                  icon={faFlask}
                />
              </div>
              
              {engineData.fuelLevel !== null && engineData.fuelCapacity !== null && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CompactDataField
                    label="Current Volume"
                    value={((engineData.fuelLevel / 100) * engineData.fuelCapacity).toFixed(0)}
                    unit="L"
                    icon={faFlask}
                  />
                  <CompactDataField
                    label="Remaining Range (est.)"
                    value={engineData.fuelRate > 0 && engineData.fuelLevel !== null && engineData.fuelCapacity !== null
                      ? (((engineData.fuelLevel / 100) * engineData.fuelCapacity) / engineData.fuelRate).toFixed(1)
                      : 'N/A'}
                    unit={engineData.fuelRate > 0 ? 'h' : ''}
                    icon={faClock}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'warnings' && (
          <div className="space-y-6">
            <div className="bg-oGray2 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-oRed" />
                  System Status & Warnings
                </h3>
                <button
                  onClick={() => setShowAllNotifications(!showAllNotifications)}
                  className="px-3 py-1 text-sm bg-oGray3 text-white rounded hover:bg-oBlue transition-colors"
                >
                  {showAllNotifications ? 'Show Active Only' : 'Show All'}
                </button>
              </div>
              
              {(() => {
                const instance = selectedEngine;
                const notificationTypes = [
                  'chargeIndicator', 'checkEngine', 'commError', 'eGRSystem', 'emergencyStopMode',
                  'highBoostPressure', 'lowCoolantLevel', 'lowFuelPressure', 'lowOilLevel', 
                  'lowOilPressure', 'lowSystemVoltage', 'maintenanceNeeded', 'neutralStartProtect',
                  'overTemperature', 'powerReduction', 'preheatIndicator', 'revLimitExceeded',
                  'shuttingDown', 'subOrSecondaryThrottle', 'throttlePositionSensor', 'warningLevel1',
                  'warningLevel2', 'waterFlow', 'waterInFuel'
                ];
                
                const notifications = [];
                notificationTypes.forEach(type => {
                  // Try numeric instance first
                  let notification = getSignalKValue(`notifications.propulsion.${instance}.${type}`);
                  
                  // Try named instances if not found
                  if (!notification && instance === '0') {
                    notification = getSignalKValue(`notifications.propulsion.port.${type}`) 
                               ?? getSignalKValue(`notifications.propulsion.main.${type}`);
                  } else if (!notification && instance === '1') {
                    notification = getSignalKValue(`notifications.propulsion.starboard.${type}`);
                  }
                  
                  if (notification && typeof notification === 'object') {
                    notifications.push({ type, ...notification });
                  }
                });
                
                const hasWarnings = notifications.some(n => n.state === 'alert' || n.state === 'warn');
                const hasAlarms = notifications.some(n => n.state === 'alarm' || n.state === 'emergency');
                const activeIssues = notifications.filter(n => n.state !== 'normal');
                
                if (activeIssues.length === 0) {
                  return (
                    <div className="space-y-4">
                      <div className="text-center text-gray-400 py-8">
                        <FontAwesomeIcon icon={faCheckCircle} size="3x" className="mb-4 text-oGreen" />
                        <h4 className="text-xl text-white mb-2">All Systems Normal</h4>
                        <p>No active warnings or alarms detected.</p>
                        <p className="text-sm mt-2">Monitoring {notifications.length} notification paths</p>
                      </div>
                      
                      {showAllNotifications && notifications.length > 0 && (
                        <div className="bg-green-900/20 border-l-4 border-green-500 p-4">
                          <div className="flex items-center mb-2">
                            <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2" />
                            <h4 className="text-lg font-bold text-green-500">ALL NORMAL STATUS ({notifications.length})</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                            {notifications.map((n, idx) => (
                              <div key={idx} className="text-gray-300 bg-oGray3/30 p-2 rounded flex items-center">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2 text-xs" />
                                <span className="truncate" title={n.message}>
                                  {n.type.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-400 text-center">
                        Monitoring: notifications.propulsion.{instance === '0' ? '0/port/main' : instance === '1' ? '1/starboard' : instance}.*
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-4">
                    {hasAlarms && (
                      <div className="bg-red-900/30 border-l-4 border-red-500 p-4">
                        <div className="flex items-center mb-2">
                          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-2" />
                          <h4 className="text-lg font-bold text-red-500">CRITICAL ALARMS</h4>
                        </div>
                        <div className="space-y-2">
                          {notifications.filter(n => n.state === 'alarm' || n.state === 'emergency').map((n, idx) => (
                            <div key={idx} className="text-white bg-oGray3/50 p-2 rounded">
                              <div className="font-semibold">{n.type.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div className="text-sm text-gray-300">{n.message}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {hasWarnings && (
                      <div className="bg-yellow-900/30 border-l-4 border-yellow-500 p-4">
                        <div className="flex items-center mb-2">
                          <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 mr-2" />
                          <h4 className="text-lg font-bold text-yellow-500">WARNINGS</h4>
                        </div>
                        <div className="space-y-2">
                          {notifications.filter(n => n.state === 'alert' || n.state === 'warn').map((n, idx) => (
                            <div key={idx} className="text-white bg-oGray3/50 p-2 rounded">
                              <div className="font-semibold">{n.type.replace(/([A-Z])/g, ' $1').trim()}</div>
                              <div className="text-sm text-gray-300">{n.message}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {showAllNotifications && (
                      <div className="bg-green-900/20 border-l-4 border-green-500 p-4">
                        <div className="flex items-center mb-2">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2" />
                          <h4 className="text-lg font-bold text-green-500">NORMAL STATUS ({notifications.filter(n => n.state === 'normal').length})</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                          {notifications.filter(n => n.state === 'normal').map((n, idx) => (
                            <div key={idx} className="text-gray-300 bg-oGray3/30 p-2 rounded flex items-center">
                              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2 text-xs" />
                              <span className="truncate" title={n.message}>
                                {n.type.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-400">
                      Monitoring: notifications.propulsion.{instance === '0' ? '0/port/main' : instance === '1' ? '1/starboard' : instance}.*
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {debugMode && (
              <div className="bg-oGray2 rounded-lg p-4">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <FontAwesomeIcon icon={faWrench} className="mr-2 text-oBlue" />
                  Debug Information - All Paths
                </h3>
                <div className="space-y-2 text-sm font-mono">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="text-gray-400">propulsion.{selectedEngine}.revolutions:</div>
                    <div className="text-green-400">{getSignalKValue(`propulsion.${selectedEngine}.revolutions`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.runTime:</div>
                    <div className="text-green-400">{getSignalKValue(`propulsion.${selectedEngine}.runTime`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.coolantTemperature:</div>
                    <div className="text-green-400">{getSignalKValue(`propulsion.${selectedEngine}.coolantTemperature`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.coolantPressure:</div>
                    <div className="text-green-400">{getSignalKValue(`propulsion.${selectedEngine}.coolantPressure`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.oilPressure:</div>
                    <div className="text-green-400">{getSignalKValue(`propulsion.${selectedEngine}.oilPressure`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.oilTemperature:</div>
                    <div className="text-green-400">{getSignalKValue(`propulsion.${selectedEngine}.oilTemperature`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.exhaustTemperature:</div>
                    <div className="text-green-400">{getSignalKValue(`propulsion.${selectedEngine}.exhaustTemperature`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.intakeManifoldTemperature:</div>
                    <div className="text-green-400">{getSignalKValue(`propulsion.${selectedEngine}.intakeManifoldTemperature`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.boostPressure:</div>
                    <div className="text-green-400">{getSignalKValue(`propulsion.${selectedEngine}.boostPressure`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.load:</div>
                    <div className="text-green-400">{getSignalKValue(`propulsion.${selectedEngine}.load`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.torque:</div>
                    <div className="text-green-400">{getSignalKValue(`propulsion.${selectedEngine}.torque`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.state:</div>
                    <div className="text-green-400">{getSignalKValue(`propulsion.${selectedEngine}.state`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.fuel.rate:</div>
                    <div className="text-green-400">{getSignalKValue(`propulsion.${selectedEngine}.fuel.rate`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.fuel.pressure:</div>
                    <div className="text-green-400">{getSignalKValue(`propulsion.${selectedEngine}.fuel.pressure`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.transmission.gear:</div>
                    <div className="text-green-400">{getSignalKValue(`propulsion.${selectedEngine}.transmission.gear`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.transmission.oilPressure:</div>
                    <div className="text-green-400">{getSignalKValue(`propulsion.${selectedEngine}.transmission.oilPressure`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.transmission.oilTemperature:</div>
                    <div className="text-green-400">{getSignalKValue(`propulsion.${selectedEngine}.transmission.oilTemperature`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.tilt:</div>
                    <div className="text-green-400">{getSignalKValue(`propulsion.${selectedEngine}.tilt`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">electrical.batteries.0.voltage:</div>
                    <div className="text-green-400">{getSignalKValue('electrical.batteries.0.voltage') ?? 'null'}</div>
                    
                    <div className="text-gray-400">electrical.batteries.0.current:</div>
                    <div className="text-green-400">{getSignalKValue('electrical.batteries.0.current') ?? 'null'}</div>
                    
                    <div className="text-gray-400">electrical.alternators.{selectedEngine}.voltage:</div>
                    <div className="text-green-400">{getSignalKValue(`electrical.alternators.${selectedEngine}.voltage`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">electrical.alternators.{selectedEngine}.current:</div>
                    <div className="text-green-400">{getSignalKValue(`electrical.alternators.${selectedEngine}.current`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">tanks.fuel.0.currentLevel:</div>
                    <div className="text-green-400">{getSignalKValue('tanks.fuel.0.currentLevel') ?? 'null'}</div>
                    
                    <div className="text-gray-400">tanks.fuel.0.capacity:</div>
                    <div className="text-green-400">{getSignalKValue('tanks.fuel.0.capacity') ?? 'null'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MotorView;
