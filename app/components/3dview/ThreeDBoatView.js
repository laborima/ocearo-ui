import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import SailBoat3D from './SailBoat3D';
import Ocean3D from './Ocean3D';
import ThreeDCompassView from './ThreeDCompassView';

const ThreeDBoatView = ({
    compassHeading,
    courseOverGroundAngle,
    courseOverGroundEnable,
    trueWindAngle,
    trueWindSpeed,
    appWindAngle,
    appWindSpeed,
    waypointAngle,
    waypointEnable,
    laylineAngle,
    closeHauledLineEnable,
    windSectorEnable,
    trueWindMinHistoric,
    trueWindMidHistoric,
    trueWindMaxHistoric
}) => {
    let isOceanLayerVisible = true;
    const cameraRef = useRef();
    const orbitControlsRef = useRef();
    const [isUserInteracting, setIsUserInteracting] = useState(false); // Tracks if user is using controls
    const [resetCamera, setResetCamera] = useState(false); // Whether to trigger camera reset
    const resetDuration = 2; // Duration of camera reset in seconds
    
    const isCompassLayerVisible = false;

    const targetPosition = new THREE.Vector3(0, 10, -20); // Target position for the reset view
    const targetLookAt = new THREE.Vector3(0, 0, 0); // Where the camera should look at

    // Timer to reset camera after inactivity
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
    }, [isUserInteracting]);

    // Track OrbitControls interaction and start/reset the inactivity timer
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

    // Smooth camera transition using linear interpolation (LERP)
    useFrame((state, delta) => {
        if (resetCamera && cameraRef.current) {
            // Current position of the camera
            const currentPosition = cameraRef.current.position;

            // Linearly interpolate the camera position toward the target position
            currentPosition.lerp(targetPosition, delta * (1 / resetDuration)); // Adjusting speed based on reset duration

            // Make the camera look at the target object (boat)
            const currentLookAt = new THREE.Vector3();
            cameraRef.current.getWorldDirection(currentLookAt);
            currentLookAt.lerp(targetLookAt, delta * (1 / resetDuration)); // Smooth lookAt interpolation

            // Apply the lookAt to the camera
            cameraRef.current.lookAt(targetLookAt);

            // If the camera is very close to the target position, stop resetting
            if (currentPosition.distanceTo(targetPosition) < 0.01) {
                setResetCamera(false); // Stop further updates when close enough
            }
        }
    });

    return (
            <Suspense fallback={null}>
                {/* OrbitControls with ref to detect user interaction */}
                <OrbitControls ref={orbitControlsRef} enableZoom={true} enableRotate={true} />

                {/* Camera */}
                <PerspectiveCamera ref={cameraRef} fov={50} position={[0, 5, 10]} makeDefault />

                {/* Ambient light for better visibility */}
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />

                {isOceanLayerVisible && <Ocean3D />}
                
                <SailBoat3D inclination={Math.PI / 8} />

                {/* Render the 3D compass and other boat data */}
                {isCompassLayerVisible &&  <ThreeDCompassView
                    compassHeading={compassHeading}
                    courseOverGroundAngle={courseOverGroundAngle}
                    courseOverGroundEnable={courseOverGroundEnable}
                    trueWindAngle={trueWindAngle}
                    trueWindSpeed={trueWindSpeed}
                    appWindAngle={appWindAngle}
                    appWindSpeed={appWindSpeed}
                    waypointAngle={waypointAngle}
                    waypointEnable={waypointEnable}
                    laylineAngle={laylineAngle}
                    closeHauledLineEnable={closeHauledLineEnable}
                    windSectorEnable={windSectorEnable}
                    trueWindMinHistoric={trueWindMinHistoric}
                    trueWindMidHistoric={trueWindMidHistoric}
                    trueWindMaxHistoric={trueWindMaxHistoric}
                /> }
            </Suspense>
    );
};

export default ThreeDBoatView;
