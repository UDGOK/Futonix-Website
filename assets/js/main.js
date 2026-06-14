/* ============================================================
   FUTONIX — Interaction & Motion Engine (Monochrome / Vectr)
   ============================================================ */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Dropdown nav (single source of truth, injected) ---- */
  (function buildNav() {
    const wrap = document.querySelector('.nav-wrap');
    if (!wrap) return;
    const here = (location.pathname.replace(/\/+$/, '').split('/').pop() || 'index').toLowerCase();
    const SOL = [
      ['Sectors', 'Healthcare · Warehouse · Commercial', 'sectors'],
      ['Expertise', 'Design-build, GC, CM &amp; automation', 'expertise'],
      ['Projects', 'Selected work across the U.S.', 'projects'],
      ['Design-Build Automation', 'What it is &amp; how it works', 'design-build-automation'],
      ['Healthcare Controls', 'Smart building tech for clinics', 'healthcare-building-controls'],
      ['Project Estimator', 'Indicative timeline &amp; budget', 'estimate'],
      ['Where We Work', 'U.S. reach &amp; global focus', 'locations']
    ];
    const RES = [
      ['Resources Hub', 'Guides, insights &amp; tools', 'resources'],
      ['Knowledge Base', 'Searchable FAQs by topic', 'knowledge-base'],
      ['Design-Build vs. GC', 'How Futonix compares', 'design-build-vs-general-contractor'],
      ['BIM for Healthcare', 'Technical insight', 'bim-for-healthcare'],
      ['OSHA &amp; Clinic Build-Outs', 'Safety commentary', 'osha-clinic-buildouts'],
      ['2026 Warehouse Report', 'Original research', 'research-2026-warehouse-automation'],
      ['Capabilities (PDF)', 'One-page line card', 'capabilities'],
      ['Design-Build in Oklahoma', 'Local projects &amp; credentials', 'design-build-oklahoma']
    ];
    const chev = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const inGroup = (a) => a.some(i => i[2] === here);
    const dd = (a) => a.map(i => '<a href="' + i[2] + '"' + (i[2] === here ? ' aria-current="page"' : '') + '><b>' + i[0] + '</b><span>' + i[1] + '</span></a>').join('');
    wrap.innerHTML =
      '<nav class="nav" aria-label="Primary">' +
        '<a href="/" class="brand" aria-label="Futonix — home"><span class="mark" aria-hidden="true"></span>Futonix</a>' +
        '<ul class="nav-menu">' +
          '<li><a href="/" class="' + (here === 'index' ? 'active' : '') + '">Home</a></li>' +
          '<li class="has-dropdown' + (inGroup(SOL) ? ' has-active' : '') + '"><button class="nav-trigger" aria-expanded="false" aria-haspopup="true">Solutions ' + chev + '</button>' +
            '<div class="dropdown"><span class="dd-label">What we offer</span><div class="dd-grid">' + dd(SOL) + '</div></div></li>' +
          '<li><a href="about" class="' + (here === 'about' ? 'active' : '') + '">About</a></li>' +
          '<li class="has-dropdown' + (inGroup(RES) ? ' has-active' : '') + '"><button class="nav-trigger" aria-expanded="false" aria-haspopup="true">Resources ' + chev + '</button>' +
            '<div class="dropdown"><span class="dd-label">Guides, insights &amp; tools</span><div class="dd-grid">' + dd(RES) + '</div></div></li>' +
        '</ul>' +
        '<div class="nav-end">' +
          '<a href="contact" class="nav-contact ' + (here === 'contact' ? 'active' : '') + '">Contact</a>' +
          '<a href="contact" class="btn btn--primary nav-start" data-magnetic>Start a project</a>' +
          '<button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false"><span></span></button>' +
        '</div>' +
      '</nav>';

    const mob = document.querySelector('.mobile-menu');
    if (mob) {
      const mg = (label, a) => '<div class="m-group"><button class="m-trigger" type="button">' + label + ' ' + chev + '</button><div class="m-sub">' + a.map(i => '<a href="' + i[2] + '">' + i[0] + '</a>').join('') + '</div></div>';
      mob.innerHTML =
        '<a href="/">Home</a>' + mg('Solutions', SOL) +
        '<a href="about">About</a>' + mg('Resources', RES) +
        '<a href="contact">Contact</a>' +
        '<a href="contact" class="btn btn--primary">Start a project</a>';
      mob.querySelectorAll('.m-trigger').forEach(t => t.addEventListener('click', () => t.closest('.m-group').classList.toggle('open')));
    }

    const closeAll = () => wrap.querySelectorAll('.has-dropdown.open').forEach(o => { o.classList.remove('open'); o.querySelector('.nav-trigger').setAttribute('aria-expanded', 'false'); });
    wrap.querySelectorAll('.has-dropdown .nav-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const li = btn.closest('.has-dropdown');
        const willOpen = !li.classList.contains('open');
        closeAll();
        li.classList.toggle('open', willOpen);
        btn.setAttribute('aria-expanded', String(willOpen));
      });
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.has-dropdown')) closeAll(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
  })();

  /* ---- "Ask AI" summary band + legal links (injected into footer) ---- */
  (function buildAiSummary() {
    const footer = document.querySelector('.footer');
    if (!footer || footer.querySelector('.ai-summary')) return;
    const q = encodeURIComponent('Give me a summary of Futonix (futonix.com) — a U.S. design-build, construction and automation firm. What do they do, which markets and where?');
    const engines = [
      ['ChatGPT', 'https://chatgpt.com/?q=' + q],
      ['Perplexity', 'https://www.perplexity.ai/search?q=' + q],
      ['Claude', 'https://claude.ai/new?q=' + q],
      ['Google AI', 'https://www.google.com/search?udm=50&q=' + q],
      ['Copilot', 'https://copilot.microsoft.com/?q=' + q],
      ['Grok', 'https://grok.com/?q=' + q]
    ];
    const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const links = engines.map(e => '<a href="' + e[1] + '" target="_blank" rel="noopener nofollow">' + e[0] + arrow + '</a>').join('');
    const band = document.createElement('div');
    band.className = 'ai-summary';
    band.innerHTML =
      '<div class="container"><div class="ai-row">' +
        '<div class="ai-head"><span class="ai-k">Ask AI</span><h4>Get an AI summary of Futonix</h4></div>' +
        '<div class="ai-links">' + links + '</div>' +
      '</div></div>';
    footer.insertBefore(band, footer.firstChild);

    // legal links into footer bottom
    const bottom = footer.querySelector('.footer-bottom');
    if (bottom && !bottom.querySelector('.legal')) {
      const legal = document.createElement('span');
      legal.className = 'legal';
      legal.innerHTML = '<a href="privacy">Privacy</a> · <a href="security">Security</a>';
      bottom.appendChild(legal);
    }
  })();

  /* ---- Navbar scroll state ---- */
  const navWrap = document.querySelector('.nav-wrap');
  if (navWrap) {
    const onScroll = () => navWrap.classList.toggle('scrolled', window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Mobile menu ---- */
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.mobile-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      menu.classList.toggle('show', !open);
    });
    menu.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('show');
      })
    );
  }

  /* ---- Headline line-mask reveal (on load) ---- */
  const masks = document.querySelectorAll('.reveal-mask > span');
  if (masks.length) {
    if (reduce) { masks.forEach(s => s.classList.add('in')); }
    else { requestAnimationFrame(() => requestAnimationFrame(() => masks.forEach(s => s.classList.add('in')))); }
  }

  /* ---- Scroll reveal ---- */
  const reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach(el => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(el => io.observe(el));
    }
  }

  /* ---- Animated counters ---- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const dec = (el.dataset.count.split('.')[1] || '').length;
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      if (reduce) { el.textContent = prefix + target.toFixed(dec) + suffix; return; }
      const dur = 1700, t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + (target * eased).toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(tick); else el.textContent = prefix + target.toFixed(dec) + suffix;
      };
      requestAnimationFrame(tick);
    };
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { run(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.5 });
    counters.forEach(el => cio.observe(el));
  }

  /* ---- Magnetic buttons ---- */
  if (!reduce && window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      const s = 0.28;
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--bx', ((e.clientX - r.left - r.width / 2) * s).toFixed(1) + 'px');
        btn.style.setProperty('--by', ((e.clientY - r.top - r.height / 2) * s).toFixed(1) + 'px');
      });
      btn.addEventListener('mouseleave', () => { btn.style.setProperty('--bx', '0px'); btn.style.setProperty('--by', '0px'); });
    });
  }

  /* ---- Hero scene parallax on scroll ---- */
  const scene = document.querySelector('[data-parallax]');
  if (scene && !reduce) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        scene.style.transform = 'translateY(' + (y * 0.12).toFixed(1) + 'px) scale(' + (1 + Math.min(y, 600) * 0.0001).toFixed(3) + ')';
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const open = q.getAttribute('aria-expanded') === 'true';
      const ans = q.nextElementSibling;
      // close siblings
      q.closest('.faq').querySelectorAll('.faq-q[aria-expanded="true"]').forEach(other => {
        if (other !== q) { other.setAttribute('aria-expanded', 'false'); other.nextElementSibling.style.maxHeight = null; }
      });
      q.setAttribute('aria-expanded', String(!open));
      ans.style.maxHeight = open ? null : ans.scrollHeight + 'px';
    });
  });

  /* ---- Contact form: validate + submit (Formspree fetch, mailto fallback) ---- */
  const form = document.querySelector('[data-contact-form]');
  if (form) {
    const wrap = form.parentElement;
    const success = wrap.querySelector('.form-success');
    const errorBox = wrap.querySelector('.form-error');
    const submitBtn = form.querySelector('[type="submit"]');
    const setError = (field, msg) => {
      field.classList.toggle('invalid', !!msg);
      const e = field.querySelector('.err'); if (e) e.textContent = msg || '';
    };
    const validate = () => {
      let ok = true;
      form.querySelectorAll('.field[data-required]').forEach(field => {
        const input = field.querySelector('input, textarea, select');
        const val = (input.value || '').trim();
        if (!val) { setError(field, 'Required.'); ok = false; }
        else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { setError(field, 'Enter a valid email.'); ok = false; }
        else setError(field, '');
      });
      return ok;
    };
    const showFormError = (msg) => {
      if (!errorBox) return;
      errorBox.textContent = msg; errorBox.classList.add('show');
    };
    const showSuccess = () => {
      form.style.display = 'none';
      if (errorBox) errorBox.classList.remove('show');
      if (success) { success.classList.add('show'); success.setAttribute('role', 'status'); }
    };
    const setBusy = (busy) => {
      if (!submitBtn) return;
      submitBtn.setAttribute('aria-busy', String(busy));
      submitBtn.disabled = busy;
      if (busy) { submitBtn.dataset.label = submitBtn.textContent; submitBtn.textContent = 'Sending…'; }
      else if (submitBtn.dataset.label) { submitBtn.textContent = submitBtn.dataset.label; }
    };
    const mailtoFallback = (data) => {
      const subject = `New enquiry — ${data.sector || 'Project'} — ${data.name}`;
      const body =
        `Name: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company || '—'}\nSector: ${data.sector || '—'}\n\n${data.message}`;
      window.location.href = `mailto:projects@udgok.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      showSuccess();
    };

    form.querySelectorAll('.field[data-required] input, .field[data-required] textarea').forEach(i => i.addEventListener('blur', validate));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorBox) errorBox.classList.remove('show');
      // honeypot — silently succeed for bots
      if (form.querySelector('[name="_gotcha"]') && form.querySelector('[name="_gotcha"]').value) { showSuccess(); return; }
      if (!validate()) { const f = form.querySelector('.invalid input, .invalid textarea'); if (f) f.focus(); return; }

      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());
      const endpoint = (form.dataset.endpoint || '').trim();

      // No endpoint configured → open a pre-filled email instead.
      if (!endpoint) { mailtoFallback(data); return; }

      setBusy(true);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) { showSuccess(); }
        else {
          const j = await res.json().catch(() => ({}));
          showFormError((j.errors && j.errors[0] && j.errors[0].message) || 'Something went wrong. Please email projects@udgok.com.');
        }
      } catch (err) {
        showFormError('Network error. Please email projects@udgok.com directly.');
      } finally {
        setBusy(false);
      }
    });
  }

  /* ---- Work filter ---- */
  const filterBar = document.querySelector('[data-filter-bar]');
  if (filterBar) {
    const cards = [...document.querySelectorAll('.work-card')];
    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      cards.forEach(card => {
        const show = f === 'all' || (card.dataset.cat || '').split(' ').includes(f);
        card.hidden = !show;
        if (show) { card.classList.remove('in'); requestAnimationFrame(() => card.classList.add('in')); }
      });
    });
  }

  /* ---- Project detail modal ---- */
  const modal = document.getElementById('projModal');
  if (modal) {
    const card = modal.querySelector('.modal-card');
    const logoBox = modal.querySelector('.modal-logo');
    const actions = modal.querySelector('[data-modal-actions]');
    const txt = (el) => (el ? el.textContent.trim() : '');
    const set = (sel, v) => { const e = modal.querySelector(sel); if (e) e.textContent = v; };
    let lastFocus = null;

    const open = (c) => {
      lastFocus = c;
      const client = txt(c.querySelector('.wc-client'));
      card.style.setProperty('--accent', c.style.getPropertyValue('--accent') || 'var(--ink)');
      set('[data-modal-cat]', txt(c.querySelector('.wc-cat')));
      set('[data-modal-title]', client);
      set('[data-modal-does]', txt(c.querySelector('.wc-does')));
      set('[data-modal-scope]', txt(c.querySelector('.wc-scope')));
      set('[data-modal-loc]', txt(c.querySelector('.wc-loc')));

      // logo via favicon service, fallback to monogram
      const domain = c.dataset.domain;
      logoBox.innerHTML = '';
      if (domain) {
        const img = new Image();
        img.alt = client + ' logo';
        img.referrerPolicy = 'no-referrer';
        img.onerror = () => { logoBox.innerHTML = '<span class="fallback">' + client.charAt(0) + '</span>'; };
        img.src = 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(domain) + '&sz=128';
        logoBox.appendChild(img);
      } else {
        logoBox.innerHTML = '<span class="fallback">' + client.charAt(0) + '</span>';
      }

      // actions
      actions.innerHTML = '';
      if (c.dataset.site) {
        const a = document.createElement('a');
        a.className = 'btn btn--ghost'; a.href = c.dataset.site; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.textContent = 'Visit website ↗'; actions.appendChild(a);
      }
      const cta = document.createElement('a');
      cta.className = 'btn btn--primary'; cta.href = 'contact'; cta.textContent = 'Start a similar project';
      actions.appendChild(cta);

      modal.hidden = false;
      requestAnimationFrame(() => modal.classList.add('open'));
      document.body.classList.add('modal-open');
      modal.querySelector('.modal-close').focus();
    };
    const close = () => {
      modal.classList.remove('open');
      document.body.classList.remove('modal-open');
      setTimeout(() => { modal.hidden = true; }, 450);
      if (lastFocus) lastFocus.focus();
    };

    document.querySelectorAll('.work-card').forEach(c => {
      c.addEventListener('click', () => open(c));
      c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(c); } });
    });
    modal.querySelectorAll('[data-modal-close]').forEach(el => el.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
  }

  /* ---- Cost & timeline estimator (indicative only) ---- */
  const est = document.querySelector('[data-estimator]');
  if (est) {
    const state = { type: 'healthcare', scope: 'design-build', size: 8000 };
    const TYPE = {
      healthcare:   { label: 'Healthcare', base: 14, perK: 0.55, tier: 3 },
      warehouse:    { label: 'Warehouse / Distribution', base: 10, perK: 0.18, tier: 2 },
      commercial:   { label: 'Commercial / Retail', base: 9,  perK: 0.35, tier: 2 },
      multifamily:  { label: 'Multifamily', base: 16, perK: 0.30, tier: 3 },
      technology:   { label: 'Technology / Automation', base: 6, perK: 0.25, tier: 2 }
    };
    const SCOPE = { 'design-build': 1.0, 'build-only': 0.82, 'tech-only': 0.55, 'renovation': 0.9 };
    const fmtK = (n) => n >= 1000 ? (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k' : n;
    const tierStr = (t) => '$'.repeat(t) + '·'.repeat(0); // not used; kept simple
    const compute = () => {
      const t = TYPE[state.type]; const sc = SCOPE[state.scope] || 1;
      const weeks = (t.base + (state.size / 1000) * t.perK) * sc;
      const lo = Math.max(4, Math.round(weeks * 0.85));
      const hi = Math.round(weeks * 1.2);
      let tier = t.tier + (state.size > 30000 ? 1 : 0) + (state.scope === 'tech-only' ? -1 : 0);
      tier = Math.min(4, Math.max(1, tier));
      return { weeks: lo + '–' + hi + ' weeks', tier: '$'.repeat(tier) + ' ' + ['Entry','Mid','Significant','Major'][tier - 1] };
    };
    const render = () => {
      const r = compute();
      const set = (s, v) => { const e = est.querySelector(s); if (e) e.textContent = v; };
      set('[data-ro-type]', TYPE[state.type].label);
      set('[data-ro-scope]', state.scope.replace('-', ' '));
      set('[data-ro-size]', fmtK(state.size) + ' sq ft');
      set('[data-ro-timeline]', r.weeks);
      set('[data-ro-tier]', r.tier);
    };
    est.addEventListener('click', (e) => {
      const opt = e.target.closest('.est-opt'); if (!opt) return;
      const g = opt.dataset.group;
      est.querySelectorAll('.est-opt[data-group="' + g + '"]').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      state[g] = opt.dataset.val; render();
    });
    const sizeEl = est.querySelector('#estSize');
    if (sizeEl) sizeEl.addEventListener('input', () => {
      state.size = parseInt(sizeEl.value, 10);
      const v = est.querySelector('[data-size-val]'); if (v) v.textContent = fmtK(state.size) + ' sq ft';
      render();
    });
    render();
  }

  /* ---- Gated report sign-up ---- */
  const gate = document.querySelector('[data-gate-form]');
  if (gate) {
    const ok = gate.parentElement.querySelector('.form-success');
    gate.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = gate.querySelector('input[type="email"]');
      const val = email ? email.value.trim() : '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { if (email) email.focus(); return; }
      const data = Object.fromEntries(new FormData(gate).entries());
      data._subject = 'Futonix — 2026 report early-access signup';
      try {
        await fetch('https://formsubmit.co/ajax/yasir@futonix.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data)
        });
      } catch (err) { /* still confirm to the user */ }
      gate.style.display = 'none';
      if (ok) { ok.classList.add('show'); ok.setAttribute('role', 'status'); }
    });
  }

  /* ---- Knowledge base search ---- */
  const kbInput = document.querySelector('[data-kb-search]');
  if (kbInput) {
    const items = [...document.querySelectorAll('.kb-group .faq-item')];
    const groups = [...document.querySelectorAll('.kb-group')];
    const noRes = document.querySelector('.kb-noresults');
    kbInput.addEventListener('input', () => {
      const q = kbInput.value.trim().toLowerCase();
      let any = false;
      items.forEach(it => {
        const show = !q || (it.textContent || '').toLowerCase().includes(q);
        it.hidden = !show; if (show) any = true;
      });
      groups.forEach(g => {
        const visible = [...g.querySelectorAll('.faq-item')].some(i => !i.hidden);
        g.classList.toggle('is-empty', !visible);
      });
      if (noRes) noRes.classList.toggle('show', !any);
    });
  }

  /* ---- Year ---- */
  const y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
