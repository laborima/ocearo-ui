/**
 * SampleData.js - Debug/demo data for Ocearo UI
 *
 * Contains realistic sample SignalK values used when debugMode is enabled
 * or when the SignalK server is unreachable. Extracted from OcearoContext
 * to keep the context provider focused on state management.
 */

import { MathUtils } from 'three';
import { toKelvin } from '../utils/UnitConversions';

/**
 * Interval in milliseconds between sample data updates
 */
export const SAMPLE_DATA_INTERVAL = 1000;

/**
 * Sample SignalK data grouped by domain
 */
export const SAMPLE_DATA = {
    wind: {
        'environment.wind.angleTrueWater': MathUtils.degToRad(0),
        'environment.wind.speedTrue': 10.288,
        'environment.wind.angleApparent': MathUtils.degToRad(0),
        'environment.wind.speedApparent': 10.288,
    },
    temperature: {
        'environment.water.temperature': toKelvin(17),
        'environment.outside.temperature': toKelvin(21),
        'propulsion.main.exhaustTemperature': toKelvin(95),
        'environment.inside.fridge.temperature': toKelvin(4),
    },
    environment: {
        'environment.outside.pressure': 102300,
        'environment.inside.relativeHumidity': 0.74,
        'environment.inside.voc': 0.03,
    },
    performance: {
        'performance.beatAngle': MathUtils.degToRad(45),
        'performance.gybeAngle': MathUtils.degToRad(135),
        'performance.beatAngleVelocityMadeGood': 6,
        'performance.gybeAngleVelocityMadeGood': 5,
        'performance.targetAngle': MathUtils.degToRad(45),
        'performance.polarSpeed': 8,
        'performance.polarSpeedRatio': 0.95,
        'performance.velocityMadeGood': 5,
        'performance.polarVelocityMadeGood': 6,
        'performance.polarVelocityMadeGoodRatio': 0.9,
    },
    navigation: {
        'navigation.speedThroughWater': 7,
        'navigation.headingTrue': MathUtils.degToRad(0),
        'navigation.courseOverGround': MathUtils.degToRad(20),
        'navigation.courseGreatCircle.nextPoint.bearingTrue': MathUtils.degToRad(30),
        'navigation.attitude': { "roll": MathUtils.degToRad(5), "pitch": MathUtils.degToRad(2), "yaw": MathUtils.degToRad(2) },
    },
    racing: {
        'navigation.racing.layline': MathUtils.degToRad(10),
        'navigation.racing.layline.distance': 100,
        'navigation.racing.layline.time': 180,
        'navigation.racing.oppositeLayline': MathUtils.degToRad(45),
        'navigation.racing.oppositeLayline.distance': 80,
        'navigation.racing.oppositeLayline.time': 180,
        'navigation.racing.startLineStb': { latitude: 0, longitude: 0, altitude: 0 },
        'navigation.racing.startLinePort': { latitude: 0, longitude: 0, altitude: 0 },
        'navigation.racing.distanceStartline': 50,
        'navigation.racing.timeToStart': 120,
        'navigation.racing.timePortDown': 60,
        'navigation.racing.timePortUp': 70,
        'navigation.racing.timeStbdDown': 65,
        'navigation.racing.timeStbdUp': 75,
    },
    electrical: {
        'electrical.batteries.1.name': 'House Battery',
        'electrical.batteries.1.location': 'Under Starboard Bed',
        'electrical.batteries.1.capacity.nominal': 768,
        'electrical.batteries.1.capacity.actual': 707,
        'electrical.batteries.1.capacity.remaining': 601,
        'electrical.batteries.1.capacity.dischargeLimit': 0.2,
        'electrical.batteries.1.capacity.timeRemaining': 9860,
        'electrical.batteries.1.lifetimeDischarge': 540000,
        'electrical.batteries.1.lifetimeRecharge': 545000,
        'electrical.batteries.1.voltage.ripple': 0.05,
        'electrical.batteries.1.chemistry': 'LeadAcid',
        'electrical.batteries.1.manufacturer.name': 'VARTA',
        'electrical.batteries.1.manufacturer.model': 'Professional Dual Purpose RA 595 985',
        'electrical.batteries.1.manufacturer.URL': 'https://www.varta-automotive.com',
        'electrical.batteries.1.dateInstalled': '2020-06-15T00:00:00Z',
        'electrical.batteries.1.associatedBus': 'House Bus',
        'electrical.batteries.1.voltage': 12.6,
        'electrical.batteries.1.current': -2.3,

        'electrical.batteries.0.name': 'Engine Start Battery',
        'electrical.batteries.0.location': 'Engine Compartment',
        'electrical.batteries.0.capacity.nominal': 888,
        'electrical.batteries.0.capacity.actual': 861,
        'electrical.batteries.0.chemistry': 'LeadAcid',
        'electrical.batteries.0.manufacturer.name': 'VARTA',
        'electrical.batteries.0.manufacturer.model': 'Blue Dynamic E11',
        'electrical.batteries.0.manufacturer.URL': 'https://www.varta-automotive.com',
        'electrical.batteries.0.dateInstalled': '2022-04-10T00:00:00Z',
        'electrical.batteries.0.associatedBus': 'Start Bus',
        'electrical.batteries.0.voltage': 12.4,
        'electrical.batteries.0.current': 0.1,

        'electrical.alternators.0.voltage': 14.2,
        'electrical.alternators.0.current': 35.5,

        'navigation.lights': false,
        'steering.autopilot.state': 'auto',
    },
    propulsion: {
        'propulsion.0.revolutions': 25,
        'propulsion.0.runTime': 125000,
        'propulsion.0.coolantTemperature': 353.15,
        'propulsion.0.coolantPressure': 180000,
        'propulsion.0.oilPressure': 350000,
        'propulsion.0.oilTemperature': 363.15,
        'propulsion.0.exhaustTemperature': 623.15,
        'propulsion.0.intakeManifoldTemperature': 313.15,
        'propulsion.0.boostPressure': 150000,
        'propulsion.0.load': 0.45,
        'propulsion.0.torque': 0.52,
        'propulsion.0.state': 'started',
        'propulsion.0.fuel.rate': 0.000002778,
        'propulsion.0.fuel.pressure': 280000,
        'propulsion.0.fuel.economyRate': 0.45,
        'propulsion.0.transmission.gear': 1,
        'propulsion.0.transmission.oilPressure': 320000,
        'propulsion.0.transmission.oilTemperature': 343.15,
        'propulsion.0.tilt': 0,

        'propulsion.1.revolutions': 26,
        'propulsion.1.runTime': 128000,
        'propulsion.1.coolantTemperature': 355.15,
        'propulsion.1.coolantPressure': 185000,
        'propulsion.1.oilPressure': 360000,
        'propulsion.1.oilTemperature': 365.15,
        'propulsion.1.exhaustTemperature': 633.15,
        'propulsion.1.intakeManifoldTemperature': 315.15,
        'propulsion.1.boostPressure': 155000,
        'propulsion.1.load': 0.48,
        'propulsion.1.torque': 0.54,
        'propulsion.1.state': 'started',
        'propulsion.1.fuel.rate': 0.000002917,
        'propulsion.1.fuel.pressure': 285000,
        'propulsion.1.transmission.gear': 1,
        'propulsion.1.transmission.oilPressure': 325000,
        'propulsion.1.transmission.oilTemperature': 345.15,
        'propulsion.1.tilt': 0,
    },
    tanks: {
        'tanks.fuel.0.currentLevel': 0.75,
        'tanks.fuel.0.capacity': 200,
        'tanks.fuel.0.currentVolume': 150,
        'tanks.fuel.0.type': 'fuel',
    },
};
