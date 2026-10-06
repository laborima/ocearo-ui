import { useMemo } from 'react';
import { useSignalKPaths } from '../../hooks/useSignalK';
import { useOcearoContext } from '../../context/OcearoContext';

const HEADING_PATHS = [
    'navigation.headingTrue',
    'navigation.headingMagnetic',
    'navigation.courseOverGroundTrue',
    'navigation.courseOverGroundMagnetic',
    'navigation.position',
];

// First fix of the session: world-anchored effects measure from here
let sessionOrigin = null;
const originFor = (here) => {
    if (!sessionOrigin) sessionOrigin = here;
    return sessionOrigin;
};

/** The session's first fix ({lat, lon}), null before it: origin of `offset` */
export const getSessionOrigin = () => sessionOrigin;

/**
 * Own heading (rad) used to turn north-up layers into the boat-up scene, the
 * same fallback chain as the AIS layer, plus our position as East/North metres
 * from the first fix (for world-anchored effects such as the ground grid).
 */
const useOwnTrack = () => {
    const { convertLatLonToXY } = useOcearoContext();
    const values = useSignalKPaths(HEADING_PATHS);

    const rawHeading = values['navigation.headingTrue'] ?? values['navigation.headingMagnetic']
        ?? values['navigation.courseOverGroundTrue'] ?? values['navigation.courseOverGroundMagnetic'];
    const hasHeading = Number.isFinite(rawHeading);
    const heading = hasHeading ? rawHeading : 0;

    const position = values['navigation.position'];
    const hasFix = Number.isFinite(position?.latitude) && Number.isFinite(position?.longitude);
    const offset = useMemo(() => {
        if (!hasFix) return { x: 0, y: 0 };
        const here = { lat: position.latitude, lon: position.longitude };
        return convertLatLonToXY(here, originFor(here));
    }, [position, hasFix, convertLatLonToXY]);

    return { heading, offset, hasFix, hasHeading };
};

export default useOwnTrack;
