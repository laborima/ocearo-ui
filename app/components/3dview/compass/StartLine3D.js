import React, { useState, useEffect } from 'react';
import { useOcearoContext } from '../context/OcearoContext';
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
    const { getSignalKValue } = useOcearoContext();

    // State variables to toggle visibility of components
    const [showStartLine, setShowStartLine] = useState(false);

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
