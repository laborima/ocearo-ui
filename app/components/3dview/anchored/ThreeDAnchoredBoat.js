import React, { Suspense, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import SceneSetup from '../SceneSetup';
import useTheme from '../../theme/useTheme';
import * as THREE from 'three';
import SailBoat3D from '../SailBoat3D';
import AnchoredCircle from './AnchoredCircle';

const ThreeDAnchoredBoat = ({ onUpdateInfoPanel }) => {
    const sailBoatRef = useRef();
    const { size } = useThree(); // Get canvas dimensions
    const { scene } = useTheme();
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

            <SceneSetup />

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
                        uColor: { value: new THREE.Color(scene.ground) }, // Soft ground patch under the boat
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
