import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';

import ThreeDCompassView from './ThreeDCompassView';

import * as THREE from 'three';
import SailBoat3D from './SailBoat3D';
import Ocean3D from './Ocean3D';
//import SeeSky3D from './SeeSky3D';


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


    return (

        <Suspense fallback={null}>
            {/* Orbit controls for zoom and rotation */}
            <OrbitControls enableZoom={true} enableRotate={true} />

            {/* Ambient light for better visibility */}
            <ambientLight intensity={0.5} />

            {/* Point light */}
            <pointLight position={[10, 10, 10]} />

            {isOceanLayerVisible && (
                <Ocean3D />
            )}


            <SailBoat3D inclination={Math.PI / 8}/>

            {/*  <AisVessels />*/}

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
                trueWindMaxHistoric={trueWindMaxHistoric} />
        </Suspense>
    );
};

export default ThreeDBoatView;
