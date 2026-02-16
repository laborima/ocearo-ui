/**
 * TensionLines3D Component - Visualizes sail control line tensions as colored 3D lines.
 *
 * Renders four control lines (mainsheet, jib sheet, vang, cunningham) with
 * colors interpolated from green (no tension) through orange to red (max tension).
 * Uses a ShaderMaterial with a uniform to avoid material recreation each frame.
 */
import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

/**
 * GLSL vertex shader - passes position through with standard MVP transform.
 */
const TENSION_VERTEX_SHADER = `
    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

/**
 * GLSL fragment shader - interpolates color based on tension uniform.
 * 0.0 = green, 0.5 = orange, 1.0 = red.
 */
const TENSION_FRAGMENT_SHADER = `
    uniform float tension;

    void main() {
        vec3 green  = vec3(0.06, 0.80, 0.31);
        vec3 orange = vec3(1.00, 0.75, 0.00);
        vec3 red    = vec3(0.80, 0.00, 0.03);

        vec3 color;
        if (tension <= 0.5) {
            color = mix(green, orange, tension * 2.0);
        } else {
            color = mix(orange, red, (tension - 0.5) * 2.0);
        }

        gl_FragColor = vec4(color, 0.85);
    }
`;

/**
 * Line endpoint definitions for each control line.
 * Coordinates are in boat-local space (Y up, Z negative = bow).
 *
 * Mainsheet:  boom end (clew of mainsail) → cockpit traveler
 * Jib sheet:  jib clew → cockpit winch area (port side)
 * Vang:       mid-boom → mast foot base
 * Cunningham: mainsail tack (luff foot) → mast foot
 */
const LINE_DEFINITIONS = {
    mainSheet: {
        label: 'Mainsheet',
        points: [
            [0, 2.0, 1.2],
            [0, 0.9, 2.5],
        ],
    },
    jibSheet: {
        label: 'Jib Sheet',
        points: [
            [0, 0.9, -2.0],
            [0.8, 0.9, 0.5],
        ],
    },
    vang: {
        label: 'Vang',
        points: [
            [0, 1.8, 0.0],
            [0, 0.9, -0.8],
        ],
    },
    cunningham: {
        label: 'Cunningham',
        points: [
            [0, 2.0, -0.8],
            [0, 0.9, -0.8],
        ],
    },
};

/**
 * Single tension line rendered with a ShaderMaterial.
 *
 * @param {Object} props
 * @param {Array<Array<number>>} props.points - Array of two [x,y,z] endpoints
 * @param {number} props.tension - Tension value 0–1
 */
const TensionLine = ({ points, tension }) => {
    const lineRef = useRef();

    const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            tension: { value: 0.5 },
        },
        vertexShader: TENSION_VERTEX_SHADER,
        fragmentShader: TENSION_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
    }), []);

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

    useEffect(() => {
        if (shaderMaterial) {
            shaderMaterial.uniforms.tension.value = tension;
        }
    }, [tension, shaderMaterial]);

    return (
        <line ref={lineRef} geometry={geometry} material={shaderMaterial} />
    );
};

/**
 * TensionLines3D - Renders all four control lines with tension-based coloring.
 *
 * @param {Object} props
 * @param {Object} props.tensions - Map of line type to tension value (0–1)
 * @param {number} props.tensions.mainSheet - Mainsheet tension
 * @param {number} props.tensions.jibSheet - Jib sheet tension
 * @param {number} props.tensions.vang - Vang tension
 * @param {number} props.tensions.cunningham - Cunningham tension
 */
const TensionLines3D = ({ tensions = {} }) => {
    return (
        <group>
            {Object.entries(LINE_DEFINITIONS).map(([key, def]) => (
                <TensionLine
                    key={key}
                    points={def.points}
                    tension={tensions[key] || 0}
                />
            ))}
        </group>
    );
};

export default TensionLines3D;
