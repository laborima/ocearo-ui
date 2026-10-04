import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import useTheme from '../../../theme/useTheme';
import configService from '../../../settings/ConfigService';
import SailPlan, { boomAngleFor } from './SailPlan';
import DeckTrim from './DeckTrim';
import { RIG, chooseSails } from './rig';
import { buildRacerParts } from './racerGeometry';
import Tiller from './Tiller';
import { useSignalKPath } from '../../../hooks/useSignalK';

// Keel / rudder variants (settings `rmKeel`): twin rudders by default
export const KEELS = ['keel_single_twinrudder', 'keel_single_singlerudder'];

// Part -> theme colour (or fixed tone), all matte
const PART_COLORS = (scene, hull) => ({
    hull,
    deck: scene.ownDeck,
    roof: scene.ownDeck,
    glass: '#262c33',
    rig: scene.rigging,
    boom: scene.rigging,
    stripes: '#262c33',
});

/**
 * The default own boat: a procedural 10.8 m cruiser-racer (racerGeometry),
 * keel / rudder variant from settings (`rmKeel`), boom swung by the apparent
 * wind, sail plan for the wind, tiller and trim cars on deck.
 */
const RacerBoat = ({ hullColor, windData, trim, showSail = true }) => {
    const nodes = useMemo(() => buildRacerParts(), []);
    const { scene } = useTheme();
    const keel = KEELS.includes(configService.get('rmKeel')) ? configService.get('rmKeel') : KEELS[0];

    const materials = useMemo(() => {
        const colors = PART_COLORS(scene, hullColor || scene.ownHull);
        const out = {};
        for (const [part, color] of Object.entries(colors)) {
            out[part] = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0 });
        }
        // Bottom paint is a darker shade of the hull colour (vertex colours)
        out.hull.vertexColors = true;
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
    const boomAngle = boomAngleFor(awa) * leeward;
    const sails = useMemo(
        () => chooseSails(windData?.tws, windData?.twa, configService.get('sailPlanOverride')),
        [windData?.tws, windData?.twa]
    );

    const parts = ['hull', 'deck', 'roof', 'glass', 'stripes', 'rig'];
    const [gx, gy, gz] = RIG.gooseneck;
    const rudder = useSignalKPath('steering.rudderAngle', 0) || 0;
    const travellerX = ((trim?.trimState?.mainCar ?? 0.5) - 0.5) * 2 * RIG.traveller.halfWidth;

    return (
        <group>
            {parts.map(name => nodes[name] && (
                <mesh key={name} geometry={nodes[name].geometry} material={materials[name]} />
            ))}
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
            {showSail && <SailPlan awa={awa} sails={sails} trim={trim} travellerX={travellerX} />}
            <DeckTrim mainCar={trim?.trimState?.mainCar} jibCar={trim?.trimState?.jibCar} leeward={leeward} />
        </group>
    );
};

export default RacerBoat;
