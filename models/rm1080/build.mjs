/**
 * Builds public/boats/rm1080/assets/scene-transformed.glb from the builder's RM 1080 model.
 *
 * The source (~1 M triangles, CAD export) is far too heavy for a Raspberry Pi.
 * This script, run once on a developer machine, keeps the shape and brings it
 * to a few tens of thousands of triangles:
 *   - app frame: bow towards -Z, Y up, metres, origin at mid-length on the
 *     waterline (source: bow towards +X, stern at x = -10.8)
 *   - named parts the app can colour and animate: hull, deck, nonslip, glass,
 *     fittings, rails, stripes, rig (mast + standing rigging), boom (split out
 *     of the mast so it can swing), and the three keel/rudder variants
 *   - the "Biquille Bisafran" variant is exported in millimetres and rotated:
 *     baked back to metres
 *   - per-part simplification (meshoptimizer), then Draco compression
 *
 * Tools only (not app dependencies). From this folder:
 *   npm i --no-save @gltf-transform/core @gltf-transform/functions \
 *         @gltf-transform/extensions meshoptimizer draco3dgltf
 *   node build.mjs <path/to/RM1080_Opti_GB_V2_OK.glb>
 */
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { weld, simplifyPrimitive, transformPrimitive, dedup, prune } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import { fileURLToPath } from 'url';
import path from 'path';

const SRC = process.argv[2];
const OUT = process.argv[3] || path.join(path.dirname(fileURLToPath(import.meta.url)), '../../public/boats/rm1080/assets/scene-transformed.glb');
if (!SRC) { console.error('usage: node build.mjs <source.glb> [out.glb]'); process.exit(1); }

// Source material -> app part, and how much detail to keep (fraction of triangles)
const PARTS = {
    '/Peinture coque': { part: 'hull', ratio: 0.35 },
    'Antifouling.001': { part: 'bottom', ratio: 0.5 },
    '/Composite blanc': { part: 'deck', ratio: 0.08 },
    '/Antidé grainé gris': { part: 'nonslip', ratio: 0.08 },
    'PMMA': { part: 'glass', ratio: 0.1 },
    '/Plastique noir': { part: 'fittings', ratio: 0.03 },
    'Balcon Inox': { part: 'rails', ratio: 0.02 },
    'Sérigraphie (Bande haute)': { part: 'stripes', ratio: 0.05 },
    'Sérigraphie (Bande haute_Latéral)': { part: 'stripes', ratio: 0.5 },
    'Sérigraphie (bande basse)': { part: 'stripes', ratio: 0.5 },
    '/Inox': { part: 'rig', ratio: 0.08 },
    'Métal': { part: 'rig', ratio: 0.5 },
    'Tissu': { part: 'fittings', ratio: 0.2 },
};
const DROP = new Set(['__DEFAULT', 'Peinture Coque+ Text']);
const KEELS = {
    'Monoquille Bisafran': 'keel_single_twinrudder',
    'Biquille Monosafran': 'keel_twin_singlerudder',
    'Biquille Bisafran': 'keel_twin_twinrudder',
};
// Boom: the part of the "Métal" primitive between these heights, aft of the mast
const BOOM = { yMin: 2.2, yMax: 3.0, xMax: -4.9 };
// Source -> app frame: shift to mid-length, then bow (+X) to -Z
const MID_X = -5.4;
const TO_APP = [ // column-major 4x4: x' = z, z' = -(x - MID_X)
    0, 0, -1, 0,
    0, 1, 0, 0,
    1, 0, 0, 0,
    0, 0, MID_X, 1,
];

const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'draco3d.encoder': await draco3d.createEncoderModule(), 'draco3d.decoder': await draco3d.createDecoderModule() });

const src = await io.read(SRC);
await src.transform(weld());
await MeshoptSimplifier.ready;

const out = new Document();
out.createBuffer();
const scene = out.createScene('rm1080');
const root = out.createNode('rm1080');
scene.addChild(root);

const materials = {};
const materialFor = (part, srcMat) => {
    if (!materials[part]) {
        const m = out.createMaterial(part)
            .setBaseColorFactor(srcMat.getBaseColorFactor())
            .setMetallicFactor(0).setRoughnessFactor(0.8);
        if (part === 'glass') m.setAlphaMode('BLEND').setBaseColorFactor([0.3, 0.35, 0.4, 0.5]);
        materials[part] = m;
    }
    return materials[part];
};

/** Copy a triangle subset of a source primitive into the output document */
const copyPrimitive = (prim, keepTriangle, matrix) => {
    const pos = prim.getAttribute('POSITION').getArray();
    const nrm = prim.getAttribute('NORMAL')?.getArray();
    const idx = prim.getIndices()?.getArray() ?? Array.from({ length: pos.length / 3 }, (_, i) => i);
    const remap = new Map();
    const p = [], n = [], ii = [];
    for (let t = 0; t < idx.length; t += 3) {
        const tri = [idx[t], idx[t + 1], idx[t + 2]];
        const v = tri.map(k => [pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]]);
        if (keepTriangle && !keepTriangle(v)) continue;
        for (const k of tri) {
            if (!remap.has(k)) {
                remap.set(k, p.length / 3);
                p.push(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
                if (nrm) n.push(nrm[k * 3], nrm[k * 3 + 1], nrm[k * 3 + 2]);
            }
            ii.push(remap.get(k));
        }
    }
    if (!ii.length) return null;
    const buffer = out.getRoot().listBuffers()[0];
    const q = out.createPrimitive()
        .setAttribute('POSITION', out.createAccessor().setType('VEC3').setArray(new Float32Array(p)).setBuffer(buffer))
        .setIndices(out.createAccessor().setType('SCALAR').setArray(new Uint32Array(ii)).setBuffer(buffer));
    if (nrm) q.setAttribute('NORMAL', out.createAccessor().setType('VEC3').setArray(new Float32Array(n)).setBuffer(buffer));
    if (matrix) transformPrimitive(q, matrix);
    return q;
};

/**
 * CAD exports are thousands of disconnected small parts (bolts, cleats, blocks)
 * that topology-preserving simplification cannot merge. The "sloppy" mode
 * ignores topology: fine for parts seen from a few metres away.
 */
const simplifySloppy = (prim, ratio) => {
    const pos = prim.getAttribute('POSITION').getArray();
    const idx = prim.getIndices().getArray();
    const target = Math.max(3, Math.floor((idx.length * ratio) / 3) * 3);
    if (target >= idx.length) return;
    const [next] = MeshoptSimplifier.simplifySloppy(Uint32Array.from(idx), pos, 3, null, target, 0.05);
    // Compact: keep only the vertices still referenced
    const nrm = prim.getAttribute('NORMAL')?.getArray();
    const remap = new Map();
    const p = [], n = [], ii = [];
    for (const k of next) {
        if (!remap.has(k)) {
            remap.set(k, p.length / 3);
            p.push(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
            if (nrm) n.push(nrm[k * 3], nrm[k * 3 + 1], nrm[k * 3 + 2]);
        }
        ii.push(remap.get(k));
    }
    prim.getAttribute('POSITION').setArray(new Float32Array(p));
    if (nrm) prim.getAttribute('NORMAL').setArray(new Float32Array(n));
    prim.getIndices().setArray(new Uint32Array(ii));
};

/** Merge vertices sharing a position (positions only) */
const weldPositions = (prim) => {
    const pos = prim.getAttribute('POSITION').getArray();
    const idx = prim.getIndices().getArray();
    const key = (i) => `${pos[i * 3].toFixed(4)},${pos[i * 3 + 1].toFixed(4)},${pos[i * 3 + 2].toFixed(4)}`;
    const first = new Map();
    const remap = new Uint32Array(pos.length / 3);
    const p = [];
    for (let v = 0; v < pos.length / 3; v++) {
        const k = key(v);
        if (!first.has(k)) { first.set(k, p.length / 3); p.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); }
        remap[v] = first.get(k);
    }
    prim.getAttribute('POSITION').setArray(new Float32Array(p));
    prim.getIndices().setArray(Uint32Array.from(idx, (i) => remap[i]));
};

/**
 * Drop the small disconnected pieces of a part (winches, cleats, bolts on the
 * deck): only shells larger than `minSize` metres are kept, so the deck reads
 * as clean surfaces.
 */
const removeSmallComponents = (prim, minSize) => {
    const pos = prim.getAttribute('POSITION').getArray();
    const idx = prim.getIndices().getArray();
    const parent = new Int32Array(pos.length / 3).map((_, i) => i);
    const find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
    for (let t = 0; t < idx.length; t += 3) {
        const a = find(idx[t]);
        parent[find(idx[t + 1])] = a;
        parent[find(idx[t + 2])] = a;
    }
    const box = new Map();
    for (let v = 0; v < pos.length / 3; v++) {
        const r = find(v);
        const b = box.get(r) || [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
        for (let k = 0; k < 3; k++) {
            b[k] = Math.min(b[k], pos[v * 3 + k]);
            b[k + 3] = Math.max(b[k + 3], pos[v * 3 + k]);
        }
        box.set(r, b);
    }
    const big = (r) => { const b = box.get(r); return Math.hypot(b[3] - b[0], b[4] - b[1], b[5] - b[2]) >= minSize; };
    const kept = [];
    for (let t = 0; t < idx.length; t += 3) if (big(find(idx[t]))) kept.push(idx[t], idx[t + 1], idx[t + 2]);
    prim.getIndices().setArray(new Uint32Array(kept));
};

// Parts that must keep a clean outline use the topology-preserving simplifier
const CLEAN = new Set(['hull', 'bottom', 'boom', 'glass', 'deck', 'nonslip']);

const meshes = {};
const add = (part, prim, srcMat, ratio) => {
    if (!prim) return;
    prim.setMaterial(materialFor(part, srcMat));
    if (part === 'deck' || part === 'nonslip') {
        removeSmallComponents(prim, 0.4);
        // Split normals at every crease stop vertices from merging: drop them,
        // weld positions, and let the app recompute smooth normals
        prim.setAttribute('NORMAL', null);
        weldPositions(prim);
    }
    if (CLEAN.has(part) || part.startsWith('keel')) {
        simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio, error: 0.03 });
    } else {
        simplifySloppy(prim, ratio);
    }
    if (!meshes[part]) {
        meshes[part] = out.createMesh(part);
        root.addChild(out.createNode(part).setMesh(meshes[part]));
    }
    meshes[part].addPrimitive(prim);
};

for (const node of src.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    // Bake the node's own transform (the mm / rotated keel variant) into the geometry
    const world = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
        const srcMat = prim.getMaterial();
        const name = srcMat?.getName();
        if (DROP.has(name)) continue;
        const keel = KEELS[node.getName()];
        if (keel) {
            // Rudders (aft of x = -8.5) become their own parts so they can turn:
            // <keel>_rudder_port / _starboard (twin) or _rudder_centre (single)
            const isRudder = (v) => v.every(([x]) => x < -8.5);
            // Bake the node transform first so the tests run in metres
            const baked = copyPrimitive(prim, null, world);
            const hull = copyPrimitive(baked, (v) => !isRudder(v));
            hull && transformPrimitive(hull, TO_APP);
            add(keel, hull, srcMat, 0.08);
            const sides = { port: (z) => z < -0.3, starboard: (z) => z > 0.3, centre: (z) => Math.abs(z) <= 0.3 };
            for (const [sideName, test] of Object.entries(sides)) {
                // Source +Z is the app's +X (starboard)
                const r = copyPrimitive(baked, (v) => isRudder(v) && v.every(([, , z]) => test(z)));
                if (!r) continue;
                transformPrimitive(r, TO_APP);
                add(`${keel}_rudder_${sideName}`, r, srcMat, 0.15);
            }
            continue;
        }
        const spec = PARTS[name];
        if (!spec) { console.warn('unmapped material', name); continue; }
        if (name === 'Métal') {
            const isBoom = (v) => v.every(([x, y]) => y > BOOM.yMin && y < BOOM.yMax && x < BOOM.xMax);
            const boom = copyPrimitive(prim, isBoom, world);
            boom && transformPrimitive(boom, TO_APP);
            add('boom', boom, srcMat, spec.ratio);
            const mast = copyPrimitive(prim, (v) => !isBoom(v), world);
            mast && transformPrimitive(mast, TO_APP);
            add(spec.part, mast, srcMat, spec.ratio);
            continue;
        }
        const q = copyPrimitive(prim, null, world);
        q && transformPrimitive(q, TO_APP);
        add(spec.part, q, srcMat, spec.ratio);
    }
}

await out.transform(weld(), dedup(), prune());
out.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({ method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER });
await io.write(OUT, out);

let total = 0;
for (const [part, mesh] of Object.entries(meshes)) {
    const tris = mesh.listPrimitives().reduce((s, p) => s + (p.getIndices()?.getCount() ?? 0) / 3, 0);
    total += tris;
    console.log(part.padEnd(24), String(Math.round(tris)).padStart(7), 'triangles');
}
console.log('total'.padEnd(24), String(Math.round(total)).padStart(7), '->', OUT);
