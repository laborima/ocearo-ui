import React from 'react';
import useTheme from '../../../theme/useTheme';
import { RIG } from './rig';

const CAR = [0.6, 0.3, 0.7]; // m: large enough to read from the default camera

/**
 * Trim indicators on the deck, where the hardware is: the mainsheet traveller
 * across the cockpit, and the jib car on each side deck (the leeward one, in
 * use, highlighted). Values 0..1: traveller port -> starboard, jib car
 * forward -> aft.
 */
const DeckTrim = ({ mainCar = 0.5, jibCar = 0.5, leeward = -1 }) => {
    const { scene, accent } = useTheme();
    const t = RIG.traveller;
    const j = RIG.jibTrack;
    const travellerX = (mainCar - 0.5) * 2 * t.halfWidth;
    const jibZ = j.zFwd + (j.zAft - j.zFwd) * jibCar;

    return (
        <group>
            {/* Traveller track and car */}
            <mesh position={[0, t.y, t.z]}>
                <boxGeometry args={[t.halfWidth * 2, 0.08, 0.2]} />
                <meshLambertMaterial color={scene.rigging} />
            </mesh>
            <mesh position={[travellerX, t.y + 0.1, t.z]}>
                <boxGeometry args={CAR} />
                <meshLambertMaterial color={accent} />
            </mesh>

            {/* Jib tracks, car on both sides; the leeward one carries the sheet */}
            {[1, -1].map((side) => {
                const active = side === leeward;
                return (
                    <group key={side}>
                        <mesh position={[side * j.x, j.y, (j.zFwd + j.zAft) / 2]}>
                            <boxGeometry args={[0.1, 0.08, j.zAft - j.zFwd]} />
                            <meshLambertMaterial color={scene.rigging} />
                        </mesh>
                        <mesh position={[side * j.x, j.y + 0.1, jibZ]}>
                            <boxGeometry args={[CAR[1], CAR[1], CAR[2]]} />
                            <meshLambertMaterial color={active ? accent : scene.markerDim} transparent opacity={active ? 1 : 0.6} />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
};

export default DeckTrim;
