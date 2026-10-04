import { useMemo } from 'react';
import useOwnTrack from '../fsd/useOwnTrack';
import { useBerth } from './parkingStore';
import { wrapPi } from '../../utils/Polar';
import { BOAT } from './VirtualBerth';

/**
 * Where the berth entrance is from the boat and how to line up with it.
 * @returns {null|{ distance: number, bearing: number, headingError: number,
 *   lateral: number, astern: boolean }}
 *   distance (m) and relative bearing (rad, + = starboard) of the entrance,
 *   heading change still needed to be aligned (rad, + = starboard), lateral
 *   offset from the berth axis at the entrance (m, + = we are to starboard),
 *   astern: the berth is entered going astern
 */
const useBerthGuidance = () => {
    const { heading, offset } = useOwnTrack();
    const berth = useBerth();

    return useMemo(() => {
        if (!berth.pose) return null;
        const { x, y, heading: h } = berth.pose;
        const astern = berth.type === 'stern';
        // Entrance: the open end of the berth, half a boat length out
        const toOpen = astern ? 1 : -1;
        const entry = {
            x: x + toOpen * Math.sin(h) * BOAT.length * 0.5,
            y: y + toOpen * Math.cos(h) * BOAT.length * 0.5,
        };
        const dx = entry.x - offset.x;
        const dy = entry.y - offset.y;
        const distance = Math.hypot(dx, dy);
        const bearing = wrapPi(Math.atan2(dx, dy) - heading);
        // Lateral offset from the berth axis (right of the axis = starboard)
        const lateral = -(dx * Math.cos(h) - dy * Math.sin(h));
        return { distance, bearing, headingError: wrapPi(h - heading), lateral, astern };
    }, [berth, heading, offset]);
};

export default useBerthGuidance;
