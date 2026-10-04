import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import useTheme from '../../theme/useTheme';
import configService from '../../settings/ConfigService';
import usePolarPerformance from '../../hooks/usePolarPerformance';
import useOwnTrack from './useOwnTrack';

// One sample per second over ~6 minutes, or until the wake is this long
const SAMPLE_MS = 1000;
const MAX_SAMPLES = 360;
const MAX_LENGTH_M = 900;
const WIDTH = 0.9;          // half-width in scene units
const MIN_STEP_M = 0.5;     // ignore GPS jitter when stopped

// Polar thresholds: red under 80 %, yellow 80–95 %, green above
const BAD_BELOW = 0.8;
const GOOD_ABOVE = 0.95;

const colorFor = (ratio, palette, out) => {
    if (!Number.isFinite(ratio)) return out.copy(palette.foam);
    if (ratio < BAD_BELOW) return out.copy(palette.bad);
    if (ratio < GOOD_ABOVE) return out.copy(palette.fair);
    return out.copy(palette.good);
};

/**
 * Performance wake: the track actually sailed, coloured by the share of the
 * polar speed reached at each moment, so lost speed shows at a glance. Drawn
 * in the north-up layer, anchored to the sea, fading with age.
 */
const PerformanceWake = ({ y = -0.25 }) => {
    const { scene } = useTheme();
    const { heading, offset } = useOwnTrack();
    const { ratio } = usePolarPerformance();
    const samplesRef = useRef([]);   // { x, y (m, East/North), ratio }
    const lastSampleRef = useRef(0);
    const scale = configService.get('aisLengthScalingFactor') || 0.7;

    const palette = useMemo(() => ({
        good: new THREE.Color(scene.wakeGood),
        fair: new THREE.Color(scene.wakeFair),
        bad: new THREE.Color(scene.wakeBad),
        foam: new THREE.Color(scene.wakeFoam),
    }), [scene]);

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_SAMPLES * 2 * 3), 3));
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_SAMPLES * 2 * 4), 4));
        const index = [];
        for (let i = 0; i < MAX_SAMPLES - 1; i++) {
            const a = i * 2;
            index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
        geo.setIndex(index);
        geo.setDrawRange(0, 0);
        return geo;
    }, []);

    const material = useMemo(() => new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
    }), []);

    useEffect(() => () => {
        geometry.dispose();
        material.dispose();
    }, [geometry, material]);

    // Record a sample when we have moved, at most once a second
    useEffect(() => {
        const now = Date.now();
        const samples = samplesRef.current;
        const last = samples[samples.length - 1];
        if (now - lastSampleRef.current < SAMPLE_MS) return;
        if (last && Math.hypot(offset.x - last.x, offset.y - last.y) < MIN_STEP_M) return;
        lastSampleRef.current = now;
        // A momentary gap in the polar ratio (data still arriving) would leave
        // a grey patch in the wake for minutes: carry the last known value over
        const known = Number.isFinite(ratio) ? ratio : last?.ratio;
        samples.push({ x: offset.x, y: offset.y, ratio: known });

        // Trim by count and by length
        while (samples.length > MAX_SAMPLES) samples.shift();
        let length = 0;
        for (let i = samples.length - 1; i > 0; i--) {
            length += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y);
            if (length > MAX_LENGTH_M) {
                samples.splice(0, i - 1);
                break;
            }
        }
    }, [offset, ratio]);

    // Rebuild the ribbon relative to where we are now (≈1 Hz, a few hundred vertices)
    useEffect(() => {
        const samples = samplesRef.current;
        const pos = geometry.attributes.position.array;
        const col = geometry.attributes.color.array;
        const c = new THREE.Color();
        // The wake starts at the stern, now
        const lastRatio = samples[samples.length - 1]?.ratio;
        const points = [...samples, { x: offset.x, y: offset.y, ratio: Number.isFinite(ratio) ? ratio : lastRatio }];
        const n = Math.min(points.length, MAX_SAMPLES);
        const first = points.length - n;
        const anyKnown = points.some(q => Number.isFinite(q.ratio));

        for (let k = 0; k < n; k++) {
            const p = points[first + k];
            const prev = points[Math.max(first, first + k - 1)];
            const next = points[Math.min(points.length - 1, first + k + 1)];
            // Direction of travel (East/North), then its normal
            let dx = next.x - prev.x;
            let dy = next.y - prev.y;
            const len = Math.hypot(dx, dy) || 1;
            dx /= len; dy /= len;
            // Scene coordinates of the north-up layer: x = East, z = -North
            const sx = (p.x - offset.x) * scale;
            const sz = -(p.y - offset.y) * scale;
            const nx = -dy * WIDTH;
            const nz = -dx * WIDTH;
            pos.set([sx + nx, 0, sz + nz, sx - nx, 0, sz - nz], k * 6);

            // Older = more transparent; the newest end blends into the hull
            const age = 1 - k / Math.max(1, n - 1);
            // Before the first polar value the colour is unknown: leave that
            // stretch out rather than paint it grey (boats without polars,
            // where nothing is ever known, keep a neutral wake)
            const unknown = !Number.isFinite(p.ratio) && anyKnown;
            const alpha = unknown ? 0 : 0.5 * (1 - age) ** 0.7;
            colorFor(p.ratio, palette, c);
            col.set([c.r, c.g, c.b, alpha, c.r, c.g, c.b, alpha], k * 8);
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;
        geometry.setDrawRange(0, Math.max(0, (n - 1) * 6));
        geometry.computeBoundingSphere();
    }, [geometry, offset, ratio, palette, scale]);

    return (
        <group rotation={[0, heading, 0]} position={[0, y, 0]}>
            <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={1} />
        </group>
    );
};

export default PerformanceWake;
