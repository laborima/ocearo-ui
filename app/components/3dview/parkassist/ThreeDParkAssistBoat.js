import React, { Suspense, useRef, useEffect } from 'react';
import { OrbitControls, PerspectiveCamera, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import SailBoat3D from '../SailBoat3D';
import { useOcearoContext } from '../../context/OcearoContext';

const ThreeDParkAssistBoat = () => {
    const sailBoatRef = useRef();
    const pathRef = useRef();

    const { getSignalKValue } = useOcearoContext();
    const rudderAngle = getSignalKValue('steering.rudderAngle') || 0;
    const sog = getSignalKValue('navigation.speedOverGround') || 0;

    // Helper function to generate the curve points
    const generateCurvePoints = (rudderAngle, sog, maxCurvePoints = 100, scaleFactor = 0.1) => {
        const theta = THREE.MathUtils.degToRad(rudderAngle);
        const radius = sog !== 0 ? sog / Math.tan(theta || 0.01) : 1000; // Avoid division by zero
        const clampedRadius = Math.min(Math.max(radius, -500), 500); // Limit radius for stability

        const points = [];
        for (let i = 0; i < maxCurvePoints; i++) {
            const angle = (i / maxCurvePoints) * Math.PI; // Sweep angle
            const x = clampedRadius * (1 - Math.cos(angle)) * scaleFactor;
            const y = 0; // Keep path on 2D plane
            const z = clampedRadius * Math.sin(angle) * scaleFactor;
            points.push(new THREE.Vector3(x, y, z));
        }
        return points;
    };

    // Update the projected path
    useEffect(() => {
        if (!pathRef.current) return;

        const points = generateCurvePoints(rudderAngle, sog);
        pathRef.current.geometry.setFromPoints(points);
    }, [rudderAngle, sog]);

    return (
        <Suspense fallback={<Html center>Loading...</Html>}>
            {/* Camera */}
            <PerspectiveCamera makeDefault fov={60} near={1} far={1000} position={[0, 20, 30]} />
            <OrbitControls enableZoom={true} enableRotate={true} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 4} />

            {/* Environment */}
            <Environment files="./assets/ocearo_env.hdr" background={false} intensity={0.8} />

            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <spotLight
                position={[15, 30, 20]}
                intensity={1.8}
                angle={Math.PI / 6}
                penumbra={0.5}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-camera-near={0.5}
                shadow-camera-far={50}
                shadow-bias={-0.0001}
            />
            <directionalLight position={[-10, 20, 10]} intensity={1.5} color="#ffd1a6" castShadow />
            <pointLight position={[-10, 10, -10]} intensity={0.7} />

            {/* Boat and Path */}
            <group position={[0, -3, 0]}>
                {/* Sailboat */}
                <SailBoat3D position={[0, 0, 0.7]} scale={[0.7, 0.7, 0.7]} ref={sailBoatRef} showSail={false} />

                {/* Projected Path */}
                <group position={[0, 0, -5]} rotation-y={Math.PI}>
                    <line ref={pathRef}>
                        <bufferGeometry />
                        <lineBasicMaterial color="cyan" linewidth={2} />
                    </line>
                </group>
            </group>
        </Suspense>
    );
};

export default ThreeDParkAssistBoat;
