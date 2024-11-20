import React, { useMemo,useState } from 'react';
import { Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { Line, Sphere,Html } from '@react-three/drei';
import { rotateVector, toRadians,useOcearoContext } from '../../context/OcearoContext';

// https://rowlandsmarine.co.uk/content/LightHouse-14-New-features-MFD-EN.pdf?srsltid=AfmBOopyiml7Nf4PGYyXNhgn62p22dUF-u1GnSxFero1xWwljZGYpClX

/**
 *  Laylines are used in sailing to show how far the
 vessel must sail on the current tack in order to make
 the target waypoint after tacking, given present
 wind conditions. Laylines are based on the True
 Wind Direction (TWD) and fixed or polar upwind
 and downwind sailing angles. Sailing along laylines
 maximizes your Velocity Made Good (VMG) to
 windward.
 Laylines are displayed under the following conditions:
 • The Boat Type setting is set to one of the available
 sailing vessels
 • The vessel is under active navigation towards a
 waypoint
 • The layline path to the destination point is less
 than 150 nm
 • The angle between port and starboard laylines is
 less than 170
 */

const LayLines3D = ({outerRadius}) => {
    const { getSignalKValue } = useOcearoContext();


    const [showLaylines, setShowLaylines] = useState(false);

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
    const courseOverGroundAngle = getSignalKValue('navigation.courseOverGround') || toRadians(10); // Cap sur fond
    const nextWaypointBearing = getSignalKValue('navigation.courseGreatCircle.nextPoint.bearingTrue') || toRadians(30); // Cap vers le prochain waypoint
    const laylineAngle = getSignalKValue('performance.laylineAngle') || toRadians(10); // Angle de layline


    // *** Layline pour navigation de régate ***
    const layline = getSignalKValue('navigation.racing.lailine') || beatAngle; // Layline parallèle au cap actuel
    const laylineDistance = getSignalKValue('navigation.racing.layline.distance') || 100; // Distance jusqu'à la layline
    const laylineTime = getSignalKValue('navigation.racing.layline.time') || 180; // Temps estimé pour atteindre la layline

    // *** Layline opposée pour la navigation de régate ***
    const oppositeLayline = getSignalKValue('navigation.racing.oppositeLayline') || toRadians(45); // Layline parallèle au cap actuel
    const oppositeLaylineDistance = getSignalKValue('navigation.racing.oppositeLayline.distance') || 80; // Distance jusqu'à la layline opposée
    const oppositeLaylineTime = getSignalKValue('navigation.racing.oppositeLayline.time') || 180; // Temps estimé pour atteindre la layline



    // Constants for angles (in radians) and distance
    const tackAngle = 2 * trueWindAngle;                 // Tack angle, 45 degrees
    const waypointAngle = nextWaypointBearing;             // Waypoint angle, 30 degrees
    const waypointDistance = 20;                   // Distance to waypoint


    const layLineAngle = layline;
    const laylineTackAngle = 2 * (trueWindAngle + layLineAngle);


    // Calculate waypoint and course position


    const DE = waypointDistance * Math.cos(waypointAngle);

    const DC = DE / Math.cos(Math.PI / 2 - tackAngle)
    const EC = Math.sin(Math.PI / 2 - tackAngle) * DC;


    const BE = waypointDistance * Math.sin(waypointAngle);
    const BC = BE - EC;


    const waypointPosition = rotateVector(new Vector3(
        DE,
        BE,
        0
    ));

    const waypointCirclePosition = rotateVector(new Vector3(
        outerRadius * Math.cos(waypointAngle),
        outerRadius * Math.sin(waypointAngle),
        0
    ));

    const oppositeTackLinePosition = rotateVector(new Vector3(DE, EC, 0));
    const courseLinePosition = rotateVector(new Vector3(0, BC, 0));

    //Calculate layline position

/*    const DC2 = DE / Math.cos(Math.PI / 2 - laylineTackAngle)
    const EC2 = Math.sin(Math.PI / 2 - laylineTackAngle) * DC2;
    const BE2 = waypointDistance * Math.sin(waypointAngle);
    const BC2 = BE2 - EC2;


    const oppositeLaylineEndPosition = rotateVector(new Vector3(
        outerRadius * Math.cos(laylineTackAngle),
        outerRadius * Math.sin(laylineTackAngle),
        0));
    const laylineEndPosition = rotateVector(new Vector3(
        outerRadius * Math.cos(layLineAngle),
        outerRadius * Math.sin(layLineAngle),
        0));*/

    // Function to create points for a dashed semicircle
    const createSemiCirclePoints = (radius, angleStart, angleEnd, segments = 50) => {
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const angle = angleStart + ((angleEnd - angleStart) * i) / segments;
            points.push(rotateVector(new Vector3(radius * Math.cos(angle), radius * Math.sin(angle), 0)));
        }
        return points;
    };



    // Create points for layline dashed semicircle

    const laylineSemiCirclePoints = useMemo(() => createSemiCirclePoints(laylineDistance, 0, Math.PI), [laylineDistance]);


    const boatPosition = new Vector3(0, 0, 0);

    return (
        <group>
            <mesh position={waypointPosition}>
                <coneGeometry args={[0.5, 1, 32]} />
                <meshStandardMaterial color="orange" />
            </mesh>

            {/* Waypoint Indicator */}
            
            <Sphere
                position={waypointCirclePosition.toArray()}
                args={[0.2, 16,16]}
                rotation={[Math.PI / 2, 0, 0]}
                material-color="orange"
            />

            {/* Laylines and Course Lines */}
            <Line points={[boatPosition, courseLinePosition]} color="green" lineWidth={5} />
            <Line points={[boatPosition, oppositeTackLinePosition]} color="red" lineWidth={5} />
            <Line points={[oppositeTackLinePosition, waypointPosition]} color="green" lineWidth={5} />
            <Line points={[courseLinePosition, waypointPosition]} color="red" lineWidth={5} />

            {/* Laylines with Dashed Pattern */}
            <Line points={[boatPosition, rotateVector(new Vector3(
                (outerRadius+5) * Math.cos(beatAngle),
                (outerRadius+5) * Math.sin(beatAngle),
                0
            ))]} color="green" lineWidth={5} dashed dashSize={0.2} gapSize={0.2} />
            <Line points={[boatPosition, rotateVector(new Vector3(
                (outerRadius+5) * Math.cos(2 * beatAngle),
                (outerRadius+5) * Math.sin(2 * beatAngle),
                0
            ))]} color="red" lineWidth={5} dashed dashSize={0.2} gapSize={0.2} />

            {/* Dashed Semicircle to show layline distance */}
            <Line points={laylineSemiCirclePoints} color="blue" lineWidth={2} dashed dashSize={0.2} gapSize={0.2} />

            {/* Optional: Text indicator for layline time */}
            <Html position={[laylineDistance / 2, laylineDistance / 4, 0]}>
                <div style={{ color: 'blue', background: 'rgba(255, 255, 255, 0.7)', padding: '4px', borderRadius: '4px' }}>
                    {`Time to Layline: ${laylineTime}s`}
                </div>
            </Html>
        </group>
    );
};

export default LayLines3D;

