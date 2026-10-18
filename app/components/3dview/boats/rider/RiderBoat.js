import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAnimations, useGLTF } from '@react-three/drei';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useSignalKRef } from '../../../hooks/useSignalK';
import { makeArmIK } from './armIK';

const ASSET_PREFIX = process.env.ASSET_PREFIX || './';

/**
 * The author's own rides, rider included (his 3D avatar), as glTF built by the
 * Blender scripts of laborima/chatel-apps-repository (about-matthieu/windsurf):
 *   windsurf: JP Australia Magic Ride 119 board and Duotone E_Pace 6.2 rig
 *   wingfoil: 145 cm foil board, 85 cm mast and a 5 m² wing
 * Frame: metres, bow towards -Z, waterline at y = 0, rider on the port rail
 * (wind from port), one looping clip "Ride".
 */
// sheet: how far the rig is let out for the apparent wind (like the racer's
// boom: |AWA| - offset, between min and max), baked: its angle in the animation
const DEG = Math.PI / 180;
export const RIDER_MODELS = {
    windsurf: { file: 'windsurf', foil: 0, sheet: { offset: 25 * DEG, min: 5 * DEG, max: 80 * DEG, baked: 12 * DEG } },
    // The board flies above the water on its foil from about 7 knots
    wingfoil: { file: 'wingfoil', foil: 0.62, takeoff: 3.6, drop: 2.8, sheet: { offset: 30 * DEG, min: 6 * DEG, max: 70 * DEG, baked: 14 * DEG } },
};
const sheetFor = ({ offset, min, max }, awa) => Math.min(max, Math.max(min, Math.abs(awa) - offset));
const UP = new THREE.Vector3(0, 1, 0);
// Drawn larger than life: a 2.4 m board is a speck in the compass ring sized for
// a 10 m boat (display only: distances, laylines and AIS are unchanged)
export const RIDER_DISPLAY_SCALE = 2.2;
const url = (file) => `${ASSET_PREFIX}/boats/${file}/assets/rider.glb`;

/**
 * Windsurfer or wing foiler as the own boat. Mirrored on starboard tack (the
 * rider moves to the windward rail), the ride animation runs faster with the
 * speed, the foil board lifts off once flying. Tinted by the theme (white:
 * unchanged, dim red at night) and by the give-way colour.
 */
const RiderBoat = ({ model = 'windsurf', hullColor, windData }) => {
    const spec = RIDER_MODELS[model] || RIDER_MODELS.windsurf;
    const { scene, animations } = useGLTF(url(spec.file), `${ASSET_PREFIX}/draco/`);
    // Skinned meshes: a real copy per view (main view, anchored, park assist)
    const rider = useMemo(() => cloneSkinned(scene), [scene]);
    const group = useRef();
    const { actions } = useAnimations(animations, group);
    const sog = useSignalKRef('navigation.speedOverGround');
    const flying = useRef(false);
    // The rig turns round its mast (the wing round its leading edge) with the
    // wind; the arms follow it onto the wishbone / the handles
    const rig = useMemo(() => rider.getObjectByName('Rig'), [rider]);
    const armIK = useMemo(() => makeArmIK(rider), [rider]);
    const sheetDelta = useRef(0);
    const sheetQ = useMemo(() => new THREE.Quaternion(), []);
    const awaRef = useRef(windData?.awa);
    useEffect(() => { awaRef.current = windData?.awa; }, [windData?.awa]);
    const posed = useRef(false);
    const ride = useRef(null);                          // the playing clip, sped up with the boat

    // Own materials (the copy shares them with the cache), original colours kept for the tint
    const materials = useMemo(() => {
        const list = [];
        rider.traverse((o) => {
            if (!o.isMesh) return;
            o.frustumCulled = false;                        // skinned bounds do not follow the pose
            const own = (m) => {
                const c = m.clone();
                c.userData.baseColor = m.color.clone();
                if (m.name.startsWith('Sail')) { c.side = THREE.DoubleSide; c.depthWrite = !c.transparent; }
                list.push(c);
                return c;
            };
            o.material = Array.isArray(o.material) ? o.material.map(own) : own(o.material);
        });
        return list;
    }, [rider]);
    useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

    useEffect(() => {
        // hullColor is the theme's own-boat colour, or the give-way colour while we must keep clear
        const tint = new THREE.Color(hullColor || '#ffffff');
        for (const m of materials) m.color.copy(m.userData.baseColor).multiply(tint);
    }, [materials, hullColor]);

    useEffect(() => {
        const clip = actions.Ride;
        if (!clip) return undefined;
        clip.setLoop(THREE.LoopRepeat, Infinity).play();
        ride.current = clip;
        return () => { clip.stop(); ride.current = null; };
    }, [actions]);

    // Wind from starboard: the mirror image (the model is drawn on port tack)
    const starboard = (windData?.awa ?? -0.6) >= 0;

    useFrame((_, dt) => {
        const g = group.current; if (!g) return;
        const speed = Number.isFinite(sog.current) ? sog.current : 0;
        if (ride.current) ride.current.timeScale = 0.55 + Math.min(1.2, speed / 9);
        // Sheet in or out for the apparent wind, eased (the animation has the rig at `baked`)
        const awa = awaRef.current;
        const target = Number.isFinite(awa) ? sheetFor(spec.sheet, awa) - spec.sheet.baked : 0;
        sheetDelta.current += (target - sheetDelta.current) * Math.min(1, dt * 2);
        if (rig) rig.quaternion.multiply(sheetQ.setFromAxisAngle(UP, sheetDelta.current));
        // Hands back on the grips (they move with the rig), from the second frame
        if (posed.current) armIK(1);
        posed.current = true;
        if (spec.foil) {
            if (!flying.current && speed > spec.takeoff) flying.current = true;
            if (flying.current && speed < spec.drop) flying.current = false;
            const target = flying.current ? spec.foil : 0;
            g.position.y += (target * RIDER_DISPLAY_SCALE - g.position.y) * Math.min(1, dt * 1.5);
        }
    });

    return (
        <group ref={group} scale={[(starboard ? -1 : 1) * RIDER_DISPLAY_SCALE, RIDER_DISPLAY_SCALE, RIDER_DISPLAY_SCALE]}>
            <primitive object={rider} />
        </group>
    );
};

export const WindsurfRider = (props) => <RiderBoat model="windsurf" {...props} />;
export const WingRider = (props) => <RiderBoat model="wingfoil" {...props} />;
export default RiderBoat;
