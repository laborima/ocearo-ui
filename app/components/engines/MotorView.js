import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOcearoContext } from '../context/OcearoContext';
import { useSignalKPath, useSignalKPaths } from '../hooks/useSignalK';
import configService from '../settings/ConfigService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt, faClock, faTemperatureHalf, faGaugeHigh, faGasPump,
  faWrench, faCogs, faBolt, faExclamationTriangle, faCheckCircle,
  faCar, faOilCan, faFire, faSnowflake, faBatteryFull, faChartLine,
  faWater, faRuler, faArrowUp, faArrowDown, faRotate, faFlask, faPlus,
  faEuroSign, faHistory
} from '@fortawesome/free-solid-svg-icons';

// Import utilities from MotorUtils.js
import * as MotorUtils from '../utils/MotorUtils';
// Import gauge components
import { CircularGauge, BarGauge, CompactDataField, PrimaryGauge } from './GaugeComponents';
// Import fuel log modal and utilities
import FuelLogModal from './FuelLogModal';
import { 
  addFuelLogEntry, 
  fetchFuelLogEntries, 
  calculateFuelStats, 
  estimateTankLevel,
  handleOcearoCoreError 
} from '../utils/OcearoCoreUtils';

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
  const debugMode = configService.get('debugMode');
  const [selectedEngine, setSelectedEngine] = useState('0');
  const [activeTab, setActiveTab] = useState('engine'); // engine, transmission, electrical, fuel, warnings
  const [availableEngines, setAvailableEngines] = useState([]);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  
  // Define all possible engine paths for subscription
  const enginePaths = useMemo(() => {
    const paths = [];
    const instances = ['0', '1', 'port', 'main', 'starboard'];
    const fields = [
      'revolutions', 'runTime', 'coolantTemperature', 'temperature', 
      'exhaustTemperature', 'coolantPressure', 'boostPressure', 
      'oilPressure', 'oilTemperature', 'fuel.rate', 'fuel.pressure', 
      'load', 'torque', 'intakeManifoldTemperature', 'tilt', 'state',
      'transmission.gear', 'transmission.oilPressure', 'transmission.oilTemperature'
    ];
    
    instances.forEach(inst => {
      fields.forEach(field => {
        paths.push(`propulsion.${inst}.${field}`);
      });
    });
    
    // Add electrical and tank paths
    paths.push(
      'electrical.batteries.0.voltage', 'electrical.batteries.0.current',
      'electrical.batteries.1.voltage', 'electrical.batteries.1.current',
      'electrical.alternators.0.voltage', 'electrical.alternators.1.voltage',
      'electrical.alternators.0.current', 'electrical.alternators.1.current',
      'tanks.fuel.0.currentLevel', 'tanks.fuel.0.capacity'
    );
    
    return paths;
  }, []);

  const skValues = useSignalKPaths(enginePaths);
  const position = useSignalKPath('navigation.position');

  // Helper function to get value with fallbacks from subscribed data
  const getSKValue = useCallback((path) => {
    return skValues[path] ?? null;
  }, [skValues]);

  // Get available engines
  const getAvailableEngines = useCallback(() => {
    const engines = [];
    for (let i = 0; i <= 1; i++) {
      let rpm = getSKValue(`propulsion.${i}.revolutions`);
      let runTime = getSKValue(`propulsion.${i}.runTime`);
      
      if (i === 0 && (rpm === null && runTime === null)) {
        rpm = getSKValue('propulsion.port.revolutions') ?? getSKValue('propulsion.main.revolutions');
        runTime = getSKValue('propulsion.port.runTime') ?? getSKValue('propulsion.main.runTime');
      } else if (i === 1 && (rpm === null && runTime === null)) {
        rpm = getSKValue('propulsion.starboard.revolutions');
        runTime = getSKValue('propulsion.starboard.runTime');
      }
      
      if (rpm !== null || runTime !== null || debugMode) {
        engines.push({
          id: i.toString(),
          name: i === 0 ? 'Port/Main Engine' : 'Starboard Engine',
          hasData: rpm !== null || runTime !== null
        });
      }
    }
    return engines.length > 0 ? engines : [{ id: '0', name: 'Main Engine', hasData: false }];
  }, [getSKValue, debugMode]);

  useEffect(() => {
    setAvailableEngines(getAvailableEngines());
  }, [getAvailableEngines]);

  // Helper function to get engine value with instance fallbacks
  const getEngineValue = useCallback((field) => {
    const instance = selectedEngine;
    let value = getSKValue(`propulsion.${instance}.${field}`);
    
    if (value === null && instance === '0') {
      value = getSKValue(`propulsion.port.${field}`) ?? getSKValue(`propulsion.main.${field}`);
    } else if (value === null && instance === '1') {
      value = getSKValue(`propulsion.starboard.${field}`);
    }
    
    return value;
  }, [selectedEngine, getSKValue]);

  // Get comprehensive engine data
  const engineData = useMemo(() => {
    const instance = selectedEngine;
    const coolantTemperatureKelvin = getEngineValue('coolantTemperature') ?? getEngineValue('temperature') ?? getSKValue('propulsion.port.temperature');
    const exhaustTemperatureKelvin = getEngineValue('exhaustTemperature') ?? getSKValue('propulsion.main.exhaustTemperature');
    
    return {
      // Primary Engine Data
      rpm: MotorUtils.hzToRPM(getEngineValue('revolutions')),
      runTime: MotorUtils.formatEngineHours(getEngineValue('runTime')),
      coolantTemp: MotorUtils.kelvinToCelsius(coolantTemperatureKelvin),
      coolantPressure: MotorUtils.pascalsToBar(getEngineValue('coolantPressure')),
      boostPressure: MotorUtils.pascalsToBar(getEngineValue('boostPressure')),
      oilPressure: MotorUtils.pascalsToBar(getEngineValue('oilPressure')),
      oilTemp: MotorUtils.kelvinToCelsius(getEngineValue('oilTemperature')),
      fuelRate: MotorUtils.m3sToLitersPerHour(getEngineValue('fuel.rate')),
      fuelPressure: MotorUtils.pascalsToBar(getEngineValue('fuel.pressure')),
      load: MotorUtils.ratioToPercent(getEngineValue('load')),
      torque: MotorUtils.ratioToPercent(getEngineValue('torque')),
      exhaustTemp: MotorUtils.kelvinToCelsius(exhaustTemperatureKelvin),
      intakeTemp: MotorUtils.kelvinToCelsius(getEngineValue('intakeManifoldTemperature')),
      tilt: MotorUtils.radiansToDegrees(getEngineValue('tilt')),
      state: getEngineValue('state'),
      
      // Transmission Data
      gear: getEngineValue('transmission.gear'),
      transOilPressure: MotorUtils.pascalsToBar(getEngineValue('transmission.oilPressure')),
      transOilTemp: MotorUtils.kelvinToCelsius(getEngineValue('transmission.oilTemperature')),
      
      // Electrical Data
      batteryVoltage: getSKValue('electrical.batteries.0.voltage'),
      batteryCurrent: getSKValue('electrical.batteries.0.current'),
      alternatorVoltage: getSKValue(`electrical.alternators.${instance}.voltage`) ?? getSKValue('propulsion.port.alternatorVoltage'),
      alternatorCurrent: getSKValue(`electrical.alternators.${instance}.current`) ?? getSKValue('propulsion.port.alternatorCurrent'),
      
      // Fuel Tank Data
      fuelLevel: MotorUtils.ratioToPercent(getSKValue('tanks.fuel.0.currentLevel')),
      fuelCapacity: getSKValue('tanks.fuel.0.capacity'),
    };
  }, [selectedEngine, getEngineValue, getSKValue]);
  
  const houseBatteryCurrentRaw = getSKValue('electrical.batteries.1.current');
  const houseBatteryCurrent = typeof houseBatteryCurrentRaw === 'number'
    ? Math.round(houseBatteryCurrentRaw * 10) / 10
    : houseBatteryCurrentRaw;

  // Get current engine hours in hours (runTime is in seconds)
  const currentEngineHoursRaw = getEngineValue('runTime');
  const currentEngineHours = currentEngineHoursRaw !== null 
    ? currentEngineHoursRaw / 3600 
    : null;

  // Fuel log state
  const [showFuelLogModal, setShowFuelLogModal] = useState(false);
  const [fuelLogEntries, setFuelLogEntries] = useState([]);
  const [fuelStats, setFuelStats] = useState(null);
  const [fuelLogLoading, setFuelLogLoading] = useState(false);
  const [fuelLogError, setFuelLogError] = useState(null);

  // Fetch fuel log entries on mount and when tab changes to fuel
  const loadFuelLogEntries = useCallback(async () => {
    setFuelLogLoading(true);
    setFuelLogError(null);
    try {
      const entries = await fetchFuelLogEntries();
      setFuelLogEntries(entries);
      const stats = calculateFuelStats(entries, engineData.fuelCapacity);
      setFuelStats(stats);
    } catch (error) {
      const errorMessage = handleOcearoCoreError(error, 'Fuel log fetch');
      setFuelLogError(errorMessage);
      setFuelLogEntries([]);
      setFuelStats(null);
    } finally {
      setFuelLogLoading(false);
    }
  }, [engineData.fuelCapacity]);

  useEffect(() => {
    if (activeTab === 'fuel') {
      loadFuelLogEntries();
    }
  }, [activeTab, loadFuelLogEntries]);

  // Handle fuel log save
  const handleFuelLogSave = useCallback(async (fuelData) => {
    setFuelLogLoading(true);
    setFuelLogError(null);
    try {
      await addFuelLogEntry(fuelData, position);
      setShowFuelLogModal(false);
      await loadFuelLogEntries();
    } catch (error) {
      const errorMessage = handleOcearoCoreError(error, 'Fuel log save');
      setFuelLogError(errorMessage);
    } finally {
      setFuelLogLoading(false);
    }
  }, [position, loadFuelLogEntries]);

  // Get last refill engine hours for the modal
  const lastRefillEngineHours = fuelStats?.lastRefill?.engineHours || null;

  // Calculate tank estimation based on fuel logs
  const tankEstimation = estimateTankLevel(
    fuelLogEntries,
    currentEngineHours,
    engineData.fuelCapacity,
    engineData.fuelLevel !== null ? engineData.fuelLevel / 100 : null
  );

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
                    value={getSKValue('electrical.batteries.1.voltage')}
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
            {/* Header with Log Fuel Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center">
                <FontAwesomeIcon icon={faGasPump} className="mr-2 text-oYellow" />
                Fuel System
              </h3>
              <button
                onClick={() => setShowFuelLogModal(true)}
                className="bg-oBlue hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                disabled={fuelLogLoading}
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Log Refill
              </button>
            </div>

            {/* Error Message */}
            {fuelLogError && (
              <div className="bg-red-900/30 border border-red-500 text-red-400 p-3 rounded-lg">
                {fuelLogError}
              </div>
            )}

            {/* Fuel Consumption Gauges */}
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

            {/* Fuel Tank Details */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faFlask} className="mr-2 text-oBlue" />
                Tank Details
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

            {/* Consumption Statistics */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faChartLine} className="mr-2 text-oGreen" />
                Consumption Statistics
              </h3>
              {fuelLogLoading ? (
                <div className="text-center text-gray-400 py-4">Loading...</div>
              ) : fuelStats && fuelStats.refillCount > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <CompactDataField
                    label="Average Consumption"
                    value={fuelStats.averageConsumption}
                    unit="L/h"
                    icon={faChartLine}
                  />
                  <CompactDataField
                    label="Total Refills"
                    value={fuelStats.refillCount}
                    icon={faHistory}
                  />
                  <CompactDataField
                    label="Total Liters"
                    value={fuelStats.totalLiters}
                    unit="L"
                    icon={faGasPump}
                  />
                  <CompactDataField
                    label="Total Cost"
                    value={fuelStats.totalCost}
                    unit="€"
                    icon={faEuroSign}
                  />
                </div>
              ) : (
                <div className="bg-oGray2 rounded-lg p-4 text-center text-gray-400">
                  <FontAwesomeIcon icon={faGasPump} className="text-3xl mb-2" />
                  <p>No fuel log entries yet.</p>
                  <p className="text-sm">Click &quot;Log Refill&quot; to start tracking your fuel consumption.</p>
                </div>
              )}
            </div>

            {/* Tank Estimation based on logs */}
            {tankEstimation && (tankEstimation.estimatedLiters !== null || tankEstimation.hoursRemaining !== null) && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <FontAwesomeIcon icon={faFlask} className="mr-2 text-purple-400" />
                  Estimated Tank Level (based on logs)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {tankEstimation.estimatedLiters !== null && (
                    <CompactDataField
                      label="Estimated Remaining"
                      value={tankEstimation.estimatedLiters}
                      unit="L"
                      icon={faFlask}
                    />
                  )}
                  {tankEstimation.estimatedPercent !== null && (
                    <CompactDataField
                      label="Estimated Level"
                      value={tankEstimation.estimatedPercent}
                      unit="%"
                      icon={faFlask}
                      warningThreshold={30}
                      criticalThreshold={15}
                      reversed={true}
                    />
                  )}
                  {tankEstimation.hoursRemaining !== null && (
                    <CompactDataField
                      label="Hours Remaining"
                      value={tankEstimation.hoursRemaining}
                      unit="h"
                      icon={faClock}
                      warningThreshold={10}
                      criticalThreshold={5}
                      reversed={true}
                    />
                  )}
                  {tankEstimation.hoursSinceLastRefill !== undefined && (
                    <CompactDataField
                      label="Hours Since Refill"
                      value={tankEstimation.hoursSinceLastRefill}
                      unit="h"
                      icon={faClock}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Recent Fuel Log Entries */}
            {fuelLogEntries.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <FontAwesomeIcon icon={faHistory} className="mr-2 text-gray-400" />
                  Recent Refills
                </h3>
                <div className="bg-oGray2 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-oGray">
                      <tr>
                        <th className="text-white p-3 text-left">Date</th>
                        <th className="text-white p-3 text-left">Liters</th>
                        <th className="text-white p-3 text-left">Cost</th>
                        <th className="text-white p-3 text-left">Engine Hours</th>
                        <th className="text-white p-3 text-left">Additive</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fuelLogEntries.slice(-5).reverse().map((entry, index) => {
                        const fuel = entry.fuel || {};
                        return (
                          <tr key={entry.datetime || index} className="border-b border-gray-700 text-white">
                            <td className="p-3">
                              {new Date(entry.datetime).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="p-3">{fuel.liters} L</td>
                            <td className="p-3">{fuel.cost} €</td>
                            <td className="p-3">{fuel.engineHoursAtRefill} h</td>
                            <td className="p-3">
                              {fuel.additive ? (
                                <span className="text-purple-400">
                                  <FontAwesomeIcon icon={faFlask} className="mr-1" />
                                  Yes
                                </span>
                              ) : (
                                <span className="text-gray-500">No</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
                  let notification = getSKValue(`notifications.propulsion.${instance}.${type}`);
                  
                  // Try named instances if not found
                  if (!notification && instance === '0') {
                    notification = getSKValue(`notifications.propulsion.port.${type}`) 
                               ?? getSKValue(`notifications.propulsion.main.${type}`);
                  } else if (!notification && instance === '1') {
                    notification = getSKValue(`notifications.propulsion.starboard.${type}`);
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
                    <div className="text-green-400">{getSKValue(`propulsion.${selectedEngine}.revolutions`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.runTime:</div>
                    <div className="text-green-400">{getSKValue(`propulsion.${selectedEngine}.runTime`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.coolantTemperature:</div>
                    <div className="text-green-400">{getSKValue(`propulsion.${selectedEngine}.coolantTemperature`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.coolantPressure:</div>
                    <div className="text-green-400">{getSKValue(`propulsion.${selectedEngine}.coolantPressure`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.oilPressure:</div>
                    <div className="text-green-400">{getSKValue(`propulsion.${selectedEngine}.oilPressure`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.oilTemperature:</div>
                    <div className="text-green-400">{getSKValue(`propulsion.${selectedEngine}.oilTemperature`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.exhaustTemperature:</div>
                    <div className="text-green-400">{getSKValue(`propulsion.${selectedEngine}.exhaustTemperature`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.intakeManifoldTemperature:</div>
                    <div className="text-green-400">{getSKValue(`propulsion.${selectedEngine}.intakeManifoldTemperature`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.boostPressure:</div>
                    <div className="text-green-400">{getSKValue(`propulsion.${selectedEngine}.boostPressure`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.load:</div>
                    <div className="text-green-400">{getSKValue(`propulsion.${selectedEngine}.load`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.torque:</div>
                    <div className="text-green-400">{getSKValue(`propulsion.${selectedEngine}.torque`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.state:</div>
                    <div className="text-green-400">{getSKValue(`propulsion.${selectedEngine}.state`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.fuel.rate:</div>
                    <div className="text-green-400">{getSKValue(`propulsion.${selectedEngine}.fuel.rate`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.fuel.pressure:</div>
                    <div className="text-green-400">{getSKValue(`propulsion.${selectedEngine}.fuel.pressure`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.transmission.gear:</div>
                    <div className="text-green-400">{getSKValue(`propulsion.${selectedEngine}.transmission.gear`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.transmission.oilPressure:</div>
                    <div className="text-green-400">{getSKValue(`propulsion.${selectedEngine}.transmission.oilPressure`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.transmission.oilTemperature:</div>
                    <div className="text-green-400">{getSKValue(`propulsion.${selectedEngine}.transmission.oilTemperature`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">propulsion.{selectedEngine}.tilt:</div>
                    <div className="text-green-400">{getSKValue(`propulsion.${selectedEngine}.tilt`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">electrical.batteries.0.voltage:</div>
                    <div className="text-green-400">{getSKValue('electrical.batteries.0.voltage') ?? 'null'}</div>
                    
                    <div className="text-gray-400">electrical.batteries.0.current:</div>
                    <div className="text-green-400">{getSKValue('electrical.batteries.0.current') ?? 'null'}</div>
                    
                    <div className="text-gray-400">electrical.alternators.{selectedEngine}.voltage:</div>
                    <div className="text-green-400">{getSKValue(`electrical.alternators.${selectedEngine}.voltage`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">electrical.alternators.{selectedEngine}.current:</div>
                    <div className="text-green-400">{getSKValue(`electrical.alternators.${selectedEngine}.current`) ?? 'null'}</div>
                    
                    <div className="text-gray-400">tanks.fuel.0.currentLevel:</div>
                    <div className="text-green-400">{getSKValue('tanks.fuel.0.currentLevel') ?? 'null'}</div>
                    
                    <div className="text-gray-400">tanks.fuel.0.capacity:</div>
                    <div className="text-green-400">{getSKValue('tanks.fuel.0.capacity') ?? 'null'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fuel Log Modal */}
      <FuelLogModal
        isOpen={showFuelLogModal}
        onClose={() => setShowFuelLogModal(false)}
        onSave={handleFuelLogSave}
        currentEngineHours={currentEngineHours}
        lastRefillEngineHours={lastRefillEngineHours}
        loading={fuelLogLoading}
      />
    </div>
  );
};

export default MotorView;
