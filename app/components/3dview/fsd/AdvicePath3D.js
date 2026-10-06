import React from 'react';
import useTheme from '../../theme/useTheme';
import useCourseAdvice from '../../hooks/useCourseAdvice';
import Ribbon from './Ribbon';

const LENGTH = 90; // scene units, ~2 minutes at 6 kn

/**
 * Suggested course drawn like FSD's alternative path: a translucent ribbon
 * from the bow along the advised heading. The advice itself is written in
 * the HUD panel: a label in the scene ran under the HUD values.
 */
const AdvicePath3D = () => {
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
        <Ribbon from={[0, -4]} to={end} color={color} width={2} opacity={0.28} fadeTo y={-0.1} />
    );
};

export default AdvicePath3D;
