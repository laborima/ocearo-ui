'use client';
import { useMemo } from 'react';
import { useAIS } from '../3dview/ais/AISContext';
import { useSignalKPaths, useSignalKPrefix } from './useSignalK';
import usePolarPerformance from './usePolarPerformance';
import { rightOfWay, targetCategory } from '../utils/Colregs';
import configService from '../settings/ConfigService';
import { useOcearoContext } from '../context/OcearoContext';

const NO_TARGETS = [];

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
 * The boat view only advises while its AIS layer is on: with AIS hidden,
 * no "keep clear" banner, orange hull or avoidance course either. The
 * dashboard radar shows the targets itself and passes `always`.
 *
 * @param {{ always?: boolean }} [options]
 * @returns {{ ownCategory: string, encounters: Array<{ target, role }>,
 *             statuses: { [mmsi]: 'giveWay'|'yields'|'close' },
 *             giveWay: boolean, giveWayTo, primary: null|{ target, role } }}
 *   encounters sorted by time to CPA; giveWay: we must keep clear of at least
 *   one of them; primary: the most urgent encounter
 */
const useColregs = ({ always = false } = {}) => {
    // Passive: only while the AIS layer keeps the connection open
    const { targets: aisTargets } = useAIS({ passive: true });
    const { states } = useOcearoContext();
    const enabled = always || states.ais;
    const targets = enabled ? aisTargets : NO_TARGETS;
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
        // What each target means for us (drives its colour everywhere):
        // 'giveWay' we must keep clear of it, 'yields' it must keep clear of
        // us, 'close' near but no risk of collision
        const statuses = {};
        for (const t of targets) {
            if (t.risk === 'close') statuses[t.mmsi] = 'close';
            else if (t.risk === 'danger') statuses[t.mmsi] = 'giveWay';
        }
        for (const e of encounters) {
            statuses[e.target.mmsi] = e.role.ownRole === 'stand-on' ? 'yields' : 'giveWay';
        }
        const mine = encounters.filter(e => e.role.ownRole !== 'stand-on');
        return {
            ownCategory,
            encounters,
            statuses,
            giveWay: mine.length > 0,
            // The encounter that makes us manoeuvre, most urgent first
            giveWayTo: mine[0] || null,
            primary: encounters[0] || null,
        };
    }, [targets, twd, heading, v, ownCategory, scale]);
};

export default useColregs;
