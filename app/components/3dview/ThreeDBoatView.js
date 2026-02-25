import React, { Suspense, useRef, useMemo } from 'react';
import { OrbitControls, PerspectiveCamera, Html, Environment } from '@react-three/drei';
import SailBoat3D from './SailBoat3D';
import { Trail } from './ocean/Trail3D';
import Ocean3D from './ocean/Ocean3D';
import MapPlane3D from './ocean/MapPlane3D';
import AISView from './ais/AISView';
import ThreeDCompassView from './ThreeDCompassView';
import LayLines3D from './compass/LayLines3D';
import { useOcearoContext } from '../context/OcearoContext';
import { AISProvider } from './ais/AISContext';
import PolarProjection from './polar/Polar3D';
import BoatLighting from './BoatLighting';
import configService from '../settings/ConfigService';
import useSailTrim from '../hooks/useSailTrim';
import { updateSailTrim } from './sail/SailTrimUtils';
import SailTrimSliders from './sail/SailTrimSliders';

const ThreeDBoatView = ({ onUpdateInfoPanel }) => {
    const { states } = useOcearoContext(); // Application state from context
    const isCompassLayerVisible = true; // Compass visibility
    const sailBoatRef = useRef();
    const showAxes = configService.get('debugShowAxes');

    const sailTrim = useSailTrim();

    const sailTrimData = useMemo(() => {
        const computed = updateSailTrim({
            tws: sailTrim.windData.tws,
            twa: sailTrim.windData.twa,
            awa: sailTrim.windData.awa,
            mainCar: sailTrim.trimState.mainCar,
            jibCar: sailTrim.trimState.jibCar,
            tension: sailTrim.trimState.tension,
        });
        return { ...computed, trimState: sailTrim.trimState };
    }, [sailTrim.windData, sailTrim.trimState]);


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
                    position={[0, 0, 0]} 
                    scale={[0.7, 0.7, 0.7]} 
                    ref={sailBoatRef} 
                    showSail={true} 
                    onUpdateInfoPanel={onUpdateInfoPanel}
                    sailTrimData={sailTrimData}
                />

                {/* Ocean / Map plane */}
                {states.oceanMode === 'water' && <Ocean3D />}
                {states.oceanMode === 'chart' && <MapPlane3D mode="chart" />}
                {states.oceanMode === 'meteo' && <MapPlane3D mode="meteo" />}

                <Trail />

                {/* Laylines */}
                {states.showLaylines3D && <LayLines3D outerRadius={5.6} />}

                {states.showPolar && states.oceanMode === 'black' && <PolarProjection /> }

                {/* AIS Boats */}
                {states.ais && <AISProvider>
                    <AISView onUpdateInfoPanel={onUpdateInfoPanel} />
                </AISProvider>}

                {/* Compass */}
                <ThreeDCompassView visible={isCompassLayerVisible} />

                {/* Sail trim car indicators at compass level */}
                {configService.get('showSailTrimSliders') !== false && <SailTrimSliders />}
            </group>

            {/* Debug 3D axes */}
            {showAxes && <axesHelper args={[100]} />}
        </Suspense>
    );
};

export default ThreeDBoatView;
