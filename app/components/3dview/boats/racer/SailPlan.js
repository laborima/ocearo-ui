import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Billboard, Line, Text } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import useTheme from '../../../theme/useTheme';
import { tintForTheme } from '../../../theme/themes';
import { tensionToColor } from '../../sail/SailTrimUtils';
import { RIG } from './rig';
import { makeSailGeometry } from './sailGeometry';

export { makeSailGeometry };

const DEG = Math.PI / 180;
const v3 = (a) => new THREE.Vector3(...a);
const UP = new THREE.Vector3(0, 1, 0);

/**
 * Boom angle from the sheet for the apparent wind, eased so the main meets
 * the wind at a small angle of attack: close-hauled 4°, run 80°
 */
export const boomAngleFor = (awa) => {
    const a = Math.abs(awa || 0);
    return Math.min(80 * DEG, Math.max(4 * DEG, a - 26 * DEG));
};

/**
 * Boom angle off the centreline with the traveller: easing the car to
 * leeward opens the boom, pulling it to windward closes it (down to the
 * centreline in light air).
 *
 * @param {number} awa - apparent wind angle, rad
 * @param {number} travellerX - car position, m (+ = starboard)
 * @param {number} [sheetOnBoom] - mainsheet attachment, m from the gooseneck
 */
export const boomAngleWithTraveller = (awa, travellerX = 0, sheetOnBoom = RIG.mainsheetOnBoom) => {
    const leeward = (awa || 0) >= 0 ? -1 : 1;
    const toLeeward = (travellerX || 0) * leeward;
    const angle = boomAngleFor(awa) + Math.atan2(toLeeward, sheetOnBoom) * 0.8;
    return Math.max(-1 * DEG, Math.min(80 * DEG, angle));
};

// Headsail cuts: hoist along the stay, overlap (LP / J), clew height
const HEADSAIL_CUTS = {
    J1: { hoist: 0.97, lp: 1.05, clewHeight: 0.35, camber: 0.13 },
    J2: { hoist: 0.95, lp: 0.95, clewHeight: 0.55, camber: 0.11 },
    J3: { hoist: 0.82, lp: 0.82, clewHeight: 0.9, camber: 0.09 },
    staysail: { hoist: 0.95, lp: 0.75, clewHeight: 0.7, camber: 0.09, inner: true },
};
const REEF_DROP = 1.35; // m of luff per reef
const STRIPES = [0.25, 0.5, 0.75];

// Trim model behind the telltales (simulated from the drawn sails and the
// wind, not measured): the apparent wind veers aloft by WIND_GRADIENT over
// the luff, so a sail needs about that much twist. Too little twist and the
// top stalls first; too much and the top luffs first.
const WIND_GRADIENT = 12 * DEG;
const TWIST_SENSITIVITY = 3;
const TARGET_AOA = 2 * DEG;
// Main in the jib's upwash: it sees a narrower wind angle
const MAIN_HEADER = 12 * DEG;
const entryAngle = (camber, k) => Math.atan(4 * camber) * k;

/**
 * Flow at each stripe height from the angle of attack of the luff:
 * 'luffing' (windward telltale lifts), 'stalled' (leeward telltale breaks)
 * or 'flowing'.
 *
 * @param {number} mid - angle of attack at mid height, rad
 * @param {number} twist - sail twist over the luff, rad
 */
const flowStates = (mid, twist) => STRIPES.map((v) => {
    const aoa = mid + (WIND_GRADIENT - twist) * (v - 0.5) * TWIST_SENSITIVITY;
    if (aoa < -3 * DEG) return 'luffing';
    if (aoa > 8 * DEG) return 'stalled';
    return 'flowing';
});

/**
 * One telltale: a short ribbon from its attachment, streaming aft along the
 * chord, lifting up when the sail luffs, curling forward when it stalls.
 */
const telltalePoints = (origin, chord, normal, state, side) => {
    const aft = chord.clone().normalize();
    const len = 0.6;
    let dir;
    if (state === 'flowing') dir = aft.clone().addScaledVector(UP, -0.08);
    else if ((state === 'luffing' && side < 0) || (state === 'stalled' && side > 0)) {
        // Broken on this face: lifts and twists back towards the luff
        dir = aft.clone().multiplyScalar(-0.2).addScaledVector(UP, side < 0 ? 0.9 : -0.9).addScaledVector(normal, side * 0.4);
    } else dir = aft.clone().addScaledVector(UP, -0.15);
    dir.normalize();
    const start = origin.clone().addScaledVector(normal, side * 0.05);
    const wiggle = state === 'flowing' ? 0.02 : 0.08;
    return [0, 1, 2, 3].map(i => start.clone()
        .addScaledVector(dir, len * i / 3)
        .addScaledVector(normal, side * wiggle * Math.sin(i * 1.7))
        .toArray());
};

const SailMesh = ({ geometry, color, opacity, edge, stripe, accent, label, labelOutline }) => {
    useEffect(() => () => geometry.dispose(), [geometry]);
    const mid = geometry.userData.stripes?.[Math.floor((geometry.userData.stripes.length - 1) / 2)];
    return (
        <group>
            <mesh geometry={geometry} renderOrder={3}>
                <meshLambertMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <Line points={geometry.userData.outline} color={edge} lineWidth={1.5} transparent opacity={0.9} />
            {/* Draft stripes, the deepest point marked */}
            {geometry.userData.stripes?.map(s => (
                <group key={s.v}>
                    <Line points={s.lee} color={stripe} lineWidth={2} />
                    <Line points={s.windward} color={stripe} lineWidth={2} />
                    <mesh position={s.deepest} renderOrder={4}>
                        <sphereGeometry args={[0.09, 10, 8]} />
                        <meshBasicMaterial color={accent} />
                    </mesh>
                </group>
            ))}
            {label && mid && (
                <Billboard position={mid.deepest.clone().addScaledVector(mid.frame.normal, 0.5).toArray()}>
                    {/* Drawn over the sails so a sail in front never hides it */}
                    <Text fontSize={0.5} color={stripe} anchorX="center" anchorY="middle" renderOrder={10}
                        material-depthTest={false} material-transparent
                        font="fonts/Roboto-Bold.ttf" outlineWidth={0.04} outlineColor={labelOutline}>
                        {label}
                    </Text>
                </Billboard>
            )}
        </group>
    );
};

/**
 * Wordmark printed on the spinnaker, on both faces (each one reads the right
 * way round from its side).
 */
const SailLogo = ({ geometry, color }) => {
    const placements = useMemo(() => {
        const { point, normal } = geometry.userData.frameAt(0.62, 0.45);
        return [1, -1].map((side) => {
            // Facing out of this face, upright, reading left to right
            const z = normal.clone().multiplyScalar(side).setY(0).normalize();
            const y = UP.clone();
            const x = new THREE.Vector3().crossVectors(y, z).normalize();
            const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
            return { position: point.clone().addScaledVector(z, 0.06).toArray(), quaternion: q };
        });
    }, [geometry]);
    return placements.map(({ position, quaternion }, i) => (
        <Text key={i} position={position} quaternion={quaternion} fontSize={1.8} letterSpacing={0.12}
            color={color} anchorX="center" anchorY="middle" font="fonts/Roboto-Bold.ttf">
            OCEARO
        </Text>
    ));
};

/** Telltales on a sail: pairs (windward / leeward faces) at each stripe */
const Telltales = ({ geometry, at, states, colors }) => (
    <group>
        {geometry.userData.stripes.map((s, i) => {
            const origin = s.point(at);
            return [1, -1].map(side => (
                <Line key={`${s.v}${side}`}
                    points={telltalePoints(origin, s.frame.chord, s.frame.normal, states[i], side)}
                    color={side > 0 ? colors.lee : colors.windward} lineWidth={3} />
            ));
        })}
    </group>
);

/**
 * Cruiser-racer sail plan, drawn to trim by: main (reefed by the wind) and
 * the headsail for the wind (J1, J2, J3, staysail or asymmetric spinnaker on
 * the bowsprit), with draft stripes and the depth / draft position, telltales
 * on the headsail luff and the main leech, the jib sheet to its car, and the
 * vang / mainsheet coloured by load.
 *
 * @param {number} awa - apparent wind angle, rad (+ = from starboard)
 * @param {number} boomAngle - boom angle off the centreline, rad (signed)
 * @param {{headsail: string, reef: number}} sails
 * @param {Object} [trim] - sailTrimData (camber, twist, tensions, trimState)
 * @param {number[]} mainCarAt - mainsheet car sheave [x, y, z] on the traveller
 * @param {number[]} jibCarAt - jib car sheave [x, y, z] on the leeward track
 * @param {Object} [rig] - rig geometry (see racer/rig.js), the racer's by default
 */
const SailPlan = ({ awa = 0.6, boomAngle, sails, trim, mainCarAt, jibCarAt, rig = RIG }) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const { scene, accent } = theme;
    // Wind from starboard -> sails to port
    const leeward = (awa || 0) >= 0 ? -1 : 1;
    const boom = boomAngle ?? boomAngleFor(awa) * leeward;
    const reef = sails?.reef ?? 0;
    const headsail = sails?.headsail ?? 'J2';
    const jibCar = trim?.trimState?.jibCar ?? 0.5;
    const tension = trim?.trimState?.tension ?? 0.5;
    // Trim model camber (0..1) to depth / chord around the sail's design depth
    const depthFor = (design, c) => design * (0.55 + 0.8 * (c ?? 0.55));
    const mainCamber = depthFor(0.11, trim?.mainCamber);
    // Mainsheet / vang tension closes the leech; the jib car aft opens it
    const mainTwist = (2 + 20 * (1 - tension)) * DEG;
    const cut = HEADSAIL_CUTS[headsail] || HEADSAIL_CUTS.J2;
    const jibCamber = depthFor(cut.camber, trim?.jibCamber);
    const jibTwist = (2 + 20 * jibCar) * DEG;
    const wind = Math.abs(awa || 0);
    // Jib sheeted for the target angle of attack at mid height when its twist
    // matches the wind gradient; it cannot be sheeted closer than 7°
    // (pinching shows on the windward telltales) or eased past 40°
    const jibEntry = entryAngle(jibCamber, 0.7);
    const jibSheetAngle = Math.max(7 * DEG, Math.min(40 * DEG, wind - jibEntry - TARGET_AOA));

    const geometry = useMemo(() => {
        const gooseneck = v3(rig.gooseneck);
        const boomDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(UP, boom);
        const clew = gooseneck.clone().addScaledVector(boomDir, rig.boomLength - 0.15).add(new THREE.Vector3(0, 0.12, 0));
        // Reefing lowers the head down the (raked) mast
        const mastDir = v3(rig.masthead).sub(v3(rig.mastFoot)).normalize();
        const head = v3(rig.masthead).addScaledVector(mastDir, -0.25 - reef * REEF_DROP);
        const main = makeSailGeometry({
            tack: gooseneck.clone().add(new THREE.Vector3(0, 0.15, 0)),
            head,
            clew,
            headWidth: reef === 0 ? 0.9 : 0.5,
            camber: mainCamber,
            draft: 0.45,
            twist: mainTwist,
            leeward,
            stripes: STRIPES,
        });

        let fore;
        let jibClew = null;
        if (headsail === 'spi') {
            const tack = v3(rig.bowsprit);
            const spiHead = v3(rig.hounds).add(new THREE.Vector3(0, -0.3, -0.1));
            // Clew well aft and outboard, eased with the apparent wind
            const ease = Math.min(1, Math.abs(awa || 0) / Math.PI);
            const sp = rig.spiClew ?? { out: 4.2, y: 2.6, z: 1.8 };
            const spiClew = new THREE.Vector3(leeward * (sp.out + 1.5 * ease), sp.y, sp.z - 1.5 * ease);
            // A big, full asymmetric: round shoulders, deep, foot curved down
            fore = makeSailGeometry({
                tack, head: spiHead, clew: spiClew, headWidth: 0.6, camber: 0.34, draft: 0.45, twist: 0.2, leeward,
                leechRound: 2.2, footRound: 0.9, rows: 20, cols: 18, stripes: STRIPES,
            });
        } else {
            const tack = v3(cut.inner ? rig.innerStayTack : rig.forestayTack);
            const top = v3(cut.inner ? rig.innerHounds : rig.hounds);
            const head = tack.clone().lerp(top, cut.hoist);
            const j = Math.abs(top.z - tack.z) || 6;
            const back = j * cut.lp;
            jibClew = new THREE.Vector3(leeward * Math.tan(jibSheetAngle) * back, tack.y + cut.clewHeight, tack.z + back);
            fore = makeSailGeometry({ tack, head, clew: jibClew, camber: jibCamber, draft: 0.38, twist: jibTwist, leeward, stripes: STRIPES });
        }
        return { main, fore, clew, gooseneck, jibClew };
    }, [awa, boom, reef, headsail, leeward, cut, mainCamber, mainTwist, jibCamber, jibTwist, jibSheetAngle, rig]);

    // Flow at each stripe: jib luff and main leech
    const jibStates = flowStates(wind + WIND_GRADIENT / 2 - (jibSheetAngle + jibTwist / 2 + jibEntry), jibTwist);
    const mainStates = flowStates(
        wind - MAIN_HEADER + WIND_GRADIENT / 2 - (Math.abs(boom) + mainTwist / 2 + entryAngle(mainCamber, 0.5)), mainTwist);

    // Load colours from the trim model, tinted red at night
    const loadColor = (x) => {
        const { r, g, b } = tensionToColor(x ?? 0.3);
        return `#${tintForTheme(theme, new THREE.Color(r, g, b)).getHexString()}`;
    };
    const telltaleColors = {
        // Port face red, starboard face green, as on real telltales
        lee: leeward > 0 ? scene.laylineStarboard : scene.laylinePort,
        windward: leeward > 0 ? scene.laylinePort : scene.laylineStarboard,
    };
    const vangFoot = v3(rig.mastFoot).add(new THREE.Vector3(0, 0.3, 0.15));
    const vangBoom = geometry.gooseneck.clone().lerp(geometry.clew, 0.3);
    // Mainsheet: boom point above the traveller down to the car
    const sheetOnBoom = geometry.gooseneck.clone().add(new THREE.Vector3(0, 0, rig.mainsheetOnBoom).applyAxisAngle(UP, boom));
    const traveller = mainCarAt ?? [0, rig.traveller.y + 0.2, rig.traveller.z];
    const pct = (x) => Math.round(x * 100);
    const isSpi = headsail === 'spi';
    // Backstay (split to the quarters when the rig has a bridle), coloured by load
    const backstay = rig.backstay && [
        [rig.masthead, rig.backstay.split],
        ...rig.backstay.ends.map(end => [rig.backstay.split, end]),
    ];

    return (
        <group>
            <SailMesh geometry={geometry.main} color={scene.sail} opacity={0.85} edge={scene.rigging} stripe={scene.compass} accent={accent} labelOutline={scene.background}
                label={`${t('hud.sailDepth')} ${pct(mainCamber)}%`} />
            <SailMesh geometry={geometry.fore} color={isSpi ? scene.route : scene.sail} opacity={isSpi ? 0.7 : 0.85}
                edge={isSpi ? scene.route : scene.rigging} stripe={scene.compass} accent={accent} labelOutline={scene.background}
                label={isSpi ? null : `${t('hud.sailDepth')} ${pct(jibCamber)}%`} />
            {!isSpi && <Telltales geometry={geometry.fore} at={0.12} states={jibStates} colors={telltaleColors} />}
            <Telltales geometry={geometry.main} at={0.97} states={mainStates} colors={telltaleColors} />
            {/* Jib sheet from the clew to its car: the sheeting angle */}
            {geometry.jibClew && jibCarAt && (
                <Line points={[geometry.jibClew.toArray(), jibCarAt]} color={loadColor(trim?.tensions?.jibSheet)} lineWidth={2.5} />
            )}
            {isSpi && <SailLogo geometry={geometry.fore} color={scene.sail} />}
            {backstay && backstay.map((points, i) => (
                <Line key={i} points={points} color={loadColor(trim?.tensions?.backstay)} lineWidth={2.5} />
            ))}
            {/* Vang and mainsheet, coloured by load */}
            <Line points={[vangFoot.toArray(), vangBoom.toArray()]} color={loadColor(trim?.tensions?.vang)} lineWidth={2.5} />
            <Line points={[sheetOnBoom.toArray(), traveller]} color={loadColor(trim?.tensions?.mainSheet)} lineWidth={2.5} />
        </group>
    );
};

export default SailPlan;
