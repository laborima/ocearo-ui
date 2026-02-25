import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';

// ── Constants ─────────────────────────────────────────────────────────────────

const AIS_MAX_METERS = 5000;
const AIS_SCALING_FACTOR = 0.7;
const CANVAS_SIZE = 1024; // texture resolution
const TILE_SIZE = 256;    // OSM tile pixel size

const OSM_TEMPLATE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const WINDY_TEMPLATE = 'https://tiles.windy.com/tiles/v10.0/wind/{z}/{x}/{y}.png';

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

function computeZoom(radiusMeters, lat) {
    const metersPerPixelTarget = (radiusMeters * 2) / CANVAS_SIZE;
    const z = Math.log2((156543.03 * Math.cos((lat * Math.PI) / 180)) / metersPerPixelTarget);
    return Math.max(1, Math.min(18, Math.round(z)));
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

// ── Canvas tile renderer ──────────────────────────────────────────────────────

async function renderTilesToCanvas(canvas, position, zoom, tileTemplate) {
    const ctx = canvas.getContext('2d');
    const { latitude: lat, longitude: lon } = position;

    const ftx = lonToTileF(lon, zoom);
    const fty = latToTileF(lat, zoom);

    const centerPxX = ftx * TILE_SIZE;
    const centerPxY = fty * TILE_SIZE;

    const topLeftPxX = centerPxX - CANVAS_SIZE / 2;
    const topLeftPxY = centerPxY - CANVAS_SIZE / 2;

    const firstTileX = Math.floor(topLeftPxX / TILE_SIZE);
    const firstTileY = Math.floor(topLeftPxY / TILE_SIZE);
    const tilesNeeded = Math.ceil(CANVAS_SIZE / TILE_SIZE) + 2;
    const maxTile = Math.pow(2, zoom);

    const tilesToDraw = [];
    for (let dy = 0; dy < tilesNeeded; dy++) {
        for (let dx = 0; dx < tilesNeeded; dx++) {
            const tileX = firstTileX + dx;
            const tileY = firstTileY + dy;
            if (tileY < 0 || tileY >= maxTile) continue;
            const wrappedX = ((tileX % maxTile) + maxTile) % maxTile;
            const screenLeft = Math.round(tileX * TILE_SIZE - topLeftPxX);
            const screenTop  = Math.round(tileY * TILE_SIZE - topLeftPxY);
            const url = buildTileUrl(tileTemplate, zoom, wrappedX, tileY);
            tilesToDraw.push({ url, screenLeft, screenTop });
        }
    }

    const images = await Promise.all(tilesToDraw.map((t) => loadTile(t.url)));

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    for (let i = 0; i < tilesToDraw.length; i++) {
        const img = images[i];
        if (!img) continue;
        const { screenLeft, screenTop } = tilesToDraw[i];
        ctx.drawImage(img, screenLeft, screenTop, TILE_SIZE, TILE_SIZE);
    }
}

// ── MapPlane3D component ──────────────────────────────────────────────────────

export default function MapPlane3D({ mode = 'chart' }) {
    const meshRef = useRef();
    const canvasRef = useRef(null);
    const textureRef = useRef(null);
    const renderPendingRef = useRef(false);
    const lastPositionRef = useRef(null);
    const tileTemplateRef = useRef(mode === 'meteo' ? WINDY_TEMPLATE : OSM_TEMPLATE);
    const { gl } = useThree();

    // The size of the geometry will dynamically match the actual canvas spatial coverage
    const [planeRadius, setPlaneRadius] = useState(AIS_MAX_METERS * AIS_SCALING_FACTOR);

    const skPosition = useSignalKPath('navigation.position');

    const hasPosition = skPosition?.latitude != null && skPosition?.longitude != null;

    const scheduleRedraw = useCallback(() => {
        if (renderPendingRef.current) return;
        if (skPosition?.latitude == null || skPosition?.longitude == null) return;
        const position = skPosition;

        const last = lastPositionRef.current;
        if (last) {
            const dLat = Math.abs(position.latitude - last.latitude);
            const dLon = Math.abs(position.longitude - last.longitude);
            if (dLat < 0.0005 && dLon < 0.0005) return; // Only redraw if moved ~50m
        }

        renderPendingRef.current = true;
        lastPositionRef.current = position;

        const canvas = canvasRef.current;
        const texture = textureRef.current;
        if (!canvas || !texture) {
            renderPendingRef.current = false;
            return;
        }

        const zoom = computeZoom(AIS_MAX_METERS, position.latitude);

        // Calculate EXACT physical size of the canvas at this zoom level to prevent stretching/deformation
        const actualMetersPerPixel = (156543.03 * Math.cos((position.latitude * Math.PI) / 180)) / Math.pow(2, zoom);
        const actualWidthMeters = CANVAS_SIZE * actualMetersPerPixel;
        const newPlaneRadius = (actualWidthMeters / 2) * AIS_SCALING_FACTOR;

        setPlaneRadius(newPlaneRadius);

        renderTilesToCanvas(canvas, position, zoom, tileTemplateRef.current).then(() => {
            texture.needsUpdate = true;
            renderPendingRef.current = false;
        });
    }, [skPosition]);

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

    useEffect(() => {
        if (mode === 'meteo') {
            tileTemplateRef.current = WINDY_TEMPLATE;
            scheduleRedraw();
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
                    tileTemplateRef.current = url;
                }
                scheduleRedraw();
            })
            .catch(() => {
                tileTemplateRef.current = OSM_TEMPLATE;
                scheduleRedraw();
            });
    }, [mode, scheduleRedraw]);

    useEffect(() => {
        scheduleRedraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skPosition, mode]);

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
