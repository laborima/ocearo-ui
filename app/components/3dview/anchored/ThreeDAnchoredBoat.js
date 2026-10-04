import React, { Suspense, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import SceneSetup from '../SceneSetup';
import SeaGround from '../fsd/SeaGround';
import SailBoat3D from '../SailBoat3D';
import AnchoredCircle from './AnchoredCircle';

const ThreeDAnchoredBoat = ({ onUpdateInfoPanel }) => {
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

            <SceneSetup />

            {/* Boat model */}
            <SailBoat3D 
                ref={sailBoatRef} 
                scale={[1.3, 1.3, 1.3]} 
                position={[0, -6, 0]} 
                onUpdateInfoPanel={onUpdateInfoPanel} 
            />

            <AnchoredCircle />

            {/* Same neutral ground as the boat view */}
            <SeaGround y={-7} />

        </Suspense>
    );
};

export default ThreeDAnchoredBoat;
