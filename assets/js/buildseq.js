/* ============================================================
   FUTONIX — Scroll-scrubbed WebGL sections (Three.js)
   One engine, mode-aware via data-mode on [data-buildseq]:
     • "assemble" (default) — a tower builds floor-by-floor   (home, about)
     • "sectors"            — morphs Medical→Warehouse→Hospitality (projects)
   Captions (.buildseq-step) cross-fade by scroll progress.
   Falls back to a static step block if reduced-motion / no WebGL.
   ============================================================ */
import * as THREE from 'three';

const TONES = [0xEBF2F7, 0xDFEAF1, 0xD2E1EA, 0xC6D9E5];
const SECTOR = { med: 0x5FB3A1, wh: 0x5B83A8, hos: 0xC2A36B };
const smooth = (x) => x * x * (3 - 2 * x);
const ease = (x) => 1 - Math.pow(1 - x, 3);

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
  const cam = new THREE.OrthographicCamera(-F, F, F, -F, -60, 120);
  cam.position.set(9, 8, 9);
  cam.lookAt(0, mode === 'sectors' ? 2.0 : 2.7, 0);
  const setCam = () => { const a = w / h; cam.left = -F * a; cam.right = F * a; cam.top = F; cam.bottom = -F; cam.updateProjectionMatrix(); };
  setCam();

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb6cad8, 0.85));
  scene.add(new THREE.AmbientLight(0xffffff, 0.26));
  const dir = new THREE.DirectionalLight(0xffffff, 1.15);
  dir.position.set(7, 15, 5); dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  const s = dir.shadow.camera; s.left = -14; s.right = 14; s.top = 18; s.bottom = -8; s.near = 1; s.far = 54;
  dir.shadow.radius = 7; dir.shadow.bias = -0.0005;
  scene.add(dir);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.14 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(30, 30, 0x050419, 0x050419);
  grid.material.transparent = true; grid.material.opacity = 0.07; grid.position.y = 0.01; scene.add(grid);

  const group = new THREE.Group(); scene.add(group);

  const box = (bw, bh, bd, color, opts = {}) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd),
      new THREE.MeshStandardMaterial({ color, roughness: 0.94, metalness: 0, transparent: true, opacity: 1,
        emissive: opts.emissive || 0x000000, emissiveIntensity: opts.emissiveIntensity || 0 }));
    m.castShadow = true; m.receiveShadow = true; return m;
  };

  const applyFn = mode === 'sectors' ? buildSectors(group, box) : buildAssemble(group, box);

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
  const onResize = () => { w = mount.clientWidth || w; h = mount.clientHeight || h; renderer.setSize(w, h); setCam(); };
  window.addEventListener('resize', onResize, { passive: true });

  const tick = () => {
    requestAnimationFrame(tick);
    if (!vis) return;
    applyFn(progress);
    setCaption(progress);
    group.rotation.y = -0.28 + progress * 0.5;   // slow orbit through the whole section
    renderer.render(scene, cam);
  };
  applyFn(0); setCaption(0); tick();
}

/* ---- mode: assemble (tower builds floor by floor) ---- */
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
  return (p) => {
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
  };
}

/* ---- mode: sectors (cross-fade between three sector buildings) ---- */
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

  const setOpacity = (g, o) => { g.visible = o > 0.01; g.traverse((ch) => { if (ch.material) ch.material.opacity = o; }); };

  return (p) => {
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
  };
}
