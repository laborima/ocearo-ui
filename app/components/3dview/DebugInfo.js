import React from 'react';
import { useOcearoContext } from '../context/OcearoContext';
import { Html } from '@react-three/drei';

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const DebugInfo = () => {
    const { getSignalKValue } = useOcearoContext();


    // Données envoyées par https://github.com/htool/signalk-polar-performance-plugin

    // *** Données de vent ***
    const trueWindAngle = getSignalKValue('environment.wind.angleTrueWater') || toRadians(25); // Angle du vent réel (TWA)
    const trueWindSpeed = getSignalKValue('environment.wind.speedTrue') || 20; // Vitesse du vent réel
    const appWindAngle = getSignalKValue('environment.wind.angleApparent') || toRadians(23); // Angle du vent apparent
    const appWindSpeed = getSignalKValue('environment.wind.speedApparent') || 25; // Vitesse du vent apparent

    // *** Performances de navigation ***
    const beatAngle = getSignalKValue('performance.beatAngle') || toRadians(45); // Angle de près
    const gybeAngle = getSignalKValue('performance.gybeAngle') || toRadians(135); // Angle d'empannage
    const beatVMG = getSignalKValue('performance.beatAngleVelocityMadeGood') || 6; // VMG en près
    const gybeVMG = getSignalKValue('performance.gybeAngleVelocityMadeGood') || 5; // VMG au portant
    const targetTWA = getSignalKValue('performance.targetAngle') || beatAngle; // Angle cible TWA (correspond à l'angle près ou arrière)
    const optimalWindAngle = targetTWA - trueWindAngle || toRadians(15); // Angle de vent optimal (différence entre TWA et direction du vent réel)
    const polarSpeed = getSignalKValue('performance.polarSpeed') || 8; // Vitesse polaire du bateau
    const polarSpeedRatio = getSignalKValue('performance.polarSpeedRatio') || 0.95; // Ratio de vitesse polaire (Performance polaire)
    // *** Données de vitesse et de performance ***
    const velocityMadeGood = getSignalKValue('performance.velocityMadeGood') || 5; // VMG actuel
    const speedThroughWater = getSignalKValue('navigation.speedThroughWater') || 7; // Vitesse à travers l'eau
    const polarVelocityMadeGood = getSignalKValue('performance.polarVelocityMadeGood') || 6; // VMG polaire
    const polarVelocityMadeGoodRatio = getSignalKValue('performance.polarVelocityMadeGoodRatio') || 0.9; // Ratio de VMG polaire


    // *** Cap et angle par rapport au waypoint ***
    const headingTrue = getSignalKValue('navigation.headingTrue') || toRadians(0); // Cap vrai
    const courseOverGroundAngle = getSignalKValue('navigation.courseOverGroundTrue') || toRadians(20); // Cap sur fond
    const nextWaypointBearing = getSignalKValue('navigation.courseGreatCircle.nextPoint.bearingTrue') || toRadians(30); // Cap vers le prochain waypoint
    const laylineAngle = getSignalKValue('performance.laylineAngle') || toRadians(10); // Angle de layline


    // *** Layline pour navigation de régate ***
    const layline = getSignalKValue('navigation.racing.lailine') || toRadians(10); // Layline parallèle au cap actuel
    const laylineDistance = getSignalKValue('navigation.racing.layline.distance') || 100; // Distance jusqu'à la layline
    const laylineTime = getSignalKValue('navigation.racing.layline.time') || 180; // Temps estimé pour atteindre la layline

    // *** Layline opposée pour la navigation de régate ***
    const oppositeLayline = getSignalKValue('navigation.racing.oppositeLayline') || toRadians(45); // Layline parallèle au cap actuel
    const oppositeLaylineDistance = getSignalKValue('navigation.racing.oppositeLayline.distance') || 80; // Distance jusqu'à la layline opposée
    const oppositeLaylineTime = getSignalKValue('navigation.racing.oppositeLayline.time') || 180; // Temps estimé pour atteindre la layline


    // *** Données de ligne de départ pour la régate ***
    const startLineStb = getSignalKValue('navigation.racing.startLineStb') || { latitude: 0, longitude: 0, altitude: 0 }; // Position de la marque de départ tribord
    const startLinePort = getSignalKValue('navigation.racing.startLinePort') || { latitude: 0, longitude: 0, altitude: 0 }; // Position de la marque de départ bâbord
    const distanceToStartline = getSignalKValue('navigation.racing.distanceStartline') || 50; // Distance jusqu'à la ligne de départ
    const timeToStart = getSignalKValue('navigation.racing.timeToStart') || 120; // Temps estimé pour atteindre la ligne de départ
    const timePortDown = getSignalKValue('navigation.racing.timePortDown') || 60; // Temps estimé en bâbord amure au vent arrière
    const timePortUp = getSignalKValue('navigation.racing.timePortUp') || 70; // Temps estimé en bâbord amure au près
    const timeStbdDown = getSignalKValue('navigation.racing.timeStbdDown') || 65; // Temps estimé en tribord amure au vent arrière
    const timeStbdUp = getSignalKValue('navigation.racing.timeStbdUp') || 75; // Temps estimé en tribord amure au près

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

