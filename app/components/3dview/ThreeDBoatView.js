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
import FsdOcean, { SkyDome } from './ocean/FsdOcean';
import WindLayer3D from './meteo/WindLayer3D';
import Seabed3D from './ocean/Seabed3D';
import MobMarker3D from '../mob/MobMarker3D';
import { useReplay } from '../replay/ReplayBar';
import SceneSetup from './SceneSetup';
import useTheme from '../theme/useTheme';
import SeaGround from './fsd/SeaGround';
import RouteRibbon from './fsd/RouteRibbon';
import PerformanceWake from './fsd/PerformanceWake';
import GhostBoat from './fsd/GhostBoat';
import AdvicePath3D from './fsd/AdvicePath3D';
import PolarTargets3D from './compass/PolarTargets3D';
import configService from '../settings/ConfigService';
import useSailTrim from '../hooks/useSailTrim';
import { updateSailTrim } from './sail/SailTrimUtils';
import SailTrimSliders from './sail/SailTrimSliders';

const ThreeDBoatView = ({ onUpdateInfoPanel }) => {
    const { states } = useOcearoContext(); // Application state from context
    const { scene } = useTheme();
    const isCompassLayerVisible = true; // Compass visibility
    const sailBoatRef = useRef();
    const replaying = useReplay().active;
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
        return { ...computed, trimState: sailTrim.trimState, windData: sailTrim.windData };
    }, [sailTrim.windData, sailTrim.trimState]);


    return (
        <Suspense fallback={<Html>Loading...</Html>}>
            {/* PerspectiveCamera */}
            <PerspectiveCamera
                makeDefault
                fov={60}
                near={5}
                // Meteo: the camera pulls far out over the wind field
                far={states.oceanMode === 'meteo' ? 60000 : 6000}
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
            <SceneSetup backdrop={states.oceanMode === 'black' || states.oceanMode === 'water'} fogNear={600} fogFar={4200}
                fogColor={states.oceanMode === 'water' ? scene.skyHorizon : undefined} />

            <group position={[0, -3, 0]} >
                {/* Sailboat — the map plane (-0.1) sits 0.2 above the water
                    plane (-0.3), so lift the hull by the same amount in map
                    modes or it floats visibly below the chart surface */}
                <SailBoat3D
                    position={[0, (states.oceanMode === 'chart' || states.oceanMode === 'depth' || states.oceanMode === 'meteo') ? 0.2 : 0, 0]}
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
                {/* Water: FSD faceted sea and gradient sky; chart / meteo keep the flat lite water */}
                {states.oceanMode === 'water' && <FsdOcean />}
                {(states.oceanMode === 'chart' || states.oceanMode === 'depth' || states.oceanMode === 'meteo') && (
                    <>
                        <SkyDome />
                        <Ocean3D lite sky={false} horizon={scene.skyHorizon}
                            fogDensity={states.oceanMode === 'meteo' ? 0.00003 : undefined} water={states.oceanMode !== 'depth'} />
                    </>
                )}
                {/* Bathymetry: seabed relief coloured by depth, the chart laid over it in transparency */}
                {states.oceanMode === 'depth' && <Seabed3D />}
                {states.oceanMode === 'depth' && <MapPlane3D mode="chart" opacity={0.2} />}
                {/* Windy-style forecast wind: colours and streaks over the chart */}
                {states.oceanMode === 'meteo' && <WindLayer3D />}
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
                {/* Person overboard: drop point, drift and estimated position */}
                <MobMarker3D />

                {/* Live AIS makes no sense around a replayed voyage */}
                {states.ais && !replaying && <AISView onUpdateInfoPanel={onUpdateInfoPanel} />}

                {/* Compass */}
                <ThreeDCompassView visible={isCompassLayerVisible} />
                <PolarTargets3D />

                {/* Sail trim car indicators at compass level (also on deck for the racer) */}
                {configService.get('showSailTrimSliders') !== false && <SailTrimSliders />}
            </group>

            {/* Debug 3D axes */}
            {showAxes && <axesHelper args={[100]} />}
        </Suspense>
    );
};

export default ThreeDBoatView;
