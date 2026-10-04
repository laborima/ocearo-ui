import React from 'react';
import { Text } from '@react-three/drei';
import useTheme from '../../theme/useTheme';
import usePolarPerformance from '../../hooks/usePolarPerformance';
import { wrapPi } from '../../utils/Polar';

const RADIUS = 7.2; // just outside the compass ring

/** Triangle pointing at the ring centre, at `angle` from the bow (clockwise) */
const Marker = ({ angle, color, label }) => {
    const x = Math.sin(angle) * RADIUS;
    const z = -Math.cos(angle) * RADIUS;
    return (
        <group position={[x, 0.05, z]} rotation={[0, -angle, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, Math.PI]}>
                <circleGeometry args={[0.45, 3]} />
                <meshBasicMaterial color={color} />
            </mesh>
            <Text position={[0, 0.02, -0.9]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.42}
                color={color} anchorX="center" anchorY="middle" font="fonts/Roboto-Bold.ttf">
                {label}
            </Text>
        </group>
    );
};

/**
 * Polar targets on the compass ring: the heading that sails the optimal wind
 * angle on this tack (TWA), and the heading with the best velocity made good
 * to the waypoint (VMG). Both relative to the bow, like the boat-up dial.
 */
const PolarTargets3D = () => {
    const { scene } = useTheme();
    const { heading, targetHeading, vmc } = usePolarPerformance();
    if (!Number.isFinite(heading)) return null;

    return (
        <group>
            {Number.isFinite(targetHeading) && (
                <Marker angle={wrapPi(targetHeading - heading)} color={scene.target} label="TWA" />
            )}
            {vmc?.best && (
                <Marker angle={wrapPi(vmc.best.heading - heading)} color={scene.route} label="VMG" />
            )}
        </group>
    );
};

export default PolarTargets3D;
