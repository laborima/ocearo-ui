
import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { useSignalKPaths } from '../hooks/useSignalK';
import { Html } from '@react-three/drei';

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const DebugInfo = (sampleData = true) => {
    // Define all paths for subscription
    const debugPaths = useMemo(() => [
        'environment.wind.angleTrueWater',
        'environment.wind.speedTrue',
        'environment.wind.angleApparent',
        'environment.wind.speedApparent',
        'performance.beatAngle',
        'performance.gybeAngle',
        'performance.beatAngleVelocityMadeGood',
        'performance.gybeAngleVelocityMadeGood',
        'performance.targetAngle',
        'performance.polarSpeed',
        'performance.polarSpeedRatio',
        'performance.velocityMadeGood',
        'navigation.speedThroughWater',
        'performance.polarVelocityMadeGood',
        'performance.polarVelocityMadeGoodRatio',
        'navigation.headingTrue',
        'navigation.courseOverGroundTrue',
        'navigation.courseGreatCircle.nextPoint.bearingTrue',
        'performance.laylineAngle',
        'navigation.racing.lailine',
        'navigation.racing.layline.distance',
        'navigation.racing.layline.time',
        'navigation.racing.oppositeLayline',
        'navigation.racing.oppositeLayline.distance',
        'navigation.racing.oppositeLayline.time',
        'navigation.racing.startLineStb',
        'navigation.racing.startLinePort',
        'navigation.racing.distanceStartline',
        'navigation.racing.timeToStart',
        'navigation.racing.timePortDown',
        'navigation.racing.timePortUp',
        'navigation.racing.timeStbdDown',
        'navigation.racing.timeStbdUp'
    ], []);

    const skValues = useSignalKPaths(debugPaths);

    // Helper to get value with fallback
    const getVal = (path, fallback) => skValues[path] ?? fallback;

    // *** Données de vent ***
    const trueWindAngle = getVal('environment.wind.angleTrueWater', toRadians(25));
    const trueWindSpeed = getVal('environment.wind.speedTrue', 20);
    const appWindAngle = getVal('environment.wind.angleApparent', toRadians(23));
    const appWindSpeed = getVal('environment.wind.speedApparent', 25);

    // *** Performances de navigation ***
    const beatAngle = getVal('performance.beatAngle', toRadians(45));
    const gybeAngle = getVal('performance.gybeAngle', toRadians(135));
    const beatVMG = getVal('performance.beatAngleVelocityMadeGood', 6);
    const gybeVMG = getVal('performance.gybeAngleVelocityMadeGood', 5);
    const targetTWA = getVal('performance.targetAngle', beatAngle);
    const optimalWindAngle = targetTWA - trueWindAngle;
    const polarSpeed = getVal('performance.polarSpeed', 8);
    const polarSpeedRatio = getVal('performance.polarSpeedRatio', 0.95);
    
    // *** Données de vitesse et de performance ***
    const velocityMadeGood = getVal('performance.velocityMadeGood', 5);
    const speedThroughWater = getVal('navigation.speedThroughWater', 7);
    const polarVelocityMadeGood = getVal('performance.polarVelocityMadeGood', 6);
    const polarVelocityMadeGoodRatio = getVal('performance.polarVelocityMadeGoodRatio', 0.9);

    // *** Cap et angle par rapport au waypoint ***
    const headingTrue = getVal('navigation.headingTrue', toRadians(0));
    const courseOverGroundAngle = getVal('navigation.courseOverGroundTrue', toRadians(20));
    const nextWaypointBearing = getVal('navigation.courseGreatCircle.nextPoint.bearingTrue', toRadians(30));
    const laylineAngle = getVal('performance.laylineAngle', toRadians(10));

    // *** Layline pour navigation de régate ***
    const layline = getVal('navigation.racing.lailine', toRadians(10));
    const laylineDistance = getVal('navigation.racing.layline.distance', 100);
    const laylineTime = getVal('navigation.racing.layline.time', 180);

    // *** Layline opposée pour la navigation de régate ***
    const oppositeLayline = getVal('navigation.racing.oppositeLayline', toRadians(45));
    const oppositeLaylineDistance = getVal('navigation.racing.oppositeLayline.distance', 80);
    const oppositeLaylineTime = getVal('navigation.racing.oppositeLayline.time', 180);

    // *** Données de ligne de départ pour la régate ***
    const startLineStb = getVal('navigation.racing.startLineStb', { latitude: 0, longitude: 0, altitude: 0 });
    const startLinePort = getVal('navigation.racing.startLinePort', { latitude: 0, longitude: 0, altitude: 0 });
    const distanceToStartline = getVal('navigation.racing.distanceStartline', 50);
    const timeToStart = getVal('navigation.racing.timeToStart', 120);
    const timePortDown = getVal('navigation.racing.timePortDown', 60);
    const timePortUp = getVal('navigation.racing.timePortUp', 70);
    const timeStbdDown = getVal('navigation.racing.timeStbdDown', 65);
    const timeStbdUp = getVal('navigation.racing.timeStbdUp', 75);



    return (
        <group>

            <axesHelper args={[100]} />

            <Html position={[5, 5, 0]} style={{ width: '350px', color: 'white', background: 'rgba(0,0,0,0.6)', padding: '10px', borderRadius: '5px' }}>
                <div>
                    <h4>Wind Data</h4>
                    <p>True Wind Angle: {(trueWindAngle * (180 / Math.PI)).toFixed(2)}°</p>
                    <p>True Wind Speed: {trueWindSpeed.toFixed(2)} knots</p>
                    <p>Apparent Wind Angle: {(appWindAngle * (180 / Math.PI)).toFixed(2)}°</p>
                    <p>Apparent Wind Speed: {appWindSpeed.toFixed(2)} knots</p>

                    <h4>Navigation Performance</h4>
                    <p>Beat Angle: {(beatAngle * (180 / Math.PI)).toFixed(2)}°</p>
                    <p>Gybe Angle: {(gybeAngle * (180 / Math.PI)).toFixed(2)}°</p>
                    <p>VMG Beat: {beatVMG.toFixed(2)} knots</p>
                    <p>VMG Gybe: {gybeVMG.toFixed(2)} knots</p>
                    <p>Target TWA: {(targetTWA * (180 / Math.PI)).toFixed(2)}°</p>
                    <p>Optimal Wind Angle: {(optimalWindAngle * (180 / Math.PI)).toFixed(2)}°</p>
                    <p>Polar Speed: {polarSpeed.toFixed(2)} knots</p>
                    <p>Polar Speed Ratio: {polarSpeedRatio.toFixed(2)}</p>
                    <p>VMG: {velocityMadeGood.toFixed(2)} knots</p>
                    <p>Speed Through Water: {speedThroughWater.toFixed(2)} knots</p>
                    <p>Polar VMG: {polarVelocityMadeGood.toFixed(2)} knots</p>
                    <p>Polar VMG Ratio: {polarVelocityMadeGoodRatio.toFixed(2)}</p>

                    <h4>Waypoint and Heading</h4>
                    <p>True Heading: {(headingTrue * (180 / Math.PI)).toFixed(2)}°</p>
                    <p>COG Angle: {(courseOverGroundAngle * (180 / Math.PI)).toFixed(2)}°</p>
                    <p>Next Waypoint Bearing: {(nextWaypointBearing * (180 / Math.PI)).toFixed(2)}°</p>
                    <p>Layline Angle: {(laylineAngle * (180 / Math.PI)).toFixed(2)}°</p>

                    <h4>Layline Data</h4>
                    <p>Layline Distance: {laylineDistance.toFixed(2)} m</p>
                    <p>Time to Layline: {laylineTime} s</p>
                    <p>Opposite Layline Distance: {oppositeLaylineDistance.toFixed(2)} m</p>
                    <p>Time to Opposite Layline: {oppositeLaylineTime} s</p>

                    <h4>Starting Line Data</h4>
                    <p>Distance to Startline: {distanceToStartline.toFixed(2)} m</p>
                    <p>Time to Start: {timeToStart} s</p>
                    <p>Time Port Downwind: {timePortDown} s</p>
                    <p>Time Port Upwind: {timePortUp} s</p>
                    <p>Time Stbd Downwind: {timeStbdDown} s</p>
                    <p>Time Stbd Upwind: {timeStbdUp} s</p>
                </div>
            </Html>

        </group>
    );
};

export default DebugInfo;

