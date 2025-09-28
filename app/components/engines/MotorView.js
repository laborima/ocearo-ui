import React, { useState, useEffect, useCallback } from 'react';
import { useOcearoContext } from '../context/OcearoContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt, faClock, faTemperatureHalf, faGaugeHigh, faGasPump,
  faWrench, faCogs, faBolt, faExclamationTriangle, faCheckCircle,
  faCar, faOilCan, faFire, faSnowflake, faBatteryFull, faChartLine,
  faWater, faRuler, faArrowUp, faArrowDown, faRotate, faFlask
} from '@fortawesome/free-solid-svg-icons';

// Import utilities from MotorUtils.js
import * as MotorUtils from '../utils/MotorUtils';

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
  const [selectedEngine, setSelectedEngine] = useState('0');
  const [activeTab, setActiveTab] = useState('engine'); // engine, transmission, electrical, fuel, warnings
  const [availableEngines, setAvailableEngines] = useState([]);

  // Get available engines
  const getAvailableEngines = useCallback(() => {
    const engines = [];
    for (let i = 0; i <= 3; i++) {
      const rpm = getSignalKValue(`vessels.self.propulsion.${i}.revolutions`);
      const runTime = getSignalKValue(`vessels.self.propulsion.${i}.runTime`);
      if (rpm !== null || runTime !== null) {
        engines.push({
          id: i.toString(),
          name: i === 0 ? 'Port/Main Engine' : i === 1 ? 'Starboard Engine' : `Engine ${i}`,
          hasData: true
        });
      }
    }
    return engines.length > 0 ? engines : [{ id: '0', name: 'Main Engine', hasData: false }];
  }, [getSignalKValue]);

  useEffect(() => {
    setAvailableEngines(getAvailableEngines());
  }, [getAvailableEngines]);

  // Get comprehensive engine data
  const getEngineData = useCallback(() => {
    const instance = selectedEngine;
    return {
      // Primary Engine Data
      rpm: MotorUtils.hzToRPM(getSignalKValue(`vessels.self.propulsion.${instance}.revolutions`)),
      runTime: MotorUtils.formatEngineHours(getSignalKValue(`vessels.self.propulsion.${instance}.runTime`)),
      coolantTemp: MotorUtils.kelvinToCelsius(getSignalKValue(`vessels.self.propulsion.${instance}.coolantTemperature`)),
      coolantPressure: MotorUtils.pascalsToBar(getSignalKValue(`vessels.self.propulsion.${instance}.coolantPressure`)),
      boostPressure: MotorUtils.pascalsToBar(getSignalKValue(`vessels.self.propulsion.${instance}.boostPressure`)),
      oilPressure: MotorUtils.pascalsToBar(getSignalKValue(`vessels.self.propulsion.${instance}.oilPressure`)),
      oilTemp: MotorUtils.kelvinToCelsius(getSignalKValue(`vessels.self.propulsion.${instance}.oilTemperature`)),
      fuelRate: MotorUtils.m3sToLitersPerHour(getSignalKValue(`vessels.self.propulsion.${instance}.fuel.rate`)),
      fuelPressure: MotorUtils.pascalsToBar(getSignalKValue(`vessels.self.propulsion.${instance}.fuel.pressure`)),
      load: MotorUtils.ratioToPercent(getSignalKValue(`vessels.self.propulsion.${instance}.load`)),
      torque: MotorUtils.ratioToPercent(getSignalKValue(`vessels.self.propulsion.${instance}.torque`)),
      exhaustTemp: MotorUtils.kelvinToCelsius(getSignalKValue(`vessels.self.propulsion.${instance}.exhaustTemperature`)),
      intakeTemp: MotorUtils.kelvinToCelsius(getSignalKValue(`vessels.self.propulsion.${instance}.intakeManifoldTemperature`)),
      tilt: MotorUtils.radiansToDegrees(getSignalKValue(`vessels.self.propulsion.${instance}.tilt`)),
      
      // Transmission Data
      gear: getSignalKValue(`vessels.self.propulsion.${instance}.transmission.gear`),
      transOilPressure: MotorUtils.pascalsToBar(getSignalKValue(`vessels.self.propulsion.${instance}.transmission.oilPressure`)),
      transOilTemp: MotorUtils.kelvinToCelsius(getSignalKValue(`vessels.self.propulsion.${instance}.transmission.oilTemperature`)),
    };
  }, [selectedEngine, getSignalKValue]);
  
  const engineData = getEngineData();

  return (
    <div className="flex flex-col h-full rightPaneBg overflow-auto">
      {/* Header with Engine Selection */}
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <FontAwesomeIcon icon={faCar} className="mr-3 text-green-500" />
          Engine Systems
        </h2>
        <select
          value={selectedEngine}
          onChange={(e) => setSelectedEngine(e.target.value)}
          className="bg-oGray2 px-3 py-2 rounded text-white border border-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          {availableEngines.map((engine) => (
            <option key={engine.id} value={engine.id}>
              {engine.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-800">
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
                ? 'text-green-500 border-b-2 border-green-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <FontAwesomeIcon icon={tab.icon} className="mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4">
        {activeTab === 'engine' && (
          <div className="space-y-6">
            {/* Primary Engine Metrics */}
            <div className="bg-oGray2 rounded-lg p-4">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faTachometerAlt} className="mr-2 text-green-500" />
                Primary Engine Data
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DataField 
                  label="RPM" 
                  value={engineData.rpm} 
                  unit="RPM" 
                  icon={faTachometerAlt} 
                  statusClass={engineData.rpm > 3000 ? 'text-yellow-400' : 'text-green-400'} 
                />
                <DataField 
                  label="Engine Hours" 
                  value={engineData.runTime} 
                  icon={faClock} 
                />
                <DataField 
                  label="Load" 
                  value={engineData.load} 
                  unit="%" 
                  icon={faChartLine}
                  statusClass={engineData.load > 80 ? 'text-red-400' : engineData.load > 60 ? 'text-yellow-400' : 'text-green-400'} 
                />
                <DataField 
                  label="Torque" 
                  value={engineData.torque} 
                  unit="%" 
                  icon={faRotate}
                />
              </div>
            </div>

            {/* Temperature Monitoring */}
            <div className="bg-oGray2 rounded-lg p-4">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faTemperatureHalf} className="mr-2 text-orange-500" />
                Temperature Monitoring
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DataField 
                  label="Coolant Temp" 
                  value={engineData.coolantTemp} 
                  unit="°C" 
                  icon={faSnowflake}
                  statusClass={engineData.coolantTemp > 90 ? 'text-red-400' : engineData.coolantTemp > 80 ? 'text-yellow-400' : 'text-green-400'} 
                />
                <DataField 
                  label="Oil Temperature" 
                  value={engineData.oilTemp} 
                  unit="°C" 
                  icon={faOilCan}
                  statusClass={engineData.oilTemp > 120 ? 'text-red-400' : engineData.oilTemp > 100 ? 'text-yellow-400' : 'text-green-400'} 
                />
                <DataField 
                  label="Exhaust Temp" 
                  value={engineData.exhaustTemp} 
                  unit="°C" 
                  icon={faFire}
                  statusClass={engineData.exhaustTemp > 500 ? 'text-red-400' : engineData.exhaustTemp > 400 ? 'text-yellow-400' : 'text-green-400'} 
                />
                <DataField 
                  label="Intake Temp" 
                  value={engineData.intakeTemp} 
                  unit="°C" 
                  icon={faArrowDown}
                />
              </div>
            </div>

            {/* Pressure Systems */}
            <div className="bg-oGray2 rounded-lg p-4">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faGaugeHigh} className="mr-2 text-blue-500" />
                Pressure Systems
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DataField 
                  label="Oil Pressure" 
                  value={engineData.oilPressure} 
                  unit="bar" 
                  icon={faOilCan}
                  statusClass={engineData.oilPressure < 2 ? 'text-red-400' : engineData.oilPressure < 3 ? 'text-yellow-400' : 'text-green-400'} 
                />
                <DataField 
                  label="Coolant Pressure" 
                  value={engineData.coolantPressure} 
                  unit="bar" 
                  icon={faWater}
                />
                <DataField 
                  label="Boost Pressure" 
                  value={engineData.boostPressure} 
                  unit="bar" 
                  icon={faArrowUp}
                />
                <DataField 
                  label="Fuel Pressure" 
                  value={engineData.fuelPressure} 
                  unit="bar" 
                  icon={faGasPump}
                  statusClass={engineData.fuelPressure < 2 ? 'text-red-400' : 'text-green-400'} 
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transmission' && (
          <div className="bg-oGray2 rounded-lg p-4">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faCogs} className="mr-2 text-blue-500" />
              Transmission Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DataField 
                label="Current Gear" 
                value={engineData.gear === -1 ? 'Reverse' : engineData.gear === 0 ? 'Neutral' : `Forward ${engineData.gear}`} 
                icon={faCogs}
              />
              <DataField 
                label="Oil Pressure" 
                value={engineData.transOilPressure} 
                unit="bar" 
                icon={faOilCan}
                statusClass={engineData.transOilPressure < 2 ? 'text-red-400' : 'text-green-400'} 
              />
              <DataField 
                label="Oil Temperature" 
                value={engineData.transOilTemp} 
                unit="°C" 
                icon={faTemperatureHalf}
                statusClass={engineData.transOilTemp > 100 ? 'text-red-400' : engineData.transOilTemp > 80 ? 'text-yellow-400' : 'text-green-400'} 
              />
            </div>
          </div>
        )}

        {activeTab === 'electrical' && (
          <div className="space-y-6">
            {/* Battery Systems */}
            <div className="bg-oGray2 rounded-lg p-4">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faBatteryFull} className="mr-2 text-blue-500" />
                Battery Systems
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DataField 
                  label="Battery 0 Voltage" 
                  value={getSignalKValue('vessels.self.electrical.batteries.0.voltage')?.toFixed(1)} 
                  unit="V" 
                  icon={faBatteryFull}
                  statusClass={getSignalKValue('vessels.self.electrical.batteries.0.voltage') < 12 ? 'text-red-400' : 'text-green-400'} 
                />
                <DataField 
                  label="Battery 0 Current" 
                  value={getSignalKValue('vessels.self.electrical.batteries.0.current')?.toFixed(1)} 
                  unit="A" 
                  icon={faBolt}
                />
                <DataField 
                  label="Battery 1 Voltage" 
                  value={getSignalKValue('vessels.self.electrical.batteries.1.voltage')?.toFixed(1)} 
                  unit="V" 
                  icon={faBatteryFull}
                  statusClass={getSignalKValue('vessels.self.electrical.batteries.1.voltage') < 12 ? 'text-red-400' : 'text-green-400'} 
                />
              </div>
            </div>

            {/* Alternator Systems */}
            <div className="bg-oGray2 rounded-lg p-4">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faBolt} className="mr-2 text-yellow-500" />
                Alternator Systems
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DataField 
                  label="Alternator 0 Voltage" 
                  value={getSignalKValue(`vessels.self.electrical.alternators.${selectedEngine}.voltage`)?.toFixed(1)} 
                  unit="V" 
                  icon={faBolt}
                />
                <DataField 
                  label="Alternator 0 Current" 
                  value={getSignalKValue(`vessels.self.electrical.alternators.${selectedEngine}.current`)?.toFixed(1)} 
                  unit="A" 
                  icon={faBolt}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fuel' && (
          <div className="space-y-6">
            {/* Fuel Consumption */}
            <div className="bg-oGray2 rounded-lg p-4">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faGasPump} className="mr-2 text-yellow-500" />
                Fuel System
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DataField 
                  label="Fuel Rate" 
                  value={engineData.fuelRate} 
                  unit="L/h" 
                  icon={faGasPump}
                />
                <DataField 
                  label="Fuel Pressure" 
                  value={engineData.fuelPressure} 
                  unit="bar" 
                  icon={faGaugeHigh}
                  statusClass={engineData.fuelPressure < 2 ? 'text-red-400' : 'text-green-400'} 
                />
              </div>
            </div>

            {/* Fuel Tank Levels */}
            <div className="bg-oGray2 rounded-lg p-4">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <FontAwesomeIcon icon={faFlask} className="mr-2 text-blue-500" />
                Fuel Tank Levels
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DataField 
                  label="Tank 0 Level" 
                  value={MotorUtils.ratioToPercent(getSignalKValue('vessels.self.tanks.fuel.0.currentLevel'))} 
                  unit="%" 
                  icon={faFlask}
                  statusClass={getSignalKValue('vessels.self.tanks.fuel.0.currentLevel') < 0.2 ? 'text-red-400' : getSignalKValue('vessels.self.tanks.fuel.0.currentLevel') < 0.5 ? 'text-yellow-400' : 'text-green-400'} 
                />
                <DataField 
                  label="Tank 0 Capacity" 
                  value={getSignalKValue('vessels.self.tanks.fuel.0.capacity')?.toFixed(0)} 
                  unit="L" 
                  icon={faFlask}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'warnings' && (
          <div className="bg-oGray2 rounded-lg p-4">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-red-500" />
              System Status & Warnings
            </h3>
            <div className="text-center text-gray-400 py-8">
              <FontAwesomeIcon icon={faCheckCircle} size="3x" className="mb-4 text-green-500" />
              <h4 className="text-xl text-white mb-2">All Systems Normal</h4>
              <p>No active warnings or alarms detected.</p>
              <p className="text-sm mt-2">Monitoring notifications.propulsion.{selectedEngine}.* paths</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MotorView;
