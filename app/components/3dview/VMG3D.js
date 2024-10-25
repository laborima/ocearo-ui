import React, { useState, useEffect } from 'react';
import { useOcearoContext } from '../context/OcearoContext';
import { Vector3, ArrowHelper } from 'three';
import { Grid, Plane } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const VMG3D = () => {
    const { getSignalKValue } = useOcearoContext();

    // Retrieve Signal K values with default fallbacks
    const VMG = getSignalKValue('performance.velocityMadeGood') || 0;
    const courseOverGroundAngle = toRadians(getSignalKValue('navigation.courseOverGround') || 20);
    const waypointAngle = toRadians(getSignalKValue('navigation.course.waypointBearing') || 20);
    const trueWindAngle = toRadians(getSignalKValue('environment.wind.angleTrueWater') || 20);
    const trueWindSpeed = getSignalKValue('environment.wind.speedTrue') || 20;
    const appWindAngle = toRadians(getSignalKValue('environment.wind.angleApparent') || 23);
    const appWindSpeed = getSignalKValue('environment.wind.speedApparent') || 30;
    const laylineAngle = getSignalKValue('performance.laylineAngle') || 10;
    const waypointEnable = getSignalKValue('navigation.waypointEnable') || true;

    // State to manage the layline color
    const [laylineColor, setLaylineColor] = useState('limegreen');

    useEffect(() => {
        // Check if the boat is within the layline angle to adjust the color
        const isOutOfLayline = Math.abs(courseOverGroundAngle - waypointAngle) > toRadians(laylineAngle);
        setLaylineColor(isOutOfLayline ? 'red' : 'limegreen');
    }, [courseOverGroundAngle, waypointAngle, laylineAngle]);

    // Calculate the position and size for the layline grid
    const waypointPosition = new Vector3(
        Math.cos(waypointAngle) * 10,
        0,
        Math.sin(waypointAngle) * 10
    );

    const gridWidth = Math.tan(toRadians(laylineAngle)) * waypointPosition.distanceTo(new Vector3(0, 0, 0));
    const gridCenter = waypointPosition.clone().multiplyScalar(0.5); // Midway point between boat and waypoint
    const gridRotation = new Vector3(0, waypointAngle, 0); // Rotate grid to align with waypoint

    const { scene } = useThree();

    useEffect(() => {
        // Arrow helpers for direction indicators
        const courseArrow = new ArrowHelper(
            new Vector3(Math.cos(courseOverGroundAngle), 0, Math.sin(courseOverGroundAngle)),
            new Vector3(0, 0, 0),
            5,
            0x800080 // purple
        );

        const waypointArrow = new ArrowHelper(
            new Vector3(Math.cos(waypointAngle), 0, Math.sin(waypointAngle)),
            new Vector3(0, 0, 0),
            5,
            0xffff00 // yellow
        );

        const trueWindArrow = new ArrowHelper(
            new Vector3(Math.cos(trueWindAngle), 0, Math.sin(trueWindAngle)),
            new Vector3(0, 10, 0),
            trueWindSpeed,
            0x0000ff // blue
        );

        const apparentWindArrow = new ArrowHelper(
            new Vector3(Math.cos(appWindAngle), 0, Math.sin(appWindAngle)),
            new Vector3(0, 10, 0),
            appWindSpeed,
            0x00ffff // cyan
        );

        // Add arrows to the scene
        scene.add(courseArrow, waypointArrow, trueWindArrow, apparentWindArrow);

        // Clean up arrows on component unmount
        return () => {
            scene.remove(courseArrow, waypointArrow, trueWindArrow, apparentWindArrow);
        };
    }, [courseOverGroundAngle, waypointAngle, trueWindAngle, appWindAngle, trueWindSpeed, appWindSpeed, scene]);

    return (
        <group>
            {/* Layline - Transparent grid with color based on angle */}
            {waypointEnable && (
                <Plane
                    position={gridCenter}
                    rotation={[-Math.PI / 2, 0, -waypointAngle]}
                    args={[gridWidth, waypointPosition.length()]} // Plane size
                >
                      <meshStandardMaterial color={laylineColor} transparent opacity={0.25} />
                </Plane>
            )}



            {/* Waypoint - Represented by a flag at the end of the layline */}
            {waypointEnable && (
                <mesh position={waypointPosition}>
                    <coneGeometry args={[0.5, 1, 32]} />
                    <meshStandardMaterial color="orange" />
                </mesh>
            )}
        </group>
    );
};

export default VMG3D;
