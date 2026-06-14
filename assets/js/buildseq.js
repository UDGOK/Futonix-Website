/* ============================================================
   FUTONIX — Scroll-scrubbed WebGL sections (Three.js)
   Mode-aware via data-mode on [data-buildseq]:
     • "assemble" — tower builds floor-by-floor + robot arm   (home, about)
     • "sectors"  — morphs Medical→Warehouse→Hospitality + drone (projects)
   Camera orbit via data-orbit: "rise" | "spiral" | "pan".
   Captions (.buildseq-step) cross-fade by scroll progress.
   Falls back to a static step block if reduced-motion / no WebGL.
   ============================================================ */
import * as THREE from 'three';

const TONES = [0xEBF2F7, 0xDFEAF1, 0xD2E1EA, 0xC6D9E5];
const SECTOR = { med: 0x5FB3A1, wh: 0x5B83A8, hos: 0xC2A36B };
const NAVY = 0x050419, STEEL = 0x2A3242, METAL = 0xC6D9E5;
const smooth = (x) => x * x * (3 - 2 * x);
const ease = (x) => 1 - Math.pow(1 - x, 3);
const lerp = (a, b, t) => a + (b - a) * t;

const ORBITS = {
  rise:   (p) => ({ theta: 0.72 + p * 0.30, phi: lerp(1.18, 0.74, p) }),   // camera climbs as it builds
  spiral: (p) => ({ theta: lerp(0.30, 1.55, p), phi: lerp(1.02, 0.80, p) }), // sweeps around + rises
  pan:    (p) => ({ theta: lerp(1.20, -0.20, p), phi: 0.98 }),               // slides across the sectors
};

document.querySelectorAll('[data-buildseq]').forEach((section) => {
  const mount = section.querySelector('.buildseq-canvas');
  if (!mount) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { section.classList.add('buildseq--fallback'); return; }
  try { init(section, mount, section.dataset.mode || 'assemble'); }
  catch (e) { section.classList.add('buildseq--fallback'); console.warn('buildseq unavailable:', e); }
});

function init(section, mount, mode) {
  let w = mount.clientWidth || 900;
  let h = mount.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const F = 6.6;
  const cam = new THREE.OrthographicCamera(-F, F, F, -F, -80, 160);
  const setFrustum = () => { const a = w / h; cam.left = -F * a; cam.right = F * a; cam.top = F; cam.bottom = -F; cam.updateProjectionMatrix(); };
  setFrustum();

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb6cad8, 0.85));
  scene.add(new THREE.AmbientLight(0xffffff, 0.26));
  const dir = new THREE.DirectionalLight(0xffffff, 1.15);
  dir.position.set(7, 15, 5); dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  const s = dir.shadow.camera; s.left = -16; s.right = 16; s.top = 20; s.bottom = -8; s.near = 1; s.far = 60;
  dir.shadow.radius = 7; dir.shadow.bias = -0.0005;
  scene.add(dir);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.ShadowMaterial({ opacity: 0.14 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(34, 34, NAVY, NAVY);
  grid.material.transparent = true; grid.material.opacity = 0.07; grid.position.y = 0.01; scene.add(grid);

  const group = new THREE.Group(); scene.add(group);

  const box = (bw, bh, bd, color, opts = {}) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd),
      new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.94, metalness: 0, transparent: true, opacity: 1,
        emissive: opts.emissive || 0x000000, emissiveIntensity: opts.emissiveIntensity || 0 }));
    m.castShadow = true; m.receiveShadow = true; return m;
  };

  const applyFn = mode === 'sectors' ? buildSectors(group, box) : buildAssemble(group, box);

  // ---- camera orbit ----
  const target = new THREE.Vector3(0, mode === 'sectors' ? 2.1 : 2.7, 0);
  const R = 26;
  const orbitFn = ORBITS[section.dataset.orbit] || ORBITS[mode === 'sectors' ? 'pan' : 'rise'];
  const updateCamera = (p, t) => {
    const o = orbitFn(p);
    const theta = o.theta + Math.sin(t * 0.25) * 0.02;     // subtle idle breathing
    const st = Math.sin(o.phi);
    cam.position.set(target.x + R * st * Math.sin(theta), target.y + R * Math.cos(o.phi), target.z + R * st * Math.cos(theta));
    cam.lookAt(target);
  };

  const steps = [...section.querySelectorAll('.buildseq-step')];
  const setCaption = (p) => {
    const n = steps.length || 1;
    const idx = Math.min(n - 1, Math.floor(p * n));
    steps.forEach((el, i) => el.classList.toggle('active', i === idx));
  };

  let progress = 0, vis = true;
  const computeProgress = () => {
    const r = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    return total > 0 ? Math.max(0, Math.min(1, -r.top / total)) : 0;
  };
  const onScroll = () => { progress = computeProgress(); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { vis = es[0].isIntersecting; }, { threshold: 0 }).observe(section);
  }
  const onResize = () => { w = mount.clientWidth || w; h = mount.clientHeight || h; renderer.setSize(w, h); setFrustum(); };
  window.addEventListener('resize', onResize, { passive: true });

  const clock = new THREE.Clock();
  const tick = () => {
    requestAnimationFrame(tick);
    if (!vis) return;
    const t = clock.getElapsedTime();
    applyFn(progress, t);
    setCaption(progress);
    updateCamera(progress, t);
    renderer.render(scene, cam);
  };
  applyFn(0, 0); setCaption(0); updateCamera(0, 0); tick();
}

/* ---- an articulated industrial robot arm ---- */
function robotArm(group, box) {
  const rig = new THREE.Group(); rig.position.set(3.7, 0, 1.9);
  rig.add(box(0.8, 0.22, 0.8, NAVY, { rough: 0.6 }));            // base plate
  const yaw = new THREE.Group(); yaw.position.y = 0.11; rig.add(yaw);
  const col = box(0.36, 0.8, 0.36, STEEL, { rough: 0.5 }); col.position.y = 0.4; yaw.add(col);
  const shoulder = new THREE.Group(); shoulder.position.y = 0.8; yaw.add(shoulder);
  const lower = box(0.24, 1.7, 0.24, METAL); lower.position.y = 0.85; shoulder.add(lower);
  const elbow = new THREE.Group(); elbow.position.y = 1.7; shoulder.add(elbow);
  const upper = box(0.2, 1.3, 0.2, METAL); upper.position.y = 0.65; elbow.add(upper);
  const wrist = new THREE.Group(); wrist.position.y = 1.3; elbow.add(wrist);
  wrist.add(box(0.4, 0.18, 0.4, NAVY, { rough: 0.5 }));          // gripper head
  group.add(rig);
  return { yaw, shoulder, elbow, wrist };
}

/* ---- mode: assemble (tower builds + robot arm works) ---- */
function buildAssemble(group, box) {
  const baseW = 3.0, floorH = 0.6, N = 9;
  const base = box(baseW + 0.7, 0.3, baseW + 0.7, 0xBFD3E0); base.position.y = 0.15; group.add(base);
  const floors = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const size = baseW - t * 0.95;
    const isTop = i === N - 1;
    const m = box(size, floorH, size, isTop ? SECTOR.med : TONES[i % TONES.length],
      isTop ? { emissive: SECTOR.med, emissiveIntensity: 0.16 } : {});
    m.userData.baseY = 0.3 + i * floorH + floorH / 2;
    group.add(m); floors.push(m);
  }
  const arm = robotArm(group, box);

  return (p, t) => {
    const step = 1 / N;
    for (let i = 0; i < floors.length; i++) {
      const f = floors[i];
      const local = Math.max(0, Math.min(1, (p - i * step) / (step * 1.4)));
      const e = ease(local);
      f.visible = e > 0.001;
      f.material.opacity = e;
      f.position.y = f.userData.baseY - (1 - e) * 0.8;
      const sc = 0.82 + e * 0.18;
      f.scale.set(sc, 1, sc);
    }
    // articulate the arm with scroll (so it "works" as floors land) + faint idle
    arm.yaw.rotation.y = -0.5 + Math.sin(p * Math.PI * 3) * 0.9 + Math.sin(t * 0.6) * 0.04;
    arm.shoulder.rotation.z = -0.5 + Math.sin(p * Math.PI * 5 + 0.6) * 0.45;
    arm.elbow.rotation.z = 0.95 + Math.cos(p * Math.PI * 5) * 0.55;
    arm.wrist.rotation.z = Math.sin(p * Math.PI * 6) * 0.3;
  };
}

/* ---- an autonomous quadcopter inspection drone ---- */
function drone(group, box) {
  const d = new THREE.Group();
  d.add(box(0.5, 0.16, 0.5, NAVY, { rough: 0.5 }));        // body
  d.add(box(1.15, 0.05, 0.1, STEEL));                       // arms X
  d.add(box(0.1, 0.05, 1.15, STEEL));                       // arms Z
  const rotors = [];
  for (const [x, z] of [[0.55, 0.55], [-0.55, 0.55], [0.55, -0.55], [-0.55, -0.55]]) {
    const pod = box(0.16, 0.1, 0.16, STEEL, { rough: 0.5 }); pod.position.set(x, 0.06, z); d.add(pod);
    const r = box(0.46, 0.02, 0.07, METAL); r.position.set(x, 0.14, z); d.add(r); rotors.push(r);
  }
  group.add(d);
  return { d, rotors };
}

/* ---- mode: sectors (cross-fade three buildings + orbiting drone) ---- */
function buildSectors(group, box) {
  const podium = (g, bw, bd) => { const b = box(bw, 0.3, bd, 0xBFD3E0); b.position.y = 0.15; g.add(b); };

  const med = new THREE.Group();
  podium(med, 2.1, 2.1);
  for (let i = 0; i < 7; i++) { const m = box(1.8 - i * 0.09, 0.55, 1.8 - i * 0.09, TONES[i % TONES.length]); m.position.y = 0.3 + i * 0.55 + 0.275; med.add(m); }
  { const cap = box(1.0, 0.4, 1.0, SECTOR.med, { emissive: SECTOR.med, emissiveIntensity: 0.18 }); cap.position.y = 0.3 + 7 * 0.55 + 0.2; med.add(cap); }

  const wh = new THREE.Group();
  podium(wh, 4.6, 2.8);
  { const body = box(4.2, 1.35, 2.4, TONES[2]); body.position.y = 0.3 + 0.675; wh.add(body);
    const roof = box(4.2, 0.18, 2.4, SECTOR.wh, { emissive: SECTOR.wh, emissiveIntensity: 0.16 }); roof.position.y = 0.3 + 1.35 + 0.09; wh.add(roof); }

  const hos = new THREE.Group();
  podium(hos, 3.0, 3.0);
  { const body = box(2.6, 2.5, 2.6, TONES[1]); body.position.y = 0.3 + 1.25; hos.add(body);
    const roof = box(2.0, 0.3, 2.0, SECTOR.hos, { emissive: SECTOR.hos, emissiveIntensity: 0.16 }); roof.position.y = 0.3 + 2.5 + 0.15; hos.add(roof); }

  const builds = [med, wh, hos];
  builds.forEach((b) => group.add(b));
  const drn = drone(group, box);

  const setOpacity = (g, o) => { g.visible = o > 0.01; g.traverse((ch) => { if (ch.material) ch.material.opacity = o; }); };

  return (p, t) => {
    const n = builds.length;
    for (let i = 0; i < n; i++) {
      const center = (i + 0.5) / n;
      const wgt = Math.max(0, 1 - Math.abs(p - center) / (1 / n));
      const e = smooth(wgt);
      setOpacity(builds[i], e);
      builds[i].position.y = -(1 - e) * 0.7;
      const sc = 0.84 + e * 0.16;
      builds[i].scale.set(sc, sc, sc);
    }
    // drone circles the building as you scroll; rotors spin on their own
    const ang = p * Math.PI * 2.2;
    const rad = 4.6;
    drn.d.position.set(Math.sin(ang) * rad, 3.6 + Math.sin(p * Math.PI * 4) * 0.4, Math.cos(ang) * rad);
    drn.d.rotation.y = -ang + Math.PI;
    for (let i = 0; i < drn.rotors.length; i++) drn.rotors[i].rotation.y = t * 22 + i;
  };
}
