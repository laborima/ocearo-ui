import React, { useMemo } from 'react';
import { Billboard, Line, Text } from '@react-three/drei';
import useTheme from '../../theme/useTheme';
import { useSignalKPaths } from '../../hooks/useSignalK';
import { optimalUpwind, polarSpeed, wrapPi } from '../../utils/Polar';

const KN_PER_MS = 1.943844;
const DEG = Math.PI / 180;
const STEP = 2 * DEG;
const MINUTES = [5, 10, 15];
// The last ring reaches this far (scene units, ~6 hull lengths) on the
// fastest point of sail: a polar diagram laid around the boat, readable from
// the default camera. Real distances are written on the rings.
const OUTER_RADIUS = 45;
const NM = 1852;
// Lines sit just above the ground grid
const LIFT = 0.08;

const PATHS = [
    'environment.wind.speedTrue',
    'environment.wind.angleTrueWater',
    'environment.current',
    'navigation.headingTrue',
];

/**
 * Isochrones from the polar: where the boat will be after 5, 10 and 15
 * minutes for every heading it could steer, at the polar speed for the true
 * wind angle of that heading and the true wind speed, carried by the
 * current. Drawn in the boat frame (bow ahead) as a polar diagram around the
 * boat — the outer ring about six hull lengths out — with the real distance
 * along the current heading written on each ring.
 *
 * The no-go zone either side of the wind (inside the best upwind angle) is
 * left open: a dashed chord joins the two close-hauled points. The dot on
 * each ring is where the current heading takes you.
 */
function PolarProjection() {
    const { scene, accent } = useTheme();
    const v = useSignalKPaths(PATHS);

    const twsKn = (v['environment.wind.speedTrue'] ?? 0) * KN_PER_MS;
    const twa = v['environment.wind.angleTrueWater'];
    const current = v['environment.current'];
    const heading = v['navigation.headingTrue'];

    const rings = useMemo(() => {
        if (!(twsKn > 0.5) || !Number.isFinite(twa)) return [];
        const beat = (optimalUpwind(twsKn)?.twa ?? 42) * DEG;
        // Fastest point of sail, for picking the ring step
        let fastest = 0;
        for (let a = 40; a <= 180; a += 10) fastest = Math.max(fastest, polarSpeed(twsKn, a) ?? 0);
        const outerSeconds = MINUTES[MINUTES.length - 1] * 60;
        const scale = OUTER_RADIUS / Math.max(1, (fastest / KN_PER_MS) * outerSeconds);

        // Current drift in the boat frame (x starboard, z astern), m/s
        let cx = 0;
        let cz = 0;
        if (current && Number.isFinite(current.drift) && Number.isFinite(current.setTrue) && Number.isFinite(heading)) {
            const set = wrapPi(current.setTrue - heading);
            cx = current.drift * Math.sin(set);
            cz = -current.drift * Math.cos(set);
        }

        /** Scene position after `seconds` steering heading theta (rad, + to starboard of the bow) */
        const at = (theta, seconds) => {
            const kn = polarSpeed(twsKn, wrapPi(twa - theta) / DEG) ?? 0;
            const d = (kn / KN_PER_MS) * seconds;
            return [
                (Math.sin(theta) * d + cx * seconds) * scale,
                LIFT,
                (-Math.cos(theta) * d + cz * seconds) * scale,
            ];
        };

        return MINUTES.map((min, i) => {
            const seconds = min * 60;
            // Sailable headings: from close-hauled on one tack, round through
            // downwind, to close-hauled on the other
            const arc = [];
            for (let theta = twa + beat; theta <= twa + 2 * Math.PI - beat + 1e-6; theta += STEP) arc.push(at(theta, seconds));
            arc.push(at(twa + 2 * Math.PI - beat, seconds));
            const inNoGo = Math.abs(wrapPi(twa)) < beat;
            const here = inNoGo ? null : at(0, seconds);
            // Real distance made good along the current heading
            const nm = inNoGo ? null : (polarSpeed(twsKn, wrapPi(twa) / DEG) ?? 0) / KN_PER_MS * seconds / NM;
            // Label beside the point the current heading reaches (ahead, away
            // from the camera), or the close-hauled point when pinching
            const anchor = here ?? arc[0];
            const label = [anchor[0] + 1.2, anchor[1], anchor[2]];
            return { min, nm, arc, chord: [arc[0], arc[arc.length - 1]], here, label, opacity: 0.8 - i * 0.15 };
        });
    }, [twsKn, twa, current, heading]);

    if (!rings.length) return null;

    return (
        <group>
            {rings.map(ring => (
                <group key={ring.min}>
                    <Line points={ring.arc} color={scene.compass} lineWidth={2} transparent opacity={ring.opacity} />
                    {/* No-go zone: not reachable directly */}
                    <Line points={ring.chord} color={scene.compassDim} lineWidth={1.5} dashed dashSize={1} gapSize={1}
                        transparent opacity={ring.opacity * 0.8} />
                    {ring.here && (
                        <mesh position={ring.here}>
                            <sphereGeometry args={[0.5, 16, 12]} />
                            <meshBasicMaterial color={accent} />
                        </mesh>
                    )}
                    <Billboard position={[ring.label[0], 0.6, ring.label[2]]}>
                        <Text fontSize={1.3} color={scene.compass} anchorX="left" anchorY="bottom"
                            font="fonts/Roboto-Bold.ttf" outlineWidth={0.12} outlineColor={scene.background}
                            fillOpacity={ring.opacity + 0.2}>
                            {ring.nm != null ? `${ring.min} min · ${ring.nm.toFixed(2)} NM` : `${ring.min} min`}
                        </Text>
                    </Billboard>
                </group>
            ))}
        </group>
    );
}

export default PolarProjection;
