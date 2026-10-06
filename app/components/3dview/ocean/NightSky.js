import React, { useEffect, useMemo, useState } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import useTheme from '../../theme/useTheme';
import { useSignalKPaths } from '../../hooks/useSignalK';
import { starPositions, NAV_STARS } from '../../utils/StarUtils';
import { skyBodies, PLANETS } from '../../utils/PlanetUtils';
import { vesselNow } from '../../utils/VesselClock';
import useOwnTrack from '../fsd/useOwnTrack';

// Just inside the sky dome (FsdOcean SKY_RADIUS)
const RADIUS = 3600;
// Names only for the brightest stars, clear of the horizon haze; the
// planets and the Moon are always named
const LABEL_MAGNITUDE = 1.0;
const LABEL_MIN_ALTITUDE = 4;
const LABEL_SIZE = 56;
// The Moon is drawn larger than its 0.5° so its phase reads on screen
const MOON_RADIUS = RADIUS * Math.tan(0.7 * Math.PI / 180);

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

const moonVertex = `
    varying vec3 vNormal;
    void main() {
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Lit by the Sun from where it really is (same frame as the sphere), the
// dark side kept faintly visible (earthshine)
const moonFragment = `
    uniform vec3 uColor;
    uniform vec3 uSun;
    uniform float uOpacity;
    varying vec3 vNormal;
    void main() {
        float lit = smoothstep(-0.04, 0.12, dot(normalize(vNormal), uSun));
        gl_FragColor = vec4(uColor * mix(0.1, 1.0, lit), uOpacity * mix(0.35, 1.0, lit));
        #include <colorspace_fragment>
    }
`;

const pixelRatio = () => (typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2));
// Brighter bodies bigger and more opaque: Sirius (-1.5) ~10 px, 2nd mag
// ~4.5 px, Venus (-4) a little more than Sirius
const pointSize = (magnitude) => THREE.MathUtils.clamp(7.5 - 1.5 * magnitude, 3.5, 11) * pixelRatio();
const pointAlpha = (magnitude) => THREE.MathUtils.clamp(1.15 - 0.2 * magnitude, 0.5, 1);
// Dimmed by the haze low down, hidden below the horizon
const horizonFade = (altitude) => THREE.MathUtils.smoothstep(altitude, -0.5, 6);
// North-up (east, north, up) to the group's frame (x east, y up, z south)
const toScene = ([e, n, u], r = RADIUS) => [e * r, u * r, -n * r];

const COUNT = NAV_STARS.length + PLANETS.length;

/**
 * The night sky where it really is from the boat's position and the vessel
 * clock: the navigational stars (57 of the Nautical Almanac and Polaris),
 * Venus, Mars, Jupiter and Saturn, and the Moon with its phase. Stars and
 * planets show with a dark theme once the sun is below the horizon, fading
 * in through civil twilight; the Moon whenever it is up, paler by day. Same
 * north-up frame as the sky dome's sun, turned by the heading.
 */
const NightSky = () => {
    const { t } = useTranslation();
    const { scene, id: themeId } = useTheme();
    const { heading } = useOwnTrack();
    const position = useSignalKPaths(['navigation.position'])['navigation.position'];
    // A kilometre changes nothing visible in the sky: recompute on the minute,
    // not on every fix
    const lat = Number.isFinite(position?.latitude) ? Math.round(position.latitude * 100) / 100 : null;
    const lon = Number.isFinite(position?.longitude) ? Math.round(position.longitude * 100) / 100 : null;
    const [sky, setSky] = useState(null);

    // The sky turns 0.25° a minute and the Moon moves its own width in an
    // hour: once a minute is plenty
    useEffect(() => {
        const update = () => {
            const now = vesselNow();
            const stars = starPositions(lat, lon, now);
            const bodies = skyBodies(lat, lon, now);
            setSky(stars && bodies ? { stars, ...bodies } : null);
        };
        update();
        const id = setInterval(update, 60000);
        return () => clearInterval(id);
    }, [lat, lon]);

    const sunAltitude = sky ? sky.sun.altitude : 90;
    // First stars at sunset, all of them from the middle of civil twilight
    const opacity = themeId === 'day' ? 0 : 1 - THREE.MathUtils.smoothstep(sunAltitude, -8, -1);
    // The Moon is in the day sky too, paler
    const moonOpacity = sky ? horizonFade(sky.moon.altitude) * (1 - 0.45 * THREE.MathUtils.smoothstep(sunAltitude, -6, 2)) : 0;

    const geometry = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
        g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(COUNT), 1));
        g.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(COUNT), 1));
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

    const moonMaterial = useMemo(() => new THREE.ShaderMaterial({
        uniforms: { uColor: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uOpacity: { value: 1 } },
        vertexShader: moonVertex,
        fragmentShader: moonFragment,
        transparent: true,
        depthWrite: false,
        fog: false,
    }), []);

    // Stars first, then the planets, whose brightness changes with distance
    useEffect(() => {
        if (!sky) return;
        const pos = geometry.attributes.position;
        const size = geometry.attributes.aSize;
        const alpha = geometry.attributes.aAlpha;
        [...sky.stars, ...sky.planets].forEach(({ enu, magnitude, altitude }, i) => {
            pos.setXYZ(i, ...toScene(enu));
            size.setX(i, pointSize(magnitude));
            alpha.setX(i, pointAlpha(magnitude) * horizonFade(altitude));
        });
        pos.needsUpdate = true; // eslint-disable-line react-hooks/immutability
        size.needsUpdate = true;
        alpha.needsUpdate = true;
        geometry.computeBoundingSphere();
        moonMaterial.uniforms.uSun.value.set(...toScene(sky.sun.enu, 1)).normalize();
    }, [geometry, moonMaterial, sky]);

    useEffect(() => {
        material.uniforms.uColor.value.set(scene.light);
        material.uniforms.uOpacity.value = opacity; // eslint-disable-line react-hooks/immutability
        moonMaterial.uniforms.uColor.value.set(scene.light);
        moonMaterial.uniforms.uOpacity.value = moonOpacity; // eslint-disable-line react-hooks/immutability
    }, [material, moonMaterial, scene.light, opacity, moonOpacity]);

    useEffect(() => () => {
        geometry.dispose();
        material.dispose();
        moonMaterial.dispose();
    }, [geometry, material, moonMaterial]);

    const labels = useMemo(() => {
        if (!sky) return [];
        const stars = sky.stars
            .filter((s) => s.magnitude <= LABEL_MAGNITUDE && s.altitude >= LABEL_MIN_ALTITUDE)
            .map((s) => ({ key: s.name, text: s.name, enu: s.enu, gap: 0.9 }));
        const planets = sky.planets
            .filter((p) => p.altitude >= LABEL_MIN_ALTITUDE)
            .map((p) => ({ key: p.name, text: t(`sky.${p.name}`), enu: p.enu, gap: 1.1 }));
        return [...stars, ...planets];
    }, [sky, t]);

    if (!sky) return null;

    const label = ({ key, text, enu, gap }, fade, size = LABEL_SIZE) => {
        const [x, y, z] = toScene(enu);
        return (
            <Billboard key={key} position={[x, y - size * gap, z]}>
                <Text
                    fontSize={size}
                    color={scene.light}
                    fillOpacity={0.55 * fade}
                    font="fonts/Roboto-Bold.ttf"
                    anchorX="center"
                    anchorY="top"
                    renderOrder={-2}
                    material-depthWrite={false}
                    material-fog={false}
                >
                    {text}
                </Text>
            </Billboard>
        );
    };

    return (
        <group rotation={[0, heading, 0]}>
            {opacity > 0.01 && (
                <>
                    <points geometry={geometry} material={material} renderOrder={-2} frustumCulled={false} />
                    {labels.map((l) => label(l, opacity))}
                </>
            )}
            {moonOpacity > 0.01 && (
                <>
                    <mesh position={toScene(sky.moon.enu)} material={moonMaterial} renderOrder={-2} frustumCulled={false}>
                        <sphereGeometry args={[MOON_RADIUS, 32, 16]} />
                    </mesh>
                    {sky.moon.altitude >= LABEL_MIN_ALTITUDE && label(
                        { key: 'moon', text: t('sky.moon'), enu: sky.moon.enu, gap: (MOON_RADIUS + 12) / LABEL_SIZE },
                        moonOpacity
                    )}
                </>
            )}
        </group>
    );
};

export default NightSky;
