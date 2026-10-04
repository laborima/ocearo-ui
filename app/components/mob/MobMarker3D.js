import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Line, Text } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import useTheme from '../theme/useTheme';
import configService from '../settings/ConfigService';
import { useSignalKPaths } from '../hooks/useSignalK';
import { useActiveMobs } from './useMob';
import { vesselNow } from '../utils/VesselClock';
import useOwnTrack from '../3dview/fsd/useOwnTrack';

const PATHS = ['navigation.position', 'environment.current', 'environment.wind.speedTrue', 'environment.wind.directionTrue'];
const R = 6371000;
// Leeway of a person in the water with a lifejacket: ~2.5 % of the wind speed,
// downwind (search-and-rescue planning figure)
const LEEWAY = 0.025;
// Drift prediction shown ahead of the estimated position
const AHEAD_MIN = 10;

const offset = (from, to) => ({
    east: (to.longitude - from.longitude) * Math.PI / 180 * R * Math.cos(from.latitude * Math.PI / 180),
    north: (to.latitude - from.latitude) * Math.PI / 180 * R,
});

/** A person afloat: body in a lifejacket, head, raised arm; bobbing */
const Person = ({ color }) => {
    const ref = useRef();
    useFrame(({ clock }) => {
        if (!ref.current) return;
        ref.current.position.y = Math.sin(clock.elapsedTime * 1.6) * 0.15;
        ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.1) * 0.12;
    });
    return (
        <group ref={ref} scale={1.6}>
            <mesh position={[0, 0.15, 0]}>
                <capsuleGeometry args={[0.32, 0.35, 6, 12]} />
                <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.85, 0]}>
                <sphereGeometry args={[0.22, 16, 12]} />
                <meshStandardMaterial color="#e9c8a8" roughness={0.7} />
            </mesh>
            <mesh position={[0.32, 0.95, 0]} rotation={[0, 0, -0.35]}>
                <capsuleGeometry args={[0.08, 0.55, 4, 8]} />
                <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
        </group>
    );
};

/**
 * Person overboard in the 3D view: where they fell (drop point), where they
 * are now by dead reckoning (current + leeway since the alarm), the drift
 * line between them, the next ten minutes of drift, and a line from the
 * boat with range and elapsed time. Drawn in the north-up layer.
 */
const MobMarker3D = () => {
    const { t } = useTranslation();
    const { scene } = useTheme();
    const mobs = useActiveMobs();
    const v = useSignalKPaths(PATHS);
    const own = v['navigation.position'];
    const [now, setNow] = useState(() => vesselNow().getTime());
    useEffect(() => {
        const id = setInterval(() => setNow(vesselNow().getTime()), 1000);
        return () => clearInterval(id);
    }, []);
    const scale = configService.get('aisLengthScalingFactor') || 0.7;
    const { heading } = useOwnTrack();

    const drift = useMemo(() => {
        // Drift velocity (m/s, east / north): current set + wind leeway downwind
        let ve = 0;
        let vn = 0;
        const cur = v['environment.current'];
        if (Number.isFinite(cur?.drift) && Number.isFinite(cur?.setTrue)) {
            ve += cur.drift * Math.sin(cur.setTrue);
            vn += cur.drift * Math.cos(cur.setTrue);
        }
        const tws = v['environment.wind.speedTrue'];
        const twd = v['environment.wind.directionTrue'];
        if (Number.isFinite(tws) && Number.isFinite(twd)) {
            ve -= LEEWAY * tws * Math.sin(twd);
            vn -= LEEWAY * tws * Math.cos(twd);
        }
        return { ve, vn };
    }, [v]);

    if (!mobs.length || !Number.isFinite(own?.latitude)) return null;

    return <group rotation={[0, heading, 0]}>{mobs.filter(m => Number.isFinite(m.position?.latitude)).map((mob) => {
        const since = Math.max(0, (now - (Date.parse(mob.createdAt) || now)) / 1000);
        const drop = offset(own, mob.position);
        const est = { east: drop.east + drift.ve * since, north: drop.north + drift.vn * since };
        const ahead = { east: est.east + drift.ve * AHEAD_MIN * 60, north: est.north + drift.vn * AHEAD_MIN * 60 };
        const p = (q, y = 0.3) => [q.east * scale, y, -q.north * scale];
        const range = Math.hypot(est.east, est.north);
        const minutes = Math.floor(since / 60);
        const seconds = Math.floor(since % 60);
        return (
            <group key={mob.path}>
                {/* Drop point */}
                <mesh position={p(drop, 0.2)} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[1.6, 2.2, 32]} />
                    <meshBasicMaterial color={scene.vesselDanger} transparent opacity={0.7} depthWrite={false} />
                </mesh>
                {/* Drift so far, and the next ten minutes */}
                <Line points={[p(drop), p(est)]} color={scene.vesselDanger} lineWidth={2.5} />
                <Line points={[p(est), p(ahead)]} color={scene.vesselDanger} lineWidth={1.5} dashed dashSize={1.5} gapSize={1.2} transparent opacity={0.7} />
                {/* From the boat to the person */}
                <Line points={[[0, 0.3, 0], p(est)]} color={scene.compass} lineWidth={1.2} dashed dashSize={2} gapSize={2} transparent opacity={0.6} />
                <group position={p(est, 0)}>
                    <Person color="#ff7a00" />
                    <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[2.4, 2.9, 32]} />
                        <meshBasicMaterial color={scene.vesselDanger} transparent opacity={0.9} depthWrite={false} />
                    </mesh>
                    <Billboard position={[0, 4.2, 0]}>
                        <Text fontSize={1.6} color={scene.vesselDanger} anchorX="center" anchorY="bottom"
                            font="fonts/Roboto-Bold.ttf" outlineWidth={0.12} outlineColor={scene.background}>
                            {`${t('mob.short', 'MOB')} · ${minutes}:${String(seconds).padStart(2, '0')} · ${Math.round(range)} m`}
                        </Text>
                    </Billboard>
                </group>
            </group>
        );
    })}</group>;
};

export default MobMarker3D;
