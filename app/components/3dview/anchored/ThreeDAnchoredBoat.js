import React, { Suspense, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import SailBoat3D from '../SailBoat3D';

const ThreeDAnchoredBoat = () => {
    const sailBoatRef = useRef();
    const { size } = useThree(); // Get canvas dimensions
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
                <SailBoat3D ref={sailBoatRef} scale={[1.5, 1.5, 1.5]} position={[0, -6, 0]} />

                {/* Reflective plane (water or ground) */}
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, -7, 0]}
                    receiveShadow
                >
                    <planeGeometry args={[100, 100]} />
                    <shaderMaterial
                        uniforms={{
                            uColor: { value: new THREE.Color("#111111") },
                            uBlurRadius: { value: 0.1 },
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
