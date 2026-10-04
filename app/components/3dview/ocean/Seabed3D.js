import React, { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Html, Line } from '@react-three/drei';
import useTheme from '../../theme/useTheme';
import configService from '../../settings/ConfigService';
import { useSignalKPaths } from '../../hooks/useSignalK';
import useOwnTrack from '../fsd/useOwnTrack';
import { cachedImage } from '../../utils/offlineCache';
import { bathymetryTileTemplate } from '../../utils/OcearoCoreUtils';

/**
 * 3D seabed for the bathymetry mode: the bottom as a deformed grid under the
 * (translucent) chart, the way a survey is drawn. Relief exaggerated,
 * grid lines every 50 m (bold every 250 m) anchored to the ground, colour by
 * depth, isobaths at 2, 5, 10, 20, 30 and 50 m, soundings (depth now, tide
 * included) and a sounder line from the keel to the bottom. Water shallower
 * than our draft plus a margin is hatched orange; drying banks are green and
 * land sand, as on a paper chart.
 *
 * Heights: Terrarium elevation tiles (AWS open data, Mapzen encoding:
 * h = R·256 + G + B/256 − 32768 m), which carry GEBCO / ETOPO bathymetry at
 * sea up to zoom 10 (~150 m per pixel: a smoothed seabed, not a survey). Depths
 * are relative to mean sea level, not chart datum; the tide is added on top.
 *
 * Where the boat's server has SHOM models (ocearo-core downloads them when
 * online: 5 – 20 m surveys of the French coast), their tiles take over:
 * same encoding, referenced to chart datum, transparent where not covered.
 */

export const BATHY_ZOOM = 10;
export const TERRARIUM = 'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png';
// Terrarium carries bathymetry up to zoom 10 only (sea is 0 above): ~150 m
// per pixel at 45°N, smoothed by bilinear sampling
const ZOOM = BATHY_ZOOM;
// SHOM tiles from ocearo-core: ~13 m per pixel at 45°N, 3×3 tiles ≈ 10 km
export const SHOM_ZOOM = 13;
const TILES = 3;            // 3×3 tiles: ~80 km square around the boat
const GRID = 160;           // mesh resolution
const GRID_SHOM = 240;      // finer where the survey allows it (~25 m between vertices)
// Vertical exaggeration so a 2 m bank reads from the cockpit view: more on
// a SHOM survey, whose detail is real, than on the smoothed global relief
const EXAGGERATION_SURVEY = 9;
const EXAGGERATION_GLOBAL = 5;
const HALF = 3000;          // metres each side of the boat
// Soundings: one every SOUNDING_STEP metres within SOUNDING_RADIUS
const SOUNDING_STEP = 250;
const SOUNDING_RADIUS = 1500;
// Highest tides at the French Atlantic ports reach ~6.5 m above chart datum:
// exposed ground lower than that dries at low water (estran)
const DRYING_LIMIT_CD = 6.5;
const SAFETY_MARGIN = 1.0;  // metres under the keel
const DEFAULT_DRAFT = 2.0;

const PATHS = ['navigation.position', 'design.draft', 'environment.tide.heightNow', 'environment.tide.heightHigh', 'environment.tide.heightLow', 'environment.depth.belowSurface'];

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

// Network or the offline cache
const loadImage = (url) => cachedImage(url);

const cache = new Map();

/**
 * Heights (m) on a TILES×256 square of pixels around a tile, with its
 * geographic bounds. Pixels no tile covers (missing tile, transparent pixel)
 * are NaN; null when nothing at all was loaded.
 */
const loadHeights = async (lat, lon, template = TERRARIUM, z = ZOOM) => {
    const c = tileXY(lat, lon, z);
    const x0 = Math.floor(c.x) - 1;
    const y0 = Math.floor(c.y) - 1;
    const key = `${template}|${z}/${x0},${y0}`;
    if (cache.has(key)) return cache.get(key);
    const size = TILES * 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const loaded = await Promise.all(Array.from({ length: TILES * TILES }, async (_, k) => {
        const tx = x0 + (k % TILES);
        const ty = y0 + Math.floor(k / TILES);
        const url = template.replace('{z}', z).replace('{x}', tx).replace('{y}', ty);
        try {
            const img = await loadImage(url);
            ctx.drawImage(img, (k % TILES) * 256, Math.floor(k / TILES) * 256);
            return true;
        } catch {
            return false; // not covered (SHOM) or unreachable: left transparent
        }
    }));
    if (!loaded.some(Boolean)) return null;
    const px = ctx.getImageData(0, 0, size, size).data;
    const heights = new Float32Array(size * size);
    for (let i = 0; i < size * size; i++) {
        heights[i] = px[i * 4 + 3] < 255 ? NaN : px[i * 4] * 256 + px[i * 4 + 1] + px[i * 4 + 2] / 256 - 32768;
    }
    const nw = tileToLatLon(x0, y0, z);
    const se = tileToLatLon(x0 + TILES, y0 + TILES, z);
    const result = { heights, size, nw, se, z };
    cache.set(key, result);
    return result;
};

/** Terrarium around the boat, and the SHOM survey from ocearo-core where there is one */
const loadSeabed = async (lat, lon) => {
    const shomTemplate = bathymetryTileTemplate();
    const [global, shom] = await Promise.all([
        loadHeights(lat, lon),
        shomTemplate ? loadHeights(lat, lon, shomTemplate, SHOM_ZOOM).catch(() => null) : null,
    ]);
    if (!global && !shom) throw new Error('No bathymetry');
    return { global, shom };
};

/** Height (m) at a lat/lon, bilinear in the pixel grid; NaN where not covered */
const heightAt = (data, lat, lon) => {
    const { heights, size, nw, se, z } = data;
    const fx = (lon - nw.lon) / (se.lon - nw.lon) * (size - 1);
    // Mercator rows: interpolate in tile space for accuracy
    const tNw = tileXY(nw.lat, nw.lon, z);
    const tSe = tileXY(se.lat, se.lon, z);
    const ty = tileXY(lat, lon, z).y;
    const fy = (ty - tNw.y) / (tSe.y - tNw.y) * (size - 1);
    if (fx < 0 || fy < 0 || fx > size - 1 || fy > size - 1) return NaN;
    const i = Math.min(size - 2, Math.floor(fx));
    const j = Math.min(size - 2, Math.floor(fy));
    const a = fx - i;
    const b = fy - j;
    const h = (x, y) => heights[y * size + x];
    return (h(i, j) * (1 - a) + h(i + 1, j) * a) * (1 - b) + (h(i, j + 1) * (1 - a) + h(i + 1, j + 1) * a) * b;
};


// Ground-anchored metres (east, north from a fixed reference) for the grid
// lines, so they stay put on the seabed while the mesh follows the boat
const vertexShader = `
    attribute float aDepth;
    attribute float aDrying;
    attribute vec2 aGround;
    varying float vDepth;
    varying float vDrying;
    varying vec2 vGround;
    varying vec3 vWorld;
    void main() {
        vDepth = aDepth;
        vDrying = aDrying;
        vGround = aGround;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
    }
`;

const fragmentShader = `
    uniform float uDanger;
    uniform vec3 uShallow;
    uniform vec3 uMid;
    uniform vec3 uDeep;
    uniform vec3 uLand;
    uniform vec3 uDrying;
    uniform vec3 uLine;
    uniform vec3 uDangerColor;
    uniform vec3 uFade;
    uniform float uFadeNear;
    uniform float uFadeFar;
    varying float vDepth;
    varying float vDrying;
    varying vec2 vGround;
    varying vec3 vWorld;

    float contour(float d, float level, float width) {
        float w = fwidth(d);
        return 1.0 - smoothstep(0.0, w * width, abs(d - level));
    }
    float gridLines(vec2 p, float spacing, float width) {
        vec2 g = abs(fract(p / spacing - 0.5) - 0.5) * spacing;
        vec2 w = fwidth(p) * width;
        vec2 l = 1.0 - smoothstep(vec2(0.0), w, g);
        return max(l.x, l.y);
    }

    void main() {
        vec3 c;
        if (vDepth <= 0.0) {
            c = vDrying > 0.5 ? uDrying : uLand;
        } else if (vDepth < 6.0) {
            c = mix(uShallow, uMid, vDepth / 6.0);
        } else {
            // Darker with depth, as light fades under water: the relief reads at a glance
            c = mix(uMid, uDeep, clamp((vDepth - 6.0) / 18.0, 0.0, 1.0));
        }
        // Relief: hill shading from the north-west, as on a shaded survey
        vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
        if (n.y < 0.0) n = -n;
        c *= 0.5 + 0.65 * clamp(dot(n, normalize(vec3(-0.6, 0.7, -0.5))), 0.0, 1.0);
        // Too shallow for us: orange hatching (not a fill, which reads as land)
        if (vDepth > 0.0 && vDepth < uDanger) {
            float hatch = step(0.55, fract((vGround.x + vGround.y) / 14.0));
            c = mix(c, uDangerColor, 0.25 + 0.45 * hatch);
        }
        // The survey grid, fading out with distance before it shimmers
        float dist = length(vWorld.xz);
        float gridFade = 1.0 - smoothstep(900.0, 1700.0, dist);
        float minor = gridLines(vGround, 50.0, 1.5) * 0.55;
        float major = gridLines(vGround, 250.0, 2.4) * 0.85;
        c = mix(c, uLine, max(minor, major) * gridFade * (vDepth > 0.0 ? 1.0 : 0.4));
        // Isobaths, the drying line bold
        float lines = max(max(contour(vDepth, 2.0, 1.5), contour(vDepth, 5.0, 1.5)), max(contour(vDepth, 10.0, 1.5), contour(vDepth, 20.0, 1.5)));
        lines = max(lines, max(contour(vDepth, 30.0, 1.2), contour(vDepth, 50.0, 1.2)) * 0.7);
        lines = max(lines, contour(vDepth, 0.0, 2.5));
        lines = max(lines, contour(vDepth, uDanger, 2.0) * 0.9);
        c = mix(c, uLine * 0.75, clamp(lines, 0.0, 1.0) * 0.85);
        c = mix(c, uFade, smoothstep(uFadeNear, uFadeFar, dist));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
    }
`;

// Palette by theme: paper chart by day, FSD navy and cyan at night
const PALETTES = {
    light: { shallow: '#b5e0f2', mid: '#5fa8d8', deep: '#1c4f86', land: '#e2d6b8', drying: '#c7d3a6', line: '#0f3557', danger: '#e8873a', fade: '#e8eef3', text: '#0f2f4f', halo: '#ffffff' },
    dark: { shallow: '#2d7fa8', mid: '#17507a', deep: '#061a2e', land: '#3a3527', drying: '#2b3a26', line: '#6fd0ff', danger: '#e8873a', fade: '#000000', text: '#d6efff', halo: '#000000' },
    night: { shallow: '#4a0b0b', mid: '#300606', deep: '#140202', land: '#2a0a04', drying: '#2a1004', line: '#ff4a4a', danger: '#ff7a3a', fade: '#000000', text: '#ff9a9a', halo: '#000000' },
};

/** Metres east / north between two positions (local tangent plane) */
const enu = (lat0, lon0, lat, lon) => ({
    east: (lon - lon0) * 111320 * Math.cos(lat0 * Math.PI / 180),
    north: (lat - lat0) * 111320,
});

/**
 * Soundings as one textured sprite batch: every label is drawn once into a
 * canvas atlas and the quads face the camera in the vertex shader. One draw
 * call however many soundings (Troika text per label would be dozens).
 */
const SOUNDING_CELL = [96, 40];
const soundingVertex = `
    attribute vec3 aCenter;
    attribute vec2 aCell;
    uniform vec2 uAtlas;
    uniform float uSize;
    varying vec2 vUv;
    varying float vFade;
    void main() {
        vec4 mv = modelViewMatrix * vec4(aCenter, 1.0);
        float d = -mv.z;
        // Constant size on screen (like the HUD text), none right under the camera
        float size = d * uSize;
        mv.xy += position.xy * vec2(size * 2.4, size);
        vUv = (aCell + vec2(position.x + 0.5, 0.5 - position.y)) / uAtlas;
        vFade = (1.0 - smoothstep(1100.0, 1700.0, length(aCenter.xz))) * smoothstep(25.0, 60.0, d);
        gl_Position = projectionMatrix * mv;
    }
`;
const soundingFragment = `
    uniform sampler2D uMap;
    varying vec2 vUv;
    varying float vFade;
    void main() {
        vec4 t = texture2D(uMap, vUv);
        if (t.a * vFade < 0.05) discard;
        gl_FragColor = vec4(t.rgb, t.a * vFade);
        #include <colorspace_fragment>
    }
`;

const Soundings = ({ items, palette }) => {
    const { geometry, material } = useMemo(() => {
        if (!items.length) return {};
        const [cw, ch] = SOUNDING_CELL;
        const cols = 16;
        const rows = Math.ceil(items.length / cols);
        const canvas = document.createElement('canvas');
        canvas.width = cw * cols;
        canvas.height = ch * rows;
        const ctx = canvas.getContext('2d');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const quad = new THREE.PlaneGeometry(1, 1);
        const geo = new THREE.InstancedBufferGeometry();
        geo.index = quad.index;
        geo.setAttribute('position', quad.attributes.position);
        const centers = new Float32Array(items.length * 3);
        const cells = new Float32Array(items.length * 2);
        items.forEach((it, k) => {
            const cx = (k % cols) * cw;
            const cy = Math.floor(k / cols) * ch;
            ctx.font = `${it.danger ? 700 : 600} 28px Inter, Roboto, Arial, sans-serif`;
            ctx.lineWidth = 7;
            ctx.strokeStyle = palette.halo;
            ctx.strokeText(it.text, cx + cw / 2, cy + ch / 2 + 1);
            ctx.fillStyle = it.danger ? palette.danger : palette.text;
            ctx.fillText(it.text, cx + cw / 2, cy + ch / 2 + 1);
            centers.set(it.position, k * 3);
            cells.set([k % cols, Math.floor(k / cols)], k * 2);
        });
        geo.setAttribute('aCenter', new THREE.InstancedBufferAttribute(centers, 3));
        geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(cells, 2));
        geo.instanceCount = items.length;
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = false;
        texture.anisotropy = 4;
        const mat = new THREE.ShaderMaterial({
            uniforms: { uMap: { value: texture }, uAtlas: { value: new THREE.Vector2(cols, rows) }, uSize: { value: 0.03 } },
            vertexShader: soundingVertex,
            fragmentShader: soundingFragment,
            transparent: true,
            depthWrite: false,
        });
        quad.dispose();
        return { geometry: geo, material: mat };
    }, [items, palette]);
    useEffect(() => () => { geometry?.dispose(); material?.uniforms.uMap.value.dispose(); material?.dispose(); }, [geometry, material]);
    if (!geometry) return null;
    return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={3} />;
};

const formatDepth = (d) => (d < 10 ? d.toFixed(1) : String(Math.round(d)));

const Seabed3D = ({ y = -0.4 }) => {
    const v = useSignalKPaths(PATHS);
    const { scene } = useTheme();
    const position = v['navigation.position'];
    const { heading } = useOwnTrack();
    const [data, setData] = useState(null);
    const scale = configService.get('aisLengthScalingFactor') || 0.7;
    const draft = Number.isFinite(v['design.draft']?.maximum) ? v['design.draft'].maximum
        : Number(configService.get('boatDraft')) || DEFAULT_DRAFT;
    // Tide heights are above chart datum. Terrarium is relative to mean sea
    // level: use the height above mid-tide (≈ MSL) of today's high and low.
    // The SHOM survey is relative to chart datum, like the tide: add it as is
    // (none known: chart datum, the cautious case).
    const hNow = v['environment.tide.heightNow'];
    const hHigh = v['environment.tide.heightHigh'];
    const hLow = v['environment.tide.heightLow'];
    const tide = Number.isFinite(hNow) && Number.isFinite(hHigh) && Number.isFinite(hLow) ? hNow - (hHigh + hLow) / 2 : 0;
    const tideChartDatum = Number.isFinite(hNow) ? hNow : 0;
    const sounder = v['environment.depth.belowSurface'];
    const palette = scene.background === '#000000' ? (scene.sea === '#120202' ? PALETTES.night : PALETTES.dark) : PALETTES.light;

    const lat = position?.latitude;
    const lon = position?.longitude;
    // Reload when the boat leaves the middle tile
    const tileKey = Number.isFinite(lat) ? (() => { const t = tileXY(lat, lon, ZOOM); return `${Math.floor(t.x)},${Math.floor(t.y)}`; })() : null;

    useEffect(() => {
        if (!tileKey) return undefined;
        let cancelled = false;
        loadSeabed(lat, lon).then((d) => { if (!cancelled) setData(d); }).catch(() => {});
        return () => { cancelled = true; };
    }, [tileKey]); // eslint-disable-line react-hooks/exhaustive-deps

    /** Elevation (m) now, i.e. above the water surface (tide included), and whether it dries */
    const sample = useMemo(() => {
        if (!data) return null;
        return (pLat, pLon) => {
            const survey = data.shom ? heightAt(data.shom, pLat, pLon) : NaN;
            if (Number.isFinite(survey)) return { h: survey - tideChartDatum, drying: survey < DRYING_LIMIT_CD };
            const global = data.global ? heightAt(data.global, pLat, pLon) : NaN;
            if (Number.isFinite(global)) return { h: global - tide, drying: global < DRYING_LIMIT_CD - 3.5 };
            return null;
        };
    }, [data, tide, tideChartDatum]);

    // Mesh around the boat: ±HALF metres, north-up local (x east, y north)
    const built = useMemo(() => {
        if (!sample || !Number.isFinite(lat)) return null;
        const grid = data.shom ? GRID_SHOM : GRID;
        const exaggeration = data.shom ? EXAGGERATION_SURVEY : EXAGGERATION_GLOBAL;
        const g = new THREE.PlaneGeometry(HALF * 2 * scale, HALF * 2 * scale, grid, grid);
        const p = g.attributes.position;
        const depth = new Float32Array(p.count);
        const drying = new Float32Array(p.count);
        const ground = new Float32Array(p.count * 2);
        const mPerDegLat = 111320;
        const mPerDegLon = 111320 * Math.cos(lat * Math.PI / 180);
        // Grid reference: a fixed point (whole tenth of a degree) near the boat
        const ref = enu(Math.round(lat * 10) / 10, Math.round(lon * 10) / 10, lat, lon);
        for (let i = 0; i < p.count; i++) {
            const east = p.getX(i) / scale;
            const north = p.getY(i) / scale;
            const s = sample(lat + north / mPerDegLat, lon + east / mPerDegLon);
            const h = s ? s.h : 0;
            depth[i] = -h;
            drying[i] = s?.drying ? 1 : 0;
            ground[i * 2] = ref.east + east;
            ground[i * 2 + 1] = ref.north + north;
            // Below the sea surface the seabed sinks (exaggerated); land and
            // drying banks stay flat at sea level under the chart
            p.setZ(i, h < 0 ? h * exaggeration * scale : 0);
        }
        g.setAttribute('aDepth', new THREE.BufferAttribute(depth, 1));
        g.setAttribute('aDrying', new THREE.BufferAttribute(drying, 1));
        g.setAttribute('aGround', new THREE.BufferAttribute(ground, 2));
        g.computeVertexNormals();

        // Soundings on a ground-anchored lattice, in the mesh's frame
        // (x east, y north, z up before the group's rotation)
        const items = [];
        const step = SOUNDING_STEP;
        const e0 = Math.ceil((ref.east - SOUNDING_RADIUS) / step) * step;
        const n0 = Math.ceil((ref.north - SOUNDING_RADIUS) / step) * step;
        for (let ge = e0; ge <= ref.east + SOUNDING_RADIUS; ge += step) {
            for (let gn = n0; gn <= ref.north + SOUNDING_RADIUS; gn += step) {
                const east = ge - ref.east + step / 2;
                const north = gn - ref.north + step / 2;
                if (Math.hypot(east, north) > SOUNDING_RADIUS) continue;
                const s = sample(lat + north / mPerDegLat, lon + east / mPerDegLon);
                if (!s || s.h >= -0.1) continue;
                const d = -s.h;
                items.push({
                    text: formatDepth(d),
                    danger: d < draft + SAFETY_MARGIN,
                    // Group frame (y up, north towards -z), just above the bottom
                    position: [east * scale, s.h * exaggeration * scale + 2, -north * scale],
                });
            }
        }
        const here = sample(lat, lon);
        return { geometry: g, items, bottom: here && here.h < 0 ? here.h * exaggeration * scale : null, depthHere: here ? -here.h : null };
        // Rebuilt when the tile data changes or the boat has moved ~200 m
    }, [sample, scale, draft, lat && Math.round(lat * 500), lon && Math.round(lon * 500)]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => () => built?.geometry.dispose(), [built]);

    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uDanger: { value: DEFAULT_DRAFT + SAFETY_MARGIN },
            uShallow: { value: new THREE.Color() },
            uMid: { value: new THREE.Color() },
            uDeep: { value: new THREE.Color() },
            uLand: { value: new THREE.Color() },
            uDrying: { value: new THREE.Color() },
            uLine: { value: new THREE.Color() },
            uDangerColor: { value: new THREE.Color() },
            uFade: { value: new THREE.Color() },
            uFadeNear: { value: 1500 },
            uFadeFar: { value: 2100 },
        },
        vertexShader,
        fragmentShader,
    }), []);
    useEffect(() => {
        const u = material.uniforms;
        u.uDanger.value = draft + SAFETY_MARGIN; // eslint-disable-line react-hooks/immutability
        u.uShallow.value.set(palette.shallow);
        u.uMid.value.set(palette.mid);
        u.uDeep.value.set(palette.deep);
        u.uLand.value.set(palette.land);
        u.uDrying.value.set(palette.drying);
        u.uLine.value.set(palette.line);
        u.uDangerColor.value.set(palette.danger);
        u.uFade.value.set(palette.fade);
    }, [material, draft, palette]);
    useEffect(() => () => material.dispose(), [material]);

    if (!built || !Number.isFinite(lat)) return null;
    const depthLabel = Number.isFinite(sounder) ? sounder : built.depthHere;
    // The mesh was built around the position at build time; place it relative to the current one
    return (
        <group rotation={[0, heading, 0]} position={[0, y, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={built.geometry} material={material} renderOrder={-2} />
            <Soundings items={built.items} palette={palette} />
            {/* Sounder: from the keel straight down to the bottom */}
            {built.bottom !== null && (
                <group>
                    <Line points={[[0, -1.6, 0], [0, built.bottom, 0]]} color={palette.line} lineWidth={2} dashed dashSize={1.2} gapSize={0.8} />
                    <mesh position={[0, built.bottom, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[1.2, 1.8, 32]} />
                        <meshBasicMaterial color={palette.line} transparent opacity={0.8} side={THREE.DoubleSide} />
                    </mesh>
                    {Number.isFinite(depthLabel) && (
                        <Html position={[0, built.bottom / 2, 0]} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
                            <div className="ml-3 -translate-y-1/2 whitespace-nowrap px-1.5 py-px rounded-md text-caption font-semibold tabular-nums text-hud-main bg-hud-bg/70 backdrop-blur-sm">
                                {formatDepth(depthLabel)} m
                            </div>
                        </Html>
                    )}
                </group>
            )}
        </group>
    );
};

export default Seabed3D;
