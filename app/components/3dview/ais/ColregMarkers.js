import React from 'react';
import { Html } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import useTheme from '../../theme/useTheme';
import useColregs from '../../hooks/useColregs';

const ARROW_AHEAD = 14; // scene units ahead of the target's bow
const TURN = 35 * Math.PI / 180;

/** Flat arrow on the water, pointing along local -Z */
const Arrow = ({ color }) => (
    <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2]}>
            <planeGeometry args={[1.2, 5]} />
            <meshBasicMaterial color={color} transparent opacity={0.85} depthWrite={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, Math.PI]} position={[0, 0, -1.2]}>
            <circleGeometry args={[2.2, 3, Math.PI / 2]} />
            <meshBasicMaterial color={color} transparent opacity={0.85} depthWrite={false} />
        </mesh>
    </group>
);

/**
 * Right of way on every collision course, in the north-up AIS layer: a label
 * over the other vessel (it must keep clear / it has right of way) and, when
 * it is the one to give way, an arrow showing the alteration expected from it.
 */
const ColregMarkers = () => {
    const { t } = useTranslation();
    const { scene } = useTheme();
    const { encounters } = useColregs();

    return encounters.slice(0, 5).map(({ target, role }) => {
        const targetGivesWay = role.ownRole === 'stand-on' || role.ownRole === 'both';
        const course = target.cog ?? target.cogMagnetic ?? target.heading ?? 0;
        const label = role.ownRole === 'both'
            ? t('colregs.labelBoth')
            : targetGivesWay ? t('colregs.labelGiveWay') : t('colregs.labelStandOn');
        // Same colours as the targets: violet it keeps clear, red we keep clear
        const color = targetGivesWay ? scene.vesselYields : scene.vesselDanger;
        // Arrow ahead of its bow, turned to the side it should alter to
        const turn = role.targetTurn || 1;
        const heading = course + turn * TURN;
        const ax = target.sceneX + Math.sin(course) * ARROW_AHEAD;
        const az = target.sceneZ - Math.cos(course) * ARROW_AHEAD;

        return (
            <group key={target.mmsi}>
                {/* Screen-sized label: readable at any range */}
                <Html position={[target.sceneX, 12, target.sceneZ]} center zIndexRange={[15, 10]} style={{ pointerEvents: 'none' }}>
                    <div className="whitespace-nowrap px-2 py-1 rounded-md text-caption font-semibold shadow-soft text-white"
                        style={{ background: color }}>
                        {target.name} · {label} · {t('colregs.rule', { rule: role.rule })}
                    </div>
                </Html>
                {targetGivesWay && (
                    <group position={[ax, 0.35, az]} rotation={[0, -heading, 0]}>
                        <Arrow color={color} />
                    </group>
                )}
            </group>
        );
    });
};

export default ColregMarkers;
