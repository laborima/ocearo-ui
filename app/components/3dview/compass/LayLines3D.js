import React from 'react';
import { Billboard, Line, Text } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import useTheme from '../../theme/useTheme';
import useLaylines from '../../hooks/useLaylines';
import useOwnTrack from '../fsd/useOwnTrack';
import Ribbon from '../fsd/Ribbon';
import configService from '../../settings/ConfigService';
import { convertDistanceUnit, getDistanceUnitLabel } from '../../utils/UnitConversions';

const MAX_LENGTH = 1500; // scene units
const Y = -0.15;
// Short ribbons from the bow at both tacks' optimal headings
const TACK_PREVIEW = 160;

/** East/North metres -> north-up scene [x, z] */
const toScene = (p, scale) => [p.x * scale, -p.y * scale];

const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return null;
    const m = Math.round(seconds / 60);
    return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m} min`;
};

/**
 * Laylines as translucent ribbons through the next waypoint (polar optimal
 * angles, both tacks), plus where to tack or gybe from the current course,
 * with the distance and time to get there.
 */
const LayLines3D = () => {
    const { t } = useTranslation();
    const { scene } = useTheme();
    const { heading } = useOwnTrack();
    const laylines = useLaylines();
    const scale = configService.get('aisLengthScalingFactor') || 0.7;

    if (!laylines) return null;
    const { waypoint, port, starboard, tack, upwind } = laylines;
    const wp = toScene(waypoint, scale);
    const reach = Math.min(Math.hypot(wp[0], wp[1]) * 1.3 + 200, MAX_LENGTH);

    // Each layline runs from far out to the waypoint, along the heading sailed on it
    const layline = (h) => [wp[0] - Math.sin(h) * reach, wp[1] + Math.cos(h) * reach];

    const tackScene = tack ? toScene(tack.point, scale) : null;
    // Seen from the boat, a 2 m ribbon 1 km away is thinner than a pixel:
    // widen with distance
    const width = Math.min(25, Math.max(3, Math.hypot(wp[0], wp[1]) * 0.015));
    const ahead = (h) => [Math.sin(h) * TACK_PREVIEW, -Math.cos(h) * TACK_PREVIEW];
    const tackLabel = tack
        ? `${upwind ? t('laylines.tack') : t('laylines.gybe')} ${convertDistanceUnit(tack.distance)} ${getDistanceUnitLabel()}${formatTime(tack.time) ? ` · ${formatTime(tack.time)}` : ''}`
        : null;

    return (
        <group rotation={[0, heading, 0]}>
            <Ribbon from={layline(port.heading)} to={wp} color={scene.laylinePort} y={Y} width={width} opacity={0.3} fadeFrom />
            <Ribbon from={layline(starboard.heading)} to={wp} color={scene.laylineStarboard} y={Y} width={width} opacity={0.3} fadeFrom />
            {/* Both tacks' optimal headings from the bow */}
            <Ribbon from={[0, 0]} to={ahead(port.heading)} color={scene.laylinePort} y={Y} width={2.2} opacity={0.35} fadeTo />
            <Ribbon from={[0, 0]} to={ahead(starboard.heading)} color={scene.laylineStarboard} y={Y} width={2.2} opacity={0.35} fadeTo />

            {tackScene && (
                <group>
                    {/* Our course up to the tack point, then along the layline */}
                    <Line points={[[0, Y + 0.05, 0], [tackScene[0], Y + 0.05, tackScene[1]]]}
                        color={scene.target} lineWidth={2} dashed dashSize={2.5} gapSize={2} />
                    <mesh position={[tackScene[0], Y + 0.06, tackScene[1]]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[1.8, 2.6, 32]} />
                        <meshBasicMaterial color={scene.target} transparent opacity={0.9} depthWrite={false} />
                    </mesh>
                    <Billboard position={[tackScene[0], 5, tackScene[1]]}>
                        <Text fontSize={1.6} color={scene.target} anchorX="center" anchorY="bottom"
                            font="fonts/Roboto-Bold.ttf" outlineWidth={0.04} outlineColor={scene.background}>
                            {tackLabel}
                        </Text>
                    </Billboard>
                </group>
            )}
        </group>
    );
};

export default LayLines3D;
