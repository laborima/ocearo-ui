import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import configService from '../../settings/ConfigService';
import signalKService from '../../services/SignalKService';
import { useOcearoContext } from '../../context/OcearoContext';
import { useSignalKPath } from '../../hooks/useSignalK';
import { closestApproach, collisionRisk, getCollisionThresholds } from '../../utils/Collision';

const AISContext = createContext(null);

// Targets farther than this are kept for the radar but not drawn in 3D.
export const MAX_3D_DISTANCE_METERS = 5000;
// Closer than this is treated as our own AIS echo.
const MIN_DISPLAYED_DISTANCE_METERS = 10;
// Consumers re-render at most this often; the 3D view reads live data every frame.
const PUBLISH_INTERVAL_MS = 250;
// Drop targets that have been silent for this long.
const STALE_TARGET_MS = 10 * 60 * 1000;
// Aids to navigation report every 3 minutes (some every 6 or 12)
const STALE_ATON_MS = 40 * 60 * 1000;

const EMPTY_LIST = [];

// Dynamic AIS data, delivered as it comes. No server-side minPeriod: the
// server debounces a `vessels.*` row per path across *all* vessels, so with
// several targets only one position a second got through for the whole
// fleet and most targets froze (or never appeared). The store below already
// limits re-renders (PUBLISH_INTERVAL_MS).
const AIS_DYNAMIC_PATHS = [
    'navigation.position',
    'navigation.speedOverGround',
    'navigation.courseOverGroundTrue',
    'navigation.courseOverGroundMagnetic',
    'navigation.headingTrue',
    'navigation.headingMagnetic',
];
// AIS static data (message types 5/24) arrives minutes after position
// reports: keep name/type/dimensions in sync so targets don't stay on the
// default model forever. Root values like `name` are subscribable by leaf
// path since Signal K server 2.31.
const AIS_STATIC_PATHS = [
    'name',
    'design.aisShipType',
    'design.length',
    'design.beam',
    'communication.callsignVhf',
    // AIS navigation status (sailing, fishing, restricted...) for the COLREG roles
    'navigation.state',
];
const AIS_SUBSCRIPTION = [
    ...AIS_DYNAMIC_PATHS.map(path => ({ path, policy: 'instant' })),
    ...AIS_STATIC_PATHS.map(path => ({ path })),
];
// AIS aids to navigation (message 21): buoys and beacons, some of them
// virtual (no structure on the water, only the AIS message)
const ATON_SUBSCRIPTION = ['navigation.position', 'atonType', 'name', 'virtual', 'offPosition'].map(path => ({ path }));

// Identity of the 3D boat list: membership plus what picks/scales the model.
// Positions are deliberately excluded — they are read per frame.
const renderSignature = (list) => list.map(t => `${t.mmsi}|${t.shipType}|${t.length}|${t.beam}`).join(',');

const getPath = (source, path) => path.split('.').reduce((acc, part) => acc?.[part], source);

// A vessel name is usually a plain string; sent as a value it arrives wrapped
// ({ value, meta, $source… }) and must not reach the UI as an object
const nameOf = (name) => (typeof name === 'string' ? name : typeof name?.value === 'string' ? name.value : null);

const stripVesselsPrefix = (context) => (context || '').replace(/^vessels\./, '');
const isAtonContext = (context) => /^atons\./.test(context || '');

/**
 * Whether an AIS identity can be a ship. Signal K files aids to navigation
 * (MMSI 99…) and base stations under atons.*, SAR aircraft (111…) under
 * aircraft.*, and we only subscribe to vessels.*; a gateway that puts them
 * under vessels.* anyway must not have a buoy drawn as a boat.
 */
const mmsiOf = (id) => /mmsi:(\d{9})$/.exec(id || '')?.[1] || null;
export const isShipIdentity = (id) => {
    const mmsi = mmsiOf(id);
    if (!mmsi) return true;
    return !mmsi.startsWith('99') && !mmsi.startsWith('00') && !mmsi.startsWith('111');
};
/** An aid to navigation's MMSI (99…), wherever the server filed it */
const isAtonIdentity = (id) => mmsiOf(id)?.startsWith('99') ?? false;

const createAton = (id) => ({
    id,
    mmsi: mmsiOf(id),
    name: '',
    latitude: null,
    longitude: null,
    atonType: null,     // AIS aid type, 1–31 (see seamarks/aisAton.js)
    virtual: false,
    offPosition: false,
    distanceMeters: null,
    lastUpdate: 0,
});

/** Applies one SignalK value to an aid to navigation */
const applyAtonValue = (aton, path, value) => {
    switch (path) {
        case 'navigation.position':
            if (value && Number.isFinite(value.latitude)) {
                aton.latitude = value.latitude;
                aton.longitude = value.longitude;
            }
            break;
        case 'atonType': aton.atonType = value?.id ?? value ?? null; break;
        case 'name': aton.name = nameOf(value) ?? aton.name; break;
        case 'virtual': aton.virtual = value === true; break;
        case 'offPosition': aton.offPosition = value === true; break;
        case '': if (value?.name) aton.name = nameOf(value.name) ?? aton.name; break;
        default: break;
    }
};

const createTarget = (mmsi) => ({
    mmsi,
    name: 'unknown',
    latitude: null,
    longitude: null,
    sog: null,
    cog: null,
    cogMagnetic: null,
    heading: null,
    headingMagnetic: null,
    length: null,
    beam: null,
    shipType: null,
    callsign: null,
    navState: null,
    distanceMeters: null,
    sceneX: null,
    sceneZ: null,
    // Closest point of approach (null when either vessel's motion is unknown)
    cpaMeters: null,
    tcpaSeconds: null,
    risk: 'none',
    cpaScene: null,     // { targetX, targetZ, ownX, ownZ } at the closest point

    rotationAngleY: 0,
    visible: false,
    lastUpdate: 0,
    // Time of the last position report, for dead reckoning between reports
    positionAt: 0,
});

// Prefer heading (where the bow points) over COG: a drifting or anchored
// vessel's COG is noise.
const getTargetRotationAngle = (target) =>
    target.heading ?? target.headingMagnetic ?? target.cog ?? target.cogMagnetic ?? 0;

/**
 * Applies one SignalK value to a target. Returns true when it moved or turned.
 */
const applyValue = (target, path, value) => {
    switch (path) {
        case 'name': target.name = nameOf(value) ?? target.name; return false;
        case 'navigation.position':
            if (!value) return false;
            target.latitude = value.latitude;
            target.longitude = value.longitude;
            target.positionAt = Date.now();
            return true;
        case 'navigation.speedOverGround': target.sog = value; return true;
        case 'navigation.courseOverGroundTrue': target.cog = value; return true;
        case 'navigation.courseOverGroundMagnetic': target.cogMagnetic = value; return true;
        case 'navigation.headingTrue': target.heading = value; return true;
        case 'navigation.headingMagnetic': target.headingMagnetic = value; return true;
        case 'design.aisShipType': target.shipType = value?.id ?? value; return false;
        case 'design.length': target.length = value?.overall ?? value; return false;
        case 'design.beam': target.beam = value; return false;
        case 'communication.callsignVhf': target.callsign = value; return false;
        case 'navigation.state': target.navState = value; return false;
        default: return false;
    }
};

/**
 * Owns a single AIS SignalK connection shared by every AIS consumer (3D view,
 * radar widget). Vessel data lives in a mutable store so a burst of AIS
 * messages costs no React work; consumers get a throttled snapshot.
 *
 * The connection is opened only while at least one `useAIS()` consumer is
 * mounted, so the provider can sit high in the tree for free.
 */
export const AISProvider = ({ children }) => {
    const { convertLatLonToXY } = useOcearoContext();
    const myPosition = useSignalKPath('navigation.position');
    const mySog = useSignalKPath('navigation.speedOverGround');
    const myCog = useSignalKPath('navigation.courseOverGroundTrue');
    const myHeading = useSignalKPath('navigation.headingTrue');
    const ownMotionRef = useRef({ sog: null, cog: null });
    // Own motion as seen by the 3D layer: velocity (m/s east, north), time of
    // the own position fix the scene positions are relative to, and the scale
    const motionRef = useRef({ vx: 0, vy: 0, fixAt: 0, scale: 0.7 });
    // Read once per provider; settings changes apply on reload
    const [thresholds] = useState(getCollisionThresholds);

    const targetsRef = useRef({});          // mmsi -> mutable target
    const atonsRef = useRef({});            // id -> aid to navigation
    const selfIdRef = useRef(null);         // our own vessel id, from the server hello
    const myPositionRef = useRef(myPosition);
    const dirtyRef = useRef(false);
    const signatureRef = useRef('');
    const [consumerCount, setConsumerCount] = useState(0);
    const [snapshot, setSnapshot] = useState({ aisData: {}, vesselIds: EMPTY_LIST, targets: EMPTY_LIST, atons: EMPTY_LIST });

    const register = useCallback(() => {
        setConsumerCount(c => c + 1);
        return () => setConsumerCount(c => c - 1);
    }, []);

    /**
     * Recomputes scene position, distance and 3D visibility of one target
     * relative to our own position.
     */
    const updateSpatial = useCallback((target) => {
        const own = myPositionRef.current;
        if (!Number.isFinite(target.latitude) || !Number.isFinite(target.longitude) ||
            !Number.isFinite(own?.latitude) || !Number.isFinite(own?.longitude)) {
            target.visible = false;
            target.distanceMeters = null;
            return;
        }

        const scalingFactor = configService.get('aisLengthScalingFactor') || 0.7;
        const { x, y } = convertLatLonToXY(
            { lat: target.latitude, lon: target.longitude },
            { lat: own.latitude, lon: own.longitude }
        );

        target.sceneX = x * scalingFactor;
        target.sceneZ = -y * scalingFactor;
        target.rotationAngleY = getTargetRotationAngle(target);
        target.distanceMeters = Math.hypot(x, y);
        target.visible = target.distanceMeters > MIN_DISPLAYED_DISTANCE_METERS &&
            target.distanceMeters <= MAX_3D_DISTANCE_METERS;

        const motion = ownMotionRef.current;
        const approach = closestApproach({
            rx: x,
            ry: y,
            ownSog: motion.sog,
            ownCog: motion.cog,
            targetSog: target.sog,
            targetCog: target.cog ?? target.cogMagnetic,
        });
        target.cpaMeters = approach ? approach.cpa : null;
        target.tcpaSeconds = approach ? approach.tcpa : null;
        target.risk = collisionRisk(approach, target.distanceMeters, thresholds);
        target.cpaScene = approach && approach.tcpa > 0 ? {
            targetX: approach.target.x * scalingFactor,
            targetZ: -approach.target.y * scalingFactor,
            ownX: approach.own.x * scalingFactor,
            ownZ: -approach.own.y * scalingFactor,
        } : null;
    }, [convertLatLonToXY, thresholds]);

    /** Distance of an aid to navigation from us (it does not move: no CPA) */
    const updateAtonSpatial = useCallback((aton) => {
        const own = myPositionRef.current;
        if (!Number.isFinite(aton.latitude) || !Number.isFinite(own?.latitude)) {
            aton.distanceMeters = null;
            return;
        }
        const { x, y } = convertLatLonToXY(
            { lat: aton.latitude, lon: aton.longitude },
            { lat: own.latitude, lon: own.longitude }
        );
        aton.east = x;
        aton.north = y;
        aton.distanceMeters = Math.hypot(x, y);
    }, [convertLatLonToXY]);

    // Own boat moved or changed course: every relative position and CPA is
    // stale, not just the targets that happen to report next.
    useEffect(() => {
        myPositionRef.current = myPosition;
        // A stopped boat's COG is noise: fall back to the heading
        ownMotionRef.current = { sog: mySog, cog: myCog ?? myHeading };
        const ownCourse = myCog ?? myHeading;
        motionRef.current = {
            vx: Number.isFinite(mySog) && Number.isFinite(ownCourse) ? mySog * Math.sin(ownCourse) : 0,
            vy: Number.isFinite(mySog) && Number.isFinite(ownCourse) ? mySog * Math.cos(ownCourse) : 0,
            fixAt: Date.now(),
            scale: configService.get('aisLengthScalingFactor') || 0.7,
        };
        Object.values(targetsRef.current).forEach(updateSpatial);
        Object.values(atonsRef.current).forEach(updateAtonSpatial);
        dirtyRef.current = true;
    }, [myPosition, mySog, myCog, myHeading, updateSpatial, updateAtonSpatial]);

    // Throttled publication + stale target cleanup
    useEffect(() => {
        if (consumerCount === 0) return undefined;

        const publish = () => {
            const now = Date.now();
            const store = targetsRef.current;
            for (const [mmsi, target] of Object.entries(store)) {
                if (now - target.lastUpdate > STALE_TARGET_MS) {
                    delete store[mmsi];
                    dirtyRef.current = true;
                }
            }
            // Aids to navigation report every few minutes: allow three missed reports
            for (const [id, aton] of Object.entries(atonsRef.current)) {
                if (now - aton.lastUpdate > STALE_ATON_MS) {
                    delete atonsRef.current[id];
                    dirtyRef.current = true;
                }
            }
            if (!dirtyRef.current) return;
            dirtyRef.current = false;

            const targets = Object.values(store)
                .filter(t => t.distanceMeters !== null)
                .sort((a, b) => a.distanceMeters - b.distanceMeters);
            const visible = targets.filter(t => t.visible);
            const signature = renderSignature(visible);
            const membershipChanged = signature !== signatureRef.current;
            signatureRef.current = signature;
            const atons = Object.values(atonsRef.current)
                .filter(a => a.distanceMeters !== null)
                .sort((a, b) => a.distanceMeters - b.distanceMeters)
                .map(a => ({ ...a }));
            setSnapshot(prev => ({
                aisData: { ...store },
                targets,
                vesselIds: membershipChanged ? visible : prev.vesselIds,
                atons,
            }));
        };

        publish();
        const id = setInterval(publish, PUBLISH_INTERVAL_MS);
        return () => clearInterval(id);
    }, [consumerCount]);

    // SignalK connection, only while someone is watching
    useEffect(() => {
        if (consumerCount === 0) return undefined;

        let cancelled = false;
        let client = null;

        const isSelf = (id) => id === 'self' || (selfIdRef.current && id === selfIdRef.current);

        // Aids to navigation: from atons.*, or with an AtoN MMSI under vessels.*
        // (a gateway that files them there): never drawn as a boat
        const handleAton = (id, updates) => {
            const aton = atonsRef.current[id] || (atonsRef.current[id] = createAton(id));
            aton.lastUpdate = Date.now();
            for (const update of updates) {
                for (const { path, value } of update.values || []) applyAtonValue(aton, path, value);
            }
            updateAtonSpatial(aton);
            dirtyRef.current = true;
        };

        const handleDelta = (delta) => {
            if (!delta?.updates) return;
            if (isAtonContext(delta.context)) {
                handleAton(delta.context.replace(/^atons\./, ''), delta.updates);
                return;
            }
            const id = stripVesselsPrefix(delta?.context);
            if (id && isAtonIdentity(id)) {
                handleAton(id, delta.updates);
                return;
            }
            if (!id || isSelf(id) || !isShipIdentity(id) || !delta.updates) return;

            const store = targetsRef.current;
            const target = store[id] || (store[id] = createTarget(id));
            target.lastUpdate = Date.now();

            let moved = false;
            for (const update of delta.updates) {
                if (!update.values) continue;
                for (const { path, value } of update.values) {
                    if (applyValue(target, path, value)) moved = true;
                }
            }
            if (moved) updateSpatial(target);
            dirtyRef.current = true;
        };

        const loadInitialAtons = async (api) => {
            const atons = await api.get('/atons').catch(() => null);
            if (cancelled || !atons) return;
            const now = Date.now();
            for (const [id, data] of Object.entries(atons)) {
                const aton = atonsRef.current[id] || (atonsRef.current[id] = createAton(id));
                const position = getPath(data, 'navigation.position.value');
                if (Number.isFinite(position?.latitude)) {
                    aton.latitude = position.latitude;
                    aton.longitude = position.longitude;
                }
                aton.atonType = getPath(data, 'atonType.value.id') ?? aton.atonType;
                aton.name = nameOf(data.name) ?? aton.name;
                aton.virtual = getPath(data, 'virtual.value') === true || data.virtual === true;
                aton.offPosition = getPath(data, 'offPosition.value') === true || data.offPosition === true;
                aton.lastUpdate = now;
                updateAtonSpatial(aton);
            }
            dirtyRef.current = true;
        };

        const loadInitialTargets = async () => {
            const api = await client.API();
            loadInitialAtons(api);
            const vessels = await api.vessels();
            if (cancelled || !vessels) return;

            const store = targetsRef.current;
            const now = Date.now();
            for (const [id, data] of Object.entries(vessels)) {
                if (isSelf(id)) continue;
                if (isAtonIdentity(id)) {
                    const position = getPath(data, 'navigation.position.value');
                    const values = [{ path: 'name', value: data.name }];
                    if (position) values.push({ path: 'navigation.position', value: position });
                    handleAton(id, [{ values }]);
                    continue;
                }
                if (!isShipIdentity(id)) continue;
                const target = store[id] || (store[id] = createTarget(id));
                const set = (key, path) => {
                    const value = getPath(data, path);
                    if (value !== undefined) target[key] = value;
                };
                const name = nameOf(data.name);
                if (name) target.name = name;
                set('latitude', 'navigation.position.value.latitude');
                set('longitude', 'navigation.position.value.longitude');
                set('sog', 'navigation.speedOverGround.value');
                set('cog', 'navigation.courseOverGroundTrue.value');
                set('cogMagnetic', 'navigation.courseOverGroundMagnetic.value');
                set('heading', 'navigation.headingTrue.value');
                set('headingMagnetic', 'navigation.headingMagnetic.value');
                set('length', 'design.length.value.overall');
                set('beam', 'design.beam.value');
                set('callsign', 'communication.callsignVhf');
                set('navState', 'navigation.state.value');
                set('shipType', 'design.aisShipType.value.id');
                target.lastUpdate = now;
                updateSpatial(target);
            }
            dirtyRef.current = true;
        };

        const connect = async () => {
            try {
                client = signalKService.createClient({
                    // Only the vessels.* subscription below: without this the
                    // connection would also stream all of our own boat's data
                    // (and its metadata), which the main connection already has.
                    deltaStreamBehaviour: 'none',
                    sendMeta: null,
                    subscriptions: [{
                        context: 'vessels.*',
                        subscribe: AIS_SUBSCRIPTION,
                    }, {
                        context: 'atons.*',
                        subscribe: ATON_SUBSCRIPTION,
                    }],
                });
                client.on('self', (self) => { selfIdRef.current = stripVesselsPrefix(self); });
                client.on('delta', handleDelta);
                await client.connect();
                if (cancelled) return;
                selfIdRef.current = stripVesselsPrefix(client.self) || selfIdRef.current;
                await loadInitialTargets();
            } catch (error) {
                if (!cancelled) console.warn('AIS: SignalK connection failed:', error?.message || error);
            }
        };

        connect();

        return () => {
            cancelled = true;
            client?.removeAllListeners?.('delta');
            client?.disconnect();
        };
    }, [consumerCount > 0, updateSpatial, updateAtonSpatial]); // eslint-disable-line react-hooks/exhaustive-deps

    const value = useMemo(() => ({
        ...snapshot,
        targetsRef,
        motionRef,
        register,
    }), [snapshot, register]);

    return <AISContext.Provider value={value}>{children}</AISContext.Provider>;
};

/**
 * Access AIS data. Registers the caller as a consumer so the provider keeps
 * its SignalK connection open while it is mounted.
 *
 * - `vesselIds`: targets within 3D range, closest first
 * - `targets`:   every positioned target, closest first (radar)
 * - `aisData`:   mmsi -> target snapshot
 * - `atons`:     aids to navigation (buoys, beacons, virtual marks), closest
 *                first, with their distance and east/north offset in metres
 * - `targetsRef`: live mutable store, for per-frame reads
 * - `motionRef`:  own velocity and fix time, for dead reckoning (see predictScenePosition)
 *
 * @param {{passive?: boolean}} [options] - passive readers see the targets
 *   while another consumer keeps the connection open, but never open it
 */
// Dead reckoning horizon: beyond this without a report a target stops (AIS
// class B can report every 30 s, every 3 min at anchor)
const MAX_DEAD_RECKONING_S = 180;

/**
 * Where a target is now in the scene, carried forward from its last report
 * by its own speed and course, minus our own motion since our last fix (the
 * AIS layer is centred on us). Smooth motion between AIS messages.
 *
 * @param {Object} target - live target from the store
 * @param {{vx, vy, fixAt, scale}} motion - motionRef.current
 * @param {number} now - Date.now()
 * @returns {{x: number, z: number}} scene position (north-up layer)
 */
export const predictScenePosition = (target, motion, now) => {
    const course = target.cog ?? target.cogMagnetic ?? target.heading;
    const sog = Number.isFinite(target.sog) ? target.sog : 0;
    const tdt = Math.min(MAX_DEAD_RECKONING_S, Math.max(0, (now - (target.positionAt || now)) / 1000));
    const odt = Math.min(MAX_DEAD_RECKONING_S, Math.max(0, (now - motion.fixAt) / 1000));
    let east = -(motion.vx * odt);
    let north = -(motion.vy * odt);
    if (Number.isFinite(course) && sog > 0.05) {
        east += sog * Math.sin(course) * tdt;
        north += sog * Math.cos(course) * tdt;
    }
    return { x: target.sceneX + east * motion.scale, z: target.sceneZ - north * motion.scale };
};

export const useAIS = ({ passive = false } = {}) => {
    const ctx = useContext(AISContext);
    const register = passive ? null : ctx?.register;
    useEffect(() => register?.(), [register]);
    return ctx || { aisData: {}, vesselIds: EMPTY_LIST, targets: EMPTY_LIST, atons: EMPTY_LIST, targetsRef: { current: {} }, motionRef: { current: { vx: 0, vy: 0, fixAt: 0, scale: 0.7 } } };
};
