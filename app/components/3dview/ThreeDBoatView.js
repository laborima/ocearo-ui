import React, { Suspense, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import SailBoat3D from './SailBoat3D';
import Ocean3D from './ocean/Ocean3D';
import AISView from './ais/AISView';
import ThreeDCompassView from './ThreeDCompassView';
import { useOcearoContext } from '../context/OcearoContext';
import { AISProvider } from './ais/AISContext';

const ThreeDBoatView = () => {
    const { states } = useOcearoContext(); // Application state from context
    const isCompassLayerVisible = false; // Compass visibility

    const sailBoatRef = useRef();


    return (
        <Suspense fallback={<Html>Loading...</Html>}>
            {/* PerspectiveCamera */}
            <PerspectiveCamera
                        makeDefault
                        fov={60}
                        near={1}
                        far={1000}
                        position={[0, 5, 20]}
                    />
            {/* Orbit controls */}
                           <OrbitControls
                               enableZoom={true}
                               enableRotate={true}

                               maxPolarAngle={Math.PI / 2} // Prevent rotating below the boat
                               minPolarAngle={Math.PI / 4} // Limit upward rotation
                           />

            {/* Environment for reflections */}
            <Environment files="./assets/ocearo_env.hdr" background={false} />

            {/* Lighting setup */}
            <ambientLight intensity={0.6} />

            <spotLight
                position={[15, 30, 20]}
                intensity={2.0}
                angle={Math.PI / 6}
                penumbra={0.5}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
            />

            <directionalLight
                position={[-10, 20, 10]}
                intensity={1.5}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
            />

            <pointLight position={[-10, 10, -10]} intensity={0.7} />

            <group position={[0, -3, 0]} >
                {/* Sailboat */}
                <SailBoat3D scale={[0.7, 0.7, 0.7]} ref={sailBoatRef} />
    
                {/* Ocean */}
                {states.showOcean && <Ocean3D />}
    
                {/* AIS Boats */}
                <AISProvider>
                    <AISView />
                </AISProvider>
    
                {/* Compass */}
                <ThreeDCompassView visible={isCompassLayerVisible} />
            </group>
        </Suspense>
    );
};

export default ThreeDBoatView;
