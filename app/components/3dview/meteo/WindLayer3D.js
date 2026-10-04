import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import configService from '../../settings/ConfigService';
import { useSignalKPaths } from '../../hooks/useSignalK';
import useOwnTrack from '../fsd/useOwnTrack';
import { fetchWindField, uniformField, sampleWind, windColor, HALF_EXTENT_M } from './windField';
import { getForecastHour, subscribeForecast } from './forecastStore';

const PATHS = ['navigation.position', 'environment.wind.speedTrue', 'environment.wind.directionTrue'];
const TEX = 128;
const PARTICLES = 1800;
const R = 6371000;

/** East / north metres of `p` from `origin` */
const offsetM = (origin, p) => ({
    east: (p.longitude - origin.lon) * Math.PI / 180 * R * Math.cos(origin.lat * Math.PI / 180),
    north: (p.latitude - origin.lat) * Math.PI / 180 * R,
});

/**
 * Windy-style wind layer for the meteo mode: the forecast wind speed painted
 * with Windy's colour scale on a translucent sheet over the chart, and
 * streaks drifting with the wind. Pull the camera out to see the winds
 * along the route; the forecast hour comes from the meteo bar.
 */
const WindLayer3D = ({ y = 0.05 }) => {
    const v = useSignalKPaths(PATHS);
    const position = v['navigation.position'];
    const { heading } = useOwnTrack();
    const hour = useSyncExternalStore(subscribeForecast, getForecastHour, getForecastHour);
    const [field, setField] = useState(null);
    const scale = configService.get('aisLengthScalingFactor') || 0.7;

    const lat = position?.latitude;
    const lon = position?.longitude;
    const roundedKey = Number.isFinite(lat) ? `${lat.toFixed(1)},${lon.toFixed(1)}` : null;
    const tws = v['environment.wind.speedTrue'];
    const twd = v['environment.wind.directionTrue'];

    // Forecast grid around the boat; the boat's own wind when offline
    useEffect(() => {
        if (!roundedKey) return undefined;
        let cancelled = false;
        const [la, lo] = roundedKey.split(',').map(Number);
        fetchWindField(la, lo)
            .then((f) => { if (!cancelled) setField(f); })
            .catch(() => {
                if (!cancelled && Number.isFinite(tws) && Number.isFinite(twd)) setField(uniformField(la, lo, tws, twd));
            });
        return () => { cancelled = true; };
    }, [roundedKey]); // eslint-disable-line react-hooks/exhaustive-deps

    // Speed sheet: a small texture computed on the CPU from the grid
    const texture = useMemo(() => {
        const data = new Uint8Array(TEX * TEX * 4);
        const t = new THREE.DataTexture(data, TEX, TEX, THREE.RGBAFormat);
        t.magFilter = THREE.LinearFilter;
        t.minFilter = THREE.LinearFilter;
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    }, []);
    useEffect(() => {
        if (!field) return;
        const data = texture.image.data;
        for (let j = 0; j < TEX; j++) {
            for (let i = 0; i < TEX; i++) {
                const east = (i / (TEX - 1) * 2 - 1) * HALF_EXTENT_M;
                const north = (j / (TEX - 1) * 2 - 1) * HALF_EXTENT_M;
                const w = sampleWind(field, east, north, hour);
                const [r, g, b] = windColor(Math.hypot(w.u, w.v));
                const k = (j * TEX + i) * 4;
                // Fade out at the grid's edge
                const edge = Math.max(Math.abs(i / (TEX - 1) * 2 - 1), Math.abs(j / (TEX - 1) * 2 - 1));
                data[k] = r; data[k + 1] = g; data[k + 2] = b;
                data[k + 3] = Math.round(255 * Math.min(1, (1 - edge) * 8));
            }
        }
        texture.needsUpdate = true;
    }, [texture, field, hour]);
    useEffect(() => () => texture.dispose(), [texture]);

    // Streaks: particles advected by the field, drawn as short segments
    const particles = useMemo(() => {
        const pos = new Float32Array(PARTICLES * 2 * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const state = Array.from({ length: PARTICLES }, () => ({ x: 0, y: 0, age: Math.random() * 4, life: 2 + Math.random() * 3 }));
        return { geo, state };
    }, []);
    const lineMaterial = useMemo(() => new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, depthWrite: false }), []);
    useEffect(() => () => { particles.geo.dispose(); lineMaterial.dispose(); }, [particles, lineMaterial]);

    const boatRef = useRef({ east: 0, north: 0 });
    useEffect(() => {
        if (field && Number.isFinite(lat)) boatRef.current = offsetM(field.origin, { latitude: lat, longitude: lon });
    }, [field, lat, lon]);

    useFrame(({ camera }, delta) => {
        if (!field) return;
        const dt = Math.min(delta, 0.1);
        // Streaks cover what the camera sees: a few times its distance
        const radiusM = Math.min(HALF_EXTENT_M, Math.max(800, camera.position.length() / scale * 2.5));
        // Visual speed: a streak crosses ~1/12 of the view per second in 10 m/s
        const speedUp = radiusM / 120;
        const tail = radiusM / 90;
        const { east: be, north: bn } = boatRef.current;
        const pos = particles.geo.attributes.position.array;
        particles.state.forEach((p, k) => {
            p.age += dt;
            if (p.age > p.life || Math.abs(p.x) > radiusM || Math.abs(p.y) > radiusM) {
                p.x = (Math.random() * 2 - 1) * radiusM;
                p.y = (Math.random() * 2 - 1) * radiusM;
                p.age = 0;
                p.life = 2 + Math.random() * 3;
            }
            const w = sampleWind(field, be + p.x, bn + p.y, hour);
            const s = Math.hypot(w.u, w.v) || 1;
            p.x += w.u * speedUp * dt / 10;
            p.y += w.v * speedUp * dt / 10;
            const len = tail * Math.min(1.5, s / 8);
            const o = k * 6;
            pos[o] = p.x * scale; pos[o + 1] = p.y * scale; pos[o + 2] = 0.2;
            pos[o + 3] = (p.x - w.u / s * len) * scale; pos[o + 4] = (p.y - w.v / s * len) * scale; pos[o + 5] = 0.2;
        });
        particles.geo.attributes.position.needsUpdate = true;
    });

    if (!field) return null;
    const { east: be, north: bn } = boatRef.current;
    const size = HALF_EXTENT_M * 2 * scale;

    return (
        // North-up layer turned into the boat frame; local x east, y north
        <group rotation={[0, heading, 0]} position={[0, y, 0]}>
            <group rotation={[-Math.PI / 2, 0, 0]}>
                <mesh position={[-be * scale, -bn * scale, 0]} renderOrder={1}>
                    <planeGeometry args={[size, size]} />
                    <meshBasicMaterial map={texture} transparent opacity={0.62} depthWrite={false} toneMapped={false} />
                </mesh>
                <lineSegments geometry={particles.geo} material={lineMaterial} renderOrder={2} frustumCulled={false} />
            </group>
        </group>
    );
};

export default WindLayer3D;
