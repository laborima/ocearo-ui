import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import SailBoat3D from './SailBoat3D';
import Ocean3D from './Ocean3D';
import ThreeDCompassView from './ThreeDCompassView';
import AISBoatView from './AISBoatView';
import Sky3D from './Sky3D';
import { useThreeDView } from './context/ThreeDViewContext';
import VMG3D from './VMG3D';

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
    const cameraRef = useRef();
    const orbitControlsRef = useRef();
    const [isUserInteracting, setIsUserInteracting] = useState(false); // Tracks if user is using controls
    const [resetCamera, setResetCamera] = useState(false); // Whether to trigger camera reset
    const resetDuration = 2; // Duration of camera reset in seconds
    const {states } = useThreeDView();

    // State to manage visibility of ocean and compass

    const isCompassLayerVisible = false;
    const isSkyLayerVisible = false;

    const camPosition = new THREE.Vector3(1, 4, 20); // Target position for the reset view
    const targetLookAt = new THREE.Vector3(0, 0, 0); // Where the camera should look at

    const sailBoatRef = useRef();

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

    return (
            <Suspense fallback={null}>
                {/* OrbitControls with ref to detect user interaction */}
                <OrbitControls ref={orbitControlsRef} enableZoom={true} enableRotate={true} />

                {/* Camera */}
                <PerspectiveCamera ref={cameraRef} fov={50} position={camPosition} makeDefault />
                
                <axesHelper args={[100]} />

                {/* Ambient light for better visibility */}
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 10]} intensity={0.8} castShadow />
                <directionalLight position={[-10, 10, -10]} intensity={0.5} />
                <hemisphereLight skyColor={0xffffff} groundColor={0x444444} intensity={0.5} />

                <pointLight position={[10, 10, 10]} />

           
                
                {/* Your central boat */}
                <SailBoat3D ref={sailBoatRef} />
                
                {states.showOcean && <Ocean3D />}
                {isSkyLayerVisible && <Sky3D inclination={0.3} azimuth={0.2} />}

                 {/* AIS Boats fetched from SignalK */}
                <AISBoatView sailBoatRef={sailBoatRef} />
                
                <VMG3D/>

                {/* Render the 3D compass and other boat data */}
                {isCompassLayerVisible && (
                    <ThreeDCompassView
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
                    />
                )}
            </Suspense>
    );
};

export default ThreeDBoatView;
