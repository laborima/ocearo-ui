import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
import { useTranslation } from 'react-i18next';
import { 
  addFuelLogEntry, 
  fetchFuelLogEntries, 
  calculateFuelStats, 
  estimateTankLevel,
  handleOcearoCoreError 
} from '../utils/OcearoCoreUtils';

// Helper component for displaying individual data points
const DataField = ({ label, value, unit, icon, statusClass = 'text-hud-main' }) => {
  const displayValue = (value === null || value === undefined || value === 'NaN') ? 'N/A' : `${value}${unit ? ` ${unit}` : ''}`;
  
  return (
    <div className="tesla-card p-3 tesla-hover border border-hud bg-hud-bg">
      <div className="flex items-center text-hud-secondary text-xs font-black mb-1 uppercase tracking-widest">
        {icon && <FontAwesomeIcon icon={icon} className="mr-2 fa-fw text-xs" />}
        {label}
      </div>
      <div className={`font-black text-xl gliding-value ${statusClass}`}>
        {displayValue}
      </div>
    </div>
  );
};

const MotorView = () => {
  const { t } = useTranslation();
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
          name: i === 0 ? t('motor.portMainEngine') : t('motor.starboardEngine'),
          hasData: rpm !== null || runTime !== null
        });
      }
    }
    return engines.length > 0 ? engines : [{ id: '0', name: t('motor.mainEngine'), hasData: false }];
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
    <div className="flex flex-col h-full bg-rightPaneBg overflow-hidden">
      {/* Tab Navigation - Tesla Style */}
      <div className="flex border-b border-hud bg-hud-bg">
        {[
          { id: 'engine', label: t('motor.engine'), icon: faCar },
          { id: 'transmission', label: t('motor.transmission'), icon: faCogs },
          { id: 'electrical', label: t('motor.electrical'), icon: faBolt },
          { id: 'fuel', label: t('motor.fuel'), icon: faGasPump },
          { id: 'warnings', label: t('motor.warnings'), icon: faExclamationTriangle }
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

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-auto scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="p-3"
          >
        {activeTab === 'engine' && (
          <div className="space-y-3">
            {/* Engine Selection and Primary Metrics */}
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-black text-hud-main uppercase tracking-[0.2em] flex items-center">
                <div className="w-2 h-2 rounded-full bg-oBlue mr-3 animate-soft-pulse" />
                {t('motor.propulsionSystems')}
              </h2>

              <select
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value)}
                className="bg-hud-elevated px-4 py-1.5 rounded-sm text-hud-main text-xs font-black uppercase border border-hud focus:outline-none tesla-hover transition-all duration-500 shadow-soft"
              >
                {availableEngines.map((engine) => (
                  <option key={engine.id} value={engine.id} className="bg-oNight">
                    {engine.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <PrimaryGauge
                label={t('motor.propulsionSpeed')}
                value={engineData.rpm}
                unit="RPM"
                icon={faTachometerAlt}
                max={4000}
                warningThreshold={3000}
                criticalThreshold={3500}
              />
              <div className="tesla-card p-4 text-center tesla-hover flex flex-col justify-center bg-hud-bg border border-hud">
                <FontAwesomeIcon icon={faClock} className="text-lg text-hud-dim mb-2 opacity-50" />
                <div className="text-3xl font-black text-hud-main leading-none gliding-value tracking-tighter">
                  {engineData.runTime || t('common.na')}
                </div>
                <div className="text-hud-secondary text-xs font-black uppercase mt-2 tracking-[0.2em]">{t('motor.serviceHours')}</div>
              </div>
              <CircularGauge
                label={t('motor.load')}
                value={engineData.load}
                unit="%"
                min={0}
                max={100}
                icon={faChartLine}
                warningThreshold={70}
                criticalThreshold={85}
                size={100}
              />
              <CircularGauge
                label={t('motor.torque')}
                value={engineData.torque}
                unit="%"
                min={0}
                max={100}
                icon={faRotate}
                warningThreshold={75}
                criticalThreshold={90}
                size={100}
              />
            </div>

            {/* Temperature Monitoring - Circular Gauges */}
            <div>
              <h3 className="text-xs font-black text-hud-main mb-1 uppercase tracking-widest flex items-center">
                <FontAwesomeIcon icon={faTemperatureHalf} className="mr-2 text-orange-500 text-xs" />
                {t('motor.temperatureSection')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <CircularGauge
                  label={t('motor.coolant')}
                  value={engineData.coolantTemp}
                  unit="°C"
                  min={0}
                  max={120}
                  icon={faSnowflake}
                  warningThreshold={85}
                  criticalThreshold={95}
                  size={90}
                />
                <CircularGauge
                  label={t('motor.oil')}
                  value={engineData.oilTemp}
                  unit="°C"
                  min={0}
                  max={150}
                  icon={faOilCan}
                  warningThreshold={110}
                  criticalThreshold={130}
                  size={90}
                />
                <CircularGauge
                  label={t('motor.exhaust')}
                  value={engineData.exhaustTemp}
                  unit="°C"
                  min={0}
                  max={600}
                  icon={faFire}
                  warningThreshold={450}
                  criticalThreshold={550}
                  size={90}
                />
                <CircularGauge
                  label={t('motor.intake')}
                  value={engineData.intakeTemp}
                  unit="°C"
                  min={0}
                  max={100}
                  icon={faArrowDown}
                  warningThreshold={60}
                  criticalThreshold={80}
                  size={90}
                />
              </div>
            </div>

            {/* Pressure Systems - Bar Gauges */}
            <div>
              <h3 className="text-xs font-black text-hud-main mb-1 uppercase tracking-widest flex items-center">
                <FontAwesomeIcon icon={faGaugeHigh} className="mr-2 text-oBlue text-xs" />
                {t('motor.pressures')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <BarGauge
                  label={t('motor.oil')}
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
                  label={t('motor.coolant')}
                  value={engineData.coolantPressure}
                  unit="bar"
                  min={0}
                  max={3}
                  icon={faWater}
                  showMinMax={true}
                />
                <BarGauge
                  label={t('motor.boost')}
                  value={engineData.boostPressure}
                  unit="bar"
                  min={0}
                  max={2.5}
                  icon={faArrowUp}
                  showMinMax={true}
                />
                <BarGauge
                  label={t('motor.fuel')}
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
            <div className="grid grid-cols-3 gap-2">
              <CompactDataField
                label={t('motor.state')}
                value={engineData.state || t('motor.unknown')}
                icon={faCar}
              />
              <CompactDataField
                label={t('motor.tilt')}
                value={engineData.tilt}
                unit="°"
                icon={faRuler}
              />
              <CompactDataField
                label={t('motor.fuelRate')}
                value={engineData.fuelRate}
                unit="L/h"
                icon={faGasPump}
              />
            </div>
          </div>
        )}

        {activeTab === 'transmission' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="tesla-card p-4 text-center tesla-hover flex flex-col justify-center bg-hud-bg border border-hud">
                <FontAwesomeIcon icon={faCogs} className="text-xl text-hud-dim mb-2 opacity-50" />
                <div className="text-hud-secondary text-xs font-black uppercase mb-2 tracking-[0.2em]">{t('motor.transmissionGear')}</div>
                <div className="text-3xl font-black text-hud-main uppercase gliding-value tracking-tighter">
                  {engineData.gear === -1 ? t('motor.reverse') : 
                   engineData.gear === 0 ? t('motor.neutral') : 
                   engineData.gear ? `${t('motor.forward')} ${engineData.gear}` : t('common.na')}
                </div>
              </div>
              
              <CircularGauge
                label={t('motor.oilPressure')}
                value={engineData.transOilPressure}
                unit="bar"
                min={0}
                max={6}
                icon={faOilCan}
                warningThreshold={2.5}
                criticalThreshold={2}
                size={120}
              />
              
              <CircularGauge
                label={t('motor.oilTemperature')}
                value={engineData.transOilTemp}
                unit="°C"
                min={0}
                max={120}
                icon={faTemperatureHalf}
                warningThreshold={85}
                criticalThreshold={95}
                size={120}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <BarGauge
                label={t('motor.hydraulicPressure')}
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
                label={t('motor.thermalAnalysis')}
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
          <div className="space-y-4">
            {/* Battery Systems */}
            <div>
              <h3 className="text-xs font-black text-hud-main mb-2 uppercase tracking-[0.2em] flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-oBlue mr-3" />
                {t('motor.energyDistribution')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-hud-muted uppercase tracking-widest px-1">{t('motor.ignitionBank')}</h4>
                  <BarGauge
                    label={t('motor.voltageNode')}
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
                    label={t('motor.amperageLoad')}
                    value={engineData.batteryCurrent}
                    unit="A"
                    min={-50}
                    max={50}
                    icon={faBolt}
                    showMinMax={true}
                  />
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-hud-muted uppercase tracking-widest px-1">{t('motor.serviceBank')}</h4>
                  <BarGauge
                    label={t('motor.voltageNode')}
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
                    label={t('motor.amperageLoad')}
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
              <h3 className="text-xs font-black text-hud-main mb-2 uppercase tracking-[0.2em] flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-oYellow mr-3" />
                {t('motor.chargingSystems')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CircularGauge
                  label={t('motor.alternatorOutput')}
                  value={engineData.alternatorVoltage}
                  unit="V"
                  min={10}
                  max={16}
                  icon={faBolt}
                  warningThreshold={15}
                  criticalThreshold={15.5}
                  size={120}
                />
                <CircularGauge
                  label={t('motor.chargeIntensity')}
                  value={engineData.alternatorCurrent}
                  unit="A"
                  min={0}
                  max={100}
                  icon={faBolt}
                  size={120}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fuel' && (
          <div className="space-y-4">
            {/* Header with Log Fuel Button */}
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-black text-hud-main uppercase tracking-[0.2em] flex items-center">
                <div className="w-2 h-2 rounded-full bg-oYellow mr-3 animate-soft-pulse" />
                {t('motor.resourceManagement')}
              </h3>
              <button
                onClick={() => setShowFuelLogModal(true)}
                className="bg-oBlue hover:bg-blue-600 text-hud-main px-4 py-1.5 rounded-sm text-xs font-black uppercase tracking-widest transition-all duration-500 flex items-center shadow-lg shadow-oBlue/20"
                disabled={fuelLogLoading}
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2 text-xs" />
                {t('motor.registerRefill')}
              </button>
            </div>

            {/* Error Message */}
            {fuelLogError && (
              <div className="tesla-card bg-oRed/10 border border-oRed/20 text-oRed p-4 rounded-sm text-xs font-black uppercase tracking-widest animate-soft-pulse">
                {t('motor.nodeError')} {fuelLogError}
              </div>
            )}

            {/* Fuel Consumption Gauges */}
            <div className="grid grid-cols-3 gap-3">
              <CircularGauge
                label={t('motor.consumptionRate')}
                value={engineData.fuelRate}
                unit="L/h"
                min={0}
                max={50}
                icon={faGasPump}
                size={100}
              />
              <CircularGauge
                label={t('motor.injectionPressure')}
                value={engineData.fuelPressure}
                unit="bar"
                min={0}
                max={5}
                icon={faGaugeHigh}
                warningThreshold={2.5}
                criticalThreshold={2}
                size={100}
              />
              <CircularGauge
                label={t('motor.primaryReservoir')}
                value={engineData.fuelLevel}
                unit="%"
                min={0}
                max={100}
                icon={faFlask}
                warningThreshold={30}
                criticalThreshold={15}
                size={100}
              />
            </div>

            {/* Fuel Tank Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-hud-main mb-1 uppercase tracking-[0.2em] flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-oBlue mr-3" />
                {t('motor.telemetryDetails')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <BarGauge
                  label={t('motor.levelPercentage')}
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
                  label={t('motor.totalCapacity')}
                  value={engineData.fuelCapacity?.toFixed(0)}
                  unit="L"
                  icon={faFlask}
                />
              </div>
              
              {engineData.fuelLevel !== null && engineData.fuelCapacity !== null && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <CompactDataField
                    label={t('motor.currentVolume')}
                    value={((engineData.fuelLevel / 100) * engineData.fuelCapacity).toFixed(0)}
                    unit="L"
                    icon={faFlask}
                  />
                  <CompactDataField
                    label={t('motor.enduranceEst')}
                    value={engineData.fuelRate > 0 && engineData.fuelLevel !== null && engineData.fuelCapacity !== null
                      ? (((engineData.fuelLevel / 100) * engineData.fuelCapacity) / engineData.fuelRate).toFixed(1)
                      : 'N/A'}
                    unit={engineData.fuelRate > 0 ? 'h' : ''}
                    icon={faClock}
                  />
                </div>
              )}
            </div>

            {/* Tank Estimation */}
            {tankEstimation && (
              <div className="tesla-card p-4 bg-hud-bg border border-hud">
                <h3 className="text-xs font-black text-hud-main mb-3 uppercase tracking-[0.2em] flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-oGreen mr-3" />
                  {t('motor.predictiveAnalysis')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {tankEstimation.litersRemaining !== null && (
                    <CompactDataField
                      label={t('motor.estimatedVolume')}
                      value={tankEstimation.litersRemaining}
                      unit="L"
                      icon={faGasPump}
                    />
                  )}
                  {tankEstimation.levelPercentage !== null && (
                    <BarGauge
                      label={t('motor.computedLevel')}
                      value={tankEstimation.levelPercentage}
                      unit="%"
                      min={0}
                      max={100}
                      icon={faFlask}
                      warningThreshold={30}
                      criticalThreshold={15}
                      reversed={true}
                    />
                  )}
                  {tankEstimation.hoursRemaining !== null && (
                    <CompactDataField
                      label={t('motor.timeToExhaustion')}
                      value={tankEstimation.hoursRemaining}
                      unit="h"
                      icon={faClock}
                      warningThreshold={10}
                      criticalThreshold={5}
                      reversed={true}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Recent Fuel Log Entries */}
            {fuelLogEntries.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-black text-hud-main mb-1 uppercase tracking-[0.2em] flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-hud-muted mr-3" />
                  {t('motor.logHistory')}
                </h3>
                <div className="tesla-card overflow-hidden shadow-soft transition-all duration-500 border border-hud bg-hud-bg">
                  <table className="w-full text-xs font-black uppercase tracking-widest">
                    <thead className="bg-hud-elevated">
                      <tr>
                        <th className="text-hud-muted p-4 text-left font-black">{t('motor.meridianDate')}</th>
                        <th className="text-hud-muted p-4 text-left font-black">{t('motor.liters')}</th>
                        <th className="text-hud-muted p-4 text-left font-black">{t('motor.refillCost')}</th>
                        <th className="text-hud-muted p-4 text-left font-black">{t('motor.hmr')}</th>
                        <th className="text-hud-muted p-4 text-left font-black">{t('motor.avgConsumption')}</th>
                        <th className="text-hud-muted p-4 text-left font-black">{t('motor.fuelAutonomy')}</th>
                        <th className="text-hud-muted p-4 text-center font-black">{t('motor.additive')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hud">
                      {fuelLogEntries.slice(-5).reverse().map((entry, index) => {
                        const fuel = entry.fuel || {};
                        const entryConsumption = (fuel.liters && fuel.hoursSinceLastRefill && fuel.hoursSinceLastRefill > 0)
                          ? Math.round((fuel.liters / fuel.hoursSinceLastRefill) * 10) / 10
                          : null;
                        const entryAutonomy = (entryConsumption && engineData.fuelCapacity && fuel.liters)
                          ? Math.round((fuel.liters / entryConsumption) * 10) / 10
                          : null;
                        return (
                          <tr key={entry.datetime || index} className="text-hud-main tesla-hover group">
                            <td className="p-4 opacity-60 group-hover:opacity-100 transition-opacity">
                              {new Date(entry.datetime).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="p-4 gliding-value text-oBlue">{fuel.liters} L</td>
                            <td className="p-4 gliding-value">{fuel.cost != null ? `${fuel.cost} €` : '—'}</td>
                            <td className="p-4 gliding-value opacity-60">{fuel.engineHoursAtRefill} h</td>
                            <td className="p-4 gliding-value text-oYellow">
                              {entryConsumption != null ? `${entryConsumption} L/h` : '—'}
                            </td>
                            <td className="p-4 gliding-value text-oGreen">
                              {entryAutonomy != null ? `${entryAutonomy} h` : '—'}
                            </td>
                            <td className="p-4 text-center">
                              {fuel.additive ? (
                                <span className="text-purple-400 animate-soft-pulse">
                                  <FontAwesomeIcon icon={faFlask} className="text-xs" />
                                </span>
                              ) : (
                                <span className="text-hud-dim font-black">—</span>
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
          <div className="space-y-4">
            <div className="tesla-card p-4 bg-hud-bg border border-hud">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-hud-main uppercase tracking-[0.2em] flex items-center">
                  <div className="w-2 h-2 rounded-full bg-oRed mr-3 animate-soft-pulse" />
                  {t('motor.warningsSummary')}
                </h3>
                <button
                  onClick={() => setShowAllNotifications(!showAllNotifications)}
                  className="px-4 py-1.5 text-xs bg-hud-elevated text-hud-secondary rounded-sm font-black uppercase tracking-widest tesla-hover border border-hud transition-all duration-500 shadow-soft"
                >
                  {showAllNotifications ? t('motor.notificationLog') : t('motor.notificationLog')}
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
                  let notification = getSKValue(`notifications.propulsion.${instance}.${type}`);
                  
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
                      <div className="text-center text-hud-secondary py-8 tesla-card bg-hud-bg border border-hud">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-4xl mb-4 text-oGreen/40 animate-soft-pulse" />
                        <h4 className="text-sm font-black text-hud-main uppercase tracking-[0.2em]">{t('motor.allSystemsNominal')}</h4>
                        <p className="text-xs font-black mt-2 uppercase text-hud-muted tracking-widest opacity-60">{t('motor.noActiveWarnings')}</p>
                      </div>
                      
                      {showAllNotifications && notifications.length > 0 && (
                        <div className="tesla-card p-4 bg-oGreen/5 border border-oGreen/10 shadow-soft">
                          <h4 className="text-xs font-black text-oGreen mb-3 uppercase tracking-[0.2em] flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-oGreen mr-3" />
                            HEALTHY TELEMETRY NODES ({notifications.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-black uppercase tracking-tight">
                            {notifications.map((n, idx) => (
                              <div key={idx} className="text-hud-secondary flex items-center bg-hud-elevated p-3 rounded-sm tesla-hover border border-hud">
                                <FontAwesomeIcon icon={faCheckCircle} className="text-oGreen mr-3 text-xs opacity-40" />
                                <span className="truncate opacity-60">{n.type.replace(/([A-Z])/g, ' $1').trim()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-8">
                    {hasAlarms && (
                      <div className="bg-oRed/5 border border-oRed/20 p-6 rounded-sm shadow-soft animate-soft-pulse">
                        <h4 className="text-xs font-black text-oRed mb-6 uppercase tracking-[0.2em] flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-oRed mr-3" />
                          CRITICAL NODE ALARMS
                        </h4>
                        <div className="space-y-4">
                          {notifications.filter(n => n.state === 'alarm' || n.state === 'emergency').map((n, idx) => (
                            <div key={idx} className="text-hud-main text-xs font-black uppercase tracking-widest bg-oRed/10 p-4 rounded-sm tesla-hover border border-oRed/20">
                              <div className="flex justify-between items-center">
                                <span className="text-xs">{n.type.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="text-oRed text-xs font-black tracking-tighter">ALERT LEVEL 3</span>
                              </div>
                              <div className="text-hud-secondary text-xs mt-3 normal-case font-black tracking-normal opacity-80">{n.message}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {hasWarnings && (
                      <div className="bg-oYellow/5 border border-oYellow/20 p-6 rounded-sm shadow-soft">
                        <h4 className="text-xs font-black text-oYellow mb-6 uppercase tracking-[0.2em] flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-oYellow mr-3" />
                          SYSTEM ANOMALIES
                        </h4>
                        <div className="space-y-4">
                          {notifications.filter(n => n.state === 'alert' || n.state === 'warn').map((n, idx) => (
                            <div key={idx} className="text-hud-main text-xs font-black uppercase tracking-widest bg-oYellow/10 p-4 rounded-sm tesla-hover border border-oYellow/20">
                              <div className="flex justify-between items-center">
                                <span className="text-xs">{n.type.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <span className="text-oYellow text-xs font-black tracking-tighter">WARN LEVEL 2</span>
                              </div>
                              <div className="text-hud-secondary text-xs mt-3 normal-case font-black tracking-normal opacity-80">{n.message}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            
            {debugMode && (
              <div className="tesla-card p-8 bg-hud-bg border border-hud">
                <h3 className="text-xs font-black text-oBlue mb-6 uppercase tracking-[0.3em] flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-oBlue mr-3" />
                  Internal Debug Telemetry
                </h3>
                <div className="space-y-4 text-xs font-black font-mono text-hud-secondary uppercase tracking-widest">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <span className="text-hud-muted">PATH.REVOLUTIONS:</span>
                    <span className="text-oGreen opacity-80">propulsion.{selectedEngine}.revs</span>
                    <span className="text-hud-muted">VALUE.REVOLUTIONS:</span>
                    <span className="text-hud-main gliding-value">{getSKValue(`propulsion.${selectedEngine}.revolutions`) ?? 'NULL'}</span>
                    
                    <div className="col-span-2 my-4 border-t border-hud"></div>
                    
                    <span className="text-hud-muted">PATH.TEMPERATURE:</span>
                    <span className="text-oGreen opacity-80">propulsion.{selectedEngine}.temp</span>
                    <span className="text-hud-muted">VALUE.TEMPERATURE:</span>
                    <span className="text-hud-main gliding-value">{getSKValue(`propulsion.${selectedEngine}.coolantTemperature`) ?? 'NULL'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
          </motion.div>
        </AnimatePresence>
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
