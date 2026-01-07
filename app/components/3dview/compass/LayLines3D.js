import React, { useMemo, useState, useEffect } from 'react';
import { Vector3, MathUtils } from 'three';
import { Sphere } from '@react-three/drei';
import { oGreen, oRed, oYellow, useOcearoContext } from '../../context/OcearoContext';
import { useSignalKPath, useSignalKPaths } from '../../hooks/useSignalK';
import signalKService from '../../services/SignalKService';
import configService from '../../settings/ConfigService';

// Debug waypoint for testing laylines (position relative to boat)
const DEBUG_WAYPOINT = {
    name: 'Debug Waypoint',
    // Position: 5 units forward (-Z) and 3 units to starboard (+X)
    x: 3,
    z: -5
};


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
    const { convertLatLonToXY } = useOcearoContext();
    const debugMode = configService.get('debugMode');
    
    // Subscribe to relevant SignalK paths
    const navigationPaths = useMemo(() => [
        'navigation.courseGreatCircle.nextPoint.bearingTrue',
        'navigation.courseGreatCircle.nextPoint.distance',
        'navigation.position'
    ], []);

    const skValues = useSignalKPaths(navigationPaths);

    // State for waypoints from Resources API
    const [resourceWaypoints, setResourceWaypoints] = useState([]);
    const [activeCourse, setActiveCourse] = useState(null);

    // Fetch waypoints and course from SignalK Resources API
    useEffect(() => {
        // Skip fetching in debug mode - use debug waypoint instead
        if (debugMode) {
            return;
        }

        const fetchNavigationData = async () => {
            try {
                // Fetch waypoints
                const waypointsData = await signalKService.getWaypoints();
                if (waypointsData) {
                    const waypointsList = Object.entries(waypointsData).map(([id, wp]) => {
                        const position = signalKService.parseWaypointPosition(wp);
                        return {
                            id,
                            name: wp.name || 'Waypoint',
                            ...position
                        };
                    }).filter(wp => wp.latitude && wp.longitude);
                    setResourceWaypoints(waypointsList);
                }

                // Fetch active course
                const courseData = await signalKService.getCourse();
                setActiveCourse(courseData);
            } catch (error) {
                console.warn('LayLines3D: Could not fetch navigation data:', error.message);
            }
        };

        fetchNavigationData();
        
        // Refresh every 30 seconds
        const interval = setInterval(fetchNavigationData, 30000);
        return () => clearInterval(interval);
    }, [debugMode]);

    // Get waypoint data from subscribed SignalK values
    const waypointBearing = skValues['navigation.courseGreatCircle.nextPoint.bearingTrue'] ?? MathUtils.degToRad(30);
    const waypointDistance = skValues['navigation.courseGreatCircle.nextPoint.distance'] ?? 20;
    const myPosition = skValues['navigation.position'];
    
    // Origin (boat position) is always at 0,0,0
    const boatPosition = useMemo(() => new Vector3(0, 0, 0), []);
    
    // Calculate the waypoint position
    const waypointPosition = useMemo(() => {
        // Debug mode: Use fixed debug waypoint for testing
        if (debugMode) {
            return new Vector3(DEBUG_WAYPOINT.x, 0, DEBUG_WAYPOINT.z);
        }

        // First try: Use active course destination position
        if (activeCourse?.nextPoint?.position) {
            const destPos = activeCourse.nextPoint.position;
            if (myPosition?.latitude && myPosition?.longitude && destPos.latitude && destPos.longitude) {
                const { x, y } = convertLatLonToXY(
                    { lat: destPos.latitude, lon: destPos.longitude },
                    { lat: myPosition.latitude, lon: myPosition.longitude }
                );
                // Scale down for 3D view (1 unit = ~100m)
                const scale = 0.01;
                return new Vector3(x * scale, 0, -y * scale);
            }
        }
        
        // Second try: Use bearing and distance from SignalK
        if (waypointBearing !== undefined && waypointDistance !== undefined) {
            // Scale distance for 3D view
            const scaledDistance = Math.min(waypointDistance * 0.001, outerRadius * 2);
            return nmToCarthesian(scaledDistance, waypointBearing, 1);
        }
        
        // Default position
        return new Vector3(0, 0, -5);
    }, [debugMode, activeCourse, myPosition, waypointBearing, waypointDistance, convertLatLonToXY, outerRadius]);
    
    /**
     * Calculate layline corners for a rectangular path to waypoint
     * 
     * The laylines form a rectangle where:
     * - One line is along the boat's axis (forward direction, -Z in Three.js)
     * - The other line is perpendicular (along X axis)
     * - The lines to the waypoint are parallel to these axes
     * 
     * This creates two possible routes:
     * 1. Green (port): Go forward first, then turn perpendicular to waypoint
     * 2. Red (starboard): Go perpendicular first, then turn forward to waypoint
     */
    const laylineCorners = useMemo(() => {
        // Waypoint coordinates
        const wpX = waypointPosition.x;
        const wpZ = waypointPosition.z;
        
        // Port corner: same Z as waypoint, X = 0 (along boat axis first)
        // This means: go straight forward (along -Z), then turn perpendicular (along X)
        const portCorner = new Vector3(0, 0, wpZ);
        
        // Starboard corner: same X as waypoint, Z = 0 (perpendicular first)
        // This means: go perpendicular (along X), then turn forward (along -Z)
        const starboardCorner = new Vector3(wpX, 0, 0);
        
        return { port: portCorner, starboard: starboardCorner };
    }, [waypointPosition]);

    return (
        <group>
            <>
                {/* Target waypoint as yellow sphere with cross */}
                <Sphere
                    position={waypointPosition.toArray()}
                    args={[0.5, 16, 16]}
                    material-color={oYellow}
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
                
                {/* Port tack layline (green) - Forward first, then perpendicular */}
                {/* Line 1: From boat (0,0,0) forward along -Z axis to port corner */}
                <ParallelepipedLine 
                    start={boatPosition} 
                    end={laylineCorners.port} 
                    color={oGreen} 
                    width={0.2} 
                    height={0.1} 
                />
                
                {/* Line 2: From port corner perpendicular (along X) to waypoint */}
                <ParallelepipedLine 
                    start={laylineCorners.port} 
                    end={waypointPosition} 
                    color={oGreen} 
                    width={0.2} 
                    height={0.1} 
                />
                
                {/* Starboard tack layline (red) - Perpendicular first, then forward */}
                {/* Line 1: From boat (0,0,0) perpendicular (along X) to starboard corner */}
                <ParallelepipedLine 
                    start={boatPosition} 
                    end={laylineCorners.starboard} 
                    color={oRed} 
                    width={0.2} 
                    height={0.1} 
                />
                
                {/* Line 2: From starboard corner forward (along -Z) to waypoint */}
                <ParallelepipedLine 
                    start={laylineCorners.starboard} 
                    end={waypointPosition} 
                    color={oRed} 
                    width={0.2} 
                    height={0.1} 
                />
            </>
        </group>
    );
};

export default LayLines3D;