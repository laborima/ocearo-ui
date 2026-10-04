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
import { predictPath } from './steering';

// Harbour scene scale: scene units per metre (the boat model is drawn at 0.5)
const SCALE = 0.5;
// Seconds of motion shown ahead, and the path length limits (metres)
const LOOKAHEAD_S = 15;
const MIN_PATH = 8;
const MAX_PATH = 25;

const PATHS = [
    'steering.rudderAngle',
    'navigation.speedThroughWater',
    'navigation.speedOverGround',
    'propulsion.0.transmission.gear',
    'propulsion.main.transmission.gear',
    'propulsion.port.transmission.gear',
];

/**
 * Harbour view, Tesla parking style: seen from above, the path the boat will
 * follow with the current rudder and speed (blue band with chevrons, astern
 * when the gearbox is in reverse), the berth to reach, and wind and current.
 */
const ThreeDParkAssistBoat = ({ onUpdateInfoPanel }) => {
    const { scene, accent } = useTheme();
    const sailBoatRef = useRef();
    const v = useSignalKPaths(PATHS);

    const rudder = v['steering.rudderAngle'] ?? 0;
    const speed = Math.abs(v['navigation.speedThroughWater'] ?? v['navigation.speedOverGround'] ?? 0);
    const gear = v['propulsion.0.transmission.gear'] ?? v['propulsion.main.transmission.gear'] ?? v['propulsion.port.transmission.gear'];
    const reverse = gear === 'reverse';

    const path = useMemo(() => {
        const length = Math.min(MAX_PATH, Math.max(MIN_PATH, speed * LOOKAHEAD_S));
        // Path starts at the bow (or the stern going astern)
        const start = (reverse ? 1 : -1) * 5.4;
        return predictPath(rudder, length, reverse).map(([x, z]) => [x * SCALE, (z + start) * SCALE]);
    }, [rudder, speed, reverse]);

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
                <PathRibbon points={path} width={3.9 * SCALE} color={accent} glow={scene.routeGlow} opacity={speed < 0.2 ? 0.5 : 1} />

                <WindSector3D outerRadius={5} />
                <Current3D outerRadius={5} />
            </group>
        </Suspense>
    );
};

export default ThreeDParkAssistBoat;
