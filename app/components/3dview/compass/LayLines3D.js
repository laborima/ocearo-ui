import React, { useState, useMemo } from 'react';
import { Vector3, MathUtils } from 'three';
import { Sphere } from '@react-three/drei';
import { useOcearoContext } from '../../context/OcearoContext';


// Helper function to convert nautical miles and bearing to 3D coordinates
export function nmToCarthesian(distanceNM, bearingRad, scale = 1) {
    return new Vector3(
        distanceNM * Math.sin(bearingRad) * scale,
        0,
        -distanceNM * Math.cos(bearingRad) * scale
    );
}

// Helper to rotate a 2D vector for the compass view
export function rotateVector(v) {
    return new Vector3(v.x, 0, -v.y);
}

// ParallelepipedLine component to render 3D lines as parallelepipeds
const ParallelepipedLine = ({ start, end, color, width = 0.2, height = 0.1, dashed = false }) => {
    // Calculate the midpoint, length, and direction of the line
    const midpoint = useMemo(() => {
        if (!start || !end || !start.isVector3 || !end.isVector3) {
            return new Vector3();
        }
        return new Vector3().addVectors(start, end).multiplyScalar(0.5);
    }, [start, end]);
    
    const direction = useMemo(() => {
        if (!start || !end || !start.isVector3 || !end.isVector3) {
            return new Vector3(0, 0, 1);
        }
        return new Vector3().subVectors(end, start).normalize();
    }, [start, end]);
    
    const length = useMemo(() => {
        if (!start || !end || !start.isVector3 || !end.isVector3) {
            return 0;
        }
        return start.distanceTo(end);
    }, [start, end]);
    
    // Calculate rotation to align with the direction
    const rotation = useMemo(() => {
        // For 3D lines, we need to calculate the rotation to align with the direction
        // We're working in the XZ plane (Y is up)
        const angle = Math.atan2(direction.x, direction.z);
        return [0, angle, 0]; // [rotX, rotY, rotZ]
    }, [direction]);
    
    // Only render if both start and end are valid vectors
    if (!start || !end || !start.isVector3 || !end.isVector3) {
        return null;
    }
    
    if (dashed) {
        // For dashed lines, create multiple small segments
        const dashLength = 0.4;
        const gapLength = 0.3;
        const totalLength = length;
        const numSegments = Math.floor(totalLength / (dashLength + gapLength));
        
        if (numSegments <= 0) return null;
        
        const segments = [];
        for (let i = 0; i < numSegments; i++) {
            const segmentStart = i * (dashLength + gapLength);
            const segmentPosition = new Vector3().copy(start).add(
                new Vector3().copy(direction).multiplyScalar(segmentStart + dashLength / 2)
            );
            
            segments.push(
                <mesh 
                    key={i} 
                    position={segmentPosition.toArray()} 
                    rotation={rotation} 
                    scale={[width, height, dashLength]}
                >
                    <boxGeometry />
                    <meshStandardMaterial color={color} />
                </mesh>
            );
        }
        
        return <>{segments}</>;
    }
    
    // For solid lines, create a single parallelepiped
    return (
        <mesh 
            position={midpoint.toArray()} 
            rotation={rotation} 
            scale={[width, height, length]}
        >
            <boxGeometry />
            <meshStandardMaterial color={color} />
        </mesh>
    );
};

const LayLines3D = ({ outerRadius = 10 }) => {
    const { getSignalKValue } = useOcearoContext();
    const [showLaylines, setShowLaylines] = useState(true);

    // Get waypoint data
    const waypointBearing = getSignalKValue('navigation.courseGreatCircle.nextPoint.bearingTrue') || 10;
    const waypointDistance = getSignalKValue('navigation.courseGreatCircle.nextPoint.distance') || 20;
    
    // Wind data
    const trueWindDirection = getSignalKValue('environment.wind.directionTrue') || 0;
    
    // Performance data - sailing angles
    const beatAngle = getSignalKValue('performance.beatAngle') || MathUtils.degToRad(45);
    
    // Calculate the waypoint position using bearing and distance
    const waypointPosition = useMemo(() => {
        if (waypointBearing !== undefined && waypointDistance !== undefined) {
            // Convert from nautical miles and bearing to XYZ coordinates
            return nmToCarthesian(waypointDistance, waypointBearing, 1);
        }
        // Default position if no waypoint data
        return new Vector3(0, 0, -5);
    }, [waypointBearing, waypointDistance]);
    
    // Calculate layline angles based on wind direction
    const portTackAngle = useMemo(() => {
        return trueWindDirection + beatAngle;
    }, [trueWindDirection, beatAngle]);
    
    const starboardTackAngle = useMemo(() => {
        return trueWindDirection - beatAngle;
    }, [trueWindDirection, beatAngle]);
    
    // Calculate layline endpoints at the outer radius
    const portLaylineEnd = useMemo(() => {
        return nmToCarthesian(outerRadius, portTackAngle, 1);
    }, [outerRadius, portTackAngle]);
    
    const starboardLaylineEnd = useMemo(() => {
        return nmToCarthesian(outerRadius, starboardTackAngle, 1);
    }, [outerRadius, starboardTackAngle]);
    
    // Calculate the layline corners to create a trapezoid shape
    // This is a simpler, more reliable approach that directly creates laylines
    // matching the reference image
    const laylineCorners = useMemo(() => {
        // Simple approach - create points at fixed distances along the layline angles
        // Use 70% of the waypoint distance for a nice visual balance
        const cornerDistance = waypointDistance * 0.7;
        
        // Calculate the corner positions directly using the tack angles
        const portCorner = nmToCarthesian(cornerDistance, portTackAngle, 1);
        const starboardCorner = nmToCarthesian(cornerDistance, starboardTackAngle, 1);
        
        return { port: portCorner, starboard: starboardCorner };
    }, [waypointDistance, portTackAngle, starboardTackAngle]);
    
    // Origin (boat position) is always at 0,0,0
    const boatPosition = new Vector3(0, 0, 0);

    return (
        <group>
            {showLaylines && (
                <>
                    {/* Target waypoint as yellow sphere with cross */}
                    <Sphere
                        position={waypointPosition.toArray()}
                        args={[0.5, 16, 16]}
                        material-color="yellow"
                    >
                        {/* Horizontal cross line */}
                        <mesh position={[0, 0, 0]} rotation={[0, Math.PI/2, 0]}>
                            <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
                            <meshStandardMaterial color="black" />
                        </mesh>
                        {/* Vertical cross line */}
                        <mesh position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
                            <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
                            <meshStandardMaterial color="black" />
                        </mesh>
                    </Sphere>
                    
                    {/* Direct route to waypoint */}
                    <ParallelepipedLine 
                        start={boatPosition} 
                        end={waypointPosition} 
                        color="yellow" 
                        width={0.1} 
                        height={0.05} 
                        dashed 
                    />
                    
                    {/* Port tack layline (green) */}
                    <ParallelepipedLine 
                        start={boatPosition} 
                        end={laylineCorners.port} 
                        color="green" 
                        width={0.2} 
                        height={0.1} 
                    />
                    
                    <ParallelepipedLine 
                        start={laylineCorners.port} 
                        end={waypointPosition} 
                        color="green" 
                        width={0.2} 
                        height={0.1} 
                    />
                    
                    {/* Starboard tack layline (red) */}
                    <ParallelepipedLine 
                        start={boatPosition} 
                        end={laylineCorners.starboard} 
                        color="red" 
                        width={0.2} 
                        height={0.1} 
                    />
                    
                    <ParallelepipedLine 
                        start={laylineCorners.starboard} 
                        end={waypointPosition} 
                        color="red" 
                        width={0.2} 
                        height={0.1} 
                    />
                    
                    
                    {/* Extended laylines */}
                    <ParallelepipedLine 
                        start={boatPosition} 
                        end={portLaylineEnd} 
                        color="green" 
                        width={0.2} 
                        height={0.1} 
                        dashed 
                    />
                    
                    <ParallelepipedLine 
                        start={boatPosition} 
                        end={starboardLaylineEnd} 
                        color="red" 
                        width={0.2} 
                        height={0.1} 
                        dashed 
                    />
                </>
            )}
        </group>
    );
};

export default LayLines3D;