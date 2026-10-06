import React, { useEffect, useMemo, useState } from 'react';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import useTheme from '../../theme/useTheme';
import { useSignalKPaths } from '../../hooks/useSignalK';
import { sunPosition } from '../../utils/SunUtils';
import { starPositions, NAV_STARS } from '../../utils/StarUtils';
import { vesselNow } from '../../utils/VesselClock';
import useOwnTrack from '../fsd/useOwnTrack';

// Just inside the sky dome (FsdOcean SKY_RADIUS)
const RADIUS = 3600;
// Names only for the brightest stars, clear of the horizon haze
const LABEL_MAGNITUDE = 1.0;
const LABEL_MIN_ALTITUDE = 4;
const LABEL_SIZE = 56;

const starVertex = `
    attribute float aSize;
    attribute float aAlpha;
    varying float vAlpha;
    void main() {
        vAlpha = aAlpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize;
    }
`;

const starFragment = `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying float vAlpha;
    void main() {
        // Round, soft-edged point
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.35, r) * vAlpha * uOpacity;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor, a);
        #include <colorspace_fragment>
    }
`;

// Brighter stars bigger and more opaque: Sirius (-1.5) ~10 px, 2nd mag ~4.5 px
const pointSize = (magnitude) => THREE.MathUtils.clamp(7.5 - 1.5 * magnitude, 3.5, 10) * Math.min(window.devicePixelRatio || 1, 2);
const pointAlpha = (magnitude) => THREE.MathUtils.clamp(1.15 - 0.2 * magnitude, 0.5, 1);

/**
 * The navigational stars (57 of the Nautical Almanac and Polaris) where they
 * really are in the sky from the boat's position and the vessel clock. Shown
 * only with a dark theme once the sun is below the horizon, fading in through
 * civil twilight; the brightest are named. Same north-up frame as the sky
 * dome's sun, turned by the heading.
 */
const NavStars = () => {
    const { scene, id: themeId } = useTheme();
    const { heading } = useOwnTrack();
    const position = useSignalKPaths(['navigation.position'])['navigation.position'];
    const [sky, setSky] = useState({ stars: null, sunAltitude: 90 });

    // The sky turns 0.25° a minute: once a minute is plenty
    useEffect(() => {
        const update = () => {
            const now = vesselNow();
            const sun = sunPosition(position?.latitude, position?.longitude, now);
            setSky({
                stars: starPositions(position?.latitude, position?.longitude, now),
                sunAltitude: sun ? sun.elevation : 90,
            });
        };
        update();
        const id = setInterval(update, 60000);
        return () => clearInterval(id);
    }, [position?.latitude, position?.longitude]);

    // First stars at sunset, all of them from the middle of civil twilight
    const opacity = themeId === 'day' ? 0 : 1 - THREE.MathUtils.smoothstep(sky.sunAltitude, -8, -1);

    const geometry = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NAV_STARS.length * 3), 3));
        g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(NAV_STARS.map((s) => pointSize(s.magnitude))), 1));
        g.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(NAV_STARS.length), 1));
        return g;
    }, []);

    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color() }, uOpacity: { value: 1 } },
        vertexShader: starVertex,
        fragmentShader: starFragment,
        transparent: true,
        depthWrite: false,
        fog: false,
    }), []);

    // North-up (east, north, up) to the group's frame (x east, y up, z south)
    useEffect(() => {
        if (!sky.stars) return;
        const pos = geometry.attributes.position;
        const alpha = geometry.attributes.aAlpha;
        sky.stars.forEach(({ enu: [e, n, u], magnitude, altitude }, i) => {
            pos.setXYZ(i, e * RADIUS, u * RADIUS, -n * RADIUS);
            // Dimmed by the haze low down, hidden below the horizon
            alpha.setX(i, pointAlpha(magnitude) * THREE.MathUtils.smoothstep(altitude, -0.5, 6));
        });
        pos.needsUpdate = true; // eslint-disable-line react-hooks/immutability
        alpha.needsUpdate = true;
        geometry.computeBoundingSphere();
    }, [geometry, sky.stars]);

    useEffect(() => {
        material.uniforms.uColor.value.set(scene.light);
        material.uniforms.uOpacity.value = opacity; // eslint-disable-line react-hooks/immutability
    }, [material, scene.light, opacity]);

    useEffect(() => () => {
        geometry.dispose();
        material.dispose();
    }, [geometry, material]);

    const labels = useMemo(() => (sky.stars || []).filter(
        (s) => s.magnitude <= LABEL_MAGNITUDE && s.altitude >= LABEL_MIN_ALTITUDE
    ), [sky.stars]);

    if (!sky.stars || opacity <= 0.01) return null;

    return (
        <group rotation={[0, heading, 0]}>
            <points geometry={geometry} material={material} renderOrder={-2} frustumCulled={false} />
            {labels.map(({ name, enu: [e, n, u] }) => (
                <Billboard key={name} position={[e * RADIUS, u * RADIUS - LABEL_SIZE * 0.9, -n * RADIUS]}>
                    <Text
                        fontSize={LABEL_SIZE}
                        color={scene.light}
                        fillOpacity={0.55 * opacity}
                        font="fonts/Roboto-Bold.ttf"
                        anchorX="center"
                        anchorY="top"
                        renderOrder={-2}
                        material-depthWrite={false}
                        material-fog={false}
                    >
                        {name}
                    </Text>
                </Billboard>
            ))}
        </group>
    );
};

export default NavStars;
