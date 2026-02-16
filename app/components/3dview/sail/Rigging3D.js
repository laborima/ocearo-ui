/**
 * Rigging3D Component - Renders control lines (backstay, boom vang, cunningham, outhaul)
 * with dynamic tension-based coloring derived from apparent wind angle and speed.
 *
 * Color gradient: green (no tension) → yellow → orange → red → violet (max).
 * All coordinates are in boat-local space (Y up, Z negative = bow).
 */
import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useSignalKPath } from '../../hooks/useSignalK';

const MASTHEAD = [0, 10.0, -1.05];
const GOOSENECK = [0, 2.0, -1.0];
const BOOM_END = [0, 2.0, 2.6];

/**
 * Control line definitions.
 * Each entry has an array of [x, y, z] points forming the line.
 *
 * backstay:    masthead → stern chainplate
 * vang:        mid-boom → mast base (controls boom lift)
 * cunningham:  lower luff → tack area (tensions the luff)
 * outhaul:     mid-boom → boom end (tensions the foot)
 */
const RIGGING_LINES = {
    backstay: {
        points: [MASTHEAD, [0, 0.9, 3.5]],
    },
    vang: {
        points: [[0, 2.0, 0.6], [0, 0.9, -0.3]],
    },
    cunningham: {
        points: [[0, 3.0, -1.0], GOOSENECK],
    },
    outhaul: {
        points: [[0, 2.0, 1.6], BOOM_END],
    },
};

/**
 * Computes per-line tension values based on apparent wind angle and speed.
 *
 * - backstay: high upwind, supports mast bend
 * - vang: high on reach/run, prevents boom lift
 * - cunningham: high upwind in strong wind, flattens luff
 * - outhaul: high upwind, flattens foot
 *
 * @param {number} windAngle - Apparent wind angle in radians
 * @param {number} windSpeed - Apparent wind speed in m/s
 * @returns {Object} Tension values (0–1) keyed by rigging line name
 */
function computeRiggingTensions(windAngle, windSpeed) {
    let angle = windAngle;
    while (angle < 0) angle += 2 * Math.PI;
    while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;

    const absAngle = angle > Math.PI ? (2 * Math.PI - angle) : angle;
    const upwindFactor = Math.max(0, 1 - absAngle / Math.PI);
    const reachFactor = Math.sin(absAngle);
    const speedFactor = Math.min(1, Math.abs(windSpeed) / 15);

    return {
        backstay: Math.min(1, upwindFactor * speedFactor * 0.9 + 0.05),
        vang: Math.min(1, reachFactor * speedFactor * 0.85 + 0.05),
        cunningham: Math.min(1, upwindFactor * speedFactor * 0.8),
        outhaul: Math.min(1, upwindFactor * speedFactor * 0.75 + 0.05),
    };
}

/**
 * Maps a tension value (0–1) to a color on the gradient:
 * green → yellow → orange → red → violet.
 *
 * @param {number} t - Tension value 0–1
 * @returns {THREE.Color}
 */
function tensionToColor(t) {
    const c = Math.max(0, Math.min(1, t));
    if (c <= 0.25) {
        const f = c / 0.25;
        return new THREE.Color(f, 1.0, 0);
    }
    if (c <= 0.5) {
        const f = (c - 0.25) / 0.25;
        return new THREE.Color(1.0, 1.0 - f * 0.35, 0);
    }
    if (c <= 0.75) {
        const f = (c - 0.5) / 0.25;
        return new THREE.Color(1.0, 0.65 - f * 0.65, 0);
    }
    const f = (c - 0.75) / 0.25;
    return new THREE.Color(1.0 - f * 0.3, 0, f * 0.8);
}

/**
 * Single rigging line with tension-based dynamic color.
 *
 * @param {Object} props
 * @param {Array<Array<number>>} props.points - Array of [x,y,z] endpoints
 * @param {number} props.tension - Tension value 0–1
 */
const RiggingLine = ({ points, tension }) => {
    const matRef = useRef();

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(points.length * 3);
        for (let i = 0; i < points.length; i++) {
            positions[i * 3] = points[i][0];
            positions[i * 3 + 1] = points[i][1];
            positions[i * 3 + 2] = points[i][2];
        }
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geo;
    }, [points]);

    const color = useMemo(() => tensionToColor(tension), [tension]);

    useEffect(() => {
        if (matRef.current) {
            matRef.current.color.copy(color);
        }
    }, [color]);

    return (
        <line geometry={geometry}>
            <lineBasicMaterial
                ref={matRef}
                color={color}
                transparent
                opacity={0.9}
                depthWrite={false}
                linewidth={2}
            />
        </line>
    );
};

/**
 * Rigging3D - Renders all standing rigging lines with tension-based coloring
 * derived from apparent wind angle and speed via SignalK.
 */
const Rigging3D = () => {
    const windAngle = useSignalKPath('environment.wind.angleApparent', 0);
    const windSpeed = useSignalKPath('environment.wind.speedApparent', 0);

    const tensions = useMemo(
        () => computeRiggingTensions(windAngle, windSpeed),
        [windAngle, windSpeed]
    );

    return (
        <group>
            {Object.entries(RIGGING_LINES).map(([key, def]) => (
                <RiggingLine
                    key={key}
                    points={def.points}
                    tension={tensions[key] || 0}
                />
            ))}
        </group>
    );
};

export default Rigging3D;
