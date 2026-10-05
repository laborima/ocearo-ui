// Ocearo website behaviour. Everything degrades to a readable static page.
(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Navigation: solid background once scrolled, mobile menu
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const btn = nav.querySelector('.menu-btn');
    btn?.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', () => {
      nav.classList.remove('open');
      btn?.setAttribute('aria-expanded', 'false');
    }));
  }

  // Hero screen flattens as it scrolls into view
  const screen = document.querySelector('.screen');
  if (screen && !reduced) {
    const tilt = () => {
      const r = screen.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, 1 - r.top / (window.innerHeight * 0.9)));
      screen.style.setProperty('--tilt', `${(8 * (1 - p)).toFixed(2)}deg`);
      screen.style.setProperty('--zoom', (0.98 + 0.02 * p).toFixed(3));
    };
    tilt();
    window.addEventListener('scroll', tilt, { passive: true });
  }

  // Gentle rise of sections; they are already visible without JS
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  document.querySelectorAll('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));

  // Feature clips play only while on screen
  const vids = document.querySelectorAll('video[data-autoplay]');
  if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting && !reduced) {
          if (v.preload === 'none') { v.preload = 'auto'; v.load(); }
          v.play().catch(() => {});
        } else v.pause();
      });
    }, { threshold: 0.35 });
    vids.forEach((v) => vio.observe(v));
  }

  // Day / dark / night theme switcher
  document.querySelectorAll('[data-themes]').forEach((box) => {
    const buttons = box.querySelectorAll('[role="tab"]');
    const imgs = box.querySelectorAll('.theme-stage img');
    buttons.forEach((b) => b.addEventListener('click', () => {
      buttons.forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      imgs.forEach((img) => img.classList.toggle('on', img.dataset.theme === b.dataset.theme));
    }));
  });

  // Lightbox for the gallery
  document.querySelectorAll('[data-zoom]').forEach((btn) => btn.addEventListener('click', () => {
    const img = btn.querySelector('img');
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML = `<div><img src="${img.src}" alt=""><p></p></div><button class="btn btn-ghost btn-s" type="button">${btn.dataset.close || 'Close'}</button>`;
    box.querySelector('img').alt = img.alt;
    box.querySelector('p').textContent = btn.dataset.caption || img.alt;
    const close = () => { box.remove(); document.removeEventListener('keydown', onKey); btn.focus(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    box.addEventListener('click', (e) => { if (e.target === box || e.target.tagName === 'BUTTON') close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(box);
    box.querySelector('button').focus();
  }));

  // YouTube: load the player only on click (nothing from YouTube before that);
  // the chapters start it at their time
  document.querySelectorAll('[data-youtube]').forEach((el) => {
    const id = el.dataset.youtube;
    if (!id) return;
    const load = (start = 0) => {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1&hl=${doc.lang}&start=${start}`;
      f.title = el.dataset.title || 'Ocearo';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      el.replaceChildren(f);
    };
    el.querySelector('.play')?.addEventListener('click', () => load());
    el.parentElement.querySelectorAll('.chapters a[data-start]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      load(Number(a.dataset.start) || 0);
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }));
  });

  // Copy buttons
  document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const text = b.dataset.copy;
    const label = b.textContent;
    try { await navigator.clipboard.writeText(text); b.textContent = b.dataset.done || '✓'; }
    catch { const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); getSelection().removeAllRanges(); getSelection().addRange(r); }
    setTimeout(() => (b.textContent = label), 1600);
  }));

  // Live demo: the app is served from the same origin (app/ next to the site); switch it
  // to demo mode (simulated data from demo.signalk.org) before loading it.
  const demo = document.querySelector('[data-demo]');
  if (demo) {
    const start = () => {
      try {
        const key = 'ocearoConfig';
        const cfg = JSON.parse(localStorage.getItem(key) || '{}');
        if (!cfg.signalKUrlSet) {
          cfg.debugMode = true;
          if (!cfg.language) cfg.language = doc.lang;
          localStorage.setItem(key, JSON.stringify(cfg));
        }
      } catch { /* storage blocked: the app falls back to its own defaults */ }
      const f = document.createElement('iframe');
      f.src = demo.dataset.demo;
      f.title = demo.dataset.title || 'Ocearo live demo';
      f.allow = 'fullscreen; geolocation';
      f.allowFullscreen = true;
      demo.querySelector('.cover')?.remove();
      demo.appendChild(f);
      document.querySelectorAll('[data-fullscreen]').forEach((b) => (b.hidden = false));
    };
    demo.querySelector('[data-start]')?.addEventListener('click', start);
    document.querySelectorAll('[data-fullscreen]').forEach((b) => b.addEventListener('click', () => {
      demo.requestFullscreen?.().catch(() => window.open(demo.dataset.demo, '_blank'));
    }));
  }
})();
