'use client';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useSignalKPath } from '../../hooks/useSignalK';
import configService from '../../settings/ConfigService';

// ── Tile math ────────────────────────────────────────────────────────────────

const TILE_SIZE = 256;
const OSM_TEMPLATE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_POSITION = { latitude: 46.1591, longitude: -1.1522 };
const DEFAULT_ZOOM = 13;
const MIN_ZOOM = 3;
const MAX_ZOOM = 18;

/** Longitude → fractional tile X */
function lonToTileF(lon, zoom) {
    return ((lon + 180) / 360) * Math.pow(2, zoom);
}

/** Latitude → fractional tile Y */
function latToTileF(lat, zoom) {
    const latRad = (lat * Math.PI) / 180;
    return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom);
}

function buildTileUrl(template, z, x, y) {
    return template.replace('{z}', z).replace('{x}', x).replace('{y}', y);
}

// ── ChartMap ─────────────────────────────────────────────────────────────────

export default function ChartMap() {
    const containerRef = useRef(null);
    const [size, setSize] = useState({ width: 800, height: 600 });
    const [zoom, setZoom] = useState(DEFAULT_ZOOM);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [tileTemplate, setTileTemplate] = useState(OSM_TEMPLATE);
    const [attribution, setAttribution] = useState('© OpenStreetMap contributors');
    const dragRef = useRef(null);

    // ── Container size via ResizeObserver ────────────────────────────────────
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setSize({ width, height });
        });
        ro.observe(el);
        setSize({ width: el.clientWidth, height: el.clientHeight });
        return () => ro.disconnect();
    }, []);

    // ── SignalK data ─────────────────────────────────────────────────────────
    const skPosition = useSignalKPath('navigation.position');
    const skHeading = useSignalKPath('navigation.courseOverGroundTrue');

    const position = useMemo(() => {
        if (skPosition?.latitude != null && skPosition?.longitude != null) return skPosition;
        return DEFAULT_POSITION;
    }, [skPosition]);

    const headingDeg = skHeading != null ? (skHeading * 180) / Math.PI : 0;

    // ── Load SignalK charts, fall back to OSM ────────────────────────────────
    useEffect(() => {
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
                    setTileTemplate(url);
                    setAttribution(chart.name || chart.identifier || 'SignalK Chart');
                }
            })
            .catch(() => { /* keep OSM */ });
    }, []);

    // ── Zoom ─────────────────────────────────────────────────────────────────
    const zoomIn  = useCallback(() => { setZoom((z) => Math.min(z + 1, MAX_ZOOM)); setPanOffset({ x: 0, y: 0 }); }, []);
    const zoomOut = useCallback(() => { setZoom((z) => Math.max(z - 1, MIN_ZOOM)); setPanOffset({ x: 0, y: 0 }); }, []);

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        setPanOffset({ x: 0, y: 0 });
        setZoom((z) => e.deltaY < 0 ? Math.min(z + 1, MAX_ZOOM) : Math.max(z - 1, MIN_ZOOM));
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    // ── Pan (drag) ───────────────────────────────────────────────────────────
    const handlePointerDown = useCallback((e) => {
        dragRef.current = { startX: e.clientX, startY: e.clientY, panX: panOffset.x, panY: panOffset.y };
        e.currentTarget.setPointerCapture(e.pointerId);
    }, [panOffset]);

    const handlePointerMove = useCallback((e) => {
        if (!dragRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPanOffset({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy });
    }, []);

    const handlePointerUp = useCallback(() => { dragRef.current = null; }, []);

    // ── Tile grid ────────────────────────────────────────────────────────────
    const { tiles, boatX, boatY } = useMemo(() => {
        const { width, height } = size;
        const { latitude: lat, longitude: lon } = position;

        // Fractional tile coords of boat
        const ftx = lonToTileF(lon, zoom);
        const fty = latToTileF(lat, zoom);

        // Pixel position of boat in the infinite tile plane
        const boatPxX = ftx * TILE_SIZE;
        const boatPxY = fty * TILE_SIZE;

        // Container center in tile-plane pixels (boat is at center + pan)
        const centerPxX = boatPxX - panOffset.x;
        const centerPxY = boatPxY - panOffset.y;

        // Top-left corner of the visible area in tile-plane pixels
        const topLeftPxX = centerPxX - width / 2;
        const topLeftPxY = centerPxY - height / 2;

        // First tile indices
        const firstTileX = Math.floor(topLeftPxX / TILE_SIZE);
        const firstTileY = Math.floor(topLeftPxY / TILE_SIZE);

        const tilesX = Math.ceil(width  / TILE_SIZE) + 2;
        const tilesY = Math.ceil(height / TILE_SIZE) + 2;

        const maxTile = Math.pow(2, zoom);
        const result = [];

        for (let dy = 0; dy < tilesY; dy++) {
            for (let dx = 0; dx < tilesX; dx++) {
                const tileX = firstTileX + dx;
                const tileY = firstTileY + dy;
                if (tileY < 0 || tileY >= maxTile) continue;
                const wrappedX = ((tileX % maxTile) + maxTile) % maxTile;

                // Screen position of this tile's top-left corner
                const screenLeft = tileX * TILE_SIZE - topLeftPxX;
                const screenTop  = tileY * TILE_SIZE - topLeftPxY;

                result.push({
                    key: `${zoom}-${wrappedX}-${tileY}-${dx}-${dy}`,
                    url: buildTileUrl(tileTemplate, zoom, wrappedX, tileY),
                    left: Math.round(screenLeft),
                    top:  Math.round(screenTop),
                });
            }
        }

        // Boat screen position
        const boatScreenX = boatPxX - topLeftPxX;
        const boatScreenY = boatPxY - topLeftPxY;

        return { tiles: result, boatX: Math.round(boatScreenX), boatY: Math.round(boatScreenY) };
    }, [size, position, zoom, panOffset, tileTemplate]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative overflow-hidden bg-[#aad3df]"
            style={{ cursor: dragRef.current ? 'grabbing' : 'grab', touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {/* Tile layer */}
            <div className="absolute inset-0" style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {tiles.map((tile) => (
                    <img
                        key={tile.key}
                        src={tile.url}
                        alt=""
                        draggable={false}
                        crossOrigin="anonymous"
                        style={{
                            position: 'absolute',
                            left: tile.left,
                            top: tile.top,
                            width: TILE_SIZE,
                            height: TILE_SIZE,
                        }}
                    />
                ))}
            </div>

            {/* Boat marker — always at screen center when pan = 0 */}
            <div
                className="absolute pointer-events-none"
                style={{ left: boatX, top: boatY, transform: 'translate(-50%, -50%)', zIndex: 10 }}
            >
                <svg
                    width="28"
                    height="28"
                    viewBox="0 0 32 32"
                    style={{
                        transform: `rotate(${headingDeg}deg)`,
                        filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.7))',
                    }}
                >
                    <polygon points="16,2 22,28 16,24 10,28" fill="#09bfff" stroke="#fff" strokeWidth="1.5" />
                </svg>
            </div>

            {/* Zoom controls */}
            <div className="absolute right-3 bottom-10 z-20 flex flex-col gap-1" style={{ pointerEvents: 'all' }}>
                <button
                    onClick={zoomIn}
                    className="w-8 h-8 bg-hud-elevated text-hud-main rounded-lg text-lg font-bold flex items-center justify-center shadow-soft tesla-hover"
                    title="Zoom in"
                >+</button>
                <button
                    onClick={zoomOut}
                    className="w-8 h-8 bg-hud-elevated text-hud-main rounded-lg text-lg font-bold flex items-center justify-center shadow-soft tesla-hover"
                    title="Zoom out"
                >−</button>
            </div>

            {/* Re-center button (shown when panned) */}
            {(panOffset.x !== 0 || panOffset.y !== 0) && (
                <button
                    onClick={() => setPanOffset({ x: 0, y: 0 })}
                    className="absolute right-3 bottom-28 z-20 w-8 h-8 bg-hud-elevated text-oBlue rounded-lg text-xs font-bold flex items-center justify-center shadow-soft tesla-hover"
                    style={{ pointerEvents: 'all' }}
                    title="Re-center on boat"
                >⊙</button>
            )}

            {/* Zoom level */}
            <div className="absolute right-3 bottom-2 z-20 text-[10px] text-hud-muted font-mono" style={{ pointerEvents: 'none' }}>
                z{zoom}
            </div>

            {/* Attribution */}
            <div className="absolute bottom-0 left-0 z-20 text-[9px] text-gray-700 bg-white/75 px-1 rounded-tr" style={{ pointerEvents: 'none' }}>
                {attribution}
            </div>
        </div>
    );
}
