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

// Identity of the 3D boat list: membership plus what picks/scales the model.
// Positions are deliberately excluded — they are read per frame.
const renderSignature = (list) => list.map(t => `${t.mmsi}|${t.shipType}|${t.length}|${t.beam}`).join(',');

const getPath = (source, path) => path.split('.').reduce((acc, part) => acc?.[part], source);

const stripVesselsPrefix = (context) => (context || '').replace(/^vessels\./, '');

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
        case 'name': target.name = value; return false;
        case 'navigation.position':
            if (!value) return false;
            target.latitude = value.latitude;
            target.longitude = value.longitude;
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
    // Read once per provider; settings changes apply on reload
    const [thresholds] = useState(getCollisionThresholds);

    const targetsRef = useRef({});          // mmsi -> mutable target
    const selfIdRef = useRef(null);         // our own vessel id, from the server hello
    const myPositionRef = useRef(myPosition);
    const dirtyRef = useRef(false);
    const signatureRef = useRef('');
    const [consumerCount, setConsumerCount] = useState(0);
    const [snapshot, setSnapshot] = useState({ aisData: {}, vesselIds: EMPTY_LIST, targets: EMPTY_LIST });

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

    // Own boat moved or changed course: every relative position and CPA is
    // stale, not just the targets that happen to report next.
    useEffect(() => {
        myPositionRef.current = myPosition;
        // A stopped boat's COG is noise: fall back to the heading
        ownMotionRef.current = { sog: mySog, cog: myCog ?? myHeading };
        Object.values(targetsRef.current).forEach(updateSpatial);
        dirtyRef.current = true;
    }, [myPosition, mySog, myCog, myHeading, updateSpatial]);

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
            if (!dirtyRef.current) return;
            dirtyRef.current = false;

            const targets = Object.values(store)
                .filter(t => t.distanceMeters !== null)
                .sort((a, b) => a.distanceMeters - b.distanceMeters);
            const visible = targets.filter(t => t.visible);
            const signature = renderSignature(visible);
            const membershipChanged = signature !== signatureRef.current;
            signatureRef.current = signature;
            setSnapshot(prev => ({
                aisData: { ...store },
                targets,
                vesselIds: membershipChanged ? visible : prev.vesselIds,
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

        const handleDelta = (delta) => {
            const id = stripVesselsPrefix(delta?.context);
            if (!id || isSelf(id) || !delta.updates) return;

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

        const loadInitialTargets = async () => {
            const vessels = await client.API().then(api => api.vessels());
            if (cancelled || !vessels) return;

            const store = targetsRef.current;
            const now = Date.now();
            for (const [id, data] of Object.entries(vessels)) {
                if (isSelf(id)) continue;
                const target = store[id] || (store[id] = createTarget(id));
                const set = (key, path) => {
                    const value = getPath(data, path);
                    if (value !== undefined) target[key] = value;
                };
                set('name', 'name');
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
    }, [consumerCount > 0, updateSpatial]); // eslint-disable-line react-hooks/exhaustive-deps

    const value = useMemo(() => ({
        ...snapshot,
        targetsRef,
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
 * - `targetsRef`: live mutable store, for per-frame reads
 *
 * @param {{passive?: boolean}} [options] - passive readers see the targets
 *   while another consumer keeps the connection open, but never open it
 */
export const useAIS = ({ passive = false } = {}) => {
    const ctx = useContext(AISContext);
    const register = passive ? null : ctx?.register;
    useEffect(() => register?.(), [register]);
    return ctx || { aisData: {}, vesselIds: EMPTY_LIST, targets: EMPTY_LIST, targetsRef: { current: {} } };
};
