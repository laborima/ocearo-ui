import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import SailBoat3D from '../SailBoat3D';
import { useOcearoContext } from '../../context/OcearoContext';

const ThreeDParkAssistBoat = () => {
    const camPosition = new THREE.Vector3(0, 20, 0);
    const sailBoatRef = useRef();
    const cameraRef = useRef();
    const pathRef = useRef();

    const { getSignalKValue } = useOcearoContext();
    const rudderAngle = getSignalKValue('steering.rudderAngle') || 0;
    const sog = getSignalKValue('navigation.speedOverGround') || 0;

    // Generate the projected path based on the rudder angle and SOG
    useEffect(() => {
        if (!pathRef.current) return;

        const maxCurvePoints = 100;   // Number of points to approximate the path curve
        const scaleFactor = 0.1;      // Scale to adjust curve size

        // Convert rudder angle to radians and calculate turning radius
        const theta = THREE.MathUtils.degToRad(rudderAngle);
        const radius = sog / Math.tan(theta || 0.01); // Avoid division by zero

        // Generate points along the curve
        const points = [];
        for (let i = 0; i < maxCurvePoints; i++) {
            const angle = (i / maxCurvePoints) * Math.PI; // Sweep angle for the curve
            const x = radius * (1 - Math.cos(angle)) * scaleFactor;
            const y = 0; // Assuming we're on a 2D plane, no vertical displacement
            const z = radius * Math.sin(angle) * scaleFactor;
            points.push(new THREE.Vector3(x, y, z));
        }

        // Update the line geometry with new points
        pathRef.current.geometry.setFromPoints(points);
    }, [rudderAngle, sog]);


/*    // Ensure the camera updates each frame
    useFrame(() => {
        if (cameraRef.current) {
            cameraRef.current.updateMatrixWorld();
        }
    });*/


    return (
        <Suspense fallback={null}>
          {/*  <PerspectiveCamera ref={cameraRef} fov={50} position={camPosition} makeDefault /> */}
            <OrbitControls
                enableZoom={true}
                enableRotate={true}
                maxAzimuthAngle={Infinity}
                minAzimuthAngle={-Infinity}
                maxPolarAngle={Math.PI}
                minPolarAngle={0}
            />
            <ambientLight intensity={1} />
            <SailBoat3D ref={sailBoatRef} />

            {/* Projected path in Three.js */}
            <group position={[0, 0, -5]} rotation-y={Math.PI}>
                <line ref={pathRef}>
                    <bufferGeometry />
                    <lineBasicMaterial color="cyan" linewidth={2} />
                </line>
            </group>
        </Suspense>
    );
};

export default ThreeDParkAssistBoat;
