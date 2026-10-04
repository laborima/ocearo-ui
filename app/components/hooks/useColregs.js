'use client';
import { useMemo } from 'react';
import { useAIS } from '../3dview/ais/AISContext';
import { useSignalKPaths, useSignalKPrefix } from './useSignalK';
import usePolarPerformance from './usePolarPerformance';
import { rightOfWay, targetCategory } from '../utils/Colregs';
import configService from '../settings/ConfigService';

const PATHS = ['navigation.speedOverGround', 'navigation.courseOverGroundTrue'];

/**
 * Our COLREG category: power when an engine turns (a sailing yacht under
 * engine is a power-driven vessel, rule 3), sail otherwise. Settings can
 * force it (`ownVesselCategory`: 'auto' | 'sail' | 'power').
 */
const useOwnCategory = () => {
    const propulsion = useSignalKPrefix('propulsion.');
    const forced = configService.get('ownVesselCategory');
    return useMemo(() => {
        if (forced === 'sail' || forced === 'power') return forced;
        const running = Object.entries(propulsion).some(([path, value]) =>
            (path.endsWith('.revolutions') && Number(value) > 0.5) ||
            (path.endsWith('.state') && value === 'started'));
        return running ? 'power' : 'sail';
    }, [propulsion, forced]);
};

/**
 * COLREG roles for every AIS target on a collision course.
 *
 * @returns {{ ownCategory: string, encounters: Array<{ target, role }>,
 *             giveWay: boolean, primary: null|{ target, role } }}
 *   encounters sorted by time to CPA; giveWay: we must keep clear of at least
 *   one of them; primary: the most urgent encounter
 */
const useColregs = () => {
    // Passive: only while the AIS layer keeps the connection open
    const { targets } = useAIS({ passive: true });
    const { twd, heading } = usePolarPerformance();
    const v = useSignalKPaths(PATHS);
    const ownCategory = useOwnCategory();
    const scale = configService.get('aisLengthScalingFactor') || 0.7;

    return useMemo(() => {
        const course = v['navigation.courseOverGroundTrue'] ?? heading;
        const speed = v['navigation.speedOverGround'] ?? 0;
        const encounters = [];
        if (Number.isFinite(course)) {
            for (const t of targets) {
                if (t.risk !== 'danger') continue;
                const targetCourse = t.cog ?? t.cogMagnetic ?? t.heading;
                if (!Number.isFinite(targetCourse) || t.sceneX === null) continue;
                const role = rightOfWay(
                    { course, speed, category: ownCategory },
                    { x: t.sceneX / scale, y: -t.sceneZ / scale, course: targetCourse, speed: t.sog ?? 0, category: targetCategory(t) },
                    twd,
                );
                // Snapshot: the AIS store mutates targets in place
                encounters.push({ target: { ...t }, role });
            }
        }
        encounters.sort((a, b) => (a.target.tcpaSeconds ?? Infinity) - (b.target.tcpaSeconds ?? Infinity));
        return {
            ownCategory,
            encounters,
            giveWay: encounters.some(e => e.role.ownRole !== 'stand-on'),
            primary: encounters[0] || null,
        };
    }, [targets, twd, heading, v, ownCategory, scale]);
};

export default useColregs;
