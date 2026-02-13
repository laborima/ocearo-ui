import React, { Suspense, useRef, useState, useEffect } from 'react';
import { OrbitControls, PerspectiveCamera, Html, Environment } from '@react-three/drei';
import SailBoat3D from './SailBoat3D';
import { Trail } from './ocean/Trail3D';
import Ocean3D from './ocean/Ocean3D';
import AISView from './ais/AISView';
import ThreeDCompassView from './ThreeDCompassView';
import LayLines3D from './compass/LayLines3D';
import { useOcearoContext } from '../context/OcearoContext';
import { AISProvider } from './ais/AISContext';
import PolarProjection from './polar/Polar3D';
import BoatLighting from './BoatLighting';
import configService from '../settings/ConfigService';

const ThreeDBoatView = ({ onUpdateInfoPanel }) => {
    const { states } = useOcearoContext(); // Application state from context
    const isCompassLayerVisible = false; // Compass visibility
    const sailBoatRef = useRef();
    const showAxes = configService.get('debugShowAxes');


    return (
        <Suspense fallback={<Html>Loading...</Html>}>
            {/* PerspectiveCamera */}
            <PerspectiveCamera
                makeDefault
                fov={60}
                near={5}
                far={500}
                position={[0, 5, 20]}
            />
            {/* Orbit controls */}
            <OrbitControls
                enableZoom={true}
                enableRotate={true}
                maxPolarAngle={Math.PI / 2}
                minPolarAngle={Math.PI / 4}
                enableDamping={false}
                zoomSpeed={0.5}
                rotateSpeed={0.5}
            />

            {/* Environment for reflections */}
            <Environment
                files="./assets/ocearo_env.hdr"
                background={false}
                intensity={0.8}
                resolution={256}
            />

            {/* Lighting setup */}
            <BoatLighting />

            <group position={[0, -3, 0]} >
                {/* Sailboat */}
                <SailBoat3D 
                    position={[0, 0, 0.7]} 
                    scale={[0.7, 0.7, 0.7]} 
                    ref={sailBoatRef} 
                    showSail={true} 
                    onUpdateInfoPanel={onUpdateInfoPanel} 
                />

                {/* Ocean */}
                {states.showOcean && <Ocean3D />}

                <Trail />

                {/* Laylines */}
                {states.showLaylines3D && <LayLines3D outerRadius={5.6} />}

                {states.showPolar && !states.showOcean && <PolarProjection /> }

                {/* AIS Boats */}
                {states.ais && <AISProvider>
                    <AISView onUpdateInfoPanel={onUpdateInfoPanel} />
                </AISProvider>}

                {/* Compass */}
                <ThreeDCompassView visible={isCompassLayerVisible} />
            </group>

            {/* Debug 3D axes */}
            {showAxes && <axesHelper args={[100]} />}
        </Suspense>
    );
};

export default ThreeDBoatView;
