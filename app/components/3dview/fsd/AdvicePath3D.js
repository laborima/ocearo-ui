import React from 'react';
import { Billboard, Text } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import useTheme from '../../theme/useTheme';
import useCourseAdvice from '../../hooks/useCourseAdvice';
import Ribbon from './Ribbon';
import { formatAdvice } from './adviceText';

const LENGTH = 90; // scene units, ~2 minutes at 6 kn

/**
 * Suggested course drawn like FSD's alternative path: a translucent ribbon
 * from the bow along the advised heading, with the advice as a label.
 */
const AdvicePath3D = () => {
    const { t } = useTranslation();
    const { scene } = useTheme();
    const advice = useCourseAdvice();
    if (!advice) return null;

    // Stand-on: nothing to draw, the panel says "hold course and speed"
    if (advice.kind === 'standOn' || advice.change === null) return null;

    // Boat frame: the change is relative to our current course (bow up)
    const end = [Math.sin(advice.change) * LENGTH, -Math.cos(advice.change) * LENGTH];
    // Avoidance in red; a VMG idea in amber, distinct from the planned route
    const color = advice.kind === 'avoid' ? scene.vesselDanger : scene.target;

    return (
        <group>
            <Ribbon from={[0, -4]} to={end} color={color} width={2} opacity={0.28} fadeTo y={-0.1} />
            <Billboard position={[end[0] * 0.45, 4, end[1] * 0.45]}>
                <Text fontSize={1.5} color={color} anchorX="center" anchorY="bottom"
                    font="fonts/Roboto-Bold.ttf" outlineWidth={0.04} outlineColor={scene.background}>
                    {formatAdvice(advice, t)}
                </Text>
            </Billboard>
        </group>
    );
};

export default AdvicePath3D;
