import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Arrows along a flow (current, wind), one draw call for all of them.
 * Each arrow lies along the flow and turns about its own axis to face the
 * camera, so it reads from the cockpit as well as from above. It slides
 * along its direction over `travel` and fades in and out, faster in a
 * stronger flow: direction, strength and motion at a glance.
 *
 * Coordinates are those of the parent: x east, y north, z up (scene units).
 *
 * @param {Array<{x:number,y:number,z:number,u:number,v:number,len:number,speed:number,color:number[]}>} items
 *   position, flow direction (any length), arrow length, flow speed (m/s),
 *   colour (RGB 0..1)
 * @param {number} width - arrow width, scene units
 * @param {number} travel - distance an arrow slides before it fades, scene units
 * @param {number} pace - slide speed per m/s of flow, scene units per second
 * @param {number} fadeNear - arrows closer to the camera than this fade out (scene units)
 * @param {boolean} still - arrows stay put, at full strength
 * @param {number} screen - when set, `width` and each `len` are shares of the
 *   arrow's distance to the camera (times this): the same size on screen
 */
const MAX_ARROWS = 400;

const vertexShader = `
    attribute vec3 aBase;
    attribute vec2 aDir;
    attribute vec3 aColor;
    attribute vec2 aLenSpeed;
    attribute float aSeed;
    uniform vec3 uCam;
    uniform float uTime;
    uniform float uWidth;
    uniform float uTravel;
    uniform float uPace;
    uniform float uFadeNear;
    uniform float uStill;
    uniform float uScreen;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
        vec3 d = normalize(vec3(aDir, 0.0));
        // Still arrows stay put at full strength (a chart plotter's current arrows)
        float phase = uStill > 0.5 ? 0.5 : fract(uTime * aLenSpeed.y * uPace / max(uTravel, 1e-3) + aSeed);
        vec3 base = aBase + d * (phase - 0.5) * uTravel;
        // Turn the arrow about its axis towards the camera
        vec3 toCam = normalize(uCam - base);
        vec3 side = cross(toCam, d);
        side = length(side) < 1e-3 ? vec3(-d.y, d.x, 0.0) : normalize(side);
        // Screen-sized: lengths and width are shares of the distance to the
        // camera, so a far arrow reads as well as a near one
        float k = uScreen > 0.0 ? length(uCam - aBase) * uScreen : 1.0;
        vec3 p = base + side * position.x * uWidth * k + d * position.y * aLenSpeed.x * k;
        vColor = aColor;
        // Faded close to the camera, where an arrow would fill the view
        vAlpha = (uStill > 0.5 ? 1.0 : pow(sin(3.14159 * phase), 0.6)) * smoothstep(uFadeNear * 0.5, uFadeNear, length(uCam - base));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
`;

const fragmentShader = `
    uniform float uOpacity;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
        gl_FragColor = vec4(vColor, vAlpha * uOpacity);
        #include <colorspace_fragment>
    }
`;

/** Arrow outline pointing +y, length 1 (tail at -0.5), width 1 */
const arrowShape = () => {
    const s = new THREE.Shape();
    s.moveTo(-0.16, -0.5);
    s.lineTo(0.16, -0.5);
    s.lineTo(0.16, 0.08);
    s.lineTo(0.5, 0.08);
    s.lineTo(0, 0.5);
    s.lineTo(-0.5, 0.08);
    s.lineTo(-0.16, 0.08);
    s.closePath();
    return new THREE.ShapeGeometry(s);
};

const FlowArrows = ({ items, width, travel = 0, pace = 0, opacity = 0.9, fadeNear = 0, still = false, screen = 0, renderOrder = 3 }) => {
    const { geometry, material } = useMemo(() => {
        const shape = arrowShape();
        const geo = new THREE.InstancedBufferGeometry();
        geo.index = shape.index;
        geo.setAttribute('position', shape.attributes.position);
        geo.setAttribute('aBase', new THREE.InstancedBufferAttribute(new Float32Array(MAX_ARROWS * 3), 3));
        geo.setAttribute('aDir', new THREE.InstancedBufferAttribute(new Float32Array(MAX_ARROWS * 2), 2));
        geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(MAX_ARROWS * 3), 3));
        geo.setAttribute('aLenSpeed', new THREE.InstancedBufferAttribute(new Float32Array(MAX_ARROWS * 2), 2));
        const seeds = new Float32Array(MAX_ARROWS);
        // Golden-ratio phases: neighbours never pulse together
        for (let i = 0; i < MAX_ARROWS; i++) seeds[i] = (i * 0.618034) % 1;
        geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
        geo.instanceCount = 0;
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uCam: { value: new THREE.Vector3() }, uTime: { value: 0 }, uWidth: { value: 1 },
                uTravel: { value: 1 }, uPace: { value: 1 }, uOpacity: { value: opacity }, uFadeNear: { value: 0 }, uStill: { value: 0 }, uScreen: { value: 0 },
            },
            vertexShader,
            fragmentShader,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
        });
        return { geometry: geo, material: mat };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);

    useEffect(() => {
        const n = Math.min(items.length, MAX_ARROWS);
        const a = geometry.attributes;
        for (let i = 0; i < n; i++) {
            const it = items[i];
            a.aBase.array.set([it.x, it.y, it.z], i * 3);
            a.aDir.array.set([it.u, it.v], i * 2);
            a.aColor.array.set(it.color, i * 3);
            a.aLenSpeed.array.set([it.len, it.speed], i * 2);
        }
        ['aBase', 'aDir', 'aColor', 'aLenSpeed'].forEach((k) => { a[k].needsUpdate = true; });
        geometry.instanceCount = n; // eslint-disable-line react-hooks/immutability
    }, [geometry, items]);

    useEffect(() => {
        const u = material.uniforms;
        u.uWidth.value = width; // eslint-disable-line react-hooks/immutability
        u.uTravel.value = travel;
        u.uPace.value = pace;
        u.uOpacity.value = opacity;
        u.uFadeNear.value = fadeNear;
        u.uStill.value = still ? 1 : 0;
        u.uScreen.value = screen;
    }, [material, width, travel, pace, opacity, fadeNear, still, screen]);

    const ref = useRef();
    const cam = useMemo(() => new THREE.Vector3(), []);
    useFrame(({ camera, clock }) => {
        if (!ref.current) return;
        ref.current.updateWorldMatrix(true, false);
        material.uniforms.uCam.value.copy(ref.current.worldToLocal(cam.copy(camera.position)));
        material.uniforms.uTime.value = clock.elapsedTime;
    });

    return <mesh ref={ref} geometry={geometry} material={material} frustumCulled={false} renderOrder={renderOrder} />;
};

export default FlowArrows;
