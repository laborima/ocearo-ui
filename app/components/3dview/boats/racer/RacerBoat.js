import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import useTheme from '../../../theme/useTheme';
import configService from '../../../settings/ConfigService';
import SailPlan, { boomAngleWithTraveller } from './SailPlan';
import DeckTrim, { carSheave } from './DeckTrim';
import { RIG, chooseSails } from './rig';
import { buildRacerParts, sheerOutline } from './racerGeometry';
import { Line } from '@react-three/drei';
import Tiller from './Tiller';
import { useSignalKPath } from '../../../hooks/useSignalK';

// Keel / rudder variants (settings `rmKeel`): twin rudders by default
export const KEELS = ['keel_single_twinrudder', 'keel_single_singlerudder'];

// Part -> theme colour (or fixed tone), all matte
const DARK = '#262c33';
const PART_COLORS = (scene, hull) => ({
    hull,
    bottom: DARK,
    deck: scene.ownDeck,
    roof: hull,
    glass: DARK,
    ports: scene.rigging,
    rig: scene.rigging,
    boom: scene.rigging,
    stripes: DARK,
});

/**
 * The default own boat: a procedural 10.8 m cruiser-racer (racerGeometry),
 * keel / rudder variant from settings (`rmKeel`), boom swung by the apparent
 * wind, sail plan for the wind, tiller and trim cars on deck.
 */
const RacerBoat = ({ hullColor, windData, trim, showSail = true }) => {
    const nodes = useMemo(() => buildRacerParts(), []);
    const outline = useMemo(() => sheerOutline(), []);
    const { scene } = useTheme();
    const keel = KEELS.includes(configService.get('rmKeel')) ? configService.get('rmKeel') : KEELS[0];

    const materials = useMemo(() => {
        const colors = PART_COLORS(scene, hullColor || scene.ownHull);
        const out = {};
        for (const [part, color] of Object.entries(colors)) {
            out[part] = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0 });
        }
        out.stripes.side = THREE.DoubleSide;
        out.glass.side = THREE.DoubleSide;
        // Underwater: keel and rudders seen through the water, so they turn
        // visibly without making the boat look like it floats above the sea
        out.underwater = new THREE.MeshStandardMaterial({
            color: scene.vessel, roughness: 0.9, metalness: 0, transparent: true, opacity: 0.45, depthWrite: false,
        });
        return out;
    }, [scene, hullColor]);
    useEffect(() => () => Object.values(materials).forEach(m => m.dispose()), [materials]);

    const awa = windData?.awa ?? 0.6;
    const leeward = awa >= 0 ? -1 : 1;
    const travellerX = ((trim?.trimState?.mainCar ?? 0.5) - 0.5) * 2 * RIG.traveller.halfWidth;
    const boomAngle = boomAngleWithTraveller(awa, travellerX) * leeward;
    const jibCar = trim?.trimState?.jibCar ?? 0.5;
    const { jibTrack: j, traveller: tr } = RIG;
    const jibCarAt = carSheave([leeward * j.x, 0, j.zFwd], [leeward * j.x, 0, j.zAft], jibCar);
    const mainCarAt = carSheave([-tr.halfWidth, 0, tr.z], [tr.halfWidth, 0, tr.z], trim?.trimState?.mainCar ?? 0.5);
    const sails = useMemo(
        () => chooseSails(windData?.tws, windData?.twa, configService.get('sailPlanOverride')),
        [windData?.tws, windData?.twa]
    );

    const parts = ['hull', 'bottom', 'deck', 'roof', 'glass', 'ports', 'stripes', 'rig'];
    const [gx, gy, gz] = RIG.gooseneck;
    const rudder = useSignalKPath('steering.rudderAngle', 0) || 0;

    return (
        <group>
            {parts.map(name => nodes[name] && (
                <mesh key={name} geometry={nodes[name].geometry} material={materials[name]} />
            ))}
            {/* Deck edge outline: the white hull stays readable on the light day ground */}
            <Line points={outline} color={scene.rigging} lineWidth={1.5} />
            {nodes[keel] && <mesh geometry={nodes[keel].geometry} material={materials.underwater} renderOrder={1} />}
            {/* Boom pivots around the gooseneck */}
            {nodes.boom && (
                <group position={[gx, gy, gz]} rotation={[0, boomAngle, 0]}>
                    <mesh geometry={nodes.boom.geometry} material={materials.boom} position={[-gx, -gy, -gz]} />
                </group>
            )}
            {/* Rudders turn on their (toed-out) stocks: trailing edge to starboard for + angles */}
            {['port', 'starboard', 'centre'].map((side) => {
                const node = nodes[`${keel}_rudder_${side}`];
                if (!node) return null;
                const { pivot, axis } = RIG.rudders[side];
                const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...axis).normalize(), -rudder);
                return (
                    <group key={side} position={pivot} quaternion={q}>
                        <mesh geometry={node.geometry} material={materials.underwater} position={pivot.map(v => -v)} renderOrder={1} />
                    </group>
                );
            })}
            <Tiller rudder={rudder} />
            {showSail && <SailPlan awa={awa} boomAngle={boomAngle} sails={sails} trim={trim} mainCarAt={mainCarAt} jibCarAt={jibCarAt} />}
            <DeckTrim mainCar={trim?.trimState?.mainCar} jibCar={jibCar} leeward={leeward} />
        </group>
    );
};

export default RacerBoat;
