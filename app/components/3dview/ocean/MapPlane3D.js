import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';

// ── Constants ─────────────────────────────────────────────────────────────────

const CANVAS_SIZE = 1024; // texture resolution
const TILE_SIZE = 256;    // OSM tile pixel size

const OSM_TEMPLATE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const WINDY_TEMPLATE = 'https://tiles.windy.com/tiles/v10.0/wind/{z}/{x}/{y}.png';

const OSM_MAX_ZOOM = 19;     // OSM serves up to z19 — pontoons/piers appear from z17
const CUSTOM_MAX_ZOOM = 18;  // safe cap for SignalK-provided charts (unknown max)
const WINDY_MAX_ZOOM = 11;   // windy wind tiles are low-zoom only

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
    const promise = new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
    });
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
async function drawTileLayer(ctx, position, layerZoom, tileTemplate, pixelScale = 1) {
    const { latitude: lat, longitude: lon } = position;
    const effTile = TILE_SIZE * pixelScale;

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

    for (let i = 0; i < tilesToDraw.length; i++) {
        const src = sources[i];
        if (!src) continue;
        const { screenLeft, screenTop } = tilesToDraw[i];
        ctx.drawImage(src.img, src.sx, src.sy, src.sSize, src.sSize, screenLeft, screenTop, effTile, effTile);
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
        const layerZoom = Math.min(zoom, layer.maxZoom ?? zoom);
        const pixelScale = Math.pow(2, zoom - layerZoom);
        await drawTileLayer(ctx, position, layerZoom, layer.template, pixelScale);
    }
}

// ── MapPlane3D component ──────────────────────────────────────────────────────

export default function MapPlane3D({ mode = 'chart' }) {
    const meshRef = useRef();
    const canvasRef = useRef(null);
    const textureRef = useRef(null);
    const renderPendingRef = useRef(false);
    const lastRenderRef = useRef({ position: null, zoom: null });
    const frameCountRef = useRef(0);
    // Ordered tile layers: base map first, optional overlays on top
    const layersRef = useRef(
        mode === 'meteo'
            ? [{ template: OSM_TEMPLATE, maxZoom: OSM_MAX_ZOOM }, { template: WINDY_TEMPLATE, maxZoom: WINDY_MAX_ZOOM }]
            : [{ template: OSM_TEMPLATE, maxZoom: OSM_MAX_ZOOM }]
    );
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
        // Canvas covers ~4× the camera distance: sharp under the camera, with margin
        const coverage = Math.min(Math.max(camDistMeters * 4, 250), 12000);
        const baseMax = layersRef.current[0]?.template === OSM_TEMPLATE ? OSM_MAX_ZOOM : CUSTOM_MAX_ZOOM;
        const z = zoomForCoverage(coverage, position.latitude, baseMax);
        if (z !== zoomLevel) setZoomLevel(z);
    });

    const scheduleRedraw = useCallback((force = false) => {
        if (renderPendingRef.current) return;
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
        setPlaneRadius((widthMeters / 2) * sceneScale);

        renderTilesToCanvas(canvas, position, zoomLevel, layersRef.current).then(() => {
            texture.needsUpdate = true;
            renderPendingRef.current = false;
        });
    }, [zoomLevel, sceneScale]);

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
    useEffect(() => {
        if (mode === 'meteo') {
            layersRef.current = [
                { template: OSM_TEMPLATE, maxZoom: OSM_MAX_ZOOM },
                { template: WINDY_TEMPLATE, maxZoom: WINDY_MAX_ZOOM },
            ];
            scheduleRedraw(true);
            return;
        }

        const config = configService.getAll();
        const signalkUrl = config.signalkUrl || 'http://localhost:3000';
        fetch(`${signalkUrl}/signalk/v1/api/resources/charts`)
            .then((r) => r.json())
            .then((data) => {
                if (!data || typeof data !== 'object') return;
                const entries = Object.values(data);
                const chart =
                    entries.find((c) => c.identifier !== 'openstreetmap' && c.tilemapUrl) ||
                    entries.find((c) => c.tilemapUrl);
                if (chart?.tilemapUrl) {
                    const url = chart.tilemapUrl.includes('{z}')
                        ? chart.tilemapUrl
                        : `${chart.tilemapUrl}/{z}/{x}/{y}.png`;
                    layersRef.current = [{ template: url, maxZoom: CUSTOM_MAX_ZOOM }];
                }
                scheduleRedraw(true);
            })
            .catch(() => {
                layersRef.current = [{ template: OSM_TEMPLATE, maxZoom: OSM_MAX_ZOOM }];
                scheduleRedraw(true);
            });
    }, [mode, scheduleRedraw]);

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

    // Use PlaneGeometry to avoid 'arrondie' deformation, UVs map 1:1 to canvas
    const geometry = useMemo(() => new THREE.PlaneGeometry(planeRadius * 2, planeRadius * 2), [planeRadius]);

    const material = useMemo(() => new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: false,
    }), []);

    if (!hasPosition) {
        return null;
    }

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            material={material}
            rotation={[-Math.PI / 2, 0, 0]} // Fixed rotation, North is -Z
            position={[0, -0.1, 0]}
        />
    );
}
