import React, { Suspense, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import SailBoat3D from './SailBoat3D';
import Ocean3D from './ocean/Ocean3D';
import AISView from './ais/AISView';
import ThreeDCompassView from './ThreeDCompassView';
import DebugInfo from './DebugInfo';
import { useOcearoContext } from '../context/OcearoContext';
import { AISProvider } from './ais/AISContext';

const ThreeDBoatView = ({ }) => {
    const cameraRef = useRef();
    const orbitControlsRef = useRef();
    const [isUserInteracting, setIsUserInteracting] = useState(false); // Tracks if user is using controls
    const [resetCamera, setResetCamera] = useState(false); // Whether to trigger camera reset
    const resetDuration = 2; // Duration of camera reset in seconds
    const { states } = useOcearoContext();

    // State to manage visibility of ocean and compass

    const isCompassLayerVisible = false;

    const camPosition = new THREE.Vector3(1, 5, 20); // Target position for the reset view
    const targetLookAt = new THREE.Vector3(0, 0, 0); // Where the camera should look at

    const sailBoatRef = useRef();

 /*   // Timer to reset camera after inactivity
    useEffect(() => {
        let inactivityTimeout;

        if (!isUserInteracting) {
            // Set timer when the user stops interacting
            inactivityTimeout = setTimeout(() => {
                setResetCamera(true); // Trigger the reset smoothly
            }, 10000); // 10 seconds
        } else {
            setResetCamera(false); // Cancel reset if user is interacting
        }

        return () => clearTimeout(inactivityTimeout); // Clear the timer on new interaction or component unmount
    }, [isUserInteracting]);*/

   /* // Track OrbitControls interaction and start/reset the inactivity timer
    useEffect(() => {
        const controls = orbitControlsRef.current;

        const handleStart = () => {
            setIsUserInteracting(true); // User is interacting
        };
        const handleEnd = () => {
            setIsUserInteracting(false); // User stops interacting
        };

        // Add event listeners to detect start/end of interaction with OrbitControls
        controls?.addEventListener('start', handleStart);
        controls?.addEventListener('end', handleEnd);

        return () => {
            controls?.removeEventListener('start', handleStart);
            controls?.removeEventListener('end', handleEnd);
        };
    }, []);
*/
/*    // Smooth camera transition using linear interpolation (LERP)
    useFrame((state, delta) => {
        if (resetCamera && cameraRef.current) {
            // Current position of the camera
            const currentPosition = cameraRef.current.position;

            // Linearly interpolate the camera position toward the target position
            currentPosition.lerp(camPosition, delta * (1 / resetDuration)); // Adjusting speed based on reset duration

            // Smooth lookAt interpolation
            const currentLookAt = new THREE.Vector3();
            cameraRef.current.getWorldDirection(currentLookAt);
            currentLookAt.lerp(targetLookAt, delta * (1 / resetDuration));

            cameraRef.current.lookAt(targetLookAt); // Apply the lookAt

            // If the camera is very close to the target position, stop resetting
            if (currentPosition.distanceTo(camPosition) < 0.01) {
                setResetCamera(false); // Stop further updates when close enough
            }
        }
    });
*/
    return (
        <Suspense fallback={null}>
            {/* OrbitControls with ref to detect user interaction */}
            <OrbitControls ref={orbitControlsRef} enableZoom={true} enableRotate={true} />

            {/* Camera */}
            <PerspectiveCamera ref={cameraRef} fov={50} position={camPosition} makeDefault />


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

            {/*  <DebugInfo/> */}
            {/* Your central boat */}
            <SailBoat3D scale={[0.7,0.7,0.7]} ref={sailBoatRef} />

            {states.showOcean && <Ocean3D />}

            {/* AIS Boats fetched from SignalK */}
            <AISProvider>
                <AISView />
            </AISProvider>

            <ThreeDCompassView visible={isCompassLayerVisible} />

        </Suspense>
    );
};

export default ThreeDBoatView;
