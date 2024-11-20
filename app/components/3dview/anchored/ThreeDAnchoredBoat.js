import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import SailBoat3D from '../SailBoat3D';

const ThreeDAnchoredBoat = () => {
    const sailBoatRef = useRef();

    return (
        <>
            <Suspense fallback={<Html>Loading...</Html>}>
                {/* Camera setup */}
                <PerspectiveCamera
                    makeDefault
                    fov={50}
                    position={[10, 10, 20]} // Position the camera to mimic Tesla's side perspective
                />

                {/* Orbit controls */}
                <OrbitControls
                    enableZoom={true}
                    enableRotate={true}
                    maxPolarAngle={Math.PI / 2} // Prevent rotating below the boat
                    minPolarAngle={Math.PI / 4} // Limit upward rotation
                />

                {/* Lighting setup */}
                <ambientLight intensity={0.4} />
                <spotLight
                    position={[15, 30, 20]} // Light position above and to the side
                    intensity={1.5}
                    angle={Math.PI / 6}
                    penumbra={1}
                    castShadow
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                />
                <pointLight position={[-10, 10, -10]} intensity={0.5} />

                {/* Boat model */}
                <SailBoat3D ref={sailBoatRef} scale={[1.5, 1.5, 1.5]} position={[0, 0, 0]} />

                {/* Reflective plane (water or ground) */}
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, -1, 0]}
                    receiveShadow
                >
                    <planeGeometry args={[100, 100]} />
                    <meshStandardMaterial
                        color="#111111"
                        metalness={0.8}
                        roughness={0.3}
                    />
                </mesh>
            </Suspense>
        </>
    );
};

export default ThreeDAnchoredBoat;
