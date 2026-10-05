import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSignalKPath } from '../../hooks/useSignalK';
import signalKService from '../../services/SignalKService';
import configService from '../../settings/ConfigService';
import useOwnTrack from '../fsd/useOwnTrack';
import { cachedImage } from '../../utils/offlineCache';
import useTheme from '../../theme/useTheme';

// ── Constants ─────────────────────────────────────────────────────────────────

const CANVAS_SIZE = 1024; // texture resolution
const TILE_SIZE = 256;    // OSM tile pixel size

export const OSM_TEMPLATE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const SEAMARK_TEMPLATE = 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png';
const RAINVIEWER_INDEX = 'https://api.rainviewer.com/public/weather-maps.json';

const OSM_MAX_ZOOM = 19;     // OSM serves up to z19 — pontoons/piers appear from z17
const CUSTOM_MAX_ZOOM = 18;  // safe cap for SignalK-provided charts (unknown max)
const SEAMARK_MAX_ZOOM = 18; // OpenSeaMap seamark overlay (buoys, lights, marks)
// RainViewer's free tiles stop at z7: above, every tile is a "Zoom Level Not
// Supported" banner that was drawn all over the meteo map
const RAIN_MAX_ZOOM = 7;
const RAIN_MAX_BASE_ZOOM = 12; // closer in, a z7 radar pixel is a blurred blob

// Meteo: the base map follows the camera like the chart, a little coarser
// (the wind sheet covers it); a fixed 40 km coverage left a blurred map
// under the boat when zoomed in. The rain radar stays capped at its zoom.
const METEO_MAX_ZOOM = 15;
const METEO_MIN_COVERAGE = 3000; // meters
const CHART_MIN_COVERAGE = 500;   // meters — z18, pontoons still visible

// Tone the OSM palette to the theme: a softened light map by day, and by
// night a dark map (inverted, Tesla-style), red at night: a bright chart under
// a dark sky blinded the helmsman and made the HUD unreadable
const BASE_MAP_FILTERS = {
    day: 'brightness(0.72) saturate(1.15) contrast(1.05)',
    dark: 'invert(1) hue-rotate(180deg) brightness(0.82) saturate(0.7) contrast(0.92)',
    night: 'invert(1) brightness(0.55) sepia(1) hue-rotate(-38deg) saturate(2.4) contrast(0.95)',
};
// Server charts are real nautical charts: only dimmed, never inverted
const CHART_FILTERS = { day: 'none', dark: 'brightness(0.62)', night: 'brightness(0.4) sepia(1) hue-rotate(-38deg) saturate(2)' };
const SEAMARK_FILTERS = { day: 'none', dark: 'brightness(0.9)', night: 'sepia(1) hue-rotate(-38deg) saturate(2.4) brightness(0.7)' };

// The scene is linear "meters × aisLengthScalingFactor" (see AISContext), the
// camera far plane is 500 units, so only ~700 m around the boat is ever visible.

// ── Tile math ─────────────────────────────────────────────────────────────────

function lonToTileF(lon, zoom) {
    return ((lon + 180) / 360) * Math.pow(2, zoom);
}

function latToTileF(lat, zoom) {
    const latRad = (lat * Math.PI) / 180;
    return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom);
}

function buildTileUrl(template, z, x, y) {
    return template.replace('{z}', z).replace('{x}', x).replace('{y}', y);
}

function metersPerPixel(lat, zoom) {
    return (156543.03 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
}

/** Zoom so that CANVAS_SIZE pixels cover `coverageMeters` around the boat. */
function zoomForCoverage(coverageMeters, lat, maxZoom) {
    const target = coverageMeters / CANVAS_SIZE;
    const z = Math.log2((156543.03 * Math.cos((lat * Math.PI) / 180)) / target);
    return Math.max(3, Math.min(maxZoom, Math.round(z)));
}

// ── Tile image cache (module-level, survives re-renders) ──────────────────────

const tileCache = new Map();

function loadTile(url) {
    if (tileCache.has(url)) return tileCache.get(url);
    // Network or the offline cache (kept for sailing without internet)
    const promise = cachedImage(url).catch(() => null);
    tileCache.set(url, promise);
    return promise;
}

/**
 * Load a tile, falling back to an ancestor tile (up to 3 levels) when missing.
 * Returns {img, sx, sy, sSize} describing the source region to draw.
 */
async function loadTileWithFallback(template, z, x, y) {
    let img = await loadTile(buildTileUrl(template, z, x, y));
    if (img) return { img, sx: 0, sy: 0, sSize: TILE_SIZE };

    for (let up = 1; up <= 3 && z - up >= 1; up++) {
        const pz = z - up;
        const px = x >> up;
        const py = y >> up;
        img = await loadTile(buildTileUrl(template, pz, px, py));
        if (img) {
            const frac = TILE_SIZE / Math.pow(2, up);
            const sx = (x - (px << up)) * frac;
            const sy = (y - (py << up)) * frac;
            return { img, sx, sy, sSize: frac };
        }
    }
    return null;
}

// ── Canvas tile renderer ──────────────────────────────────────────────────────

/**
 * Draw one tile layer. `layerZoom` may be lower than the base zoom: the layer
 * is then drawn scaled up (pixelScale = 2^(baseZoom - layerZoom)) so that every
 * layer covers the same geographic area on the canvas.
 */
// Scratch canvas: a filtered layer is drawn unfiltered here, then filtered
// once onto the plane — per-tile filters cost ~2.5× the pixels (tiles overlap
// the canvas edges), a lot for a Pi drawing the dark chart in software
let scratchCanvas = null;

async function drawTileLayer(ctx, position, layerZoom, tileTemplate, pixelScale = 1, filter = 'none') {
    const { latitude: lat, longitude: lon } = position;
    const effTile = TILE_SIZE * pixelScale;
    const filtered = filter && filter !== 'none';
    const target = ctx;
    if (filtered) {
        if (!scratchCanvas) {
            scratchCanvas = document.createElement('canvas');
            scratchCanvas.width = CANVAS_SIZE;
            scratchCanvas.height = CANVAS_SIZE;
        }
        ctx = scratchCanvas.getContext('2d');
    }

    const ftx = lonToTileF(lon, layerZoom);
    const fty = latToTileF(lat, layerZoom);

    const centerPxX = ftx * effTile;
    const centerPxY = fty * effTile;

    const topLeftPxX = centerPxX - CANVAS_SIZE / 2;
    const topLeftPxY = centerPxY - CANVAS_SIZE / 2;

    const firstTileX = Math.floor(topLeftPxX / effTile);
    const firstTileY = Math.floor(topLeftPxY / effTile);
    const tilesNeeded = Math.ceil(CANVAS_SIZE / effTile) + 2;
    const maxTile = Math.pow(2, layerZoom);

    const tilesToDraw = [];
    for (let dy = 0; dy < tilesNeeded; dy++) {
        for (let dx = 0; dx < tilesNeeded; dx++) {
            const tileX = firstTileX + dx;
            const tileY = firstTileY + dy;
            if (tileY < 0 || tileY >= maxTile) continue;
            const wrappedX = ((tileX % maxTile) + maxTile) % maxTile;
            const screenLeft = Math.round(tileX * effTile - topLeftPxX);
            const screenTop  = Math.round(tileY * effTile - topLeftPxY);
            tilesToDraw.push({ z: layerZoom, x: wrappedX, y: tileY, screenLeft, screenTop });
        }
    }

    const sources = await Promise.all(
        tilesToDraw.map((t) => loadTileWithFallback(tileTemplate, t.z, t.x, t.y))
    );

    // From here on synchronous: two planes never interleave in the scratch canvas
    if (filtered) ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    for (let i = 0; i < tilesToDraw.length; i++) {
        const src = sources[i];
        if (!src) continue;
        const { screenLeft, screenTop } = tilesToDraw[i];
        ctx.drawImage(src.img, src.sx, src.sy, src.sSize, src.sSize, screenLeft, screenTop, effTile, effTile);
    }
    if (filtered) {
        target.filter = filter;
        target.drawImage(scratchCanvas, 0, 0);
        target.filter = 'none';
    }
}

// Render an ordered list of tile layers (base map first, overlays on top).
// Windy wind tiles are semi-transparent overlays, so the meteo mode draws an
// OSM base underneath them — otherwise the plane renders mostly black.
async function renderTilesToCanvas(canvas, position, zoom, layers) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    for (const layer of layers) {
        if (!layer?.template) continue;
        if (layer.maxBaseZoom != null && zoom > layer.maxBaseZoom) continue;
        const layerZoom = Math.min(zoom, layer.maxZoom ?? zoom);
        const pixelScale = Math.pow(2, zoom - layerZoom);
        await drawTileLayer(ctx, position, layerZoom, layer.template, pixelScale, layer.filter || 'none');
    }
}

// ── MapPlane3D component ──────────────────────────────────────────────────────

export default function MapPlane3D({ mode = 'chart', opacity = 1 }) {
    // North-up layer turned into the boat frame, like the AIS and wind layers
    const { heading } = useOwnTrack();
    const meshRef = useRef();
    const canvasRef = useRef(null);
    const textureRef = useRef(null);
    const renderPendingRef = useRef(false);
    const lastRenderRef = useRef({ position: null, zoom: null });
    const frameCountRef = useRef(0);
    // A translucent overlay (over the seabed) keeps the day colours: inverted,
    // the tidal-flat hatching turns into orange stripes over the relief
    const { id: currentTheme } = useTheme();
    const themeId = opacity < 1 ? 'day' : currentTheme;
    const baseFilter = BASE_MAP_FILTERS[themeId] || BASE_MAP_FILTERS.day;
    // Ordered tile layers (base map first, overlays on top), set per mode and theme below
    const layersRef = useRef([]);
    const { gl } = useThree();

    // Same meters → scene-units factor as the AIS layer, so the map is to scale
    const sceneScale = configService.get('aisLengthScalingFactor') || 0.7;

    // Zoom level adapts to the camera distance (LOD): harbor detail when close,
    // wide area when zoomed out.
    const [zoomLevel, setZoomLevel] = useState(16);
    const [planeRadius, setPlaneRadius] = useState(500);

    const skPosition = useSignalKPath('navigation.position');
    const positionRef = useRef(null);
    useEffect(() => { positionRef.current = skPosition; }, [skPosition]);

    const hasPosition = skPosition?.latitude != null && skPosition?.longitude != null;

    // ── Adaptive zoom from camera distance (checked ~4×/s) ───────────────────
    useFrame(({ camera }) => {
        frameCountRef.current++;
        if (frameCountRef.current % 15 !== 0) return;
        const position = positionRef.current;
        if (position?.latitude == null) return;

        const camDistMeters = camera.position.length() / sceneScale;
        // Canvas covers ~4× the camera distance: sharp under the camera, with margin.
        // Meteo keeps a wide fixed minimum so low-zoom wind/rain overlays are visible.
        const minCoverage = mode === 'meteo' ? METEO_MIN_COVERAGE : CHART_MIN_COVERAGE;
        const coverage = Math.min(Math.max(camDistMeters * 4, minCoverage), 60000);
        const baseMax = mode === 'meteo'
            ? METEO_MAX_ZOOM
            : (layersRef.current[0]?.template === OSM_TEMPLATE ? OSM_MAX_ZOOM : CUSTOM_MAX_ZOOM);
        const z = zoomForCoverage(coverage, position.latitude, baseMax);
        if (z !== zoomLevel) setZoomLevel(z);
    });

    // Set when a redraw is requested while one is in flight, so the latest
    // zoom/position is drawn as soon as the current one finishes (a static
    // boat at anchor sends no new position to trigger it otherwise).
    const redrawQueuedRef = useRef(false);
    const scheduleRedrawRef = useRef(null);

    const scheduleRedraw = useCallback((force = false) => {
        if (renderPendingRef.current) {
            redrawQueuedRef.current = true;
            return;
        }
        const position = positionRef.current;
        if (position?.latitude == null || position?.longitude == null) return;

        const last = lastRenderRef.current;
        if (!force && last.position && last.zoom === zoomLevel) {
            // Redraw once the boat has moved ~48 canvas pixels at current zoom
            const mpp = metersPerPixel(position.latitude, zoomLevel);
            const thresholdDeg = (mpp * 48) / 111320;
            const dLat = Math.abs(position.latitude - last.position.latitude);
            const dLon = Math.abs(position.longitude - last.position.longitude);
            if (dLat < thresholdDeg && dLon < thresholdDeg) return;
        }

        const canvas = canvasRef.current;
        const texture = textureRef.current;
        if (!canvas || !texture) return;

        renderPendingRef.current = true;
        lastRenderRef.current = { position, zoom: zoomLevel };

        // Exact physical size of the canvas at this zoom → plane size in scene units
        const widthMeters = CANVAS_SIZE * metersPerPixel(position.latitude, zoomLevel);

        renderTilesToCanvas(canvas, position, zoomLevel, layersRef.current)
            .then(() => {
                texture.needsUpdate = true;
                // Resize with the new texture, not before: the old image would
                // otherwise be stretched to the new zoom for a moment
                setPlaneRadius((widthMeters / 2) * sceneScale);
            })
            .catch((error) => console.warn('MapPlane3D: tile rendering failed:', error?.message || error))
            .finally(() => {
                renderPendingRef.current = false;
                if (redrawQueuedRef.current) {
                    redrawQueuedRef.current = false;
                    scheduleRedrawRef.current?.();
                }
            });
    }, [zoomLevel, sceneScale]);

    useEffect(() => { scheduleRedrawRef.current = scheduleRedraw; }, [scheduleRedraw]);

    useEffect(() => {
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_SIZE;
        canvas.height = CANVAS_SIZE;
        canvasRef.current = canvas;

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = gl.capabilities.getMaxAnisotropy();
        texture.generateMipmaps = true;
        textureRef.current = texture;

        if (meshRef.current) {
            meshRef.current.material.map = texture;
            meshRef.current.material.needsUpdate = true;
        }

        return () => {
            texture.dispose();
        };
    }, [gl]);

    // ── Resolve tile layers (SignalK charts for chart mode, OSM fallback) ────
    // Once per mode: depending on the zoom-bound redraw callback re-fetched
    // the chart list (and in meteo dropped then re-added the rain radar,
    // a visible flash) at every LOD step while zooming
    useEffect(() => {
        let cancelled = false;
        const redraw = () => { if (!cancelled) scheduleRedrawRef.current?.(true); };
        // OSM (and seamarks) in the theme's colours until a server chart is found
        const defaults = [
            { template: OSM_TEMPLATE, maxZoom: OSM_MAX_ZOOM, filter: baseFilter },
            ...(mode === 'meteo' ? [] : [{ template: SEAMARK_TEMPLATE, maxZoom: SEAMARK_MAX_ZOOM, filter: SEAMARK_FILTERS[themeId] }]),
        ];
        layersRef.current = defaults;
        if (mode === 'meteo') {
            redraw();
            // Add the latest rain radar frame (free, no API key)
            fetch(RAINVIEWER_INDEX)
                .then((r) => r.json())
                .then((data) => {
                    const frames = data?.radar?.past;
                    const path = frames?.[frames.length - 1]?.path;
                    if (!path || cancelled) return;
                    layersRef.current = [
                        ...layersRef.current,
                        { template: `https://tilecache.rainviewer.com${path}/256/{z}/{x}/{y}/2/1_1.png`, maxZoom: RAIN_MAX_ZOOM, maxBaseZoom: RAIN_MAX_BASE_ZOOM },
                    ];
                    redraw();
                })
                .catch(() => { /* no radar overlay */ });
            return () => { cancelled = true; };
        }

        // Through the service: authenticated servers and request timeout
        signalKService.apiCall('/signalk/v1/api/resources/charts')
            .then((data) => {
                if (cancelled || !data || typeof data !== 'object') return;
                const entries = Object.values(data);
                const chart =
                    entries.find((c) => c.identifier !== 'openstreetmap' && c.tilemapUrl) ||
                    entries.find((c) => c.tilemapUrl);
                if (chart?.tilemapUrl) {
                    const url = chart.tilemapUrl.includes('{z}')
                        ? chart.tilemapUrl
                        : `${chart.tilemapUrl}/{z}/{x}/{y}.png`;
                    layersRef.current = [{ template: url, maxZoom: CUSTOM_MAX_ZOOM, filter: CHART_FILTERS[themeId] }];
                }
                redraw();
            })
            .catch(() => {
                if (cancelled) return;
                layersRef.current = defaults;
                redraw();
            });
        return () => { cancelled = true; };
    }, [mode, themeId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Redraw when position moves past threshold or the LOD zoom changes
    useEffect(() => {
        scheduleRedraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skPosition, mode, zoomLevel]);

    useEffect(() => {
        if (meshRef.current && textureRef.current) {
            meshRef.current.material.map = textureRef.current;
            meshRef.current.material.needsUpdate = true;
        }
    });

    // Unit plane scaled to the canvas footprint: resizing on every zoom change
    // no longer allocates (and leaks) a new geometry. UVs map 1:1 to the canvas.
    const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

    // Pushed back in depth by a few depth-buffer steps: the wind sheet, the
    // wake and the route lie only centimetres above the chart, less than the
    // depth precision far from the camera, and would flicker through it
    const material = useMemo(() => new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: opacity < 1,
        opacity,
        depthWrite: opacity >= 1,
        polygonOffset: true,
        polygonOffsetFactor: 2,
        polygonOffsetUnits: 8,
    }), [opacity]);

    useEffect(() => () => {
        geometry.dispose();
        material.dispose();
    }, [geometry, material]);

    if (!hasPosition) {
        return null;
    }

    return (
        <group rotation={[0, heading, 0]}>
            <mesh
                ref={meshRef}
                geometry={geometry}
                material={material}
                rotation={[-Math.PI / 2, 0, 0]} // North is -Z in the north-up layer
                position={[0, -0.1, 0]}
                scale={[planeRadius * 2, planeRadius * 2, 1]}
            />
        </group>
    );
}
