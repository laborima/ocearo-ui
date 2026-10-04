import React, { Suspense, useRef, useMemo } from 'react';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import SailBoat3D from '../SailBoat3D';
import SceneSetup from '../SceneSetup';
import SeaGround from '../fsd/SeaGround';
import { useSignalKPaths } from '../../hooks/useSignalK';
import useTheme from '../../theme/useTheme';
import WindSector3D from '../compass/WindSector3D';
import Current3D from '../compass/Current3D';
import PathRibbon from './PathRibbon';
import VirtualBerth from './VirtualBerth';
import { Line } from '@react-three/drei';
import { predictTrack } from './steering';
import { wrapPi } from '../../utils/Polar';

// Harbour scene scale: scene units per metre (the boat model is drawn at 0.5)
const SCALE = 0.5;
// Seconds of motion shown ahead
const LOOKAHEAD_S = 20;

const PATHS = [
    'steering.rudderAngle',
    'navigation.speedThroughWater',
    'navigation.speedOverGround',
    'propulsion.0.transmission.gear',
    'propulsion.main.transmission.gear',
    'propulsion.port.transmission.gear',
    'environment.current',
    'environment.wind.speedTrue',
    'environment.wind.angleTrueWater',
    'navigation.headingTrue',
    'navigation.courseOverGroundTrue',
];

/**
 * Harbour view, Tesla parking style: seen from above, the track the boat
 * will follow over the next 20 s with the rudder, speed, current and windage
 * (blue band with chevrons, astern when the gearbox is in reverse; dashed: the
 * same without drift), the berth to reach, and the wind and current arrows.
 */
const ThreeDParkAssistBoat = ({ onUpdateInfoPanel }) => {
    const { scene, accent } = useTheme();
    const sailBoatRef = useRef();
    const v = useSignalKPaths(PATHS);

    const rudder = v['steering.rudderAngle'] ?? 0;
    const speed = Math.abs(v['navigation.speedThroughWater'] ?? v['navigation.speedOverGround'] ?? 0);
    const gear = v['propulsion.0.transmission.gear'] ?? v['propulsion.main.transmission.gear'] ?? v['propulsion.port.transmission.gear'];
    // Signal K: "Forward" / "Neutral" / "Reverse"; some gateways send -1 / 0 / 1
    const reverse = gear === -1 || (typeof gear === 'string' && gear.trim().toLowerCase().startsWith('rev'));

    const heading = v['navigation.headingTrue'] ?? v['navigation.courseOverGroundTrue'];
    const currentData = v['environment.current'];
    const windSpeed = v['environment.wind.speedTrue'];
    const windAngle = v['environment.wind.angleTrueWater'];

    // Predicted track with wind and current, and the same without drift
    const { path, noDrift } = useMemo(() => {
        const signed = reverse ? -speed : speed;
        const current = currentData && Number.isFinite(heading)
            ? { set: wrapPi((currentData.setTrue ?? 0) - heading), drift: currentData.drift ?? 0 }
            : null;
        const wind = Number.isFinite(windSpeed) && Number.isFinite(windAngle) ? { angle: windAngle, speed: windSpeed } : null;
        // Start at the bow (or the stern going astern)
        const start = (reverse ? 1 : -1) * 5.4;
        const toScene = ([x, z]) => [x * SCALE, (z + start) * SCALE];
        return {
            path: predictTrack({ rudder, speed: signed, seconds: LOOKAHEAD_S, current, wind }).map(toScene),
            noDrift: predictTrack({ rudder, speed: signed, seconds: LOOKAHEAD_S }).map(toScene),
        };
    }, [rudder, speed, reverse, heading, currentData, windSpeed, windAngle]);

    return (
        <Suspense fallback={<Html center>Loading...</Html>}>
            {/* From above and a little behind, like a car's parking view */}
            <PerspectiveCamera makeDefault fov={50} near={1} far={1000} position={[0, 30, 12]} />
            <OrbitControls
                target={[0, -3, -2]}
                enableZoom
                enableRotate
                maxPolarAngle={Math.PI / 2.4}
                minPolarAngle={0}
            />

            <SceneSetup fogNear={120} fogFar={400} />

            <group position={[0, -3, 0]}>
                <SeaGround />
                <VirtualBerth scale={SCALE} />

                <SailBoat3D
                    position={[0, 0, 0]}
                    scale={[SCALE, SCALE, SCALE]}
                    ref={sailBoatRef}
                    showSail={false}
                    onUpdateInfoPanel={onUpdateInfoPanel}
                />

                {/* Where the boat goes with this rudder and speed */}
                <PathRibbon points={path} width={3.9 * SCALE} color={accent} glow={scene.routeGlow} />
                {/* Without wind and current, for comparison */}
                <Line points={noDrift.map(([x, z]) => [x, 0.06, z])} color={scene.compassDim} lineWidth={1.5} dashed dashSize={0.6} gapSize={0.5} />

                <WindSector3D outerRadius={5} />
                <Current3D outerRadius={5} />
            </group>
        </Suspense>
    );
};

export default ThreeDParkAssistBoat;
