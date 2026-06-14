/* ============================================================
   FUTONIX — Sector hero scenes (Three.js, bundled locally)
   One bespoke animated WebGL scene per sector media box:
     • medical    — clinic, surgical robot arm, vitals monitor, ambulance
     • warehouse  — shed, running conveyor + boxes, AGV, racking, truck, drone
     • commercial — glass building, panning security cams + scan cones,
                    turnstile, sequenced lighting, data-pulse network
   Soft contact shadows on a transparent ground so the panel tint shows
   through. Pointer parallax + continuous automation. Each falls back to
   its inline SVG if WebGL/init fails.
   ============================================================ */
import * as THREE from 'three';

/* ---- palette (declared before any scene is built) ---- */
const WHITE = 0xF4F8FB, LIGHT = 0xE7EFF5, LIGHT2 = 0xD7E2EB, GREY = 0xC6D2DC;
const NAVY = 0x0A1430, INK = 0x050419, STEEL = 0x9AA8B6, STEEL_DK = 0x59697C, GLASS = 0x33425E;
const MED = 0x2DD4BF, MED_HI = 0x5EEAD4;          // teal
const WH = 0x6E8AAE, WH_HI = 0x9DB6D6;            // steel-blue
const COM_AMBER = 0xC2A36B, COM_AMBER_HI = 0xD8BE86;  // amber
const WARM = 0xFFE7B0;

const M = (c, r = 0.85, m = 0, e = 0x000000, ei = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, emissive: e, emissiveIntensity: ei });
function box(w, h, d, mat, cast = true) { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); me.castShadow = cast; me.receiveShadow = true; return me; }
function groundShadow(root) { const g = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.16 })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; root.add(g); return g; }

let PX = 0, PY = 0;
window.addEventListener('pointermove', (e) => { PX = e.clientX / window.innerWidth - 0.5; PY = e.clientY / window.innerHeight - 0.5; }, { passive: true });

/* ============================================================
   Shared harness: renderer + lights + camera + loop per host
   ============================================================ */
function makeScene(host, build) {
  const mount = host.querySelector('.sector-canvas');
  if (!mount) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = mount.clientWidth || 520, h = mount.clientHeight || 440;

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
  catch (e) { console.warn('Sector 3D unavailable:', e); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, w / h, 0.1, 200);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xC2D2DE, 0.95));
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(6, 10, 6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  const s = key.shadow.camera; s.left = -10; s.right = 10; s.top = 10; s.bottom = -10; s.near = 1; s.far = 40;
  key.shadow.radius = 5; key.shadow.bias = -0.0005;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xCFE6E0, 0.3); fill.position.set(-8, 5, -6); scene.add(fill);

  const root = new THREE.Group(); scene.add(root);

  let api, target = new THREE.Vector3(0, 1.2, 0);
  try {
    api = build(scene, root) || {};
    if (api.cam) { cam.position.set(...api.cam.pos); target.set(...api.cam.target); }
    else { cam.position.set(6.5, 4.4, 7); }
    cam.lookAt(target);
    renderer.render(scene, cam);          // first frame must succeed before we hide the SVG
  } catch (e) { console.warn('Sector 3D build failed, using SVG fallback:', e); renderer.dispose(); return; }

  mount.appendChild(renderer.domElement);
  host.classList.add('webgl');

  const onResize = () => { w = mount.clientWidth || w; h = mount.clientHeight || h; renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  window.addEventListener('resize', onResize, { passive: true });

  let visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(host);

  if (reduce) return;                       // static first frame for reduced-motion
  const clock = new THREE.Clock();
  let rx = 0, ry = 0;
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    ry += ((PX * 0.3) - ry) * 0.05; rx += ((-PY * 0.12) - rx) * 0.05;
    root.rotation.y = ry + Math.sin(t * 0.18) * 0.05;
    root.rotation.x = rx;
    if (api.update) api.update(t, dt);
    renderer.render(scene, cam);
  }
  tick();
}

/* ============================================================
   MEDICAL — clinic + surgical robot arm + vitals monitor + ambulance
   ============================================================ */
function buildMedical(scene, root) {
  groundShadow(root);

  // clinic building
  const b = box(3.8, 2.6, 2.8, M(WHITE, 0.92)); b.position.set(-0.6, 1.3, -1.5); root.add(b);
  const wing = box(2.0, 1.4, 2.0, M(LIGHT, 0.92)); wing.position.set(1.7, 0.7, -1.1); root.add(wing);
  // entrance glass
  const ent = box(1.3, 1.3, 0.12, M(GLASS, 0.25, 0.5)); ent.position.set(-0.6, 0.65, -0.08); root.add(ent);
  // teal cross emblem on facade
  const cMat = M(MED, 0.4, 0, MED, 0.9);
  const cv = box(0.3, 1.05, 0.12, cMat, false); cv.position.set(-0.6, 1.95, 0.06); root.add(cv);
  const ch = box(1.05, 0.3, 0.12, cMat, false); ch.position.set(-0.6, 1.95, 0.06); root.add(ch);
  // window strip on wing
  for (let i = 0; i < 3; i++) { const wn = box(0.1, 0.5, 0.4, M(MED_HI, 0.3, 0.2, MED_HI, 0.5), false); wn.position.set(2.71, 0.7, -1.7 + i * 0.6); root.add(wn); }

  // operating table + patient
  const table = box(1.7, 0.12, 0.7, M(0xD7E4EC, 0.5, 0.2)); table.position.set(1.2, 0.8, 1.4); root.add(table);
  [-0.7, 0.7].forEach(dx => [-0.25, 0.25].forEach(dz => { const leg = box(0.08, 0.8, 0.08, M(STEEL, 0.4, 0.4)); leg.position.set(1.2 + dx, 0.4, 1.4 + dz); root.add(leg); }));
  const patient = box(1.2, 0.18, 0.4, M(0xEFF5F9, 0.8)); patient.position.set(1.2, 0.95, 1.4); root.add(patient);

  // surgical robot arm (ceiling-style on a stand beside table)
  const navyM = M(INK, 0.6), steelM = M(STEEL_DK, 0.5, 0.3), metalM = M(0xC4D0DA, 0.6, 0.25);
  const part = (g, x, y, z, m, py) => { const p = box(x, y, z, m); p.position.y = py; g.add(p); return p; };
  const rig = new THREE.Group(); rig.position.set(2.4, 0, 1.5); rig.scale.setScalar(0.82);
  part(rig, 0.7, 0.18, 0.7, navyM, 0.09);
  const yaw = new THREE.Group(); yaw.position.y = 0.18; rig.add(yaw); part(yaw, 0.3, 0.7, 0.3, steelM, 0.35);
  const sh = new THREE.Group(); sh.position.y = 0.7; yaw.add(sh); part(sh, 0.18, 1.3, 0.18, metalM, 0.65);
  const el = new THREE.Group(); el.position.y = 1.3; sh.add(el); part(el, 0.15, 1.0, 0.15, metalM, 0.5);
  const wr = new THREE.Group(); wr.position.y = 1.0; el.add(wr);
  const tool = box(0.12, 0.4, 0.12, M(MED, 0.4, 0.3, MED, 0.5)); tool.position.y = -0.2; wr.add(tool);
  root.add(rig);

  // vitals monitor: pole + screen with pulsing heartbeat
  const pole = box(0.07, 1.4, 0.07, M(STEEL_DK, 0.5, 0.3)); pole.position.set(0.0, 0.7, 1.7); root.add(pole);
  const screenMat = M(0x09202B, 0.4, 0.2, MED_HI, 0.6);
  const screen = box(0.75, 0.5, 0.06, screenMat, false); screen.position.set(0.0, 1.5, 1.72); root.add(screen);

  // ambulance driving past the front
  const amb = new THREE.Group();
  amb.add(box(1.5, 0.7, 0.7, M(WHITE, 0.5, 0.2)));
  const cab = box(0.55, 0.55, 0.66, M(LIGHT, 0.5, 0.2)); cab.position.set(0.95, -0.05, 0); amb.add(cab);
  const stripe = box(1.5, 0.18, 0.72, M(MED, 0.4, 0, MED, 0.3), false); stripe.position.y = 0.05; amb.add(stripe);
  const cross2 = box(0.22, 0.22, 0.74, M(0xff5a5a, 0.4, 0, 0xff5a5a, 0.4), false); amb.add(cross2);
  const lb1 = box(0.18, 0.1, 0.18, M(MED_HI, 0.3, 0, MED_HI, 1), false); lb1.position.set(0.55, 0.42, 0); amb.add(lb1);
  const lb2 = box(0.18, 0.1, 0.18, M(0xff6b6b, 0.3, 0, 0xff6b6b, 1), false); lb2.position.set(0.78, 0.42, 0); amb.add(lb2);
  amb.position.set(-3, 0.45, 2.7); amb.rotation.y = Math.PI / 2; root.add(amb);

  return {
    cam: { pos: [6.2, 4.2, 6.6], target: [0.4, 1.15, 0.6] },
    update(t) {
      yaw.rotation.y = Math.sin(t * 0.5) * 0.6;
      sh.rotation.z = -0.5 + Math.sin(t * 0.8) * 0.22;
      el.rotation.z = 1.0 + Math.cos(t * 0.8) * 0.35;
      wr.rotation.z = Math.sin(t * 1.1) * 0.3;
      const beat = 0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(t * 2.6)), 8);
      screenMat.emissiveIntensity = 0.4 + beat;
      amb.position.x += 0.018; if (amb.position.x > 3.4) amb.position.x = -3.4;
      const blink = Math.sin(t * 12) > 0;
      lb1.material.emissiveIntensity = blink ? 1.3 : 0.1;
      lb2.material.emissiveIntensity = blink ? 0.1 : 1.3;
    }
  };
}

/* ============================================================
   WAREHOUSE — shed + conveyor + boxes + AGV + racking + truck + drone
   ============================================================ */
function buildWarehouse(scene, root) {
  groundShadow(root);

  // shed
  const shed = box(5.6, 2.2, 3.6, M(LIGHT, 0.9)); shed.position.set(-0.4, 1.1, -1.4); root.add(shed);
  // roof ridges
  for (let i = 0; i < 6; i++) { const r = box(5.6, 0.08, 0.12, M(GREY, 0.8), false); r.position.set(-0.4, 2.2, -2.9 + i * 0.6); root.add(r); }
  // dock doors
  [-1.6, 0.0, 1.4].forEach(dx => { const d = box(0.9, 1.1, 0.1, M(STEEL_DK, 0.6, 0.2)); d.position.set(-0.4 + dx, 0.55, 0.42); root.add(d); });

  // parked truck/trailer at a dock
  const truck = new THREE.Group(); truck.position.set(1.0, 0, 1.7);
  truck.add((() => { const m = box(2.0, 1.2, 1.0, M(WHITE, 0.6, 0.1)); m.position.y = 0.95; return m; })());
  const cabT = box(0.8, 1.0, 0.95, M(WH, 0.5, 0.2)); cabT.position.set(1.35, 0.8, 0); truck.add(cabT);
  [[-0.6, 0.52], [-0.6, -0.52], [1.2, 0.52], [1.2, -0.52]].forEach(([x, z]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 14), M(INK, 0.6)); w.rotation.x = Math.PI / 2; w.position.set(x, 0.22, z); truck.add(w); });
  root.add(truck);

  // conveyor with looping boxes + spinning rollers
  const conv = new THREE.Group(); conv.position.set(-2.0, 0, 2.0);
  const belt = box(3.0, 0.12, 0.8, M(STEEL_DK, 0.7, 0.2)); belt.position.y = 0.7; conv.add(belt);
  [-1.4, 1.4].forEach(x => { const rail = box(0.08, 0.18, 0.8, M(STEEL, 0.5, 0.3)); rail.position.set(x, 0.62, 0); conv.add(rail); });
  const rollers = [];
  for (let i = 0; i < 7; i++) { const rl = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.8, 12), M(STEEL, 0.5, 0.4)); rl.rotation.x = Math.PI / 2; rl.position.set(-1.3 + i * 0.43, 0.58, 0); conv.add(rl); rollers.push(rl); }
  const parcels = [];
  for (let i = 0; i < 4; i++) { const p = box(0.42, 0.32, 0.5, M(i % 2 ? COM_AMBER : 0xCBB892, 0.85)); p.position.set(-1.3 + i * 0.9, 0.92, 0); conv.add(p); parcels.push(p); }
  root.add(conv);

  // racking with pallets
  function rack(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    [-0.7, 0.7].forEach(px => [-0.45, 0.45].forEach(pz => { const u = box(0.08, 2.0, 0.08, M(WH, 0.5, 0.3)); u.position.set(px, 1.0, pz); g.add(u); }));
    [0.55, 1.25, 1.9].forEach(y => { const sh = box(1.5, 0.06, 1.0, M(STEEL, 0.6, 0.2)); sh.position.set(0, y, 0); g.add(sh); });
    [0.7, 1.4].forEach(y => [-0.35, 0.35].forEach(pz => { const pal = box(0.6, 0.4, 0.5, M(0xC8B591, 0.85)); pal.position.set(0, y + 0.23, pz); g.add(pal); }));
    root.add(g);
  }
  rack(-2.7, -0.6);

  // AGV carrying a pallet, looping a rectangular path
  const agv = new THREE.Group();
  agv.add(box(0.8, 0.22, 1.0, M(WH, 0.5, 0.3)));
  const load = box(0.55, 0.4, 0.6, M(0xC8B591, 0.85)); load.position.y = 0.3; agv.add(load);
  const eye = box(0.5, 0.06, 0.06, M(WH_HI, 0.3, 0, WH_HI, 0.8), false); eye.position.set(0, 0.05, 0.5); agv.add(eye);
  agv.position.set(-2.7, 0.18, 0.8); root.add(agv);
  const path = [[-2.7, 0.8], [-2.7, 2.0], [0.0, 2.0], [0.0, 0.8]];
  let seg = 0, segT = 0;

  // scanning drone
  const drone = new THREE.Group();
  drone.add(box(0.34, 0.1, 0.34, M(INK, 0.6)));
  const dro = [];
  [[0.32, 0.32], [-0.32, 0.32], [0.32, -0.32], [-0.32, -0.32]].forEach(([x, z]) => { const r = box(0.28, 0.02, 0.05, M(STEEL, 0.5, 0.3), false); r.position.set(x, 0.08, z); drone.add(r); dro.push(r); });
  const dscan = box(0.1, 0.05, 0.1, M(WH_HI, 0.3, 0, WH_HI, 1), false); dscan.position.y = -0.08; drone.add(dscan);
  drone.position.set(0, 2.8, 0); root.add(drone);

  return {
    cam: { pos: [6.8, 4.6, 7.2], target: [-0.2, 1.0, 0.5] },
    update(t, dt) {
      for (const r of rollers) r.rotation.z -= dt * 6;
      for (const p of parcels) { p.position.x += dt * 0.9; if (p.position.x > 1.45) p.position.x = -1.45; }
      // AGV along path
      segT += dt * 0.35;
      if (segT > 1) { segT = 0; seg = (seg + 1) % path.length; }
      const a = path[seg], b = path[(seg + 1) % path.length];
      agv.position.x = a[0] + (b[0] - a[0]) * segT;
      agv.position.z = a[1] + (b[1] - a[1]) * segT;
      agv.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
      const da = t * 0.5; drone.position.set(Math.sin(da) * 1.6 - 0.4, 2.7 + Math.sin(t * 1.4) * 0.15, Math.cos(da) * 1.6); drone.rotation.y = -da;
      for (let i = 0; i < dro.length; i++) dro[i].rotation.y = t * 22 + i;
      dscan.material.emissiveIntensity = 0.4 + 0.6 * Math.abs(Math.sin(t * 4));
    }
  };
}

/* ============================================================
   COMMERCIAL & TECHNOLOGY — glass building, panning cameras + scan cones,
   turnstile, sequenced lighting, data-pulse network
   ============================================================ */
function buildCommercial(scene, root) {
  groundShadow(root);

  // glass office tower with a window grid (sequenced lighting)
  const tower = box(2.2, 4.0, 2.2, M(GLASS, 0.25, 0.55)); tower.position.set(-0.9, 2.0, -1.3); root.add(tower);
  const winMats = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) {
    const mm = M(WARM, 0.3, 0.2, WARM, 0.2);
    const wpane = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.06), mm);
    wpane.position.set(-0.9 - 0.66 + c * 0.44, 0.7 + r * 0.6, -0.19); root.add(wpane); winMats.push({ m: mm, i: r * 4 + c });
  }
  // retail podium with storefront glow
  const podium = box(4.2, 1.2, 2.0, M(LIGHT, 0.9)); podium.position.set(0.4, 0.6, 0.7); root.add(podium);
  const store = box(4.0, 0.7, 0.08, M(COM_AMBER, 0.3, 0.2, COM_AMBER_HI, 0.5), false); store.position.set(0.4, 0.55, 1.71); root.add(store);
  const sign = box(1.4, 0.26, 0.1, M(COM_AMBER_HI, 0.3, 0, COM_AMBER_HI, 0.8), false); sign.position.set(0.4, 1.05, 1.72); root.add(sign);

  // security cameras on poles, with sweeping scan cones
  const cams = [];
  function secCam(x, z, baseAng) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const pole = box(0.07, 2.0, 0.07, M(STEEL_DK, 0.5, 0.3)); pole.position.y = 1.0; g.add(pole);
    const head = new THREE.Group(); head.position.y = 2.0; g.add(head);
    const body = box(0.34, 0.22, 0.5, M(0x202B3D, 0.5, 0.3)); body.position.z = 0.1; head.add(body);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.1, 16), M(MED_HI, 0.2, 0.4, MED_HI, 0.6)); lens.rotation.x = Math.PI / 2; lens.position.set(0, 0, 0.36); head.add(lens);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.2, 20, 1, true), new THREE.MeshBasicMaterial({ color: MED_HI, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false }));
    cone.rotation.x = -Math.PI / 2; cone.position.set(0, 0, 1.25); head.add(cone);
    root.add(g); cams.push({ head, baseAng });
  }
  secCam(-2.8, 2.2, 0.5); secCam(2.9, 1.6, -0.6);

  // turnstile / access gate at the storefront
  const turn = new THREE.Group(); turn.position.set(0.4, 0, 1.95);
  turn.add((() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.9, 16), M(STEEL_DK, 0.5, 0.4)); m.position.y = 0.45; return m; })());
  const arms = new THREE.Group(); arms.position.y = 0.7;
  for (let i = 0; i < 3; i++) { const a = box(0.7, 0.05, 0.05, M(STEEL, 0.4, 0.4), false); a.position.x = 0.32; const holder = new THREE.Group(); holder.rotation.y = i * (Math.PI * 2 / 3); holder.add(a); arms.add(holder); }
  turn.add(arms); root.add(turn);

  // data-pulse network between rooftop / pole nodes
  const nodes = [new THREE.Vector3(-0.9, 4.1, -1.3), new THREE.Vector3(-2.8, 2.05, 2.2), new THREE.Vector3(2.9, 2.05, 1.6), new THREE.Vector3(0.4, 1.3, 0.7)];
  nodes.forEach(n => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), M(MED_HI, 0.3, 0, MED_HI, 1)); s.position.copy(n); root.add(s); });
  const pulses = [];
  const linkMat = new THREE.LineBasicMaterial({ color: MED, transparent: true, opacity: 0.28 });
  [[0, 1], [0, 2], [0, 3]].forEach(([a, b]) => {
    const A = nodes[a], B = nodes[b], mid = A.clone().add(B).multiplyScalar(0.5); mid.y += 0.5;
    const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(20)), linkMat));
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), M(MED_HI, 0.3, 0, MED_HI, 1.4));
    root.add(dot); pulses.push({ dot, curve, t: Math.random(), sp: 0.3 + Math.random() * 0.2 });
  });
  const tmp = new THREE.Vector3();

  return {
    cam: { pos: [6.6, 4.6, 7], target: [0, 1.7, 0.4] },
    update(t, dt) {
      for (const c of cams) c.head.rotation.y = c.baseAng + Math.sin(t * 0.6 + c.baseAng) * 0.6;
      arms.rotation.y += dt * 0.9;
      for (const wp of winMats) wp.m.emissiveIntensity = 0.12 + 0.7 * ((Math.sin(t * 1.6 - wp.i * 0.4) + 1) / 2);
      for (const p of pulses) { p.t = (p.t + p.sp * dt) % 1; p.curve.getPoint(p.t, tmp); p.dot.position.copy(tmp); }
    }
  };
}

/* ============================================================
   Boot: one scene per sector media box
   ============================================================ */
const BUILDERS = { medical: buildMedical, warehouse: buildWarehouse, commercial: buildCommercial };
document.querySelectorAll('.sector-scene').forEach(host => {
  const kind = host.getAttribute('data-sector');
  const build = BUILDERS[kind];
  if (build) { try { makeScene(host, build); } catch (e) { console.warn('Sector scene error (' + kind + '):', e); } }
});
