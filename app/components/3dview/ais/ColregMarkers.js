import React, { useRef } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import useTheme from '../../theme/useTheme';
import useColregs from '../../hooks/useColregs';
import useHudClearance from '../hud/useHudClearance';

import { Line } from '@react-three/drei';

const START_AHEAD = 6;   // scene units ahead of the target's bow
const ARC_LENGTH = 30;   // length of the expected turn
const TURN = 40 * Math.PI / 180;
const STEPS = 16;

/**
 * Expected manoeuvre of a give-way vessel: a curved arrow starting ahead of
 * its bow and bending to the side it should turn to, flat on the water.
 */
const TurnArrow = ({ x, z, course, turn, color }) => {
    const pts = [];
    let h = course;
    let px = x + Math.sin(course) * START_AHEAD;
    let pz = z - Math.cos(course) * START_AHEAD;
    for (let i = 0; i <= STEPS; i++) {
        pts.push([px, 0.4, pz]);
        h = course + turn * TURN * ((i + 1) / STEPS);
        px += Math.sin(h) * ARC_LENGTH / STEPS;
        pz -= Math.cos(h) * ARC_LENGTH / STEPS;
    }
    const [ex, , ez] = pts[pts.length - 1];
    return (
        <group>
            <Line points={pts} color={color} lineWidth={5} transparent opacity={0.7} />
            {/* Head: a flat triangle along the final heading */}
            <group position={[ex, 0.4, ez]} rotation={[0, -h, 0]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <shapeGeometry args={[(() => { const sh = new THREE.Shape(); sh.moveTo(0, 3.2); sh.lineTo(-2, -0.6); sh.lineTo(2, -0.6); sh.closePath(); return sh; })()]} />
                    <meshBasicMaterial color={color} transparent opacity={0.75} depthWrite={false} side={THREE.DoubleSide} />
                </mesh>
            </group>
        </group>
    );
};

/** The vessel's name over it, hidden while it would sit on the HUD */
const NameTag = ({ name, color }) => {
    const ref = useRef(null);
    useHudClearance(ref);
    return (
        <div ref={ref} className="whitespace-nowrap max-w-[9rem] truncate px-2 py-0.5 rounded-full text-caption font-semibold text-white backdrop-blur-sm"
            style={{ background: `color-mix(in srgb, ${color} 72%, transparent)` }}>
            {name}
        </div>
    );
};

/**
 * Right of way on every collision course, in the north-up AIS layer: a label
 * over the other vessel (it must keep clear / it has right of way) and, when
 * it is the one to give way, an arrow showing the alteration expected from it.
 */
const ColregMarkers = () => {
    const { scene } = useTheme();
    const { encounters } = useColregs();

    return encounters.slice(0, 5).map(({ target, role }) => {
        const targetGivesWay = role.ownRole === 'stand-on' || role.ownRole === 'both';
        const course = target.cog ?? target.cogMagnetic ?? target.heading ?? 0;
        // Same colours as the targets: violet it keeps clear, red we keep clear
        const color = targetGivesWay ? scene.vesselYields : scene.vesselDanger;
        const turn = role.targetTurn || 1;

        return (
            <group key={target.mmsi}>
                {/* Screen-sized name tag, coloured by role: the role and the rule
                    are in the banner, the advice and the vessel's card. */}
                <Html position={[target.sceneX, 12, target.sceneZ]} center zIndexRange={[15, 10]} style={{ pointerEvents: 'none' }}>
                    <NameTag name={target.name} color={color} />
                </Html>
                {targetGivesWay && (
                    <TurnArrow x={target.sceneX} z={target.sceneZ} course={course} turn={turn} color={color} />
                )}
            </group>
        );
    });
};

export default ColregMarkers;
