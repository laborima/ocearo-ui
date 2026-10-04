import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import configService from '../../settings/ConfigService';
import { useSignalKPaths } from '../../hooks/useSignalK';
import useOwnTrack from '../fsd/useOwnTrack';

/**
 * 3D seabed for the chart mode: a relief mesh under the (translucent) chart,
 * coloured by depth like a paper chart (shallow blue to deep white), with
 * isobaths at 2, 5, 10, 20, 30 and 50 m and the water shallower than our draft plus
 * a safety margin in orange. Land rises above the sea in sand tones.
 *
 * Heights: Terrarium elevation tiles (AWS open data, Mapzen encoding:
 * h = R·256 + G + B/256 − 32768 m), which carry GEBCO / ETOPO bathymetry at
 * sea up to zoom 10 (~150 m per pixel: a smoothed seabed, not a survey). Depths
 * are relative to mean sea level, not chart datum; the tide is added on top.
 */

const TERRARIUM = 'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png';
// Terrarium carries bathymetry up to zoom 10 only (sea is 0 above): ~150 m
// per pixel at 45°N, smoothed by bilinear sampling
const ZOOM = 10;
const TILES = 3;            // 3×3 tiles: ~80 km square around the boat
const GRID = 160;           // mesh resolution
const EXAGGERATION = 4;     // vertical exaggeration so a 10 m shoal reads from the cockpit view
const SAFETY_MARGIN = 1.0;  // metres under the keel
const DEFAULT_DRAFT = 2.0;

const PATHS = ['navigation.position', 'design.draft', 'environment.tide.heightNow', 'environment.tide.heightHigh', 'environment.tide.heightLow'];

const tileXY = (lat, lon, z) => {
    const n = 2 ** z;
    const x = (lon + 180) / 360 * n;
    const r = lat * Math.PI / 180;
    const y = (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n;
    return { x, y };
};
const tileToLatLon = (x, y, z) => {
    const n = 2 ** z;
    const lon = x / n * 360 - 180;
    const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
    return { lat, lon };
};

const loadImage = (url) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`tile ${url}`));
    img.src = url;
});

const cache = new Map();

/** Heights (m) on a TILES×256 square of pixels around a tile, with its geographic bounds */
const loadHeights = async (lat, lon) => {
    const c = tileXY(lat, lon, ZOOM);
    const x0 = Math.floor(c.x) - 1;
    const y0 = Math.floor(c.y) - 1;
    const key = `${x0},${y0}`;
    if (cache.has(key)) return cache.get(key);
    const size = TILES * 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    await Promise.all(Array.from({ length: TILES * TILES }, async (_, k) => {
        const tx = x0 + (k % TILES);
        const ty = y0 + Math.floor(k / TILES);
        const url = TERRARIUM.replace('{z}', ZOOM).replace('{x}', tx).replace('{y}', ty);
        const img = await loadImage(url);
        ctx.drawImage(img, (k % TILES) * 256, Math.floor(k / TILES) * 256);
    }));
    const px = ctx.getImageData(0, 0, size, size).data;
    const heights = new Float32Array(size * size);
    for (let i = 0; i < size * size; i++) {
        heights[i] = px[i * 4] * 256 + px[i * 4 + 1] + px[i * 4 + 2] / 256 - 32768;
    }
    const nw = tileToLatLon(x0, y0, ZOOM);
    const se = tileToLatLon(x0 + TILES, y0 + TILES, ZOOM);
    const result = { heights, size, nw, se };
    cache.set(key, result);
    return result;
};

/** Height (m) at a lat/lon, bilinear in the pixel grid */
const heightAt = (data, lat, lon) => {
    const { heights, size, nw, se } = data;
    const fx = (lon - nw.lon) / (se.lon - nw.lon) * (size - 1);
    // Mercator rows: interpolate in tile space for accuracy
    const tNw = tileXY(nw.lat, nw.lon, ZOOM);
    const tSe = tileXY(se.lat, se.lon, ZOOM);
    const ty = tileXY(lat, lon, ZOOM).y;
    const fy = (ty - tNw.y) / (tSe.y - tNw.y) * (size - 1);
    const i = Math.max(0, Math.min(size - 2, Math.floor(fx)));
    const j = Math.max(0, Math.min(size - 2, Math.floor(fy)));
    const a = Math.min(1, Math.max(0, fx - i));
    const b = Math.min(1, Math.max(0, fy - j));
    const h = (x, y) => heights[y * size + x];
    return (h(i, j) * (1 - a) + h(i + 1, j) * a) * (1 - b) + (h(i, j + 1) * (1 - a) + h(i + 1, j + 1) * a) * b;
};

const vertexShader = `
    attribute float aDepth;
    varying float vDepth;
    varying vec3 vWorld;
    void main() {
        vDepth = aDepth;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
    }
`;

const fragmentShader = `
    uniform float uDanger;
    uniform vec3 uFade;
    uniform float uFadeNear;
    uniform float uFadeFar;
    varying float vDepth;
    varying vec3 vWorld;

    float contour(float d, float level) {
        float w = fwidth(d);
        return 1.0 - smoothstep(0.0, w * 1.5, abs(d - level));
    }

    void main() {
        // Paper-chart palette: drying / land sand, shallow blues, deep near-white
        vec3 land = vec3(0.86, 0.80, 0.66);
        vec3 c;
        if (vDepth <= 0.0) c = mix(land, vec3(0.72, 0.68, 0.58), clamp(-vDepth / 40.0, 0.0, 1.0));
        else if (vDepth < 5.0) c = mix(vec3(0.42, 0.62, 0.86), vec3(0.62, 0.78, 0.93), vDepth / 5.0);
        else if (vDepth < 20.0) c = mix(vec3(0.62, 0.78, 0.93), vec3(0.85, 0.92, 0.98), (vDepth - 5.0) / 15.0);
        else c = mix(vec3(0.85, 0.92, 0.98), vec3(0.96, 0.98, 1.0), clamp((vDepth - 20.0) / 60.0, 0.0, 1.0));
        // Too shallow for us: orange
        if (vDepth > 0.0 && vDepth < uDanger) c = mix(c, vec3(1.0, 0.55, 0.15), 0.65);
        // Isobaths
        float lines = max(max(contour(vDepth, 2.0), contour(vDepth, 5.0)), max(contour(vDepth, 10.0), contour(vDepth, 20.0)));
        lines = max(lines, max(contour(vDepth, 30.0), contour(vDepth, 50.0)) * 0.6);
        lines = max(lines, contour(vDepth, 0.0) * 1.5);
        c = mix(c, vec3(0.16, 0.30, 0.50), clamp(lines, 0.0, 1.0) * 0.8);
        // Light from above-left for the relief
        vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
        if (n.y < 0.0) n = -n;
        c *= 0.75 + 0.3 * clamp(dot(n, normalize(vec3(-0.4, 1.0, -0.3))), 0.0, 1.0);
        float dist = length(vWorld.xz);
        c = mix(c, uFade, smoothstep(uFadeNear, uFadeFar, dist));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
    }
`;

const Seabed3D = ({ y = -0.4 }) => {
    const v = useSignalKPaths(PATHS);
    const position = v['navigation.position'];
    const { heading } = useOwnTrack();
    const [data, setData] = useState(null);
    const scale = configService.get('aisLengthScalingFactor') || 0.7;
    const draft = Number.isFinite(v['design.draft']?.maximum) ? v['design.draft'].maximum
        : Number(configService.get('boatDraft')) || DEFAULT_DRAFT;
    // Tide heights are above chart datum, the seabed is relative to mean sea
    // level: use the height above mid-tide (≈ MSL) of today's high and low
    const hNow = v['environment.tide.heightNow'];
    const hHigh = v['environment.tide.heightHigh'];
    const hLow = v['environment.tide.heightLow'];
    const tide = Number.isFinite(hNow) && Number.isFinite(hHigh) && Number.isFinite(hLow) ? hNow - (hHigh + hLow) / 2 : 0;

    const lat = position?.latitude;
    const lon = position?.longitude;
    // Reload when the boat leaves the middle tile
    const tileKey = Number.isFinite(lat) ? (() => { const t = tileXY(lat, lon, ZOOM); return `${Math.floor(t.x)},${Math.floor(t.y)}`; })() : null;

    useEffect(() => {
        if (!tileKey) return undefined;
        let cancelled = false;
        loadHeights(lat, lon).then((d) => { if (!cancelled) setData(d); }).catch(() => {});
        return () => { cancelled = true; };
    }, [tileKey]); // eslint-disable-line react-hooks/exhaustive-deps

    // Mesh around the boat: ±HALF metres, north-up local (x east, y north)
    const HALF = 4000;
    const geometry = useMemo(() => {
        if (!data || !Number.isFinite(lat)) return null;
        const g = new THREE.PlaneGeometry(HALF * 2 * scale, HALF * 2 * scale, GRID, GRID);
        const p = g.attributes.position;
        const depth = new Float32Array(p.count);
        const mPerDegLat = 111320;
        const mPerDegLon = 111320 * Math.cos(lat * Math.PI / 180);
        for (let i = 0; i < p.count; i++) {
            const east = p.getX(i) / scale;
            const north = p.getY(i) / scale;
            const h = heightAt(data, lat + north / mPerDegLat, lon + east / mPerDegLon) + tide;
            depth[i] = -h;
            // Below the sea surface the seabed sinks (exaggerated); land stays
            // flat at sea level under the chart, so it never hides the boat
            const z = h < 0 ? h * EXAGGERATION * scale : 0;
            p.setZ(i, z);
        }
        g.setAttribute('aDepth', new THREE.BufferAttribute(depth, 1));
        g.computeVertexNormals();
        return g;
        // Rebuilt when the tile data changes or the boat has moved ~200 m
    }, [data, scale, tide, lat && Math.round(lat * 500), lon && Math.round(lon * 500)]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => () => geometry?.dispose(), [geometry]);

    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uDanger: { value: DEFAULT_DRAFT + SAFETY_MARGIN },
            uFade: { value: new THREE.Color('#e8eef3') },
            uFadeNear: { value: 1800 },
            uFadeFar: { value: 2700 },
        },
        vertexShader,
        fragmentShader,
    }), []);
    useEffect(() => { material.uniforms.uDanger.value = draft + SAFETY_MARGIN; }, [material, draft]); // eslint-disable-line react-hooks/immutability
    useEffect(() => () => material.dispose(), [material]);

    if (!geometry || !Number.isFinite(lat)) return null;
    // The mesh was built around the position at build time; place it relative to the current one
    return (
        <group rotation={[0, heading, 0]} position={[0, y, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geometry} material={material} renderOrder={-2} />
        </group>
    );
};

export default Seabed3D;
