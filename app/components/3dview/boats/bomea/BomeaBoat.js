import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import useTheme from '../../../theme/useTheme';
import configService from '../../../settings/ConfigService';
import { useSignalKPath } from '../../../hooks/useSignalK';
import SailPlan, { boomAngleWithTraveller } from '../racer/SailPlan';
import DeckTrim, { jibCarSheave, mainCarSheave, trimLayout } from '../racer/DeckTrim';
import { chooseSails } from '../racer/rig';
import { fetchModelFile } from '../../../services/BomeaService';

/**
 * A boat imported from Bomea (Settings, Vessel, Find on Bomea): its glTF,
 * cached in the browser, shown at its real size, with Ocearo's live sails,
 * telltales and trim hardware on its own rig.
 *
 * Bomea models are in metres, Y up, bow towards +X; a quarter turn puts the
 * bow towards -Z like every Ocearo boat. Their parts are named
 * "part:<slug>#<role>" (hull, keel, rudder, mast, boom, forestay, backstay,
 * main, genoa…): the rig is measured on those parts, Bomea's fixed sails are
 * hidden (Ocearo draws its own from the wind), the boom swings and the rudder
 * turns with the helm.
 */

const ROLE = /#([a-z]+)/i;
const SAILS = /^(main|mainsail|genoa|jib|gennaker|spinnaker|sails?|lazybag)$/i;
const role = (o) => (ROLE.exec(o.name || '')?.[1] || '').toLowerCase();

/** Bomea frame → Ocearo frame (bow +X → -Z, starboard +Z → +X) */
const toO = (v) => [v.z, v.y, -v.x];

const boxOf = (root, test) => {
    const box = new THREE.Box3();
    root.traverse((o) => { if (o !== root && test(o)) box.expandByObject(o); });
    return box.isEmpty() ? null : box;
};

/**
 * Rig geometry in Ocearo's boat frame, measured on the model's named parts,
 * with the same keys as the racer's RIG; missing parts are estimated from the
 * hull and the published I, J, P, E.
 */
export const measureRig = (root, spec = {}) => {
    root.updateMatrixWorld(true);
    const hull = boxOf(root, (o) => o.isMesh) || new THREE.Box3(new THREE.Vector3(-5, -1.5, -1.6), new THREE.Vector3(5, 1, 1.6));
    const by = (r) => boxOf(root, (o) => role(o) === r || (o.parent && role(o.parent) === r));
    const mast = by('mast'), boom = by('boom'), stay = by('forestay'), back = by('backstay'), rudder = by('rudder');
    const deckY = Math.max(0.6, Math.min(hull.max.y, 1.6));
    const L = hull.max.x - hull.min.x;
    const mastX = mast ? (mast.min.x + mast.max.x) / 2 : hull.max.x - L * 0.42;
    const I = spec.I || (mast ? mast.max.y - mast.min.y : 1.3 * L);
    const foot = new THREE.Vector3(mastX, mast ? mast.min.y : deckY, 0);
    const head = new THREE.Vector3(mastX, mast ? mast.max.y : deckY + I * 1.1, 0);
    const hounds = stay ? new THREE.Vector3(stay.min.x, stay.max.y, 0) : new THREE.Vector3(mastX, foot.y + I, 0);
    const tack = stay ? new THREE.Vector3(stay.max.x, stay.min.y, 0) : new THREE.Vector3(Math.min(hull.max.x - 0.2, mastX + (spec.J || 0.33 * I)), deckY, 0);
    const goose = boom ? new THREE.Vector3(boom.max.x, (boom.min.y + boom.max.y) / 2, 0) : new THREE.Vector3(mastX - 0.1, foot.y + 1.2, 0);
    const boomLength = boom ? boom.max.x - boom.min.x : (spec.E || 0.36 * I);
    const lerp = (a, b, f) => a.clone().lerp(b, f);
    const stern = new THREE.Vector3(hull.min.x + 0.25, deckY, 0);
    const halfBeam = Math.max(0.6, (hull.max.z - hull.min.z) / 2);
    // Main traveller near the boom end, over the cockpit; jib tracks along the side decks abreast of the mast
    const boomEnd = goose.x - boomLength;
    const rigO = {
        mastFoot: toO(foot), masthead: toO(head), hounds: toO(hounds), gooseneck: toO(goose), boomLength,
        forestayTack: toO(tack), innerHounds: toO(lerp(foot, hounds, 0.78)), innerStayTack: toO(lerp(tack, foot, 0.35).setY(deckY)),
        bowsprit: toO(new THREE.Vector3(tack.x + 0.6, tack.y, 0)),
        traveller: { z: -(boomEnd + 0.35), y: deckY - 0.25, halfWidth: Math.min(1.1, halfBeam * 0.55) },
        jibTrack: { x: halfBeam * 0.82, zFwd: -(mastX + 0.2), zAft: -(mastX - Math.max(1, L * 0.12)) },
        mainsheetOnBoom: Math.max(0.5, boomLength - 0.35),
        spiClew: { out: halfBeam * 2.6, y: deckY + 1.6, z: -(stern.x + L * 0.15) },
    };
    if (back) rigO.backstay = { split: toO(new THREE.Vector3(back.min.x + 0.1, back.min.y + 0.1, 0)), ends: [toO(new THREE.Vector3(back.min.x, back.min.y, 0))] };
    else rigO.backstay = { split: toO(lerp(stern, head, 0.15)), ends: [toO(stern)] };
    // Rudder stock: top of the blade, a quarter of its chord behind its leading edge
    const r = rudder ? new THREE.Vector3(rudder.max.x - (rudder.max.x - rudder.min.x) * 0.25, rudder.max.y, (rudder.min.z + rudder.max.z) / 2) : null;
    return { rig: rigO, rudderPivot: r, deckY, halfBeam, length: L, hullBox: hull };
};

/** Deck shape for the trim hardware: an elliptic deck edge and a flat deck at the measured height. */
const deckOf = (m) => ({
    edgeAt: (z) => {
        const u = Math.max(-1, Math.min(1, (z + (m.hullBox.min.x + m.hullBox.max.x) / 2) / (m.length / 2)));
        return m.halfBeam * Math.sqrt(Math.max(0.05, 1 - u * u));
    },
    heightAt: () => m.deckY,
});

const BomeaHull = ({ url, boat, hullColor, alert, windData, trim, showSail }) => {
    const { scene: gltf } = useGLTF(url);
    const { scene } = useTheme();
    const rudderAngle = useSignalKPath('steering.rudderAngle', 0) || 0;

    // A copy per mount (the cached scene may be shown twice, e.g. a ghost boat)
    const parts = useMemo(() => {
        const root = gltf.clone(true);
        root.traverse((o) => {
            if (SAILS.test(role(o))) o.visible = false;
            if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
        });
        const m = measureRig(root, boat?.bomea?.rig || {});
        // Boom and rudder move: each one hangs from a pivot at its gooseneck / stock
        const pivot = (r, at) => {
            if (!at) return null;
            const nodes = [];
            root.traverse((o) => { if (role(o) === r && !(o.parent && role(o.parent) === r)) nodes.push(o); });
            if (!nodes.length) return null;
            const p = new THREE.Group();
            p.position.copy(at);
            root.add(p);
            root.updateMatrixWorld(true);
            nodes.forEach((n) => p.attach(n));
            return p;
        };
        const g = m.rig.gooseneck;
        const boomPivot = pivot('boom', new THREE.Vector3(-g[2], g[1], g[0]));
        const rudderPivot = pivot('rudder', m.rudderPivot);
        return { root, m, boomPivot, rudderPivot };
    }, [gltf, boat]);

    // Hull colour: the user's or the theme's own-boat colour on the hull and deck, matte like the other boats
    useEffect(() => {
        const color = new THREE.Color(hullColor || scene.ownHull);
        parts.root.traverse((o) => {
            if (!o.isMesh || !o.material) return;
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            o.material = mats.map((mt) => {
                const c = mt.clone();
                if (/^(hull|deck|cabin)$/.test(role(o.parent || o)) || /^(hull|deck|cabin)$/.test(role(o))) c.color = color.clone();
                if (alert && /^(hull)$/.test(role(o.parent || o))) c.color = new THREE.Color(scene.giveWay || '#ffa64d');
                if ('metalness' in c) c.metalness = Math.min(c.metalness, 0.1);
                if ('roughness' in c) c.roughness = Math.max(c.roughness, 0.7);
                return c;
            });
            if (o.material.length === 1) o.material = o.material[0];
        });
    }, [parts, hullColor, alert, scene]);

    const layout = useMemo(() => trimLayout(parts.m.rig, deckOf(parts.m)), [parts]);
    const awa = windData?.awa ?? 0.6;
    const leeward = awa >= 0 ? -1 : 1;
    const mainCar = trim?.trimState?.mainCar ?? 0.5;
    const jibCar = trim?.trimState?.jibCar ?? 0.5;
    const travellerX = (mainCar - 0.5) * 2 * parts.m.rig.traveller.halfWidth;
    const boomAngle = boomAngleWithTraveller(awa, travellerX, parts.m.rig.mainsheetOnBoom) * leeward;
    const sails = useMemo(
        () => chooseSails(windData?.tws, windData?.twa, configService.get('sailPlanOverride')),
        [windData?.tws, windData?.twa]
    );
    // The boom swings with the wind and the rudder turns with the helm (their pivots live inside the glTF scene)
    const pivots = useRef(null);
    useEffect(() => { pivots.current = { boom: parts.boomPivot, rudder: parts.rudderPivot }; }, [parts]);
    useEffect(() => {
        const p = pivots.current;
        if (p?.boom) p.boom.rotation.y = boomAngle;
        if (p?.rudder) p.rudder.rotation.y = -rudderAngle;
    }, [parts, boomAngle, rudderAngle]);
    const sail = boat?.capabilities?.includes('sail');

    return (
        <group>
            {/* Bomea's frame: bow towards +X → Ocearo's: bow towards -Z */}
            <primitive object={parts.root} rotation={[0, Math.PI / 2, 0]} />
            {sail && showSail && (
                <SailPlan awa={awa} boomAngle={boomAngle} sails={sails} trim={trim} rig={parts.m.rig}
                    mainCarAt={mainCarSheave(mainCar, layout)} jibCarAt={jibCarSheave(leeward, jibCar, layout)} />
            )}
            {sail && <DeckTrim mainCar={mainCar} jibCar={jibCar} leeward={leeward} layout={layout} />}
        </group>
    );
};

const BomeaBoat = (props) => {
    const b = props.boat?.bomea;
    const [url, setUrl] = useState(null);
    useEffect(() => {
        let alive = true, made = null;
        if (b?.url) fetchModelFile(b.url, b.version).then((u) => { made = u; if (alive) setUrl(u); });
        return () => { alive = false; if (made) URL.revokeObjectURL(made); };
    }, [b?.url, b?.version]);
    if (!url) return null;
    return <BomeaHull {...props} url={url} />;
};

export default BomeaBoat;
