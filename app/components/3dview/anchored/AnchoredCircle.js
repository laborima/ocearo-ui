import React, { useEffect, useMemo, useState } from 'react';
import { Line } from '@react-three/drei';
import { oYellow, oRed, oGray } from '../../context/OcearoContext';
import { useSignalKPath } from '../../hooks/useSignalK';
import { getAnchorTrack } from '../../utils/OcearoCoreUtils';

/** Scene plane the anchorage is drawn on, just under the hull. */
const PLANE_Y = -6.9;

/** Circle tessellation. 64 segments is smooth at every radius we draw. */
const SEGMENTS = 64;

/** Fallback radius (metres) when the anchor plugin reports nothing. */
const DEFAULT_RADIUS_M = 30;

/** How often the swing track is refreshed. The server samples every 20 s. */
const TRACK_POLL_MS = 15000;

/** Consecutive failures after which polling backs off (ocearo-core down). */
const MAX_TRACK_POLL_FAILURES = 3;

/** Slow poll used after repeated failures, so the track returns on its own. */
const TRACK_POLL_BACKOFF_MS = 120000;

/**
 * Metres → scene units.
 *
 * The boat model is drawn about 10 units long for a ~9.5 m hull, so one metre
 * is roughly one unit. Kept explicit so the scale can be tuned in one place if
 * the anchorage ever needs to be compressed to fit a large radius on screen.
 */
const M_PER_UNIT = 1;

/**
 * Project a lat/lon onto the scene plane, relative to a reference position.
 *
 * Returns [x, z] with x = easting and z = -northing, the same convention the
 * AIS view uses (`AISContext.js`: sceneX = easting, sceneZ = -northing), so a
 * target and the anchorage drawn together stay consistent.
 *
 * @param {{latitude:number, longitude:number}} pos
 * @param {{latitude:number, longitude:number}} ref
 * @returns {[number, number]} scene [x, z]
 */
const project = (pos, ref) => {
    const EARTH_RADIUS_M = 6371000;
    const toRad = deg => deg * Math.PI / 180;

    const lat1 = toRad(ref.latitude);
    const lat2 = toRad(pos.latitude);
    const dLat = lat2 - lat1;
    const dLon = toRad(pos.longitude - ref.longitude);

    // Equirectangular projection: over an anchorage (tens of metres) the error
    // against the geodesic is far below a pixel, and it stays linear, so the
    // circle and the track cannot drift apart.
    const easting = EARTH_RADIUS_M * dLon * Math.cos((lat1 + lat2) / 2);
    const northing = EARTH_RADIUS_M * dLat;

    return [easting / M_PER_UNIT, -northing / M_PER_UNIT];
};

/**
 * Anchorage overlay for the anchored 3D view.
 *
 * Draws the alarm circle centred on the real anchor drop point and the swing
 * track the boat has described around it — the track is what makes a veering
 * shift or a dragging anchor readable at a glance, which a bare circle never
 * showed.
 *
 * The boat model sits at the scene origin, so everything here is positioned
 * relative to the current vessel position.
 */
const AnchoredCircle = () => {
    const skPosition = useSignalKPath('navigation.position');
    const skAnchorPosition = useSignalKPath('navigation.anchor.position');
    const skMaxRadius = useSignalKPath('navigation.anchor.maxRadius');
    const skHeadingTrue = useSignalKPath('navigation.headingTrue');
    const skHeadingMagnetic = useSignalKPath('navigation.headingMagnetic');
    const skCog = useSignalKPath('navigation.courseOverGroundTrue');

    const [track, setTrack] = useState([]);

    // Poll the swing track recorded by ocearo-core. The server buffer survives
    // a UI reload, which a client-side accumulation would not.
    useEffect(() => {
        let cancelled = false;
        let id = null;
        let failures = 0;
        let inFlight = false;

        const arm = (delay) => {
            if (id) clearInterval(id);
            id = setInterval(poll, delay);
        };

        const poll = async () => {
            // A failing call can hang until the API timeout, which is longer
            // than the poll period; without this, requests would pile up.
            if (inFlight) return;
            inFlight = true;
            try {
                const res = await getAnchorTrack();
                if (cancelled) return;
                if (failures >= MAX_TRACK_POLL_FAILURES) arm(TRACK_POLL_MS);
                failures = 0;
                setTrack(Array.isArray(res?.track) ? res.track : []);
            } catch {
                if (cancelled) return;
                // Keep the last good track: a Signal K restart is routine and
                // must not erase what is on screen. Back off instead of giving
                // up, so the track comes back once the server does.
                if (++failures === MAX_TRACK_POLL_FAILURES) arm(TRACK_POLL_BACKOFF_MS);
            } finally {
                inFlight = false;
            }
        };

        poll();
        arm(TRACK_POLL_MS);
        return () => { cancelled = true; if (id) clearInterval(id); };
    }, []);

    const anchorPosition = useMemo(() => {
        if (skAnchorPosition?.latitude != null && skAnchorPosition?.longitude != null) {
            return { latitude: skAnchorPosition.latitude, longitude: skAnchorPosition.longitude };
        }
        return null;
    }, [skAnchorPosition]);

    const radiusKnown = Number.isFinite(skMaxRadius) && skMaxRadius > 0;
    const radius = (radiusKnown ? skMaxRadius : DEFAULT_RADIUS_M) / M_PER_UNIT;

    // Anchor position in scene coordinates, relative to the boat at the origin.
    //
    // With no anchor dropped the circle is centred on the boat itself, as a
    // preview of the alarm radius. Anchoring it to the first fix ever seen
    // would drift kilometres away on a moving boat — and the plugin publishes
    // a null position once the anchor is raised, so that stale centre would
    // survive weighing anchor.
    const anchorScene = useMemo(() => {
        if (skPosition?.latitude == null || skPosition?.longitude == null) return null;
        if (!anchorPosition) return [0, PLANE_Y, 0];
        const [x, z] = project(anchorPosition, skPosition);
        return [x, PLANE_Y, z];
    }, [anchorPosition, skPosition]);

    // The hull is drawn bow-up (SailBoat3D pins its yaw to 0), so the whole
    // overlay has to be counter-rotated by the heading to sit in the same frame
    // — exactly what AISView does with its own group. Without this, an anchor
    // due north is drawn straight ahead whatever way the boat is lying, which
    // defeats the purpose of showing the rode and the swing.
    const sceneRotation = useMemo(() => {
        const h = skHeadingTrue ?? skHeadingMagnetic ?? skCog ?? 0;
        return Number.isFinite(h) ? h : 0;
    }, [skHeadingTrue, skHeadingMagnetic, skCog]);

    const circlePoints = useMemo(() => {
        const pts = [];
        for (let i = 0; i <= SEGMENTS; i++) {
            const theta = (i / SEGMENTS) * Math.PI * 2;
            pts.push([radius * Math.cos(theta), 0, radius * Math.sin(theta)]);
        }
        return pts;
    }, [radius]);

    // Warning ring at 80 % of the limit — the same threshold the server watches.
    const watchPoints = useMemo(
        () => circlePoints.map(([x, y, z]) => [x * 0.8, y, z * 0.8]),
        [circlePoints]
    );

    const trackPoints = useMemo(() => {
        // `!= null`, not a falsy test: latitude 0 is a valid position, and
        // longitude has to be guarded too since project() dereferences it.
        if (skPosition?.latitude == null || skPosition?.longitude == null) return null;
        if (!track.length) return null;
        const pts = track
            .filter(p => Number.isFinite(p?.latitude) && Number.isFinite(p?.longitude))
            .map(p => {
                const [x, z] = project(p, skPosition);
                return [x, PLANE_Y + 0.05, z];
            });
        // The current position closes the track onto the boat itself, so the
        // line always ends where the hull is drawn.
        pts.push([0, PLANE_Y + 0.05, 0]);
        return pts.length >= 2 ? pts : null;
    }, [track, skPosition]);

    // Rode: a straight line from the anchor to the bow, the quickest read on
    // which way the boat is lying. Pointless when the circle is centred on the
    // boat because no anchor is down.
    const rodePoints = useMemo(
        () => (anchorScene && anchorPosition ? [anchorScene, [0, PLANE_Y, 0]] : null),
        [anchorScene, anchorPosition]
    );

    if (!anchorScene) return null;

    // Drag colouring needs both a real drop point and a real alarm radius:
    // against the 30 m default, a boat lying correctly at 40 m on a 60 m scope
    // would be painted as dragging while the server raises nothing.
    const dragging = anchorPosition !== null && radiusKnown &&
        Math.hypot(anchorScene[0], anchorScene[2]) > radius;

    return (
        <group rotation={[0, sceneRotation, 0]}>
            {/* Alarm circle */}
            <group position={anchorScene}>
                <Line
                    points={circlePoints}
                    color={dragging ? oRed : oYellow}
                    lineWidth={2}
                    transparent
                    opacity={0.7}
                />
                <Line
                    points={watchPoints}
                    color={oGray}
                    lineWidth={1}
                    dashed
                    dashSize={2}
                    gapSize={2}
                    transparent
                    opacity={0.35}
                />
                {/* Anchor drop point */}
                <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[Math.max(0.6, radius * 0.03), 16]} />
                    <meshBasicMaterial color={oYellow} transparent opacity={0.9} />
                </mesh>
            </group>

            {rodePoints && (
                <Line
                    points={rodePoints}
                    color={oGray}
                    lineWidth={1}
                    transparent
                    opacity={0.5}
                />
            )}

            {trackPoints && (
                <Line
                    points={trackPoints}
                    color={dragging ? oRed : oYellow}
                    lineWidth={2}
                    transparent
                    opacity={0.85}
                />
            )}
        </group>
    );
};

export default AnchoredCircle;
