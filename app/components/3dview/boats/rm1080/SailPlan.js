import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import useTheme from '../../../theme/useTheme';
import { tintForTheme } from '../../../theme/themes';
import { tensionToColor } from '../../sail/SailTrimUtils';
import { RIG } from './rig';

const DEG = Math.PI / 180;
const v3 = (a) => new THREE.Vector3(...a);
const UP = new THREE.Vector3(0, 1, 0);

/**
 * Cambered sail between a luff (bottom -> top) and a leech (clew -> head).
 *
 * @param {Object} p
 * @param {THREE.Vector3} p.tack / p.head - luff ends
 * @param {THREE.Vector3} p.clew
 * @param {number} p.headWidth - chord at the head (square-top main), m
 * @param {number} p.camber - depth / chord
 * @param {number} p.draft - position of the deepest point along the chord (0..1)
 * @param {number} p.twist - leech opening at the head, rad
 * @param {number} p.leeward - +1 bulges to starboard, -1 to port
 */
export const makeSailGeometry = ({ tack, head, clew, headWidth = 0, camber = 0.1, draft = 0.4, twist = 0.1, leeward = 1, rows = 14, cols = 10 }) => {
    const positions = [];
    const footChord = clew.clone().sub(tack);
    const headDir = footChord.clone().setY(0).normalize();
    const headClew = head.clone().addScaledVector(headDir, headWidth);
    // Exponent so that sin(PI * u^k) peaks at u = draft
    const k = Math.log(0.5) / Math.log(draft);

    for (let r = 0; r <= rows; r++) {
        const v = r / rows;
        const luff = tack.clone().lerp(head, v);
        const leech = clew.clone().lerp(headClew, v);
        const chord = leech.clone().sub(luff);
        // Twist: the leech opens to leeward with height
        chord.applyAxisAngle(UP, -leeward * twist * v);
        const len = chord.length();
        const normal = new THREE.Vector3().crossVectors(UP, chord).normalize();
        if (Math.sign(normal.x || 1) !== Math.sign(leeward)) normal.negate();
        for (let c = 0; c <= cols; c++) {
            const u = c / cols;
            const depth = camber * len * Math.sin(Math.PI * u ** k) * (1 - 0.35 * v);
            const p = luff.clone().addScaledVector(chord, u).addScaledVector(normal, depth);
            positions.push(p.x, p.y, p.z);
        }
    }
    const index = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const a = r * (cols + 1) + c;
            const b = a + cols + 1;
            index.push(a, b, a + 1, a + 1, b, b + 1);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(index);
    geo.computeVertexNormals();
    // Outline (foot, leech, luff) so a translucent white sail still reads on a white scene
    const at = (r, c) => { const i = (r * (cols + 1) + c) * 3; return [positions[i], positions[i + 1], positions[i + 2]]; };
    const outline = [];
    for (let c = 0; c <= cols; c++) outline.push(at(0, c));
    for (let r = 1; r <= rows; r++) outline.push(at(r, cols));
    for (let c = cols - 1; c >= 0; c--) outline.push(at(rows, c));
    for (let r = rows - 1; r >= 0; r--) outline.push(at(r, 0));
    geo.userData.outline = outline;
    return geo;
};

/** Boom / sheet angle from the apparent wind: close-hauled 4°, run 80° */
export const boomAngleFor = (awa) => {
    const a = Math.abs(awa || 0);
    return Math.min(80 * DEG, Math.max(4 * DEG, (a - 25 * DEG) * 0.62));
};

// Headsail cuts: hoist along the stay, overlap (LP / J), clew height
const HEADSAIL_CUTS = {
    J1: { hoist: 0.97, lp: 1.05, clewHeight: 0.35, camber: 0.13 },
    J2: { hoist: 0.95, lp: 0.95, clewHeight: 0.55, camber: 0.11 },
    J3: { hoist: 0.82, lp: 0.82, clewHeight: 0.9, camber: 0.09 },
    staysail: { hoist: 0.95, lp: 0.75, clewHeight: 0.7, camber: 0.09, inner: true },
};
const REEF_DROP = 1.35; // m of luff per reef

const SailMesh = ({ geometry, color, opacity, edge }) => {
    useEffect(() => () => geometry.dispose(), [geometry]);
    return (
        <group>
            <mesh geometry={geometry} renderOrder={3}>
                <meshLambertMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <Line points={geometry.userData.outline} color={edge} lineWidth={1.5} transparent opacity={0.8} />
        </group>
    );
};

/**
 * RM 1080 sail plan: main (reefed by the wind), the headsail for the wind
 * (J1, J2, J3, staysail or asymmetric spinnaker on the bowsprit), boom swung
 * to leeward, and the vang / mainsheet coloured by load. Sails are
 * translucent so AIS targets and the scene stay visible behind them.
 *
 * @param {number} awa - apparent wind angle, rad (+ = from starboard)
 * @param {{headsail: string, reef: number}} sails
 * @param {Object} [trim] - sailTrimData (camber, twist, tensions)
 */
const SailPlan = ({ awa = 0.6, sails, trim }) => {
    const theme = useTheme();
    const { scene } = theme;
    // Wind from starboard -> sails to port
    const leeward = (awa || 0) >= 0 ? -1 : 1;
    const boomAngle = boomAngleFor(awa) * leeward;
    const reef = sails?.reef ?? 0;
    const headsail = sails?.headsail ?? 'J2';

    const geometry = useMemo(() => {
        const gooseneck = v3(RIG.gooseneck);
        const boomDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(UP, boomAngle);
        const clew = gooseneck.clone().addScaledVector(boomDir, RIG.boomLength - 0.15).add(new THREE.Vector3(0, 0.12, 0));
        // Reefing lowers the head down the (raked) mast
        const mastDir = v3(RIG.masthead).sub(v3(RIG.mastFoot)).normalize();
        const head = v3(RIG.masthead).addScaledVector(mastDir, -0.25 - reef * REEF_DROP);
        const main = makeSailGeometry({
            tack: gooseneck.clone().add(new THREE.Vector3(0, 0.15, 0)),
            head,
            clew,
            headWidth: reef === 0 ? 0.9 : 0.5,
            camber: (trim?.mainCamber ?? 1) * 0.1,
            twist: 0.08 + (trim?.mainTwist ?? 0.1) * 0.5,
            leeward,
        });

        let fore;
        if (headsail === 'spi') {
            const tack = v3(RIG.bowsprit);
            const spiHead = v3(RIG.hounds).add(new THREE.Vector3(0, -0.3, -0.1));
            // Clew well aft and outboard, eased with the apparent wind
            const ease = Math.min(1, Math.abs(awa || 0) / Math.PI);
            const spiClew = new THREE.Vector3(leeward * (4.2 + 1.5 * ease), 2.6, 1.8 - 1.5 * ease);
            fore = makeSailGeometry({ tack, head: spiHead, clew: spiClew, camber: 0.24, draft: 0.45, twist: 0.25, leeward });
        } else {
            const cut = HEADSAIL_CUTS[headsail] || HEADSAIL_CUTS.J2;
            const tack = v3(cut.inner ? RIG.innerStayTack : RIG.forestayTack);
            const top = v3(cut.inner ? RIG.innerHounds : RIG.hounds);
            const head = tack.clone().lerp(top, cut.hoist);
            const j = Math.abs(top.z - tack.z) || 6;
            const sheet = (8 + Math.max(0, Math.abs(awa || 0) / DEG - 30) * 0.45) * DEG;
            const back = j * cut.lp;
            const clew = new THREE.Vector3(leeward * Math.tan(Math.min(sheet, 32 * DEG)) * back, tack.y + cut.clewHeight, tack.z + back);
            fore = makeSailGeometry({
                tack, head, clew,
                camber: (trim?.jibCamber ?? 1) * cut.camber,
                twist: 0.06 + (trim?.jibTwist ?? 0.1) * 0.4,
                leeward,
            });
        }
        return { main, fore, clew, gooseneck };
    }, [awa, boomAngle, reef, headsail, leeward, trim?.mainCamber, trim?.mainTwist, trim?.jibCamber, trim?.jibTwist]);

    // Load colours from the trim model, tinted red at night
    const loadColor = (t) => {
        const { r, g, b } = tensionToColor(t ?? 0.3);
        return `#${tintForTheme(theme, new THREE.Color(r, g, b)).getHexString()}`;
    };
    const vangFoot = v3(RIG.mastFoot).add(new THREE.Vector3(0, 0.3, 0.15));
    const vangBoom = geometry.gooseneck.clone().lerp(geometry.clew, 0.3);
    const traveller = new THREE.Vector3(Math.sin(boomAngle) * 0.9, RIG.traveller.y, RIG.traveller.z);

    return (
        <group>
            <SailMesh geometry={geometry.main} color={scene.sail} opacity={0.4} edge={scene.rigging} />
            <SailMesh geometry={geometry.fore} color={headsail === 'spi' ? scene.route : scene.sail} opacity={headsail === 'spi' ? 0.3 : 0.4} edge={headsail === 'spi' ? scene.route : scene.rigging} />
            {/* Vang and mainsheet, coloured by load */}
            <Line points={[vangFoot.toArray(), vangBoom.toArray()]} color={loadColor(trim?.tensions?.vang)} lineWidth={2.5} />
            <Line points={[geometry.clew.toArray(), traveller.toArray()]} color={loadColor(trim?.tensions?.mainSheet)} lineWidth={2.5} />
        </group>
    );
};

export default SailPlan;
