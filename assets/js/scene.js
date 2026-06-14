/* ============================================================
   FUTONIX — Hero WebGL Scene (Three.js, bundled locally)
   Cinematic BIM + robotics city: solid + glowing-wireframe (BIM)
   buildings on a site grid, an articulated robot arm, an
   autonomous drone, and turbines. Scroll-reactive + parallax.
   Falls back to inline SVG if WebGL/import fails.
   ============================================================ */
import * as THREE from 'three';

// Palette constants must be declared BEFORE init() runs (init reads them) to
// avoid a temporal-dead-zone ReferenceError.
const TONES = [0xEBF2F7, 0xDFEAF1, 0xD2E1EA, 0xC6D9E5];
const SECTOR = { med: 0x5FB3A1, wh: 0x5B83A8, hos: 0xC2A36B };
const NAVY = 0x050419, STEEL = 0x2A3242, METAL = 0xC6D9E5, BIM = 0x5EEAD4;

const mount = document.querySelector('.scene-canvas');
const wrap = document.getElementById('hero-scene');

if (mount && wrap) {
  try { init(mount, wrap); }
  catch (e) { console.warn('Hero 3D unavailable, using SVG fallback:', e); }
}

function init(mount, wrap) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = mount.clientWidth || 1280;
  let h = mount.clientHeight || w * 0.45;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);
  wrap.classList.add('webgl');

  const scene = new THREE.Scene();

  // ---- Camera: cinematic orthographic isometric ----
  const BASE_F = 5.4;     // vertical half-extent on wide screens
  const MIN_HALF_W = 8.6; // keep the full city width in frame on narrow screens
  const cam = new THREE.OrthographicCamera(-BASE_F, BASE_F, BASE_F, -BASE_F, -80, 160);
  cam.position.set(11, 6.6, 13);
  cam.lookAt(0, 2.2, 0);
  const setCam = () => {
    const a = w / h;
    const F = Math.max(BASE_F, MIN_HALF_W / a); // zoom out only if the width would clip
    cam.left = -F * a; cam.right = F * a; cam.top = F; cam.bottom = -F; cam.updateProjectionMatrix();
  };
  setCam();

  // ---- Lights ----
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb6cad8, 0.85));
  scene.add(new THREE.AmbientLight(0xffffff, 0.26));
  const dir = new THREE.DirectionalLight(0xffffff, 1.15);
  dir.position.set(8, 14, 5); dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  const sc = dir.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 18; sc.bottom = -12; sc.near = 1; sc.far = 56;
  dir.shadow.radius = 7; dir.shadow.bias = -0.0005;
  scene.add(dir);

  // ---- Ground + BIM site grid ----
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.ShadowMaterial({ opacity: 0.14 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(44, 44, BIM, NAVY);
  grid.material.transparent = true; grid.material.opacity = 0.10; grid.position.y = 0.01; scene.add(grid);

  const city = new THREE.Group(); scene.add(city);

  // ---- builders: solid (with BIM edge glow) + wireframe (under construction) ----
  // Solid-building BIM outline: subtle teal. Under-construction massing: navy blueprint (reads on light bg).
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x2DD4BF, transparent: true, opacity: 0.32 });
  const wireMat = new THREE.LineBasicMaterial({ color: NAVY, transparent: true, opacity: 0.42 });
  const wireAccent = new THREE.LineBasicMaterial({ color: 0x147D6F, transparent: true, opacity: 0.7 });
  const addEdges = (mesh, geo, mat) => { mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat)); };

  const solid = (x, z, bw, bd, bh, tone, accent) => {
    const geo = new THREE.BoxGeometry(bw, bh, bd);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: tone, roughness: 0.94, metalness: 0 }));
    m.position.set(x, bh / 2, z); m.castShadow = true; m.receiveShadow = true;
    addEdges(m, geo, edgeMat);                                   // BIM glow edges
    city.add(m);
    if (accent) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.66, 0.18, bd * 0.66),
        new THREE.MeshStandardMaterial({ color: SECTOR[accent], roughness: 0.5, emissive: SECTOR[accent], emissiveIntensity: 0.2 }));
      cap.position.set(x, bh + 0.09, z); cap.castShadow = true; city.add(cap);
    }
  };
  const wirebuilding = (x, z, bw, bd, bh) => {
    const geo = new THREE.BoxGeometry(bw, bh, bd);
    const ghost = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x0A1A24, roughness: 1, transparent: true, opacity: 0.16 }));
    ghost.position.set(x, bh / 2, z); addEdges(ghost, geo, wireMat); city.add(ghost);
    // floor slabs to read as a model-in-progress
    const floors = Math.max(2, Math.round(bh / 0.7));
    for (let i = 1; i < floors; i++) {
      const fg = new THREE.BoxGeometry(bw, 0.02, bd);
      const fl = new THREE.LineSegments(new THREE.EdgesGeometry(fg), wireAccent);
      fl.position.set(x, i * (bh / floors), z); city.add(fl);
    }
  };

  // [x,z,w,d,h,tone,accent] solids
  [
    [0, 0, 1.9, 1.9, 4.6, TONES[0], 'med'],
    [-3.1, 0.4, 3.4, 1.7, 1.1, TONES[2]],
    [3.0, -0.7, 1.6, 1.6, 2.9, TONES[1], 'hos'],
    [-1.8, -1.9, 1.3, 1.3, 2.0, TONES[1]],
    [1.6, 1.9, 1.4, 1.4, 1.5, TONES[2]],
    [-2.6, 2.4, 1.1, 1.1, 1.1, TONES[3]],
    [-5.0, 1.4, 1.4, 1.4, 1.0, TONES[3]],
    [5.2, 0.6, 1.2, 1.2, 2.1, TONES[2], 'wh'],
    [-6.6, -0.4, 1.0, 1.0, 1.5, TONES[3]],
    [6.7, -1.8, 1.0, 1.0, 1.2, TONES[3]],
    [0.6, 3.2, 0.9, 0.9, 0.6, TONES[3]]
  ].forEach(b => solid(...b));

  // BIM wireframe buildings (under construction)
  [
    [-4.0, -2.0, 1.4, 1.4, 3.0],
    [2.2, -2.4, 1.3, 1.3, 3.6],
    [4.2, 2.2, 1.2, 1.2, 2.4]
  ].forEach(b => wirebuilding(...b));

  // ---- Robot arm (articulated) ----
  const armMatNavy = new THREE.MeshStandardMaterial({ color: NAVY, roughness: 0.6 });
  const armMatSteel = new THREE.MeshStandardMaterial({ color: STEEL, roughness: 0.5 });
  const armMatMetal = new THREE.MeshStandardMaterial({ color: METAL, roughness: 0.85 });
  const part = (g, w2, h2, d2, mat, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w2, h2, d2), mat); m.position.y = y; m.castShadow = true; g.add(m); return m; };
  const rig = new THREE.Group(); rig.position.set(3.2, 0, 2.7); rig.scale.setScalar(1.35);
  part(rig, 0.9, 0.22, 0.9, armMatNavy, 0.11);
  const yaw = new THREE.Group(); yaw.position.y = 0.11; rig.add(yaw);
  part(yaw, 0.38, 0.85, 0.38, armMatSteel, 0.42);
  const shoulder = new THREE.Group(); shoulder.position.y = 0.85; yaw.add(shoulder);
  part(shoulder, 0.24, 1.7, 0.24, armMatMetal, 0.85);
  const elbow = new THREE.Group(); elbow.position.y = 1.7; shoulder.add(elbow);
  part(elbow, 0.2, 1.3, 0.2, armMatMetal, 0.65);
  const wrist = new THREE.Group(); wrist.position.y = 1.3; elbow.add(wrist);
  part(wrist, 0.42, 0.18, 0.42, armMatNavy, 0.09);
  city.add(rig);

  // ---- Autonomous drone (orbits) ----
  const drone = new THREE.Group();
  const dbody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.5), armMatNavy); dbody.castShadow = true; drone.add(dbody);
  drone.add(new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 0.1), armMatSteel));
  drone.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 1.15), armMatSteel));
  const rotors = [];
  [[0.55, 0.55], [-0.55, 0.55], [0.55, -0.55], [-0.55, -0.55]].forEach(([rx, rz]) => {
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.02, 0.07), armMatMetal); r.position.set(rx, 0.14, rz); drone.add(r); rotors.push(r);
  });
  city.add(drone);

  // ---- Turbines ----
  const hubs = [];
  const turbine = (x, z, s) => {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.08 * s, 2.4 * s, 10), new THREE.MeshStandardMaterial({ color: 0xF3F8FB, roughness: 0.7 }));
    pole.position.y = 1.2 * s; pole.castShadow = true; g.add(pole);
    const hub = new THREE.Group(); hub.position.set(0, 2.4 * s, 0.06 * s);
    for (let i = 0; i < 3; i++) { const arm = new THREE.Group(); const bl = new THREE.Mesh(new THREE.BoxGeometry(0.07 * s, 1.2 * s, 0.16 * s), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.6 })); bl.position.y = 0.6 * s; bl.castShadow = true; arm.rotation.z = i * (Math.PI * 2 / 3); arm.add(bl); hub.add(arm); }
    g.add(hub); g.position.set(x, 0, z); city.add(g); hubs.push(hub);
  };
  turbine(-7.4, 1.8, 1.0); turbine(7.8, 2.6, 0.8);

  // ---- Pointer parallax + scroll reactivity ----
  let tx = 0, ty = 0, cx = 0, cy = 0, scrollP = 0;
  if (!reduce) window.addEventListener('pointermove', (e) => { tx = (e.clientX / window.innerWidth - 0.5); ty = (e.clientY / window.innerHeight - 0.5); }, { passive: true });
  const heroEl = document.querySelector('.hero');
  const onHeroScroll = () => { const hh = (heroEl && heroEl.offsetHeight) || window.innerHeight; scrollP = Math.min(window.scrollY / hh, 1); };
  window.addEventListener('scroll', onHeroScroll, { passive: true }); onHeroScroll();

  let visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(wrap);
  const onResize = () => { w = mount.clientWidth || w; h = mount.clientHeight || h; renderer.setSize(w, h); setCam(); };
  window.addEventListener('resize', onResize, { passive: true });

  const clock = new THREE.Clock();
  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();
    cx += (tx - cx) * 0.04; cy += (ty - cy) * 0.04;
    city.position.y = Math.sin(t * 0.6) * 0.07 - scrollP * 0.7;
    city.rotation.y = Math.sin(t * 0.12) * 0.10 + cx * 0.22 + scrollP * 0.45;
    city.rotation.x = cy * 0.05;
    mount.style.opacity = (1 - scrollP * 0.6).toFixed(3);
    // robot arm — continuous "working" motion
    yaw.rotation.y = Math.sin(t * 0.5) * 0.7;
    shoulder.rotation.z = -0.4 + Math.sin(t * 0.7) * 0.3;
    elbow.rotation.z = 0.9 + Math.cos(t * 0.7) * 0.4;
    wrist.rotation.z = Math.sin(t * 0.9) * 0.25;
    // drone orbit + rotors
    const a = t * 0.4;
    drone.position.set(Math.sin(a) * 4.3, 5.0 + Math.sin(t * 1.3) * 0.3, Math.cos(a) * 4.3);
    drone.rotation.y = -a + Math.PI;
    for (let i = 0; i < rotors.length; i++) rotors[i].rotation.y = t * 22 + i;
    // turbines
    for (const hub of hubs) hub.rotation.z += 0.02;
    renderer.render(scene, cam);
  };
  if (reduce) { renderer.render(scene, cam); } else tick();
}
