import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import useTheme from '../../../theme/useTheme';
import configService from '../../../settings/ConfigService';
import SailPlan, { boomAngleFor } from './SailPlan';
import DeckTrim from './DeckTrim';
import { RIG, chooseSails } from './rig';

export const KEELS = ['keel_single_twinrudder', 'keel_twin_singlerudder', 'keel_twin_twinrudder'];

// Part -> theme colour (or fixed tone), all matte
const PART_COLORS = (scene, hull) => ({
    hull,
    bottom: '#2a2d31',
    deck: scene.ownDeck,
    nonslip: scene.ownDeck,
    glass: '#3b4652',
    fittings: '#3a3d42',
    rails: scene.rigging,
    rig: scene.rigging,
    boom: scene.rigging,
    stripes: '#2a2d31',
});

/**
 * RM 1080 built from the builder's model (see models/rm1080/build.mjs), with
 * the keel / rudder variant from settings (`rmKeel`), the boom swung by the
 * apparent wind, the sail plan for the wind and the trim indicators on deck.
 */
const RmBoat = ({ nodes, hullColor, windData, trim, showSail = true }) => {
    const { scene } = useTheme();
    const keel = KEELS.includes(configService.get('rmKeel')) ? configService.get('rmKeel') : KEELS[0];

    const materials = useMemo(() => {
        const colors = PART_COLORS(scene, hullColor || scene.ownHull);
        const out = {};
        for (const [part, color] of Object.entries(colors)) {
            out[part] = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0 });
        }
        out.glass.transparent = true;
        out.glass.opacity = 0.55;
        return out;
    }, [scene, hullColor]);
    useEffect(() => () => Object.values(materials).forEach(m => m.dispose()), [materials]);

    // Deck parts ship without normals (dropped to simplify them): smooth ones here, once
    useMemo(() => {
        for (const node of Object.values(nodes)) {
            const geo = node.geometry;
            if (geo && !geo.attributes.normal) geo.computeVertexNormals();
        }
    }, [nodes]);

    const awa = windData?.awa ?? 0.6;
    const leeward = awa >= 0 ? -1 : 1;
    const boomAngle = boomAngleFor(awa) * leeward;
    const sails = useMemo(
        () => chooseSails(windData?.tws, windData?.twa, configService.get('sailPlanOverride')),
        [windData?.tws, windData?.twa]
    );

    // Simple and clean: deck hardware and guard rails are left out (noise at this scale)
    const parts = ['hull', 'bottom', 'deck', 'nonslip', 'glass', 'stripes', 'rig', keel];
    const [gx, gy, gz] = RIG.gooseneck;

    return (
        <group>
            {parts.map(name => nodes[name] && (
                <mesh key={name} geometry={nodes[name].geometry} material={materials[name] || materials.bottom} />
            ))}
            {/* Boom pivots around the gooseneck */}
            {nodes.boom && (
                <group position={[gx, gy, gz]} rotation={[0, boomAngle, 0]}>
                    <mesh geometry={nodes.boom.geometry} material={materials.boom} position={[-gx, -gy, -gz]} />
                </group>
            )}
            {showSail && <SailPlan awa={awa} sails={sails} trim={trim} />}
            <DeckTrim mainCar={trim?.trimState?.mainCar} jibCar={trim?.trimState?.jibCar} leeward={leeward} />
        </group>
    );
};

export default RmBoat;
