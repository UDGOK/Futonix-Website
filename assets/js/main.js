/* ============================================================
   FUTONIX — Interaction & Motion Engine (Monochrome / Vectr)
   ============================================================ */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      window.location.href = `mailto:hello@futonix.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
          method: 'POST', body: fd, headers: { Accept: 'application/json' }
        });
        if (res.ok) { showSuccess(); }
        else {
          const j = await res.json().catch(() => ({}));
          showFormError((j.errors && j.errors[0] && j.errors[0].message) || 'Something went wrong. Please email hello@futonix.com.');
        }
      } catch (err) {
        showFormError('Network error. Please email hello@futonix.com directly.');
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

  /* ---- Year ---- */
  const y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
