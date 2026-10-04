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

/**
 * Own heading (rad) used to turn north-up layers into the boat-up scene, the
 * same fallback chain as the AIS layer, plus our position as East/North metres
 * from the first fix (for world-anchored effects such as the ground grid).
 */
const useOwnTrack = () => {
    const { convertLatLonToXY } = useOcearoContext();
    const values = useSignalKPaths(HEADING_PATHS);

    const heading = values['navigation.headingTrue'] ?? values['navigation.headingMagnetic']
        ?? values['navigation.courseOverGroundTrue'] ?? values['navigation.courseOverGroundMagnetic'] ?? 0;

    const position = values['navigation.position'];
    const offset = useMemo(() => {
        if (!Number.isFinite(position?.latitude) || !Number.isFinite(position?.longitude)) return { x: 0, y: 0 };
        const here = { lat: position.latitude, lon: position.longitude };
        if (!sessionOrigin) sessionOrigin = here;
        return convertLatLonToXY(here, sessionOrigin);
    }, [position, convertLatLonToXY]);

    return { heading, offset };
};

export default useOwnTrack;
