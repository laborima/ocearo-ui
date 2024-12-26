import React, {  useState } from 'react';
import { Vector3, MathUtils } from 'three';
import { Line, Sphere } from '@react-three/drei';
import { useOcearoContext } from '../../context/OcearoContext';


export function rotateVector(v) {
    return new Vector3(v.x, 0, -v.y);
}

const LayLines3D = ({ outerRadius }) => {
    const { getSignalKValue } = useOcearoContext();
    const [showLaylines, setShowLaylines] = useState(false);

    // Wind data
    const trueWindAngle = getSignalKValue('environment.wind.angleTrueWater') || MathUtils.degToRad(25); // True Wind Angle (TWA)
    const trueWindSpeed = getSignalKValue('environment.wind.speedTrue') || 20; // True Wind Speed
    const appWindAngle = getSignalKValue('environment.wind.angleApparent') || MathUtils.degToRad(23); // Apparent Wind Angle
    const appWindSpeed = getSignalKValue('environment.wind.speedApparent') || 25; // Apparent Wind Speed

    // Navigation performance
    const beatAngle = getSignalKValue('performance.beatAngle') || MathUtils.degToRad(45); // Beat Angle
    const gybeAngle = getSignalKValue('performance.gybeAngle') || MathUtils.degToRad(135); // Gybe Angle
    const beatVMG = getSignalKValue('performance.beatAngleVelocityMadeGood') || 6; // VMG on beat
    const gybeVMG = getSignalKValue('performance.gybeAngleVelocityMadeGood') || 5; // VMG on gybe
    const targetTWA = getSignalKValue('performance.targetAngle') || beatAngle; // Target True Wind Angle
    const optimalWindAngle = targetTWA - trueWindAngle || MathUtils.degToRad(15); // Optimal Wind Angle
    const polarSpeed = getSignalKValue('performance.polarSpeed') || 8; // Polar Speed of the boat
    const polarSpeedRatio = getSignalKValue('performance.polarSpeedRatio') || 0.95; // Polar Speed Ratio
    const velocityMadeGood = getSignalKValue('performance.velocityMadeGood') || 5; // Current VMG
    const speedThroughWater = getSignalKValue('navigation.speedThroughWater') || 7; // Speed Through Water
    const polarVelocityMadeGood = getSignalKValue('performance.polarVelocityMadeGood') || 6; // Polar VMG
    const polarVelocityMadeGoodRatio = getSignalKValue('performance.polarVelocityMadeGoodRatio') || 0.9; // Polar VMG Ratio

    // Course data
    const headingTrue = getSignalKValue('navigation.headingTrue') || MathUtils.degToRad(0); // True Heading
    const courseOverGroundAngle = getSignalKValue('navigation.courseOverGround') || MathUtils.degToRad(10); // Course Over Ground
    const nextWaypointBearing = getSignalKValue('navigation.courseGreatCircle.nextPoint.bearingTrue') || MathUtils.degToRad(30); // Bearing to next waypoint
    const laylineAngle = getSignalKValue('performance.laylineAngle') || MathUtils.degToRad(10); // Layline Angle

    // Racing data
    const layline = getSignalKValue('navigation.racing.layline') || beatAngle; // Layline angle for racing
    const laylineDistance = getSignalKValue('navigation.racing.layline.distance') || 100; // Distance to layline
    const laylineTime = getSignalKValue('navigation.racing.layline.time') || 180; // Time to reach layline
    const oppositeLayline = getSignalKValue('navigation.racing.oppositeLayline') || MathUtils.degToRad(45); // Opposite layline angle
    const oppositeLaylineDistance = getSignalKValue('navigation.racing.oppositeLayline.distance') || 80; // Distance to opposite layline
    const oppositeLaylineTime = getSignalKValue('navigation.racing.oppositeLayline.time') || 180; // Time to reach opposite layline

    // Constants for angles (in radians) and distance
    const tackAngle = 2 * trueWindAngle; // Tack angle, assuming 45 degrees
    const waypointAngle = nextWaypointBearing; // Waypoint angle
    const waypointDistance = 20; // Distance to waypoint

    const layLineAngle = layline;
    const laylineTackAngle = 2 * (trueWindAngle + layLineAngle);

    // Calculate waypoint and course position
    const DE = waypointDistance * Math.cos(waypointAngle);
    const DC = DE / Math.cos(Math.PI / 2 - tackAngle);
    const EC = Math.sin(Math.PI / 2 - tackAngle) * DC;
    const BE = waypointDistance * Math.sin(waypointAngle);
    const BC = BE - EC;

    const waypointPosition = rotateVector(new Vector3(DE, BE, 0));
    const waypointCirclePosition = rotateVector(new Vector3(outerRadius * Math.cos(waypointAngle), outerRadius * Math.sin(waypointAngle), 0));
    const oppositeTackLinePosition = rotateVector(new Vector3(DE, EC, 0));
    const courseLinePosition = rotateVector(new Vector3(0, BC, 0));

    // Calculate layline positions
    const DC2 = DE / Math.cos(Math.PI / 2 - laylineTackAngle);
    const EC2 = Math.sin(Math.PI / 2 - laylineTackAngle) * DC2;
    const BE2 = waypointDistance * Math.sin(waypointAngle);
    const BC2 = BE2 - EC2;

    const oppositeLaylineEndPosition = rotateVector(new Vector3(outerRadius * Math.cos(laylineTackAngle), outerRadius * Math.sin(laylineTackAngle), 0));
    const laylineEndPosition = rotateVector(new Vector3(outerRadius * Math.cos(layLineAngle), outerRadius * Math.sin(layLineAngle), 0));

    const boatPosition = new Vector3(0, 0, 0);

    return (
        <group>
            <mesh position={waypointPosition}>
                <coneGeometry args={[0.5, 1, 32]} />
                <meshStandardMaterial color="orange" />
            </mesh>
            
            <Sphere
                position={waypointCirclePosition.toArray()}
                args={[0.2, 16, 16]}
                rotation={[Math.PI / 2, 0, 0]}
                material-color="orange"
            />

            {/* Laylines and Course Lines */}
            <Line points={[boatPosition, courseLinePosition]} color="green" lineWidth={5} />
            <Line points={[boatPosition, oppositeTackLinePosition]} color="red" lineWidth={5} />
            <Line points={[oppositeTackLinePosition, waypointPosition]} color="green" lineWidth={5} />
            <Line points={[courseLinePosition, waypointPosition]} color="red" lineWidth={5} />

            {/* Laylines with Dashed Pattern */}
            <Line points={[boatPosition, laylineEndPosition]} color="green" lineWidth={5} dashed dashSize={0.2} gapSize={0.2} />
            <Line points={[boatPosition, oppositeLaylineEndPosition]} color="red" lineWidth={5} dashed dashSize={0.2} gapSize={0.2} />

        </group>
    );
};

export default LayLines3D;