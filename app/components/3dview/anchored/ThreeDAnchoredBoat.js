import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import SailBoat3D from '../SailBoat3D';

const ThreeDAnchoredBoat = () => {
    const sailBoatRef = useRef();

    return (
        < >
            <Suspense fallback={<Html>Loading...</Html>}>
                {/* Camera setup */}
                <PerspectiveCamera
                    makeDefault
                    fov={50}
                    position={[10, 10, 20]} // Position the camera
                />

                {/* Orbit controls */}
                <OrbitControls
                    enableZoom={true}
                    enableRotate={true}
                    
                    maxPolarAngle={Math.PI / 2} // Prevent rotating below the boat
                    minPolarAngle={Math.PI / 4} // Limit upward rotation
                />

                {/* Environment for reflections */}
                <Environment preset="sunset" background={false} />

                {/* Lighting setup */}
                {/* Ambient light to fill shadows */}
                <ambientLight intensity={0.6} />

                {/* Spot light for strong highlights */}
                <spotLight
                    position={[15, 30, 20]}
                    intensity={2.0}
                    angle={Math.PI / 6}
                    penumbra={0.5}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />

                {/* Directional light for metallic reflection and shadowing */}
                <directionalLight
                    position={[-10, 20, 10]}
                    intensity={1.5}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />
                
                {/* Point light for subtle fill and reflections */}
                <pointLight position={[-10, 10, -10]} intensity={0.7} />

                {/* Boat model */}
                <SailBoat3D ref={sailBoatRef} scale={[1.5, 1.5, 1.5]} position={[0, -5, 0]} />

                {/* Reflective plane (water or ground) */}
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, -6,0]}
                    receiveShadow
                >
                    <planeGeometry args={[100, 100]} />
                    <meshStandardMaterial
                        color="#111111"
                        metalness={0.8}
                        roughness={0.2}
                    />
                </mesh>
            </Suspense>
        </>
    );
};

export default ThreeDAnchoredBoat;
