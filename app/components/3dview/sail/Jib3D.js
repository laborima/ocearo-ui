/**
 * Jib3D Component - 3D visualization of a jib/genoa sail attached to the forestay.
 *
 * The jib is a triangular sail whose luff (leading edge) follows the forestay
 * wire from the bow deck (tack) up to the masthead (head). The leech (trailing
 * edge) runs from the head down to the clew. The foot runs from the tack to
 * the clew along the deck.
 *
 * The geometry is subdivided into horizontal levels. Each level has vertices
 * distributed from the luff point (on the forestay) outward to the leech.
 * Camber is applied as lateral displacement perpendicular to the sail chord.
 * Wind angle rotates the sail around the forestay/luff axis.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useSignalKPath } from '../../hooks/useSignalK';

// Forestay anchor points in boat-local coordinates (Y up, Z forward/negative = bow)
// Tack: where the jib attaches at the bow — near the waterline
const TACK = new THREE.Vector3(0, 0.7, -6.2);
// Head: where the jib halyard meets the top of the forestay (near masthead)
const HEAD = new THREE.Vector3(0, 10.0, -1.05);
// Clew: the aft-lower corner of the jib where the sheets attach
const CLEW_BASE = new THREE.Vector3(0, 0.9, -2.0);

// Subdivision parameters
const JIB_LEVELS = 30;
const JIB_SEGMENTS_PER_LEVEL = 8;

/**
 * Jib3D Component
 *
 * @param {Object} props
 * @param {number} props.jibCar - Jib car position (0 forward, 1 aft) controls sheet angle
 * @param {number} props.camber - Camber/fullness ratio (0 flat, 1 maximum draft)
 * @param {number} props.twist - Twist angle in radians (leech opens at the top)
 */
const Jib3D = ({
    jibCar = 0.5,
    camber = 0.8,
    twist = 0.0,
}) => {
    const appWindAngle = useSignalKPath('environment.wind.angleApparent', 0);
    const appWindSpeed = useSignalKPath('environment.wind.speedApparent', 0);

    const meshRef = useRef();
    const flatPositionsRef = useRef(null);

    /**
     * Builds the flat (uncambered) jib geometry.
     *
     * For each horizontal level t (0 = tack/foot, 1 = head):
     *   - luffPoint = lerp(TACK, HEAD, t) — point on the forestay
     *   - clewPoint = lerp(CLEW_BASE, HEAD, t) — point on the leech
     *   - Vertices are distributed from luffPoint to clewPoint
     *
     * This creates a proper triangular sail that converges to the head.
     */
    const jibGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];

        for (let level = 0; level <= JIB_LEVELS; level++) {
            const t = level / JIB_LEVELS;

            // Luff point on the forestay
            const lx = TACK.x + (HEAD.x - TACK.x) * t;
            const ly = TACK.y + (HEAD.y - TACK.y) * t;
            const lz = TACK.z + (HEAD.z - TACK.z) * t;

            // Leech/clew point — converges toward head at the top
            const cx = CLEW_BASE.x + (HEAD.x - CLEW_BASE.x) * t;
            const cy = CLEW_BASE.y + (HEAD.y - CLEW_BASE.y) * t;
            const cz = CLEW_BASE.z + (HEAD.z - CLEW_BASE.z) * t;

            for (let seg = 0; seg <= JIB_SEGMENTS_PER_LEVEL; seg++) {
                const s = seg / JIB_SEGMENTS_PER_LEVEL;

                // Interpolate from luff to leech
                positions.push(
                    lx + (cx - lx) * s,
                    ly + (cy - ly) * s,
                    lz + (cz - lz) * s
                );

                colors.push(0.35, 0.38, 0.42);
            }
        }

        // Build triangle indices
        const indices = [];
        const vertsPerLevel = JIB_SEGMENTS_PER_LEVEL + 1;
        for (let level = 0; level < JIB_LEVELS; level++) {
            for (let seg = 0; seg < JIB_SEGMENTS_PER_LEVEL; seg++) {
                const i = level * vertsPerLevel + seg;
                const iNext = i + vertsPerLevel;
                indices.push(i, i + 1, iNext);
                indices.push(i + 1, iNext + 1, iNext);
            }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
    }, []);

    /**
     * Updates jib vertices to apply camber (belly) and wind-angle rotation.
     *
     * Camber is applied as lateral (X-axis) displacement using a sine curve
     * across the chord, scaled by the camber parameter and decreasing toward
     * the head. Wind angle rotates each level's vertices around the luff point
     * on the Y axis, with twist increasing toward the top.
     */
    useEffect(() => {
        if (!meshRef.current) return;

        const geo = meshRef.current.geometry;
        const posAttr = geo.attributes.position;
        const positions = posAttr.array;

        // Store flat positions on first run
        if (!flatPositionsRef.current) {
            flatPositionsRef.current = new Float32Array(positions);
        }
        const flat = flatPositionsRef.current;

        // Normalize wind angle
        let normalizedAngle = appWindAngle;
        while (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
        while (normalizedAngle >= 2 * Math.PI) normalizedAngle -= 2 * Math.PI;

        const isWindFromLeft = normalizedAngle > Math.PI;
        const dirFact = isWindFromLeft ? -1.0 : 1.0;

        let windAngle = normalizedAngle;
        if (windAngle > Math.PI) {
            windAngle = 2 * Math.PI - windAngle;
        }

        // Jib sheet angle based on wind and car position
        const sheetAngle = Math.max(0, Math.min(Math.PI / 2,
            windAngle * 0.6 - jibCar * 0.3
        ));

        const vertsPerLevel = JIB_SEGMENTS_PER_LEVEL + 1;
        const luffAxis = new THREE.Vector3(0, 1, 0);

        for (let level = 0; level <= JIB_LEVELS; level++) {
            const t = level / JIB_LEVELS;

            // Luff point on the forestay for this level
            const luffX = TACK.x + (HEAD.x - TACK.x) * t;
            const luffY = TACK.y + (HEAD.y - TACK.y) * t;
            const luffZ = TACK.z + (HEAD.z - TACK.z) * t;

            // Twist increases toward the top
            const levelTwist = twist * t;
            const rotAngle = (sheetAngle + levelTwist) * dirFact;

            // Camber decreases toward the head (triangle gets narrower)
            const camberScale = camber * 0.8 * (1.0 - t * 0.7);

            for (let seg = 0; seg <= JIB_SEGMENTS_PER_LEVEL; seg++) {
                const idx = (level * vertsPerLevel + seg) * 3;
                const s = seg / JIB_SEGMENTS_PER_LEVEL;

                // Start from flat position
                let px = flat[idx];
                let py = flat[idx + 1];
                let pz = flat[idx + 2];

                // Apply camber: sine-curve lateral displacement
                const camberDisp = Math.sin(s * Math.PI) * camberScale;
                px += camberDisp * dirFact;

                // Rotate around the luff point (forestay) on Y axis
                const dx = px - luffX;
                const dz = pz - luffZ;
                const cosA = Math.cos(rotAngle);
                const sinA = Math.sin(rotAngle);
                px = luffX + dx * cosA - dz * sinA;
                pz = luffZ + dx * sinA + dz * cosA;

                positions[idx] = px;
                positions[idx + 1] = py;
                positions[idx + 2] = pz;
            }
        }

        posAttr.needsUpdate = true;
        geo.computeVertexNormals();
    }, [appWindAngle, appWindSpeed, jibCar, camber, twist]);

    return (
        <mesh ref={meshRef}>
            <bufferGeometry {...jibGeometry} />
            <meshBasicMaterial
                vertexColors
                transparent
                opacity={0.4}
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
    );
};

export default Jib3D;
