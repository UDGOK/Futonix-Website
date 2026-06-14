/* ============================================================
   FUTONIX — Hero WebGL Scene (Three.js, bundled locally)
   Tonal monochrome low-poly skyline with muted per-sector
   accents + a blueprint ground grid. SVG fallback if WebGL fails.
   ============================================================ */
import * as THREE from 'three';

const mount = document.querySelector('.scene-canvas');
const wrap = document.getElementById('hero-scene');

if (mount && wrap) {
  try { init(mount, wrap); }
  catch (e) { console.warn('Hero 3D unavailable, using SVG fallback:', e); }
}

function init(mount, wrap) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w = mount.clientWidth || 960;
  let h = mount.clientHeight || w * 0.5625;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);
  wrap.classList.add('webgl');

  const scene = new THREE.Scene();

  // ---- Camera: orthographic isometric ----
  const F = 7.0;
  const cam = new THREE.OrthographicCamera(-F, F, F, -F, -60, 120);
  cam.position.set(9, 7.4, 9);
  cam.lookAt(0, 1.6, 0);
  const setCam = () => {
    const a = w / h;
    cam.left = -F * a; cam.right = F * a; cam.top = F; cam.bottom = -F;
    cam.updateProjectionMatrix();
  };
  setCam();

  // ---- Lights ----
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb6cad8, 0.85));
  scene.add(new THREE.AmbientLight(0xffffff, 0.26));
  const dir = new THREE.DirectionalLight(0xffffff, 1.15);
  dir.position.set(7, 13, 4);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  const sc = dir.shadow.camera;
  sc.left = -18; sc.right = 18; sc.top = 18; sc.bottom = -18; sc.near = 1; sc.far = 48;
  dir.shadow.radius = 7; dir.shadow.bias = -0.0005;
  scene.add(dir);

  // ---- Ground shadow catcher (transparent) ----
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 90),
    new THREE.ShadowMaterial({ opacity: 0.14 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // ---- City group ----
  const city = new THREE.Group();
  scene.add(city);

  // ---- Blueprint ground grid (navy, low opacity) ----
  const grid = new THREE.GridHelper(30, 30, 0x050419, 0x050419);
  grid.material.transparent = true;
  grid.material.opacity = 0.07;
  grid.position.y = 0.01;
  city.add(grid);

  const TONES = [0xEBF2F7, 0xDFEAF1, 0xD2E1EA, 0xC6D9E5];
  // Muted, desaturated per-sector accents so they read as highlights, not noise.
  const SECTOR = {
    med: 0x5FB3A1,  // medical — soft teal
    wh:  0x5B83A8,  // warehouse — steel blue
    hos: 0xC2A36B,  // hospitality — warm amber
  };
  const navy = new THREE.MeshStandardMaterial({ color: 0x050419, roughness: 0.6 });

  const box = (x, z, bw, bd, bh, tone, accent) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(bw, bh, bd),
      new THREE.MeshStandardMaterial({ color: tone, roughness: 0.94, metalness: 0 })
    );
    m.position.set(x, bh / 2, z);
    m.castShadow = true; m.receiveShadow = true;
    city.add(m);
    if (accent) {
      const col = SECTOR[accent] || 0x050419;
      const mat = accent === true ? navy
        : new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, emissive: col, emissiveIntensity: 0.18 });
      const cap = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.7, 0.16, bd * 0.7), mat);
      cap.position.set(x, bh + 0.08, z); cap.castShadow = true;
      city.add(cap);
    }
  };

  // [x, z, width, depth, height, tone, accent('med'|'wh'|'hos')]
  [
    // signature, sector-accented
    [0,    0,   1.8, 1.8, 4.6, TONES[0], 'med'],
    [-3,   0.5, 3.4, 1.7, 1.1, TONES[2], 'wh'],
    [2.9, -0.6, 1.5, 1.5, 2.9, TONES[1], 'hos'],
    // mid-ground
    [-1.7,-1.9, 1.3, 1.3, 2.0, TONES[1]],
    [1.5,  1.9, 1.4, 1.4, 1.6, TONES[2]],
    [-2.5, 2.4, 1.1, 1.1, 1.1, TONES[3]],
    [3.2,  1.8, 1.0, 1.0, 0.9, TONES[3]],
    [-4.2, 1.8, 0.9, 0.9, 0.6, TONES[3]],
    [0.6,  3.2, 0.9, 0.9, 0.55,TONES[3]],
    [4.2, -2.1, 0.9, 0.9, 0.7, TONES[3]],
    [-3.5,-2.0, 0.85,0.85,0.55,TONES[3]],
    // background row — denser skyline
    [-1.0,-3.3, 0.9, 0.9, 3.2, TONES[1]],
    [1.2, -3.5, 1.0, 1.0, 2.4, TONES[2]],
    [-2.7,-3.1, 0.8, 0.8, 2.7, TONES[2]],
    [3.6, -3.3, 0.8, 0.8, 1.8, TONES[3]],
    [-5.1, 0.2, 0.9, 0.9, 1.6, TONES[3]],
    [5.1,  0.6, 0.9, 0.9, 1.9, TONES[2]],
    // foreground detail cubes
    [-0.8, 2.5, 0.6, 0.6, 0.4, TONES[3]],
    [2.2,  2.9, 0.6, 0.6, 0.45,TONES[3]],
  ].forEach(b => box(...b));

  // ---- Wind turbines (slow spin) ----
  const hubs = [];
  const turbine = (x, z, s) => {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05 * s, 0.08 * s, 2.4 * s, 10),
      new THREE.MeshStandardMaterial({ color: 0xF3F8FB, roughness: 0.7 })
    );
    pole.position.y = 1.2 * s; pole.castShadow = true; g.add(pole);
    const hub = new THREE.Group(); hub.position.set(0, 2.4 * s, 0.06 * s);
    for (let i = 0; i < 3; i++) {
      const arm = new THREE.Group();
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.07 * s, 1.2 * s, 0.16 * s),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.6 })
      );
      blade.position.y = 0.6 * s; blade.castShadow = true;
      arm.rotation.z = i * (Math.PI * 2 / 3); arm.add(blade);
      hub.add(arm);
    }
    g.add(hub); g.position.set(x, 0, z);
    city.add(g); hubs.push(hub);
  };
  turbine(-5.3, -1.4, 1.0);
  turbine(5.1, 2.7, 0.8);

  // ---- Pointer parallax ----
  let tx = 0, ty = 0, cx = 0, cy = 0;
  if (!reduce) {
    window.addEventListener('pointermove', (e) => {
      tx = (e.clientX / window.innerWidth - 0.5);
      ty = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });
  }

  // ---- Scroll reactivity (rotate / sink / fade as the hero scrolls away) ----
  let scrollP = 0;
  const heroEl = document.querySelector('.hero');
  const onHeroScroll = () => {
    const hh = (heroEl && heroEl.offsetHeight) || window.innerHeight;
    scrollP = Math.min(window.scrollY / hh, 1);
  };
  window.addEventListener('scroll', onHeroScroll, { passive: true });
  onHeroScroll();

  // ---- Pause when off-screen ----
  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(wrap);
  }

  // ---- Resize ----
  const onResize = () => {
    w = mount.clientWidth || w; h = mount.clientHeight || w * 0.5625;
    renderer.setSize(w, h); setCam();
  };
  window.addEventListener('resize', onResize, { passive: true });

  // ---- Render loop ----
  const clock = new THREE.Clock();
  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();
    cx += (tx - cx) * 0.04; cy += (ty - cy) * 0.04;
    city.position.y = Math.sin(t * 0.6) * 0.08 - scrollP * 0.7;        // sink on scroll
    city.rotation.y = Math.sin(t * 0.14) * 0.12 + cx * 0.22 + scrollP * 0.5; // turn on scroll
    city.rotation.x = cy * 0.05;
    mount.style.opacity = (1 - scrollP * 0.65).toFixed(3);            // fade out
    for (const hub of hubs) hub.rotation.z += 0.02;
    renderer.render(scene, cam);
  };

  if (reduce) renderer.render(scene, cam);
  else tick();
}
