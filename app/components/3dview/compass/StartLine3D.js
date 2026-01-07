import React, { useState, useEffect, useMemo } from 'react';
import { useSignalKPaths } from '../../hooks/useSignalK';
import * as THREE from 'three';
import { Vector3, ArrowHelper,CircleGeometry,MeshBasicMaterial,Mesh } from 'three';
import { Line, Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const StartLine3D = () => {
    // Define paths for subscription
    const startLinePaths = useMemo(() => [
        'navigation.racing.startLineStb',
        'navigation.racing.startLinePort',
        'navigation.racing.distanceStartline',
        'navigation.racing.timeToStart',
        'navigation.racing.timePortDown',
        'navigation.racing.timePortUp',
        'navigation.racing.timeStbdDown',
        'navigation.racing.timeStbdUp'
    ], []);

    const skValues = useSignalKPaths(startLinePaths);

    // Helper to get value with fallback
    const getVal = (path, fallback) => skValues[path] ?? fallback;

    // State variables to toggle visibility of components
    const [showStartLine, setShowStartLine] = useState(false);

    // *** Données de ligne de départ pour la régate ***
    const startLineStb = getVal('navigation.racing.startLineStb', { latitude: 0, longitude: 0, altitude: 0 }); // Position de la marque de départ tribord
    const startLinePort = getVal('navigation.racing.startLinePort', { latitude: 0, longitude: 0, altitude: 0 }); // Position de la marque de départ bâbord
    const distanceToStartline = getVal('navigation.racing.distanceStartline', 50); // Distance jusqu'à la ligne de départ
    const timeToStart = getVal('navigation.racing.timeToStart', 120); // Temps estimé pour atteindre la ligne de départ
    const timePortDown = getVal('navigation.racing.timePortDown', 60); // Temps estimé en bâbord amure au vent arrière
    const timePortUp = getVal('navigation.racing.timePortUp', 70); // Temps estimé en bâbord amure au près
    const timeStbdDown = getVal('navigation.racing.timeStbdDown', 65); // Temps estimé en tribord amure au vent arrière
    const timeStbdUp = getVal('navigation.racing.timeStbdUp', 75); // Temps estimé en tribord amure au près




    return (
        <group>
            {/* Waypoint - Conditional rendering */}
            {showWaypoint && (
                <mesh position={waypointPosition}>
                    <coneGeometry args={[0.5, 1, 32]} />
                    <meshStandardMaterial color="orange" />
                </mesh>
            )}

        </group>
    );
};

export default StartLine3D;
