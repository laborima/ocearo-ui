'use client';
import { useEffect, useRef } from 'react';
import { useOcearoContext } from '../context/OcearoContext';
import configService from '../settings/ConfigService';
import { addSample, trimSamples } from './voyageStore';
import { isReplaying, setReplaySink } from './replayEngine';

const SAMPLE_MS = 5000;
// Below this speed over ground (m/s) the boat counts as stopped: a sample a
// minute is enough (anchorage, marina), so voyages split at long stops
const MOVING_SOG = 0.4;
const STOPPED_SAMPLE_MS = 60000;

const read = (get, path) => {
    const v = get(path);
    return v === null || v === undefined ? undefined : v;
};

/**
 * Records the own boat every 5 s while under way (once a minute when
 * stopped) into the browser, for replaying voyages from the logbook. Not
 * while a replay runs, nor on demo data. Also hands the replay engine the
 * store writer.
 */
const VoyageRecorder = () => {
    const { getSignalKValue, updateSignalKData } = useOcearoContext();
    const lastRef = useRef(0);

    useEffect(() => { setReplaySink(updateSignalKData); }, [updateSignalKData]);

    useEffect(() => {
        if (configService.get('recordVoyages') === false) return undefined;
        let count = 0;
        const id = setInterval(() => {
            if (isReplaying() || configService.get('debugMode')) return;
            const pos = read(getSignalKValue, 'navigation.position');
            if (!Number.isFinite(pos?.latitude) || !Number.isFinite(pos?.longitude)) return;
            const now = Date.now();
            const sog = read(getSignalKValue, 'navigation.speedOverGround') ?? 0;
            if (sog < MOVING_SOG && now - lastRef.current < STOPPED_SAMPLE_MS) return;
            lastRef.current = now;
            const attitude = read(getSignalKValue, 'navigation.attitude');
            addSample({
                t: now,
                lat: pos.latitude,
                lon: pos.longitude,
                hdg: read(getSignalKValue, 'navigation.headingTrue'),
                cog: read(getSignalKValue, 'navigation.courseOverGroundTrue'),
                sog,
                stw: read(getSignalKValue, 'navigation.speedThroughWater'),
                tws: read(getSignalKValue, 'environment.wind.speedTrue'),
                twa: read(getSignalKValue, 'environment.wind.angleTrueWater'),
                twd: read(getSignalKValue, 'environment.wind.directionTrue'),
                aws: read(getSignalKValue, 'environment.wind.speedApparent'),
                awa: read(getSignalKValue, 'environment.wind.angleApparent'),
                rud: read(getSignalKValue, 'steering.rudderAngle'),
                roll: attitude?.roll,
                depth: read(getSignalKValue, 'environment.depth.belowKeel') ?? read(getSignalKValue, 'environment.depth.belowTransducer'),
            }).catch(() => {});
            if (++count % 720 === 0) trimSamples().catch(() => {});
        }, SAMPLE_MS);
        return () => clearInterval(id);
    }, [getSignalKValue]);

    return null;
};

export default VoyageRecorder;
