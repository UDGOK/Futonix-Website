# Futonix — Design · Build · Automation

Marketing website for **Futonix**, a design-build & automation firm working across
medical, warehouse and hospitality sectors internationally.

A static, multi-page site (no build step) with a monochrome "ice-blue / navy" design
system, Roboto type, scroll-reveal motion, and a **Three.js** low-poly isometric hero
scene (bundled locally, works offline).

## Pages
- `index.html` — Home (hero 3D scene, sectors, process, dark statement, stats, projects, FAQ)
- `sectors.html` — Medical · Warehouse · Hospitality
- `projects.html` — Selected work
- `about.html` — Why Futonix
- `contact.html` — Enquiry form

## Run locally
Serve over HTTP (the 3D scene loads as an ES module, so `file://` falls back to SVG):

```bash
python -m http.server 4321
# then open http://localhost:4321
```

## Tech
- Plain HTML / CSS / JS — no framework, no build
- [Three.js](https://threejs.org/) r160 (vendored in `assets/js/vendor/`)
- Contact form ready for [Formspree](https://formspree.io) — set `data-endpoint` on the
  form in `contact.html`; falls back to a pre-filled email until then.
