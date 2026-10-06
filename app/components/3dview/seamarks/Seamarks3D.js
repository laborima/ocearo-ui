import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useOcearoContext } from '../../context/OcearoContext';
import { useSignalKPaths } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';
import useTheme from '../../theme/useTheme';
import useOwnTrack, { getSessionOrigin } from '../fsd/useOwnTrack';
import { cellsAround, loadCells } from './seamarkData';
import { mergeAtons } from './aisAton';
import { useAIS } from '../ais/AISContext';
import { markStyle, seamarkGeometry } from './seamarkGeometry';
import { lightSequence, isLit } from './lightRhythm';

// Marks downloaded and drawn within 3 NM
const RADIUS_M = 3 * 1852;
// Overpass busy or no network: next attempt
const RETRY_MS = 2 * 60 * 1000;
// The closest ones only: one draw call each (a Raspberry Pi budget)
const MAX_MARKS = 120;
// Marks are drawn 1.5 times their size, and beyond this distance (scene
// units, ~120 m) they grow with distance, a little slower than they shrink
// in perspective: a real buoy is a few pixels from half a mile, and the
// far ones must not crowd the horizon
const EXAGGERATION = 1.5;
const TRUE_SIZE_RANGE = 80;
const sizeAt = (d) => EXAGGERATION * Math.max(1, d / TRUE_SIZE_RANGE) ** 0.75;
// Names of the closest marks only
const LABEL_RANGE = 900;
const MAX_LABELS = 8;
const PATHS = ['navigation.position', 'navigation.speedOverGround', 'navigation.courseOverGroundTrue'];
const LIGHT_PAINT = { white: '#fff6dc', red: '#ff3b30', green: '#30ff7a', yellow: '#ffd23a', blue: '#4aa3ff' };
// A light is seen as a glow, not as its lantern: a soft disc a few metres wide
const GLOW_SIZE = 2.6;

/** Radial glow texture shared by every light */
const glowTexture = () => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.2, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.25)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
};

/**
 * Downloads the seamarks of the cells around the boat (once per cell, then
 * from the offline cache) and returns them all.
 */
const useSeamarkCells = (lat, lon, enabled) => {
    const [cells, setCells] = useState({});
    const loading = useRef(new Set());
    // Cells move with the boat in 0.1° steps: recompute on a ~1 km move
    const latKm = Number.isFinite(lat) ? Math.round(lat * 100) / 100 : null;
    const lonKm = Number.isFinite(lon) ? Math.round(lon * 100) / 100 : null;
    const needed = useMemo(() => (
        enabled && latKm !== null && lonKm !== null ? cellsAround(latKm, lonKm, RADIUS_M) : []
    ), [enabled, latKm, lonKm]);

    const [retry, setRetry] = useState(0);
    useEffect(() => {
        let cancelled = false;
        let timer = null;
        const missing = needed.filter((c) => !(c.key in cells) && !loading.current.has(c.key));
        if (!missing.length) return undefined;
        missing.forEach((c) => loading.current.add(c.key));
        loadCells(missing).then((found) => {
            missing.forEach((c) => loading.current.delete(c.key));
            if (cancelled) return;
            if (Object.keys(found).length) setCells((prev) => ({ ...prev, ...found }));
            // Some cells could not be had (servers busy, offline): try again later
            if (missing.some((c) => !(c.key in found))) timer = setTimeout(() => setRetry((r) => r + 1), RETRY_MS);
        });
        return () => { cancelled = true; clearTimeout(timer); };
    }, [needed, cells, retry]);

    return useMemo(() => needed.flatMap((c) => cells[c.key] || []), [needed, cells]);
};

/**
 * Buoys and beacons in 3D, where they are on the water, from OpenSeaMap
 * and from the AIS aids to navigation Signal K receives (the AIS ones show
 * even without the OpenSeaMap download; virtual ones as a ghost):
 * cardinal, lateral, isolated danger, safe water and special marks, with
 * their colours, shape and topmark, and their light flashing its real
 * rhythm with a dark theme. Anchored to the sea like the AIS targets
 * (same scale and north-up layer turned by the heading), smoothed between
 * GPS fixes. Can be turned off in the settings (no download then).
 */
const Seamarks3D = ({ waterLevel = -0.3 }) => {
    const enabled = configService.get('showSeamarks3D') !== false;
    // OpenSeaMap download; the AIS marks come from Signal K either way
    const overpass = configService.get('seamarksOverpass') !== false;
    const scale = configService.get('aisLengthScalingFactor') || 0.7;
    const { convertLatLonToXY } = useOcearoContext();
    const { id: themeId, scene } = useTheme();
    const night = themeId === 'night';
    const { heading, offset, hasFix } = useOwnTrack();
    const v = useSignalKPaths(PATHS);
    const position = v['navigation.position'];
    const sog = v['navigation.speedOverGround'];
    const cog = v['navigation.courseOverGroundTrue'];

    const osm = useSeamarkCells(position?.latitude, position?.longitude, enabled && overpass && hasFix);
    const { atons } = useAIS();
    const all = useMemo(() => mergeAtons(osm, atons), [osm, atons]);

    // East/north metres from the session origin, like the own track offset
    const placed = useMemo(() => {
        const origin = getSessionOrigin();
        if (!origin) return [];
        const seen = new Set();
        return all.filter((m) => !seen.has(m.id) && seen.add(m.id)).map((m) => {
            const { x, y } = convertLatLonToXY({ lat: m.lat, lon: m.lon }, origin);
            return { ...m, x, y };
        });
    }, [all, convertLatLonToXY]);

    // The closest marks, refreshed with each fix
    const shown = useMemo(() => placed
        .map((m) => ({ m, d: Math.hypot(m.x - offset.x, m.y - offset.y) }))
        .filter(({ d }) => d <= RADIUS_M)
        .sort((a, b) => a.d - b.d)
        .slice(0, MAX_MARKS)
        .map(({ m, d }) => ({ ...m, d })), [placed, offset]);

    const material = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.05 }), []);
    // Virtual AIS marks: nothing on the water, only the AIS message
    const ghost = useMemo(() => new THREE.MeshStandardMaterial({
        vertexColors: true, roughness: 0.55, transparent: true, opacity: 0.38, depthWrite: false,
    }), []);
    const glow = useMemo(() => glowTexture(), []);
    // Light colours; all red-orange with the night theme
    const lightMaterials = useMemo(() => Object.fromEntries(Object.entries(LIGHT_PAINT).map(([name, c]) => [
        name, new THREE.SpriteMaterial({
            map: glow, color: night ? '#ff6a50' : c, blending: THREE.AdditiveBlending,
            transparent: true, depthWrite: false, toneMapped: false, fog: false,
        }),
    ])), [night, glow]);
    useEffect(() => () => Object.values(lightMaterials).forEach((m) => m.dispose()), [lightMaterials]);
    useEffect(() => () => {
        material.dispose();
        ghost.dispose();
        glow.dispose();
    }, [material, ghost, glow]);

    const items = useMemo(() => shown.map((m) => {
        const style = markStyle(m);
        const { geometry, lightY } = seamarkGeometry(style, night);
        const sequence = m.light ? lightSequence(m.light, m.kind === 'cardinal' && m.category === 'south') : null;
        // Each light starts its cycle at its own time
        const seed = [...String(m.id)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7);
        const phase = seed / 997 * (sequence?.period || 1);
        return { m, geometry, lightY, sequence, phase, hasLight: !!m.light };
    }), [shown, night]);

    // Own position between fixes: dead-reckoned and eased onto each fix
    const fix = useRef({ x: 0, y: 0, at: 0, init: false });
    const smooth = useRef({ x: 0, y: 0 });
    useEffect(() => {
        fix.current = { x: offset.x, y: offset.y, at: performance.now() / 1000, init: true };
    }, [offset]);

    const layer = useRef();
    const marks = useRef([]);
    const lights = useRef([]);
    const lit = themeId !== 'day';
    useFrame((state, delta) => {
        const f = fix.current;
        const sm = smooth.current;
        if (!f.init || !layer.current) return;
        const dt = Math.min(delta, 0.1);
        const ms = Number.isFinite(sog) ? sog : 0;
        const course = Number.isFinite(cog) ? cog : heading;
        const vx = Math.sin(course) * ms;
        const vy = Math.cos(course) * ms;
        const since = Math.min(3, performance.now() / 1000 - f.at);
        const tx = f.x + vx * since;
        const ty = f.y + vy * since;
        if (Math.hypot(tx - sm.x, ty - sm.y) > 60) { sm.x = tx; sm.y = ty; }
        sm.x += vx * dt + (tx - sm.x - vx * dt) * Math.min(1, dt * 3);
        sm.y += vy * dt + (ty - sm.y - vy * dt) * Math.min(1, dt * 3);
        layer.current.position.set(-sm.x * scale, 0, sm.y * scale);

        const t = state.clock.elapsedTime;
        items.forEach((it, i) => {
            const mesh = marks.current[i];
            if (!mesh) return;
            const d = Math.hypot(it.m.x - sm.x, it.m.y - sm.y) * scale;
            mesh.scale.setScalar(scale * sizeAt(d));
            const light = lights.current[i];
            if (light) light.visible = lit && isLit(it.sequence, t + it.phase);
        });
    });

    // Name, and whether the mark transmits on AIS (V-AIS: virtual mark)
    const labels = useMemo(() => items
        .filter((it) => (it.m.name || it.m.ais) && it.m.d * scale <= LABEL_RANGE)
        .slice(0, MAX_LABELS)
        .map((it) => ({
            ...it,
            text: [it.m.name, it.m.ais && (it.m.virtual ? 'V-AIS' : 'AIS')].filter(Boolean).join(' · '),
        })), [items, scale]);

    if (!enabled || !items.length) return null;

    return (
        <group rotation={[0, heading, 0]} position={[0, waterLevel, 0]}>
            <group ref={layer}>
                {items.map((it, i) => (
                    <group key={it.m.id} position={[it.m.x * scale, 0, -it.m.y * scale]}
                        ref={(g) => { marks.current[i] = g; }}>
                        <mesh geometry={it.geometry} material={it.m.virtual ? ghost : material} />
                        {it.hasLight && (
                            <sprite material={lightMaterials[it.m.light.colour] || lightMaterials.white}
                                position={[0, it.lightY, 0]} scale={[GLOW_SIZE, GLOW_SIZE, 1]}
                                ref={(l) => { lights.current[i] = l; }} />
                        )}
                    </group>
                ))}
                {labels.map((it) => {
                    // Above the mark at the size it is drawn (see useFrame)
                    const k = sizeAt(it.m.d * scale);
                    return (
                        <Billboard key={`label-${it.m.id}`} position={[it.m.x * scale, (it.lightY + 1) * scale * k, -it.m.y * scale]}>
                            <Text fontSize={0.9 * k} color={scene.compass} fillOpacity={0.8} font="fonts/Roboto-Bold.ttf"
                                anchorX="center" anchorY="bottom" outlineWidth={0.04 * k} outlineColor={scene.compassFace}>
                                {it.text}
                            </Text>
                        </Billboard>
                    );
                })}
            </group>
        </group>
    );
};

export default Seamarks3D;
