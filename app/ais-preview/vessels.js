// Procedural low-poly AIS vessel models (three.js).
// One builder per AIS ship-type category. Built at ~real scale (length ~8-12 units,
// bow toward +Z, up +Y, beam along X). The preview page normalizes scale/centering.
//
// This module is intentionally framework-agnostic (plain three.js) so it can later
// be reused inside the app to replace the per-vessel GLTF models.

import * as THREE from 'three';

// ── The 11 AIS categories we model ───────────────────────────────────────────
// `current` = the model the app renders today for this type (via determineBoatType),
// `meshy`   = expected filename under ./meshy/<id>.glb
export const AIS_TYPES = [
  { key: 'wig',       code: 20, range: '20–29', labelFr: 'WIG (effet de sol)',     current: 'ship' },
  { key: 'fishing',   code: 30, range: '30',    labelFr: 'Pêche',                  current: 'optimist' },
  { key: 'tug',       code: 31, range: '31–32', labelFr: 'Remorqueur',             current: 'ship' },
  { key: 'military',  code: 35, range: '35',    labelFr: 'Militaire',              current: 'ship' },
  { key: 'sailing',   code: 36, range: '36',    labelFr: 'Voilier',                current: 'sailboat' },
  { key: 'pleasure',  code: 37, range: '37',    labelFr: 'Plaisance',              current: 'ship' },
  { key: 'hsc',       code: 40, range: '40–49', labelFr: 'Navire rapide (HSC)',    current: 'ship' },
  { key: 'pilot',     code: 50, range: '50–59', labelFr: 'Pilote / spécial',       current: 'ship' },
  { key: 'passenger', code: 60, range: '60–69', labelFr: 'Passagers',              current: 'ship' },
  { key: 'cargo',     code: 70, range: '70–79', labelFr: 'Cargo',                  current: 'ship' },
  { key: 'tanker',    code: 80, range: '80–89', labelFr: 'Pétrolier (tanker)',     current: 'ship' },
];

// ── Materials (low-poly: flat shading) ───────────────────────────────────────
const M = {
  hull:   () => new THREE.MeshStandardMaterial({ color: 0xeef2f5, flatShading: true, roughness: 0.85, metalness: 0.05 }),
  hullRed:() => new THREE.MeshStandardMaterial({ color: 0x8a1f1f, flatShading: true, roughness: 0.85 }),
  hullDk: () => new THREE.MeshStandardMaterial({ color: 0x2b3138, flatShading: true, roughness: 0.9 }),
  hullGrey:()=> new THREE.MeshStandardMaterial({ color: 0x8d99a4, flatShading: true, roughness: 0.8 }),
  deck:   () => new THREE.MeshStandardMaterial({ color: 0x9fb0bd, flatShading: true, roughness: 0.95 }),
  cabin:  () => new THREE.MeshStandardMaterial({ color: 0xe2e9ee, flatShading: true, roughness: 0.7 }),
  glass:  () => new THREE.MeshStandardMaterial({ color: 0x0a2a33, emissive: 0x09bfff, emissiveIntensity: 0.4, flatShading: true, roughness: 0.4 }),
  dark:   () => new THREE.MeshStandardMaterial({ color: 0x394049, flatShading: true, roughness: 0.85 }),
  red:    () => new THREE.MeshStandardMaterial({ color: 0xcc1414, flatShading: true, roughness: 0.7 }),
  orange: () => new THREE.MeshStandardMaterial({ color: 0xff7a18, flatShading: true, roughness: 0.7 }),
  sail:   () => new THREE.MeshStandardMaterial({ color: 0xf4f6f8, flatShading: true, roughness: 1, side: THREE.DoubleSide }),
  steel:  () => new THREE.MeshStandardMaterial({ color: 0xb9c2cb, flatShading: true, roughness: 0.6, metalness: 0.3 }),
};

// ── Primitive helpers ────────────────────────────────────────────────────────
function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}
function cyl(rt, rb, h, seg, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  return m;
}
function sphere(r, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mat);
  m.position.set(x, y, z);
  return m;
}

// Low-poly hull: rectangular body + faceted (4-sided) cone bow. Returns a group
// whose deck top sits at y = depth/2.
function hull(len, beam, depth, mat) {
  const g = new THREE.Group();
  const bodyLen = len * 0.70;
  g.add(box(beam, depth, bodyLen, mat, 0, 0, -len * 0.05));

  const bow = new THREE.Mesh(new THREE.ConeGeometry(beam * 0.54, len * 0.34, 4), mat);
  bow.rotation.set(Math.PI / 2, 0, Math.PI / 4); // apex toward +Z, flat bottom
  bow.scale.y = depth / (beam * 1.08);           // flatten vertically to hull depth
  bow.position.set(0, 0, len * 0.5 - len * 0.17);
  g.add(bow);

  // Slight keel/bottom wedge for a less boxy underside
  const keel = box(beam * 0.5, depth * 0.5, bodyLen * 0.9, mat, 0, -depth * 0.55, -len * 0.05);
  g.add(keel);
  return g;
}

// ── Per-type builders ────────────────────────────────────────────────────────
function buildCargo() {
  const g = new THREE.Group();
  const L = 11, B = 3, D = 1.5;
  g.add(hull(L, B, D, M.hull()));
  const deck = D / 2;
  // aft bridge block near stern
  g.add(box(B * 0.8, 1.3, 1.6, M.cabin(), 0, deck + 0.65, -L * 0.36));
  g.add(box(B * 0.55, 0.5, 1.0, M.glass(), 0, deck + 1.0, -L * 0.36));
  // funnel
  g.add(cyl(0.22, 0.26, 0.9, 8, M.dark(), 0, deck + 1.6, -L * 0.40));
  // cargo hatches
  for (let i = 0; i < 3; i++) {
    g.add(box(B * 0.7, 0.35, 1.5, M.dark(), 0, deck + 0.18, L * 0.18 - i * 1.9));
  }
  // two masts/cranes
  g.add(cyl(0.07, 0.07, 1.6, 6, M.steel(), B * 0.2, deck + 0.8, L * 0.05));
  g.add(box(1.2, 0.08, 0.08, M.steel(), B * 0.2 + 0.4, deck + 1.4, L * 0.05));
  return g;
}

function buildTanker() {
  const g = new THREE.Group();
  const L = 12, B = 3.2, D = 1.5;
  g.add(hull(L, B, D, M.hull()));
  const deck = D / 2;
  // stern superstructure
  g.add(box(B * 0.85, 1.5, 1.4, M.cabin(), 0, deck + 0.75, -L * 0.38));
  g.add(box(B * 0.6, 0.45, 0.9, M.glass(), 0, deck + 1.15, -L * 0.38));
  g.add(cyl(0.22, 0.26, 0.9, 8, M.red(), 0, deck + 1.7, -L * 0.42));
  // cylindrical deck tanks / domes
  for (let i = 0; i < 4; i++) {
    g.add(cyl(0.5, 0.5, 0.55, 10, M.steel(), 0, deck + 0.28, L * 0.22 - i * 1.5));
  }
  // central pipeline
  g.add(cyl(0.09, 0.09, L * 0.62, 6, M.dark(), 0, deck + 0.55, L * 0.02).rotateX(Math.PI / 2));
  return g;
}

function buildPassenger() {
  const g = new THREE.Group();
  const L = 11, B = 3, D = 1.4;
  g.add(hull(L, B, D, M.hull()));
  const deck = D / 2;
  // stacked decks (decreasing)
  g.add(box(B * 0.92, 0.7, L * 0.72, M.cabin(), 0, deck + 0.35, 0));
  g.add(box(B * 0.78, 0.6, L * 0.6, M.cabin(), 0, deck + 0.95, -0.2));
  g.add(box(B * 0.6, 0.5, L * 0.45, M.cabin(), 0, deck + 1.45, -0.3));
  // bridge
  g.add(box(B * 0.5, 0.35, 0.7, M.glass(), 0, deck + 1.85, L * 0.12));
  // window rows (glow)
  for (let d = 0; d < 2; d++) {
    g.add(box(B * 0.93, 0.12, L * 0.7, M.glass(), 0, deck + 0.4 + d * 0.6, 0));
  }
  // funnel + lifeboats
  g.add(cyl(0.25, 0.3, 0.8, 10, M.red(), 0, deck + 2.1, -L * 0.18));
  for (const s of [-1, 1]) {
    g.add(box(0.6, 0.22, 0.3, M.orange(), s * B * 0.5, deck + 0.55, L * 0.1));
    g.add(box(0.6, 0.22, 0.3, M.orange(), s * B * 0.5, deck + 0.55, -L * 0.1));
  }
  return g;
}

function buildFishing() {
  const g = new THREE.Group();
  const L = 8, B = 2.5, D = 1.4;
  g.add(hull(L, B, D, M.hull()));
  const deck = D / 2;
  // forward cabin
  g.add(box(B * 0.75, 1.0, 1.6, M.cabin(), 0, deck + 0.5, L * 0.22));
  g.add(box(B * 0.6, 0.4, 0.5, M.glass(), 0, deck + 0.85, L * 0.30));
  // mast + boom (net crane)
  g.add(cyl(0.06, 0.06, 2.2, 6, M.steel(), 0, deck + 1.1, L * 0.1));
  g.add(box(0.06, 0.06, 2.4, M.steel(), 0, deck + 1.9, -L * 0.05).rotateX(0.5));
  // net reel (horizontal cylinder) aft
  g.add(cyl(0.35, 0.35, B * 0.7, 10, M.dark(), 0, deck + 0.35, -L * 0.32).rotateZ(Math.PI / 2));
  return g;
}

function buildSailing() {
  const g = new THREE.Group();
  const L = 9, B = 2.1, D = 1.3;
  g.add(hull(L, B, D, M.hull()));
  const deck = D / 2;
  // low cabin
  g.add(box(B * 0.6, 0.45, 2.2, M.cabin(), 0, deck + 0.22, L * 0.02));
  g.add(box(B * 0.5, 0.18, 1.2, M.glass(), 0, deck + 0.4, L * 0.05));
  // mast
  const mastH = 7;
  g.add(cyl(0.07, 0.09, mastH, 6, M.steel(), 0, deck + mastH / 2, L * 0.05));
  // boom
  g.add(box(0.06, 0.06, 3.4, M.steel(), 0, deck + 0.8, -L * 0.1));
  // triangular mainsail (between mast and boom)
  const sailShape = new THREE.Shape();
  sailShape.moveTo(0, 0); sailShape.lineTo(0, mastH * 0.82); sailShape.lineTo(-3.2, 0); sailShape.closePath();
  const sail = new THREE.Mesh(new THREE.ShapeGeometry(sailShape), M.sail());
  sail.position.set(0, deck + 0.2, L * 0.05);
  sail.rotation.y = Math.PI / 2;
  g.add(sail);
  // jib (small foresail)
  const jib = new THREE.Shape();
  jib.moveTo(0, 0); jib.lineTo(0, mastH * 0.6); jib.lineTo(2.4, 0); jib.closePath();
  const jibM = new THREE.Mesh(new THREE.ShapeGeometry(jib), M.sail());
  jibM.position.set(0, deck + 0.2, L * 0.05);
  jibM.rotation.y = Math.PI / 2;
  g.add(jibM);
  // keel
  g.add(box(0.18, 1.4, 1.6, M.dark(), 0, -1.0, -L * 0.02));
  return g;
}

function buildPleasure() {
  const g = new THREE.Group();
  const L = 9, B = 2.6, D = 1.3;
  g.add(hull(L, B, D, M.hull()));
  const deck = D / 2;
  // streamlined raised cabin
  g.add(box(B * 0.8, 0.6, 3.2, M.cabin(), 0, deck + 0.3, L * 0.05));
  g.add(box(B * 0.7, 0.4, 2.4, M.glass(), 0, deck + 0.55, L * 0.1));
  // flybridge
  g.add(box(B * 0.5, 0.35, 1.2, M.cabin(), 0, deck + 0.9, L * 0.0));
  g.add(cyl(0.04, 0.04, 0.9, 6, M.steel(), 0, deck + 1.5, L * 0.0)); // antenna
  // swim platform aft
  g.add(box(B * 0.85, 0.12, 0.8, M.deck(), 0, deck - 0.1, -L * 0.46));
  return g;
}

function buildHSC() {
  const g = new THREE.Group();
  const L = 10, B = 3.2, D = 1.0;
  // catamaran-style twin hulls
  for (const s of [-1, 1]) {
    const h = hull(L, B * 0.34, D, M.hull());
    h.position.x = s * B * 0.3;
    g.add(h);
  }
  const deck = D / 2;
  // connecting deck
  g.add(box(B * 0.95, 0.25, L * 0.7, M.deck(), 0, deck, 0));
  // sleek superstructure
  g.add(box(B * 0.8, 0.6, L * 0.55, M.cabin(), 0, deck + 0.45, -L * 0.02));
  g.add(box(B * 0.7, 0.35, L * 0.4, M.glass(), 0, deck + 0.6, L * 0.05));
  // raked mast
  g.add(box(0.08, 0.08, 1.6, M.steel(), 0, deck + 1.1, -L * 0.05).rotateX(-0.4));
  return g;
}

function buildTug() {
  const g = new THREE.Group();
  const L = 7, B = 3, D = 1.6;
  g.add(hull(L, B, D, M.hullDk()));
  const deck = D / 2;
  // tall wheelhouse forward-center
  g.add(box(B * 0.7, 1.4, 1.8, M.red(), 0, deck + 0.7, L * 0.12));
  g.add(box(B * 0.55, 0.5, 0.9, M.glass(), 0, deck + 1.2, L * 0.18));
  // funnel
  g.add(cyl(0.22, 0.26, 0.7, 8, M.dark(), 0, deck + 1.7, -L * 0.05));
  // fenders along the bow
  for (let i = 0; i < 4; i++) {
    g.add(sphere(0.22, M.dark(), 0, deck - 0.1, L * 0.45 - i * 0.5));
  }
  // towing winch aft
  g.add(cyl(0.3, 0.3, B * 0.5, 8, M.steel(), 0, deck + 0.25, -L * 0.32).rotateZ(Math.PI / 2));
  return g;
}

function buildMilitary() {
  const g = new THREE.Group();
  const L = 11, B = 2.6, D = 1.4;
  g.add(hull(L, B, D, M.hullGrey()));
  const deck = D / 2;
  // angular stealth superstructure (tapered stack)
  g.add(box(B * 0.7, 0.7, 3.0, M.hullGrey(), 0, deck + 0.35, L * 0.0));
  const tower = box(B * 0.45, 1.0, 1.2, M.hullGrey(), 0, deck + 1.0, L * 0.05);
  tower.rotation.x = 0.06;
  g.add(tower);
  // pyramidal mast
  g.add(cyl(0.02, 0.18, 1.4, 4, M.dark(), 0, deck + 1.9, L * 0.05));
  // forward gun
  g.add(box(0.5, 0.35, 0.6, M.hullGrey(), 0, deck + 0.25, L * 0.34));
  g.add(cyl(0.05, 0.05, 1.2, 6, M.dark(), 0, deck + 0.35, L * 0.42).rotateX(Math.PI / 2));
  return g;
}

function buildPilot() {
  const g = new THREE.Group();
  const L = 8, B = 2.6, D = 1.4;
  g.add(hull(L, B, D, M.hull()));
  const deck = D / 2;
  // bright pilot hull band
  g.add(box(B + 0.02, 0.3, L * 0.7, M.orange(), 0, deck - 0.05, -L * 0.05));
  // central cabin with windows all round
  g.add(box(B * 0.7, 1.0, 2.4, M.cabin(), 0, deck + 0.5, 0));
  g.add(box(B * 0.72, 0.4, 1.8, M.glass(), 0, deck + 0.7, 0));
  // radar dome on roof + mast
  g.add(sphere(0.3, M.cabin(), 0, deck + 1.25, -0.2));
  g.add(cyl(0.05, 0.05, 1.0, 6, M.steel(), 0, deck + 1.4, 0.4));
  return g;
}

function buildWig() {
  const g = new THREE.Group();
  const L = 10, B = 1.6;
  // aircraft-like fuselage (capsule)
  const fus = cyl(0.6, 0.6, L * 0.7, 10, M.hull());
  fus.rotation.x = Math.PI / 2;
  g.add(fus);
  // nose cone
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.6, L * 0.22, 10), M.hull());
  nose.rotation.x = Math.PI / 2;
  nose.position.z = L * 0.45;
  g.add(nose);
  // cockpit glass
  g.add(box(0.7, 0.4, 1.6, M.glass(), 0, 0.45, L * 0.22));
  // short wings
  for (const s of [-1, 1]) {
    g.add(box(L * 0.42, 0.12, 1.6, M.steel(), s * (L * 0.28), -0.1, -L * 0.05));
    g.add(cyl(0.18, 0.18, 0.5, 8, M.dark(), s * (L * 0.34), 0.0, -L * 0.05)); // engine pod
  }
  // tail fin + stabilizers
  g.add(box(0.1, 1.4, 1.2, M.steel(), 0, 0.7, -L * 0.4));
  g.add(box(2.4, 0.1, 0.8, M.steel(), 0, 0.9, -L * 0.44));
  return g;
}

const BUILDERS = {
  wig: buildWig, fishing: buildFishing, tug: buildTug, military: buildMilitary,
  sailing: buildSailing, pleasure: buildPleasure, hsc: buildHSC, pilot: buildPilot,
  passenger: buildPassenger, cargo: buildCargo, tanker: buildTanker,
};

export function createVessel(key) {
  const build = BUILDERS[key];
  if (!build) return new THREE.Group();
  const g = build();
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  return g;
}
