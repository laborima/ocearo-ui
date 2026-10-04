import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import useTheme from '../../../theme/useTheme';
import configService from '../../../settings/ConfigService';
import { useSignalKPath } from '../../../hooks/useSignalK';
import SailPlan, { boomAngleWithTraveller } from '../racer/SailPlan';
import DeckTrim, { jibCarSheave, mainCarSheave, trimLayout } from '../racer/DeckTrim';
import { chooseSails } from '../racer/rig';
import { CAT_RIG } from './rig';
import { buildCatParts, catDeckEdgeAt, catDeckHeightAt, catOutline } from './catGeometry';

const DARK = '#262c33';

/**
 * Procedural 14 m performance catamaran: same style, sail plan, telltales
 * and trim hardware as the racer, with a rudder per hull turning with the
 * helm and daggerboards seen through the water.
 */
const CatamaranBoat = ({ hullColor, windData, trim, showSail = true }) => {
    const nodes = useMemo(() => buildCatParts(), []);
    const outlines = useMemo(() => catOutline(), []);
    const layout = useMemo(() => trimLayout(CAT_RIG, { edgeAt: catDeckEdgeAt, heightAt: catDeckHeightAt }), []);
    const { scene } = useTheme();

    const materials = useMemo(() => {
        const hull = hullColor || scene.ownHull;
        const colors = { hull, deck: scene.ownDeck, roof: hull, glass: DARK, stripes: DARK, net: DARK, rig: scene.rigging, boom: scene.rigging };
        const out = {};
        for (const [part, color] of Object.entries(colors)) {
            out[part] = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0 });
        }
        out.glass.side = THREE.DoubleSide;
        out.stripes.side = THREE.DoubleSide;
        out.net.side = THREE.DoubleSide;
        out.net.transparent = true;
        out.net.opacity = 0.75;
        out.underwater = new THREE.MeshStandardMaterial({
            color: scene.vessel, roughness: 0.9, metalness: 0, transparent: true, opacity: 0.45, depthWrite: false,
        });
        return out;
    }, [scene, hullColor]);
    useEffect(() => () => Object.values(materials).forEach(m => m.dispose()), [materials]);

    const awa = windData?.awa ?? 0.6;
    const leeward = awa >= 0 ? -1 : 1;
    const mainCar = trim?.trimState?.mainCar ?? 0.5;
    const jibCar = trim?.trimState?.jibCar ?? 0.5;
    const travellerX = (mainCar - 0.5) * 2 * CAT_RIG.traveller.halfWidth;
    const boomAngle = boomAngleWithTraveller(awa, travellerX, CAT_RIG.mainsheetOnBoom) * leeward;
    const sails = useMemo(
        () => chooseSails(windData?.tws, windData?.twa, configService.get('sailPlanOverride')),
        [windData?.tws, windData?.twa]
    );
    const rudder = useSignalKPath('steering.rudderAngle', 0) || 0;
    const [gx, gy, gz] = CAT_RIG.gooseneck;

    return (
        <group>
            {['hull', 'deck', 'roof', 'glass', 'stripes', 'net', 'rig'].map(name => (
                <mesh key={name} geometry={nodes[name].geometry} material={materials[name]} />
            ))}
            {outlines.map((points, i) => <Line key={i} points={points} color={scene.rigging} lineWidth={1.5} />)}
            <mesh geometry={nodes.boards.geometry} material={materials.underwater} renderOrder={1} />
            <group position={[gx, gy, gz]} rotation={[0, boomAngle, 0]}>
                <mesh geometry={nodes.boom.geometry} material={materials.boom} position={[-gx, -gy, -gz]} />
            </group>
            {/* A rudder per hull, trailing edge to starboard for + angles */}
            {['port', 'starboard'].map((side) => {
                const { pivot } = CAT_RIG.rudders[side];
                return (
                    <group key={side} position={pivot} rotation={[0, -rudder, 0]}>
                        <mesh geometry={nodes[`rudder_${side}`].geometry} material={materials.underwater} position={pivot.map(v => -v)} renderOrder={1} />
                    </group>
                );
            })}
            {showSail && (
                <SailPlan awa={awa} boomAngle={boomAngle} sails={sails} trim={trim} rig={CAT_RIG}
                    mainCarAt={mainCarSheave(mainCar, layout)} jibCarAt={jibCarSheave(leeward, jibCar, layout)} />
            )}
            <DeckTrim mainCar={mainCar} jibCar={jibCar} leeward={leeward} layout={layout} />
        </group>
    );
};

export default CatamaranBoat;
