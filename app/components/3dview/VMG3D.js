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

const VMG3D = () => {
    const { getSignalKValue } = useOcearoContext();

    // State variables to toggle visibility of components
    const [showStartLine, setShowStartLine] = useState(false);
    const [showWaypoint, setShowWaypoint] = useState(true);
    const [showLaylines, setShowLaylines] = useState(false);

    const debugOn = false;
    const outerRadius = 5;
    const innerRadius = 4.5;

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
    const courseOverGroundAngle = getSignalKValue('navigation.courseOverGround') || toRadians(20); // Cap sur fond
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


    const { scene } = useThree();

    // Helper function to create a line
    function createLine(startPoint, endPoint, params) {

        // Create LineGeometry and set the points
        const geometry = new LineGeometry();
        geometry.setPositions([startPoint.x, startPoint.y, startPoint.z, endPoint.x, endPoint.y, endPoint.z]);

        // Create LineMaterial with adjustable linewidth
        const material = new LineMaterial(params);

        // Adjust the resolution for linewidth scaling
        material.resolution.set(window.innerWidth, window.innerHeight);

        // Create the Line2 mesh
        const line = new Line2(geometry, material);
        line.computeLineDistances(); // Required for dashed lines if needed
        return line;
    }


    // Helper function to create an arrow
    function createArrow(color, angle, length, position = new Vector3(0, 0, 0)) {
        const direction = new Vector3(Math.cos(angle - Math.PI / 2), 0, - Math.sin(angle - Math.PI / 2)).normalize();
        return new ArrowHelper(direction, position, length, color);
    }

    function createCircle(color, radius, position = new Vector3(0, 0, 0)) {
        const segments = 32; // Number of segments for smoother edges
        const geometry = new CircleGeometry(radius, segments);
        const material = new MeshBasicMaterial({ color: color }); // Yellow color
        const circle =  new Mesh(geometry, material);
        
        circle.position.set(position.x,position.y,position.z);
        circle.rotation.x = -Math.PI / 2;
        return circle;
    }

    
    function createCylinder(color = 0xFFA500, radius = 1, height = 2, position = new THREE.Vector3(0, 0, 0)) {
        const radialSegments = 32; // Number of radial segments for smoother edges
        const geometry = new THREE.CylinderGeometry(radius, radius, height, radialSegments);
        const material = new THREE.MeshBasicMaterial({ color: color }); // Orange color
        const cylinder = new THREE.Mesh(geometry, material);
        
        // Set position and orientation
        cylinder.position.set(position.x, position.y, position.z);
     //   cylinder.rotation.x = Math.PI / 2; // Optional, for horizontal orientation if needed

        return cylinder;
    }

    function rotate(v) {
        return new Vector3(v.x, 0, -v.y);
    }

    const twa = appWindAngle;//toRadians(40);

    // Constants for angles (in radians) and distance
    const tackAngle = 2 * twa;                 // Tack angle, 45 degrees
    const waypointAngle = toRadians(30);             // Waypoint angle, 30 degrees
    const waypointDistance = 20;                   // Distance to waypoint


    // Calculate waypoint and course position


    const DE = waypointDistance * Math.cos(waypointAngle);

    const DC = DE / Math.cos(Math.PI / 2 - tackAngle)
    const EC = Math.sin(Math.PI / 2 - tackAngle) * DC;


    const BE = waypointDistance * Math.sin(waypointAngle);
    const BC = BE - EC;


    const waypointPosition = rotate(new Vector3(
        DE,
        BE,
        0
    ));

    const waypointCirclePosition = rotate(new Vector3(
        outerRadius * Math.cos(waypointAngle),
        outerRadius * Math.sin(waypointAngle),
        0
    ));

    const oppositeTackLinePosition = rotate(new Vector3(DE, EC, 0));
    const courseLinePosition = rotate(new Vector3(0, BC, 0));

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
    
    
    //Calculate layline position
    
    const layLineAngle = -layline;
    const laylineTackAngle = 2 * (twa + layLineAngle);

    const DC2 = DE / Math.cos(Math.PI / 2 - laylineTackAngle)
    const EC2 = Math.sin(Math.PI / 2 - laylineTackAngle) * DC2;


    const BE2 = waypointDistance * Math.sin(waypointAngle);
    const BC2 = BE2 - EC2;


    const oppositeLaylineEndPosition = rotate( new Vector3(
    outerRadius * Math.cos(laylineTackAngle),
    outerRadius * Math.sin(laylineTackAngle),
    0));
    const laylineEndPosition = rotate( new Vector3(
    outerRadius * Math.cos(layLineAngle),
    outerRadius * Math.sin(layLineAngle),
    0));



    /** Start line */
    const startLineStbPosition = new Vector3(startLineStb.longitude, 0, startLineStb.latitude);
    const startLinePortPosition = new Vector3(startLinePort.longitude, 0, startLinePort.latitude);



    useEffect(() => {


        const createOptionalArrow = (color, angle, distance, offset = new THREE.Vector3(0, 0, 0)) =>
            angle && distance ? createArrow(color, angle, distance, offset) : null;

        const waypointMark = createCylinder(0xFFA500, 0.2, 0.2, waypointCirclePosition);

        const courseLine = createLine(new THREE.Vector3(0, 0, 0), courseLinePosition, {
            color: 0x00ff00,
            linewidth: 5
        });
        const tackLine = createLine(new THREE.Vector3(0, 0, 0), oppositeTackLinePosition, {
            color: 0xff0000,
            linewidth: 5
        });
        const parallelCourseLine = createLine(oppositeTackLinePosition, waypointPosition, {
            color: 0x00ff00,
            linewidth: 5
        });
        const parallelTackLine = createLine(courseLinePosition, waypointPosition, {
            color: 0xff0000,
            linewidth: 5
        });


        const layLine = createLine(new THREE.Vector3(0, 0, 0), laylineEndPosition, {
            color: 0x00ff00,
            linewidth: 5,
            dashed: true,         // Enable dashed line
            dashScale: 1,         // Scale of dash
            dashSize: 0.2,        // Length of each dash
            gapSize: 0.2          // Length of gaps between dashes
        });
        const oppositeLayLine = createLine(new THREE.Vector3(0, 0, 0), oppositeLaylineEndPosition, {
            color: 0xff0000,
            linewidth: 5,
            dashed: true,         // Enable dashed line
            dashScale: 1,         // Scale of dash
            dashSize: 0.2,        // Length of each dash
            gapSize: 0.2          // Length of gaps between dashes
        });
/*        const parallellayLine = createLine(oppositeLaylineEndPosition, waypointPosition, {
            color: 0x00ff00,
            linewidth: 5,
            dashed: true,         // Enable dashed line
            dashScale: 1,         // Scale of dash
            dashSize: 0.2,        // Length of each dash
            gapSize: 0.2          // Length of gaps between dashes
        });
        const parallelOppositeLayLine = createLine(laylineEndPosition, waypointPosition, {
            color: 0xff0000,
            linewidth: 5,
            dashed: true,         // Enable dashed line
            dashScale: 1,         // Scale of dash
            dashSize: 0.2,        // Length of each dash
            gapSize: 0.2          // Length of gaps between dashes
        });*/


        const trueWindArrow = createOptionalArrow(0x0000ff, trueWindAngle, trueWindSpeed,  rotate(new Vector3(
               outerRadius * Math.cos(trueWindAngle),
               outerRadius * Math.sin(trueWindAngle),
               0
           )));
        const apparentWindArrow = createOptionalArrow(0x00ffff, appWindAngle, appWindSpeed,           rotate(new Vector3(
                          outerRadius * Math.cos(appWindAngle),
                          outerRadius * Math.sin(appWindAngle),
                          0
                      )));

        // Parallel lines

        const compassElements = [
            tackLine, trueWindArrow,
            apparentWindArrow, parallelCourseLine, parallelTackLine, courseLine,
            layLine, oppositeLayLine, waypointMark
        ].filter(Boolean);

        scene.add(...compassElements);

        return () => {
            compassElements.forEach((obj) => {
                scene.remove(obj);
                if (obj && obj.geometry && obj.material) { // Ensure obj has geometry and material

                    obj.geometry.dispose();
                    obj.material.dispose();
                }
            });
        };
    }, [
        courseOverGroundAngle,
        waypointAngle,
        trueWindAngle,
        appWindAngle,
        trueWindSpeed,
        appWindSpeed,
        scene
    ]);


    return (
        <group>
            {/* Waypoint - Conditional rendering */}
            {showWaypoint && (
                <mesh position={waypointPosition}>
                    <coneGeometry args={[0.5, 1, 32]} />
                    <meshStandardMaterial color="orange" />
                </mesh>
            )}


            {/* Information display */}
            {debugOn && (
                <Html position={[5, 5, 0]} style={{ width: '350px', color: 'white', background: 'rgba(0,0,0,0.6)', padding: '10px', borderRadius: '5px' }}>
                    <p>VMG: {velocityMadeGood.toFixed(2)} nœuds</p>
                    <p>Vitesse Polaire: {polarSpeed.toFixed(2)} nœuds</p>
                    <p>Distance jusqu'à la Layline: {laylineDistance.toFixed(2)} m</p>
                    <p>Distance jusqu'à la Ligne de Départ: {distanceToStartline.toFixed(2)} m</p>
                    <p>Temps jusqu'à la Ligne de Départ: {timeToStart} s</p>
                    <p>Angle du Vent Réel: {(trueWindAngle * (180 / Math.PI)).toFixed(2)}°</p>
                    <p>Vitesse du Vent Réel: {trueWindSpeed.toFixed(2)} nœuds</p>
                    <p>Angle du Vent Apparent: {(appWindAngle * (180 / Math.PI)).toFixed(2)}°</p>
                    <p>Vitesse du Vent Apparent: {appWindSpeed.toFixed(2)} nœuds</p>
                    <p>Angle de Près: {(beatAngle * (180 / Math.PI)).toFixed(2)}°</p>
                    <p>Angle d'Empannage: {(gybeAngle * (180 / Math.PI)).toFixed(2)}°</p>
                    <p>VMG en Près: {beatVMG.toFixed(2)} nœuds</p>
                    <p>VMG au Portant: {gybeVMG.toFixed(2)} nœuds</p>
                    <p>Angle Cible TWA: {(targetTWA * (180 / Math.PI)).toFixed(2)}°</p>
                    <p>Angle de Vent Optimal: {(optimalWindAngle * (180 / Math.PI)).toFixed(2)}°</p>
                    <p>Ratio de Vitesse Polaire: {polarSpeedRatio.toFixed(2)}</p>
                    <p>Ratio de VMG Polaire: {polarVelocityMadeGoodRatio.toFixed(2)}</p>
                </Html>
            )}
        </group>
    );
};

export default VMG3D;
