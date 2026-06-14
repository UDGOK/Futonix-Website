/* ============================================================
   FUTONIX — Scroll-scrubbed "Watch it come together" (Three.js)
   A pinned section: as you scroll, a tower assembles floor-by-floor,
   the camera orbits, and captions cross-fade (Design→Build→Automate).
   Falls back to a static 3-step block if reduced-motion / no WebGL.
   ============================================================ */
import * as THREE from 'three';

const section = document.querySelector('[data-buildseq]');
const mount = section && section.querySelector('.buildseq-canvas');

if (section && mount) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) section.classList.add('buildseq--fallback');
  else { try { init(section, mount); } catch (e) { section.classList.add('buildseq--fallback'); console.warn('buildseq 3D unavailable:', e); } }
}

function init(section, mount) {
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
  cam.lookAt(0, 2.7, 0);
  const setCam = () => { const a = w / h; cam.left = -F * a; cam.right = F * a; cam.top = F; cam.bottom = -F; cam.updateProjectionMatrix(); };
  setCam();

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb6cad8, 0.85));
  scene.add(new THREE.AmbientLight(0xffffff, 0.26));
  const dir = new THREE.DirectionalLight(0xffffff, 1.15);
  dir.position.set(7, 15, 5); dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  const s = dir.shadow.camera; s.left = -12; s.right = 12; s.top = 18; s.bottom = -6; s.near = 1; s.far = 54;
  dir.shadow.radius = 7; dir.shadow.bias = -0.0005;
  scene.add(dir);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.14 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(30, 30, 0x050419, 0x050419);
  grid.material.transparent = true; grid.material.opacity = 0.07; grid.position.y = 0.01; scene.add(grid);

  const group = new THREE.Group(); scene.add(group);

  const TONES = [0xEBF2F7, 0xDFEAF1, 0xD2E1EA, 0xC6D9E5];
  // base podium (always visible)
  const baseW = 3.0, floorH = 0.6, N = 9;
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(baseW + 0.7, 0.3, baseW + 0.7),
    new THREE.MeshStandardMaterial({ color: 0xBFD3E0, roughness: 0.96 })
  );
  base.position.y = 0.15; base.castShadow = true; base.receiveShadow = true; group.add(base);

  const floors = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const size = baseW - t * 0.95;            // gentle taper
    const isTop = i === N - 1;
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(size, floorH, size),
      new THREE.MeshStandardMaterial({
        color: isTop ? 0x5FB3A1 : TONES[i % TONES.length],
        roughness: 0.94, transparent: true, opacity: 1,
        emissive: isTop ? 0x5FB3A1 : 0x000000, emissiveIntensity: isTop ? 0.16 : 0
      })
    );
    m.castShadow = true; m.receiveShadow = true;
    m.userData.baseY = 0.3 + i * floorH + floorH / 2;
    group.add(m); floors.push(m);
  }

  const steps = [...section.querySelectorAll('.buildseq-step')];

  let progress = 0, visible = true;
  const computeProgress = () => {
    const r = section.getBoundingClientRect();
    const total = section.offsetHeight - window.innerHeight;
    return total > 0 ? Math.max(0, Math.min(1, -r.top / total)) : 0;
  };
  const onScroll = () => { progress = computeProgress(); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(section);
  }
  const onResize = () => { w = mount.clientWidth || w; h = mount.clientHeight || h; renderer.setSize(w, h); setCam(); };
  window.addEventListener('resize', onResize, { passive: true });

  const ease = (x) => 1 - Math.pow(1 - x, 3);
  const apply = (p) => {
    const step = 1 / N;
    for (let i = 0; i < floors.length; i++) {
      const f = floors[i];
      const local = Math.max(0, Math.min(1, (p - i * step) / (step * 1.4)));
      const e = ease(local);
      f.visible = e > 0.001;
      f.material.opacity = e;
      f.position.y = f.userData.baseY - (1 - e) * 0.8;   // drop-in
      const sc = 0.82 + e * 0.18;
      f.scale.set(sc, 1, sc);
    }
    group.rotation.y = -0.28 + p * 0.55;                  // slow orbit
    let idx = 0;
    steps.forEach((el, i) => {
      const active = (p < 0.34 ? 0 : p < 0.67 ? 1 : 2) === i;
      el.classList.toggle('active', active);
      if (active) idx = i;
    });
    return idx;
  };

  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible) return;
    apply(progress);
    renderer.render(scene, cam);
  };
  apply(0);
  tick();
}
