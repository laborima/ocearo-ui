import React, { Suspense, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useOcearoContext } from '../../context/OcearoContext';
import SailBoat3D from '../SailBoat3D';
import AnchoredCircle from './AnchoredCircle';

const ThreeDAnchoredBoat = ({ onUpdateInfoPanel }) => {
    const sailBoatRef = useRef();
    const { size } = useThree(); // Get canvas dimensions
    const { nightMode } = useOcearoContext();
    const aspect = size.width / size.height; // Calculate aspect ratio

    return (
        <Suspense fallback={<Html>Loading...</Html>}>
            {/* Camera setup */}
            <PerspectiveCamera
                makeDefault
                fov={25}
                aspect={aspect} // Use canvas dimensions for aspect
                near={1}
                far={1000}
                position={[32, 10, -32]}
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

            {/* Lighting setup - Optimized for Tesla-UI HUD aesthetic */}
            <ambientLight intensity={0.2} />

            {/* Main directional light */}
            <directionalLight
                position={[15, 30, 20]}
                intensity={1.2}
                castShadow={false}
                color={nightMode ? "#b0d8ff" : "#ffffff"}
            />

            {/* Rim light for silhouette definition */}
            <spotLight
                position={[0, 50, 100]}
                intensity={0.8}
                angle={0.6}
                penumbra={1}
                color={nightMode ? "#4080ff" : "#ffffff"}
            />

            {/* Fill light */}
            <pointLight position={[-10, 10, -10]} intensity={0.5} />

            {/* Boat model */}
            <SailBoat3D 
                ref={sailBoatRef} 
                scale={[1.3, 1.3, 1.3]} 
                position={[0, -6, 0]} 
                onUpdateInfoPanel={onUpdateInfoPanel} 
            />

            <AnchoredCircle />

            {/* Reflective plane (water or ground) */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -7, 0]}
                receiveShadow
            >
                <planeGeometry args={[100, 100]} />
                <shaderMaterial
                    uniforms={{
                        uColor: { value: new THREE.Color(nightMode ? "#050505" : "#0a0a0a") }, // Darker for high contrast
                        uBlurRadius: { value: 0.15 },
                    }}
                    vertexShader={`
                            varying vec2 vUv;
                            void main() {
                                vUv = uv;
                                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                            }
                        `}
                    fragmentShader={`
                            uniform vec3 uColor;
                            uniform float uBlurRadius;
                            varying vec2 vUv;

                            void main() {
                                float distanceToCenter = length(vUv - vec2(0.5));
                                float alpha = smoothstep(0.5 - uBlurRadius, 0.5 + uBlurRadius, distanceToCenter);
                                gl_FragColor = vec4(uColor, 1.0 - alpha);
                            }
                        `}
                />
            </mesh>

        </Suspense>
    );
};

export default ThreeDAnchoredBoat;
