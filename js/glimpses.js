/* ═══════════════════════════════════
   NOVA 5.0 — glimpses.js  v2
   Lenis + GSAP ScrollTrigger
   ═══════════════════════════════════ */
(function () {
  'use strict';

  /* ── Lenis ── */
  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    wheelMultiplier: 0.65,
    touchMultiplier: 0.85,
    smoothWheel: true,
  });
  gsap.registerPlugin(ScrollTrigger);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ── Navbar ── */
  const navbar = document.getElementById('navbar');
  ScrollTrigger.create({
    start: 60,
    onUpdate: (self) => navbar.classList.toggle('scrolled', self.scroll() > 60),
  });

  /* ── Mobile menu ── */
  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileClose = document.getElementById('mobile-menu-close');
  const openMenu = () => { mobileMenu.classList.add('open'); mobileMenu.removeAttribute('aria-hidden'); hamburger.classList.add('open'); hamburger.setAttribute('aria-expanded','true'); lenis.stop(); };
  const closeMenu = () => { mobileMenu.classList.remove('open'); mobileMenu.setAttribute('aria-hidden','true'); hamburger.classList.remove('open'); hamburger.setAttribute('aria-expanded','false'); lenis.start(); };
  if (hamburger) hamburger.addEventListener('click', openMenu);
  if (mobileClose) mobileClose.addEventListener('click', closeMenu);
  document.querySelectorAll('.mobile-nav-link').forEach(l => l.addEventListener('click', closeMenu));

  /* ── Terminal chip ── */
  const msgs = ['mission@nova ~ $ T-minus 10 days','mission@nova ~ $ 12 clubs onboard','mission@nova ~ $ countdown online','mission@nova ~ $ launch pad: RIT','mission@nova ~ $ signal: strong'];
  let idx = 0;
  const termText = document.getElementById('terminal-text');
  setInterval(() => {
    if (!termText) return;
    idx = (idx + 1) % msgs.length;
    gsap.to(termText, { opacity: 0, duration: 0.15, onComplete: () => { termText.textContent = msgs[idx]; gsap.to(termText, { opacity: 1, duration: 0.25 }); } });
  }, 3500);

  /* ── Scroll reveals ── */
  document.querySelectorAll('.reveal-up').forEach(el => {
    const delay = parseFloat(getComputedStyle(el).getPropertyValue('--delay')) || 0;
    gsap.fromTo(el, { y: 32, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.7, delay, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
    });
  });

  // Masonry items stagger
  document.querySelectorAll('.masonry-grid').forEach(grid => {
    const items = grid.querySelectorAll('.masonry-item');
    if (items.length) {
      gsap.fromTo(items, { y: 28, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power2.out',
        scrollTrigger: { trigger: grid, start: 'top 88%', toggleActions: 'play none none none' },
      });
    }
  });

  // Edition separator wipe
  document.querySelectorAll('.edition-separator').forEach(sep => {
    gsap.fromTo(sep, { opacity: 0, clipPath: 'inset(0 100% 0 0)' }, {
      opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.8, ease: 'power2.out',
      scrollTrigger: { trigger: sep, start: 'top 90%', toggleActions: 'play none none none' },
    });
  });

  /* ── Hero load ── */
  const heroTl = gsap.timeline({ delay: 0.2 });
  heroTl
    .from('.navbar', { opacity: 0, y: -16, duration: 0.4 })
    .from('.inner-hero .back-link', { opacity: 0, x: -12, duration: 0.4 }, 0.3)
    .from('.inner-hero .section-index-row', { opacity: 0, y: 10, duration: 0.4 }, 0.4)
    .from('.inner-hero .section-headline', { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' }, 0.5)
    .from('.inner-hero .section-subtext', { opacity: 0, y: 10, duration: 0.4 }, 0.7);

  /* ── Lightbox ── */
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbCaption = document.getElementById('lightbox-caption');
  const lbClose = document.getElementById('lightbox-close');

  function openLightbox(src, alt) {
    if (!lightbox) return;
    lbImg.src = src; lbImg.alt = alt || ''; lbCaption.textContent = alt || '';
    lightbox.classList.add('open'); lightbox.removeAttribute('aria-hidden'); lenis.stop();
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open'); lightbox.setAttribute('aria-hidden', 'true'); lenis.start();
  }
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeLightbox(); closeMenu(); }
  });

  document.querySelectorAll('.masonry-item').forEach(item => {
    item.addEventListener('click', () => {
      const caption = item.dataset.caption || 'NOVA Glimpse';
      const img = item.querySelector('img');
      openLightbox(img ? img.src : '', caption);
    });
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') item.click(); });
  });

  /* ── Footer canvas ── */
  const c = document.getElementById('footer-canvas');
  if (c) {
    const ctx = c.getContext('2d');
    function resize() { c.width = c.offsetWidth; c.height = c.offsetHeight; }
    resize();
    window.addEventListener('resize', resize, { passive: true });
    function draw() {
      const w = c.width, h = c.height, vp = { x: w/2, y: h*0.55 }, n = 22;
      ctx.clearRect(0,0,w,h);
      const g = ctx.createLinearGradient(0, vp.y-16, 0, h);
      g.addColorStop(0, 'rgba(25,227,255,0.07)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, vp.y-16, w, h-vp.y+16);
      for (let i = 0; i <= n; i++) { const t = i/n, y = vp.y + (h-vp.y)*(t*t); ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.strokeStyle = `rgba(25,227,255,${0.04+t*0.04})`; ctx.lineWidth = 0.5; ctx.stroke(); }
      for (let i = -n; i <= n; i++) { ctx.beginPath(); ctx.moveTo(vp.x, vp.y); ctx.lineTo(vp.x + i*(w/n)*1.5, h); ctx.strokeStyle = 'rgba(25,227,255,0.04)'; ctx.lineWidth = 0.5; ctx.stroke(); }
    }
    draw();
    window.addEventListener('resize', draw, { passive: true });
  }

  /* ── Footer wordmark + moon ── */
  const letters = document.querySelectorAll('.footer-wordmark .wm-letter, .footer-wordmark .wm-dot');
  if (letters.length) {
    gsap.from(letters, { yPercent: 100, opacity: 0, duration: 0.8, stagger: 0.04, ease: 'power3.out', scrollTrigger: { trigger: '.footer-wordmark', start: 'top 92%', once: true } });
  }
  const moon = document.querySelector('.footer-moon');
  if (moon) {
    gsap.fromTo(moon, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, ease: 'power2.out', scrollTrigger: { trigger: '.footer-grid-scene', start: 'top 85%', once: true } });
  }

  /* ── Page transition ── */
  const pt = document.querySelector('.page-transition');
  if (pt) {
    gsap.fromTo(pt, { scaleX: 1 }, { scaleX: 0, transformOrigin: 'right', duration: 0.45, ease: 'power2.inOut', delay: 0.05 });
    document.querySelectorAll('a[href]:not([href^="#"]):not([target="_blank"])').forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('mailto:')) {
        link.addEventListener('click', e => {
          e.preventDefault();
          gsap.to(pt, { scaleX: 1, transformOrigin: 'left', duration: 0.4, ease: 'power2.inOut', onComplete: () => { window.location.href = href; } });
        });
      }
    });
  }
})();
