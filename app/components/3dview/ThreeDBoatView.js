import React, { Suspense, useRef, useMemo } from 'react';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import SailBoat3D from './SailBoat3D';
import Ocean3D from './ocean/Ocean3D';
import MapPlane3D from './ocean/MapPlane3D';
import AISView from './ais/AISView';
import ThreeDCompassView from './ThreeDCompassView';
import LayLines3D from './compass/LayLines3D';
import { useOcearoContext } from '../context/OcearoContext';
import PolarProjection from './polar/Polar3D';
import SceneSetup from './SceneSetup';
import SeaGround from './fsd/SeaGround';
import RouteRibbon from './fsd/RouteRibbon';
import PerformanceWake from './fsd/PerformanceWake';
import GhostBoat from './fsd/GhostBoat';
import AdvicePath3D from './fsd/AdvicePath3D';
import PolarTargets3D from './compass/PolarTargets3D';
import configService from '../settings/ConfigService';
import { getRenderProfile } from '../utils/RenderProfile';
import useSailTrim from '../hooks/useSailTrim';
import { updateSailTrim } from './sail/SailTrimUtils';
import SailTrimSliders from './sail/SailTrimSliders';

const ThreeDBoatView = ({ onUpdateInfoPanel }) => {
    const { states } = useOcearoContext(); // Application state from context
    const isCompassLayerVisible = true; // Compass visibility
    const sailBoatRef = useRef();
    const showAxes = configService.get('debugShowAxes');
    const piProfile = useMemo(() => getRenderProfile().id === 'pi', []);

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
                far={6000}
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

            {/* Background, fog and lights; the realistic ocean draws its own sky */}
            <SceneSetup backdrop={states.oceanMode === 'black'} fogNear={600} fogFar={4200} />

            <group position={[0, -3, 0]} >
                {/* Sailboat — the map plane (-0.1) sits 0.2 above the water
                    plane (-0.3), so lift the hull by the same amount in map
                    modes or it floats visibly below the chart surface */}
                <SailBoat3D
                    position={[0, (states.oceanMode === 'chart' || states.oceanMode === 'meteo') ? 0.2 : 0, 0]}
                    scale={[0.7, 0.7, 0.7]} 
                    ref={sailBoatRef} 
                    showSail={true} 
                    onUpdateInfoPanel={onUpdateInfoPanel}
                    sailTrimData={sailTrimData}
                />

                {/* Boat sailing at the polar speed: ahead of us = we are under the polar */}
                {configService.get('showGhostBoat') !== false && (
                    <GhostBoat scale={0.7} />
                )}

                {/* Ocean / Map plane — chart & meteo keep the ocean sky/water,
                    the map plane floats just above the water surface */}
                {/* The mirrored water renders the scene twice: flat water on a Pi */}
                {states.oceanMode !== 'black' && <Ocean3D lite={states.oceanMode !== 'water' || piProfile} />}
                {states.oceanMode === 'chart' && <MapPlane3D mode="chart" />}
                {states.oceanMode === 'meteo' && <MapPlane3D mode="meteo" />}

                {/* FSD view: neutral ground with a sea-anchored grid */}
                {states.oceanMode === 'black' && <SeaGround />}

                {/* Planned route to the next waypoint */}
                <RouteRibbon />

                {/* Wake coloured by the share of the polar reached */}
                <PerformanceWake />

                {/* Laylines */}
                {states.showLaylines3D && <LayLines3D />}

                {/* Suggested course change (avoidance or VMG), advisory only */}
                <AdvicePath3D />

                {states.showPolar && states.oceanMode === 'black' && <PolarProjection /> }

                {/* AIS Boats */}
                {states.ais && <AISView onUpdateInfoPanel={onUpdateInfoPanel} />}

                {/* Compass */}
                <ThreeDCompassView visible={isCompassLayerVisible} />
                <PolarTargets3D />

                {/* Sail trim car indicators at compass level */}
                {configService.get('showSailTrimSliders') !== false && <SailTrimSliders />}
            </group>

            {/* Debug 3D axes */}
            {showAxes && <axesHelper args={[100]} />}
        </Suspense>
    );
};

export default ThreeDBoatView;
