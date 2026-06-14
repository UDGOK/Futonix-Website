/* ============================================================
   FUTONIX — Hero WebGL Scene (Three.js, bundled locally)
   "Smart-City Automation District": realistic textured towers
   with window facades, rooftop solar + HVAC, autonomous cars on
   a road grid, a battery-storage yard, a ground solar farm, 5G
   network towers with blinking beacons + data pulses, a robotic
   construction bay (arm + tower crane + BIM wireframe), turbines
   and an inspection drone. Monochrome ice/navy + teal, soft
   shadows, atmospheric depth. Scroll-reactive + pointer parallax.
   Falls back to inline SVG if WebGL/import fails.
   ============================================================ */
import * as THREE from 'three';

/* ---- Palette (declared before init() runs) ---- */
const BG       = 0xD6E2EB;
const CONCRETE = [0xEDF3F8, 0xE2EBF2, 0xD6E1EA, 0xCAD8E3];
const GLASS    = 0x9FB8CC, GLASS_DK = 0x46587A;
const METAL    = 0xC4D0DA, METAL_DK = 0x8A99A8;
const NAVY     = 0x0A1430, INK = 0x050419;
const TEAL     = 0x2DD4BF, TEAL_HI = 0x5EEAD4;
const SOLAR    = 0x16243F;
const ASPHALT  = 0x2B3441, LANE = 0xE6EDF2, BLOCK = 0xDBE5ED;
const SECTOR   = { med: 0x5FB3A1, wh: 0x6E8AAE, hos: 0xC2A36B };
const CARCOL   = [0xF3F6F9, 0xCBD4DC, 0x9FB1C2, 0x2A3550, 0x5FB3A1];

const ROADS = [-12, -6, 0, 6, 12];   // road centerlines on both axes
const ROADW = 2.2;                    // road width
const HALF  = 18;                     // ground half-size used for texture mapping
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/* ---- Procedural facade texture: glass grid w/ a few lit windows ---- */
function facadeTexture(cols, rows, glass) {
  const cw = 16, ch = 22, pad = 3;
  const c = document.createElement('canvas');
  c.width = cols * cw; c.height = rows * ch;
  const g = c.getContext('2d');
  g.fillStyle = glass ? '#3c4d6b' : '#e7eef4';
  g.fillRect(0, 0, c.width, c.height);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const px = x * cw + pad, py = y * ch + pad, ww = cw - pad * 2, wh = ch - pad * 2;
      const r = Math.random();
      let fill;
      if (glass) fill = r < 0.06 ? '#5EEAD4' : r < 0.13 ? '#bfe9e0' : (r < 0.55 ? '#5e7088' : '#566d92');
      else fill = r < 0.05 ? '#5EEAD4' : r < 0.5 ? '#cfdbe6' : '#b9c8d6';
      g.fillStyle = fill;
      g.fillRect(px, py, ww, wh);
      // subtle top sheen on glass
      if (glass && r > 0.13) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(px, py, ww, wh * 0.4); }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
/* emissive map: only lit windows glow */
function litTexture(cols, rows) {
  const cw = 16, ch = 22, pad = 3;
  const c = document.createElement('canvas');
  c.width = cols * cw; c.height = rows * ch;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const r = Math.random();
    if (r < 0.10) { g.fillStyle = r < 0.045 ? '#5EEAD4' : '#9fe9df'; g.fillRect(x * cw + pad, y * ch + pad, cw - pad * 2, ch - pad * 2); }
  }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}

/* ---- Ground texture: city plan with roads + dashed lanes ---- */
function groundTexture() {
  const S = 1024, c = document.createElement('canvas');
  c.width = c.height = S; const g = c.getContext('2d');
  const w2p = (w) => (w + HALF) / (HALF * 2) * S;
  g.fillStyle = '#dbe5ed'; g.fillRect(0, 0, S, S);
  // faint block lines
  g.strokeStyle = 'rgba(10,20,48,0.05)'; g.lineWidth = 1;
  const rw = (ROADW + 1.2) / (HALF * 2) * S;
  for (const r of ROADS) {
    const p = w2p(r);
    // road strips
    g.fillStyle = '#2b3441';
    g.fillRect(p - rw / 2, 0, rw, S);
    g.fillRect(0, p - rw / 2, S, rw);
  }
  // dashed lane centerlines (drawn after strips so they sit on top)
  g.strokeStyle = '#e6edf2'; g.lineWidth = 2; g.setLineDash([10, 12]);
  for (const r of ROADS) { const p = w2p(r);
    g.beginPath(); g.moveTo(p, 0); g.lineTo(p, S); g.stroke();
    g.beginPath(); g.moveTo(0, p); g.lineTo(S, p); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

const mount = document.querySelector('.scene-canvas');
const wrap = document.getElementById('hero-scene');

function init(mount, wrap) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = mount.clientWidth || 1280, h = mount.clientHeight || w * 0.45;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 46, 104);

  // ---- Camera (perspective for realistic depth) ----
  const cam = new THREE.PerspectiveCamera(32, w / h, 0.1, 220);
  const camBase = new THREE.Vector3(28, 20.5, 31);
  const target = new THREE.Vector3(0, 3.4, -1);
  const fit = () => {
    cam.aspect = w / h;
    // pull back on narrow screens so the whole district stays in frame
    const k = cam.aspect < 1.2 ? 1.5 : cam.aspect < 1.7 ? 1.22 : 1.0;
    cam.position.copy(camBase).multiplyScalar(k);
    cam.updateProjectionMatrix();
    cam.lookAt(target);
  };
  fit();

  // ---- Lights ----
  scene.add(new THREE.HemisphereLight(0xffffff, 0xC2D2DE, 0.92));
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));
  const key = new THREE.DirectionalLight(0xffffff, 1.25);
  key.position.set(26, 34, 16); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 110;
  key.shadow.radius = 6; key.shadow.bias = -0.0004;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xBFE6E0, 0.28); fill.position.set(-20, 14, -18); scene.add(fill);

  const city = new THREE.Group(); scene.add(city);

  // ---- Ground ----
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, HALF * 2),
    new THREE.MeshStandardMaterial({ map: groundTexture(), roughness: 0.96 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; city.add(ground);

  // shared roof + trim materials
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xC9D4DD, roughness: 0.9 });
  const hvacMat = new THREE.MeshStandardMaterial({ color: METAL, roughness: 0.7, metalness: 0.2 });
  const darkMat = new THREE.MeshStandardMaterial({ color: METAL_DK, roughness: 0.6, metalness: 0.3 });

  // ---- Solar array (tilted panels) ----
  const panelMat = new THREE.MeshStandardMaterial({ color: SOLAR, roughness: 0.25, metalness: 0.5, emissive: 0x0a1830, emissiveIntensity: 0.3 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xAEBCC9, roughness: 0.6, metalness: 0.4 });
  function solarArray(cols, rows, cell = 0.9, tilt = 0.5) {
    const g = new THREE.Group();
    for (let r = 0; r < rows; r++) for (let cx = 0; cx < cols; cx++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(cell * 0.95, 0.05, cell * 0.62), panelMat);
      p.rotation.x = -tilt; p.position.set(cx * cell - (cols - 1) * cell / 2, 0.18, r * (cell * 0.8) - (rows - 1) * (cell * 0.8) / 2);
      p.castShadow = true; g.add(p);
      // teal grid line accents
      const line = new THREE.Mesh(new THREE.BoxGeometry(cell * 0.95, 0.06, 0.015), new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.5 }));
      line.rotation.x = -tilt; line.position.copy(p.position); g.add(line);
    }
    return g;
  }

  // ---- Building factory ----
  function building(x, z, bw, bd, bh, opts = {}) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const glass = opts.glass;
    const cols = Math.max(3, Math.round(bw * 1.7)), rows = Math.max(4, Math.round(bh * 1.15));
    const side = new THREE.MeshStandardMaterial({
      map: facadeTexture(cols, rows, glass),
      emissiveMap: litTexture(cols, rows), emissive: 0xffffff, emissiveIntensity: 0.9,
      roughness: glass ? 0.22 : 0.82, metalness: glass ? 0.5 : 0.05,
      color: glass ? GLASS : pick(CONCRETE)
    });
    const top = new THREE.MeshStandardMaterial({ color: 0xC9D4DD, roughness: 0.9 });
    const mats = [side, side, top, darkMat, side, side];
    const body = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mats);
    body.position.y = bh / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);

    // optional setback crown
    if (opts.crown) {
      const ch = bh * 0.18;
      const crown = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.7, ch, bd * 0.7), side);
      crown.position.y = bh + ch / 2; crown.castShadow = true; g.add(crown);
    }
    // rooftop equipment
    const roofY = bh + (opts.crown ? bh * 0.18 : 0);
    if (opts.solar) { const s = solarArray(Math.max(2, Math.round(bw)), Math.max(2, Math.round(bd)), 0.5, 0.5); s.position.set(0, roofY, 0); s.scale.setScalar(0.9); g.add(s); }
    else {
      for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
        const u = new THREE.Mesh(new THREE.BoxGeometry(rnd(0.5, 1), rnd(0.3, 0.6), rnd(0.5, 1)), hvacMat);
        u.position.set(rnd(-bw / 3, bw / 3), roofY + 0.25, rnd(-bd / 3, bd / 3)); u.castShadow = true; g.add(u);
      }
    }
    // sector accent stripe at the parapet
    if (opts.accent) {
      const a = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.04, 0.18, bd + 0.04),
        new THREE.MeshStandardMaterial({ color: SECTOR[opts.accent], emissive: SECTOR[opts.accent], emissiveIntensity: 0.25, roughness: 0.5 }));
      a.position.y = bh - 0.12; g.add(a);
    }
    // small rooftop antenna mast on a few
    if (opts.mast) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 1.6, 6), darkMat);
      m.position.set(bw * 0.25, roofY + 0.8, bd * 0.25); g.add(m);
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), new THREE.MeshStandardMaterial({ color: TEAL_HI, emissive: TEAL_HI, emissiveIntensity: 1 }));
      b.position.set(bw * 0.25, roofY + 1.6, bd * 0.25); g.add(b); beacons.push(b);
    }
    city.add(g); return g;
  }

  const beacons = [];

  // ---- Wireframe (under-construction) building — keeps the BIM theme ----
  function wireBuilding(x, z, bw, bd, bh) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const geo = new THREE.BoxGeometry(bw, bh, bd);
    const ghost = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x0A1A24, transparent: true, opacity: 0.14, roughness: 1 }));
    ghost.position.y = bh / 2; g.add(ghost);
    ghost.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: NAVY, transparent: true, opacity: 0.5 })));
    const floors = Math.max(3, Math.round(bh / 0.9));
    for (let i = 1; i < floors; i++) {
      const fl = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(bw, 0.02, bd)), new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.6 }));
      fl.position.y = i * (bh / floors); g.add(fl);
    }
    city.add(g); return g;
  }

  /* ============ POPULATE THE DISTRICT ============ */
  // Downtown core (block centers, avoiding road lines at multiples of 6)
  building(-3, -3, 4, 4, 15, { glass: true, crown: true, solar: true });
  building(3, -3.4, 4, 4.2, 12, { accent: 'med', mast: true });
  building(3.4, 3, 3.6, 3.6, 17, { glass: true, crown: true, solar: true });
  building(-3.2, 3.2, 4.2, 4.6, 9, { accent: 'hos' });
  building(-0.2, -0.2, 3, 3, 7, { glass: true });
  building(9, -2.6, 3.2, 3.4, 13, { glass: true, crown: true, mast: true });
  building(-9, -2.8, 3.4, 3.2, 8, { solar: true });
  building(9.2, 3.2, 3, 3.2, 10, { accent: 'wh', solar: true });
  building(-9, 3, 3.2, 3, 6, { glass: true });
  building(2.8, 9, 3, 3, 9, { solar: true });
  building(-3, 9.2, 3.4, 3, 7, { glass: true, mast: true });
  building(-9.2, 9, 3, 3, 5, {});

  // Construction bay (front-right)
  wireBuilding(9, 9, 3.4, 3.4, 11);

  /* ---- Energy district: ground solar farm + battery yard + turbines (front-left, in view) ---- */
  const farm = solarArray(7, 4, 1.0, 0.46); farm.position.set(-12.5, 0, 11.5); city.add(farm);

  // battery storage yard (container units with status LEDs)
  const leds = [];
  function batteryYard(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xCBD6DF, roughness: 0.8, metalness: 0.1 });
    for (let r = 0; r < 3; r++) for (let c2 = 0; c2 < 2; c2++) {
      const u = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 1.0), bodyMat);
      u.position.set(c2 * 3.1, 0.55, r * 1.5); u.castShadow = true; u.receiveShadow = true; g.add(u);
      // ribbed door lines
      const ribs = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.6, 1.1, 1.0)), new THREE.LineBasicMaterial({ color: 0x9aa8b6 }));
      ribs.position.copy(u.position); g.add(ribs);
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshStandardMaterial({ color: TEAL_HI, emissive: TEAL_HI, emissiveIntensity: 1 }));
      led.position.set(c2 * 3.1 + 1.0, 0.85, r * 1.5 + 0.52); g.add(led); leds.push(led);
    }
    city.add(g); return g;
  }
  batteryYard(-16, 5.5);

  // turbines
  const hubs = [];
  function turbine(x, z, s) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * s, 0.13 * s, 5 * s, 12), new THREE.MeshStandardMaterial({ color: 0xF2F7FB, roughness: 0.6 }));
    pole.position.y = 2.5 * s; pole.castShadow = true; g.add(pole);
    const hub = new THREE.Group(); hub.position.set(0, 5 * s, 0.12 * s);
    for (let i = 0; i < 3; i++) { const arm = new THREE.Group(); const bl = new THREE.Mesh(new THREE.BoxGeometry(0.12 * s, 2.4 * s, 0.28 * s), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.5 })); bl.position.y = 1.2 * s; bl.castShadow = true; arm.rotation.z = i * (Math.PI * 2 / 3); arm.add(bl); hub.add(arm); }
    g.add(hub); city.add(g); hubs.push(hub);
  }
  turbine(-16.5, 12.5, 1.0); turbine(-15, 1, 0.78);

  /* ---- 5G / network towers with beacons; data pulses travel between tops ---- */
  const towerTops = [];
  function netTower(x, z, hgt) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, hgt, 10), darkMat);
    mast.position.y = hgt / 2; mast.castShadow = true; g.add(mast);
    // lattice cross-braces
    for (let i = 1; i < Math.floor(hgt / 1.4); i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.025, 6, 12), darkMat);
      ring.rotation.x = Math.PI / 2; ring.position.y = i * 1.4; g.add(ring);
    }
    // antenna panels (triangular array near top)
    for (let i = 0; i < 3; i++) {
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.32), new THREE.MeshStandardMaterial({ color: 0xEDF2F6, roughness: 0.7 }));
      const ang = i * (Math.PI * 2 / 3); a.position.set(Math.cos(ang) * 0.42, hgt - 0.6, Math.sin(ang) * 0.42); a.lookAt(a.position.x * 2, hgt - 0.6, a.position.z * 2); a.castShadow = true; g.add(a);
    }
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshStandardMaterial({ color: TEAL_HI, emissive: TEAL_HI, emissiveIntensity: 1.2 }));
    beacon.position.y = hgt + 0.2; g.add(beacon); beacons.push(beacon);
    city.add(g);
    towerTops.push(new THREE.Vector3(x, hgt + 0.2, z));
    return g;
  }
  netTower(14.5, 9.5, 9);
  netTower(-13.5, 11.5, 7.5);
  netTower(15, -10.5, 8);

  // data-pulse links between tower tops
  const pulses = [];
  const linkMat = new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.22 });
  function link(a, b) {
    const mid = a.clone().add(b).multiplyScalar(0.5); mid.y += a.distanceTo(b) * 0.16;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const pts = curve.getPoints(24);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), linkMat); city.add(line);
    for (let i = 0; i < 2; i++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), new THREE.MeshStandardMaterial({ color: TEAL_HI, emissive: TEAL_HI, emissiveIntensity: 1.4 }));
      city.add(dot); pulses.push({ dot, curve, t: i * 0.5, speed: rnd(0.18, 0.3) });
    }
  }
  link(towerTops[0], towerTops[1]); link(towerTops[0], towerTops[2]); link(towerTops[1], towerTops[2]);

  /* ---- Tower crane (construction automation) ---- */
  const craneJib = (() => {
    const g = new THREE.Group(); g.position.set(11.4, 0, 11.4);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.4, 13, 0.4), darkMat); mast.position.y = 6.5; mast.castShadow = true; g.add(mast);
    for (let i = 1; i < 9; i++) { const x = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.4, 1.4, 0.4)), new THREE.LineBasicMaterial({ color: 0x7c8a99 })); x.position.y = i * 1.45; g.add(x); }
    const jib = new THREE.Group(); jib.position.y = 13; g.add(jib);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(11, 0.35, 0.35), darkMat); arm.position.x = 3.4; arm.castShadow = true; jib.add(arm);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.8), hvacMat); counter.position.x = -2.2; jib.add(counter);
    // hanging cable + load
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4, 6), darkMat); cable.position.set(6.4, -2, 0); jib.add(cable);
    const load = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), new THREE.MeshStandardMaterial({ color: SECTOR.hos, roughness: 0.7 })); load.position.set(6.4, -4.2, 0); load.castShadow = true; jib.add(load);
    city.add(g); g.userData = { jib, cable, load }; return g;
  })();

  /* ---- Articulated robot arm in the construction bay ---- */
  const arm = (() => {
    const navyM = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.6 });
    const steelM = new THREE.MeshStandardMaterial({ color: METAL_DK, roughness: 0.5, metalness: 0.3 });
    const metalM = new THREE.MeshStandardMaterial({ color: METAL, roughness: 0.7, metalness: 0.2 });
    const part = (g, x, y, z, m, py) => { const p = new THREE.Mesh(new THREE.BoxGeometry(x, y, z), m); p.position.y = py; p.castShadow = true; g.add(p); return p; };
    const rig = new THREE.Group(); rig.position.set(6.4, 0, 9.4); rig.scale.setScalar(1.15);
    part(rig, 1, 0.25, 1, navyM, 0.12);
    const yaw = new THREE.Group(); yaw.position.y = 0.12; rig.add(yaw); part(yaw, 0.42, 0.95, 0.42, steelM, 0.47);
    const sh = new THREE.Group(); sh.position.y = 0.95; yaw.add(sh); part(sh, 0.26, 1.9, 0.26, metalM, 0.95);
    const el = new THREE.Group(); el.position.y = 1.9; sh.add(el); part(el, 0.22, 1.5, 0.22, metalM, 0.75);
    const wr = new THREE.Group(); wr.position.y = 1.5; el.add(wr); part(wr, 0.46, 0.2, 0.46, navyM, 0.1);
    city.add(rig); return { yaw, sh, el, wr };
  })();

  /* ---- Inspection drone (orbits downtown) ---- */
  const drone = (() => {
    const g = new THREE.Group();
    const navyM = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.6 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.55), navyM); b.castShadow = true; g.add(b);
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.05, 0.1), darkMat));
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 1.25), darkMat));
    const rotors = [];
    [[0.6, 0.6], [-0.6, 0.6], [0.6, -0.6], [-0.6, -0.6]].forEach(([rx, rz]) => { const r = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.08), metalish()); r.position.set(rx, 0.15, rz); g.add(r); rotors.push(r); });
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), new THREE.MeshStandardMaterial({ color: TEAL_HI, emissive: TEAL_HI, emissiveIntensity: 1 })); eye.position.y = -0.12; g.add(eye);
    city.add(g); g.userData.rotors = rotors; return g;
  })();
  function metalish() { return new THREE.MeshStandardMaterial({ color: METAL, roughness: 0.6, metalness: 0.3 }); }

  /* ---- Autonomous cars on the road grid ---- */
  const cars = [];
  function makeCar(color) {
    const g = new THREE.Group();
    const bodyM = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.26, 1.04), bodyM); body.position.y = 0.2; body.castShadow = true; g.add(body);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.6), new THREE.MeshStandardMaterial({ color: 0x223047, roughness: 0.3, metalness: 0.4 })); cab.position.set(0, 0.42, -0.04); g.add(cab);
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.04), new THREE.MeshStandardMaterial({ color: 0xFFF6E0, emissive: 0xFFF3D6, emissiveIntensity: 0.9 })); hl.position.set(0, 0.2, 0.52); g.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.07, 0.04), new THREE.MeshStandardMaterial({ color: TEAL, emissive: TEAL, emissiveIntensity: 0.7 })); tl.position.set(0, 0.2, -0.52); g.add(tl);
    return g;
  }
  for (let i = 0; i < 18; i++) {
    const car = makeCar(pick(CARCOL));
    const horiz = Math.random() < 0.5;            // drives along X (true) or Z
    const road = pick(ROADS);
    const dir = Math.random() < 0.5 ? 1 : -1;
    const laneOff = (ROADW * 0.26) * dir;          // keep right
    const speed = rnd(2.4, 4.6);
    const pos = rnd(-HALF, HALF);
    if (horiz) { car.position.set(pos, 0, road - laneOff); car.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
    else { car.position.set(road + laneOff, 0, pos); car.rotation.y = dir > 0 ? 0 : Math.PI; }
    city.add(car); cars.push({ car, horiz, road, dir, laneOff, speed });
  }

  /* ---- Street lamps (subtle) along a couple roads ---- */
  for (const z of [-6, 6]) for (let x = -15; x <= 15; x += 6) {
    const lamp = new THREE.Group(); lamp.position.set(x + 1, 0, z + 1.3);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.8, 6), darkMat); pole.position.y = 0.9; lamp.add(pole);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshStandardMaterial({ color: TEAL_HI, emissive: TEAL_HI, emissiveIntensity: 0.7 })); head.position.y = 1.8; lamp.add(head); city.add(lamp);
  }

  /* ---- Interaction: pointer parallax + scroll reactivity ---- */
  let tx = 0, ty = 0, cx = 0, cy = 0, scrollP = 0;
  if (!reduce) window.addEventListener('pointermove', (e) => { tx = e.clientX / window.innerWidth - 0.5; ty = e.clientY / window.innerHeight - 0.5; }, { passive: true });
  const heroEl = document.querySelector('.hero');
  const onScroll = () => { const hh = (heroEl && heroEl.offsetHeight) || window.innerHeight; scrollP = Math.min(window.scrollY / hh, 1); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  let visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(wrap);
  const onResize = () => { w = mount.clientWidth || w; h = mount.clientHeight || h; renderer.setSize(w, h); fit(); };
  window.addEventListener('resize', onResize, { passive: true });

  const tmp = new THREE.Vector3();
  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);   // getDelta also advances clock.elapsedTime
    const t = clock.elapsedTime;

    // city bob + scroll sink/turn + pointer parallax
    cx += (tx - cx) * 0.04; cy += (ty - cy) * 0.04;
    city.position.y = -scrollP * 4;
    city.rotation.y = cx * 0.18 + scrollP * 0.3;
    cam.position.y = (camBase.y * (cam.aspect < 1.2 ? 1.5 : cam.aspect < 1.7 ? 1.22 : 1)) - cy * 6;
    cam.lookAt(target);
    mount.style.opacity = (1 - scrollP * 0.55).toFixed(3);

    // cars
    for (const c of cars) {
      if (c.horiz) { c.car.position.x += c.dir * c.speed * dt; if (c.car.position.x > HALF) c.car.position.x = -HALF; if (c.car.position.x < -HALF) c.car.position.x = HALF; }
      else { c.car.position.z += c.dir * c.speed * dt; if (c.car.position.z > HALF) c.car.position.z = -HALF; if (c.car.position.z < -HALF) c.car.position.z = HALF; }
    }
    // turbines + drone rotors
    for (const hub of hubs) hub.rotation.z += dt * 1.1;
    const dr = drone.userData.rotors; for (let i = 0; i < dr.length; i++) dr[i].rotation.y = t * 24 + i;
    const a = t * 0.32; drone.position.set(Math.sin(a) * 8, 12 - scrollP * 0 + Math.sin(t * 1.3) * 0.3, Math.cos(a) * 8 - 1); drone.rotation.y = -a + Math.PI;
    // robot arm working motion
    arm.yaw.rotation.y = Math.sin(t * 0.5) * 0.7;
    arm.sh.rotation.z = -0.35 + Math.sin(t * 0.7) * 0.28;
    arm.el.rotation.z = 0.8 + Math.cos(t * 0.7) * 0.4;
    arm.wr.rotation.z = Math.sin(t * 0.9) * 0.25;
    // crane swing + load bob
    craneJib.userData.jib.rotation.y = Math.sin(t * 0.18) * 0.9;
    craneJib.userData.load.position.y = -4.2 + Math.sin(t * 0.6) * 0.4;
    // beacons + LEDs pulse
    const pulse = 0.6 + 0.4 * Math.sin(t * 3);
    for (const b of beacons) b.material.emissiveIntensity = pulse * 1.3;
    for (const l of leds) l.material.emissiveIntensity = 0.5 + 0.5 * Math.sin(t * 2 + l.position.x);
    // data pulses along links
    for (const p of pulses) { p.t = (p.t + p.speed * dt) % 1; p.curve.getPoint(p.t, tmp); p.dot.position.copy(tmp); }

    renderer.render(scene, cam);
  }

  // reveal only after a successful first render (so the SVG fallback shows on error)
  renderer.render(scene, cam);
  wrap.classList.add('webgl');
  if (reduce) return;            // static first frame for reduced-motion users
  tick();
}

if (mount && wrap) {
  try { init(mount, wrap); }
  catch (e) { console.warn('Hero 3D unavailable, using SVG fallback:', e); }
}
