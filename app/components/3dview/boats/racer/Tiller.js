import React from 'react';
import { Billboard, Text } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import useTheme from '../../../theme/useTheme';
import { RIG } from './rig';

const DEG = Math.PI / 180;
const SWEEP = 35 * DEG;   // rudder stops, either side
const TICK_EVERY = 10;    // degrees

/**
 * Tiller with the rudder indicator built in: the tiller swings opposite to
 * the rudder blades (tiller to port = rudder to starboard), over a graduated
 * arc on the cockpit floor, with the angle at its end.
 *
 * @param {number} rudder - rudder angle, rad (+ = rudder to starboard)
 */
const Tiller = ({ rudder = 0 }) => {
    const { t } = useTranslation();
    const { scene, accent } = useTheme();
    const { pivot, length } = RIG.tiller;
    const angle = Math.max(-SWEEP, Math.min(SWEEP, rudder));
    const deg = Math.round(Math.abs(rudder) / DEG);
    const floorY = RIG.traveller.y - pivot[1] + 0.02;

    const ticks = [];
    for (let d = -35; d <= 35; d += TICK_EVERY / 2) {
        const a = d * DEG;
        const major = d % TICK_EVERY === 0;
        ticks.push(
            <mesh key={d} position={[-Math.sin(a) * (length - 0.05), floorY, -Math.cos(a) * (length - 0.05)]} rotation={[0, a, 0]}>
                <boxGeometry args={[0.05, 0.02, major ? 0.3 : 0.15]} />
                <meshBasicMaterial color={d === 0 ? scene.compass : scene.compassDim} />
            </mesh>
        );
    }

    return (
        <group position={pivot}>
            {/* Graduated arc swept by the tiller end */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, floorY, 0]}>
                <ringGeometry args={[length - 0.08, length + 0.06, 48, 1, Math.PI / 2 - SWEEP, SWEEP * 2]} />
                <meshBasicMaterial color={scene.compassDim} transparent opacity={0.7} depthWrite={false} />
            </mesh>
            {ticks}

            {/* The tiller itself, in the accent colour: it is the indicator */}
            <group rotation={[0, angle, 0]}>
                <mesh position={[0, 0, -length / 2]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.07, 0.09, length, 12]} />
                    <meshLambertMaterial color={accent} />
                </mesh>
                <mesh position={[0, 0, -length]}>
                    <sphereGeometry args={[0.13, 14, 10]} />
                    <meshLambertMaterial color={accent} />
                </mesh>
                <Billboard position={[0, 0.45, -length]}>
                    <Text fontSize={0.55} color={accent} anchorX="center" anchorY="bottom"
                        font="fonts/Roboto-Bold.ttf" outlineWidth={0.03} outlineColor={scene.background}>
                        {deg === 0 ? '0°' : `${deg}° ${t(rudder > 0 ? 'hud.starboardShort' : 'hud.portShort')}`}
                    </Text>
                </Billboard>
            </group>
        </group>
    );
};

export default Tiller;
