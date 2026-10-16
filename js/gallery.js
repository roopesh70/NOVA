/* ═══════════════════════════════════
   NOVA 5.0 — gallery.js  v2
   Lenis + GSAP ScrollTrigger
   ═══════════════════════════════════ */
(function () {
  'use strict';

  try {
    sessionStorage.setItem('nova_entered', 'true');
  } catch (e) {}

  /* ── Lenis ── */
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    wheelMultiplier: 1.0,
    touchMultiplier: isTouchDevice ? 1.5 : 1.0,
    smoothWheel: true,
    smoothTouch: false,
  });
  gsap.registerPlugin(ScrollTrigger);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(500, 33);

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
  const msgs = ['mission@nova ~ $ T-minus 8 days','mission@nova ~ $ 12 clubs onboard','mission@nova ~ $ countdown online','mission@nova ~ $ launch pad: RIT','mission@nova ~ $ signal: strong'];
  let tIdx = 0;
  const termText = document.getElementById('terminal-text');
  setInterval(() => {
    if (!termText) return;
    tIdx = (tIdx + 1) % msgs.length;
    gsap.to(termText, { opacity: 0, duration: 0.15, onComplete: () => { termText.textContent = msgs[tIdx]; gsap.to(termText, { opacity: 1, duration: 0.25 }); } });
  }, 3500);

  /* ── Scroll reveals ── */
  document.querySelectorAll('.reveal-up').forEach(el => {
    gsap.fromTo(el, { y: 28, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.6, ease: 'power2.out',
      clearProps: 'transform',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  /* ── Gallery data (populated after event) ── */
  const galleryItems = [
    // { src: 'gallery/photo1.jpg', alt: 'Inauguration ceremony', category: 'inauguration' },
  ];

  /* ── Filter tabs ── */
  const tabs = document.querySelectorAll('.gallery-tab');
  const galleryGrid = document.getElementById('gallery-grid');
  const galleryEmpty = document.getElementById('gallery-empty');
  const galleryCount = document.getElementById('gallery-count');

  function filterGallery(filter) {
    tabs.forEach(t => {
      t.classList.toggle('active', t.dataset.filter === filter);
      t.setAttribute('aria-selected', t.dataset.filter === filter ? 'true' : 'false');
    });
    const filtered = filter === 'all' ? galleryItems : galleryItems.filter(i => i.category === filter);
    renderGallery(filtered);
  }

  function renderGallery(items) {
    if (!galleryGrid || !galleryEmpty) return;
    if (items.length === 0) {
      galleryGrid.style.display = 'none';
      galleryEmpty.style.display = 'block';
      if (galleryCount) galleryCount.textContent = 'Showing 0 photos · More coming soon';
      return;
    }
    galleryGrid.style.display = 'block';
    galleryEmpty.style.display = 'none';
    galleryGrid.innerHTML = '';
    if (galleryCount) galleryCount.textContent = `Showing ${items.length} photo${items.length !== 1 ? 's' : ''}`;

    items.forEach((item, i) => {
      const el = document.createElement('div');
      el.className = 'masonry-item';
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.innerHTML = `
        <img class="masonry-img" src="${item.src}" alt="${item.alt}" loading="lazy" />
        <div class="masonry-caption">
          <p class="masonry-caption-edition">NOVA 5.0 · ${item.category.toUpperCase()}</p>
          <p class="masonry-caption-text">${item.alt}</p>
        </div>
      `;
      el.addEventListener('click', () => openLightbox(items, i));
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openLightbox(items, i); });
      galleryGrid.appendChild(el);
    });

    // Animate new items
    gsap.fromTo(galleryGrid.querySelectorAll('.masonry-item'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' });
  }

  tabs.forEach(tab => tab.addEventListener('click', () => filterGallery(tab.dataset.filter)));
  filterGallery('all');

  /* ── Lightbox with navigation ── */
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbCaption = document.getElementById('lightbox-caption');
  const lbClose = document.getElementById('lightbox-close');
  const lbPrev = document.getElementById('lightbox-prev');
  const lbNext = document.getElementById('lightbox-next');
  let lbItems = [], lbIdx = 0;

  function openLightbox(items, idx) {
    lbItems = items; lbIdx = idx;
    showLbItem();
    lightbox.classList.add('open'); lightbox.removeAttribute('aria-hidden'); lenis.stop();
  }
  function showLbItem() {
    const item = lbItems[lbIdx];
    if (!item) return;
    gsap.to(lbImg, { opacity: 0, duration: 0.12, onComplete: () => {
      lbImg.src = item.src; lbImg.alt = item.alt; lbCaption.textContent = item.alt;
      gsap.to(lbImg, { opacity: 1, duration: 0.18 });
    }});
  }
  function closeLightbox() {
    lightbox.classList.remove('open'); lightbox.setAttribute('aria-hidden', 'true'); lenis.start();
  }

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  if (lbPrev) lbPrev.addEventListener('click', () => { lbIdx = (lbIdx - 1 + lbItems.length) % lbItems.length; showLbItem(); });
  if (lbNext) lbNext.addEventListener('click', () => { lbIdx = (lbIdx + 1) % lbItems.length; showLbItem(); });

  document.addEventListener('keydown', e => {
    if (lightbox?.classList.contains('open')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') { lbIdx = (lbIdx - 1 + lbItems.length) % lbItems.length; showLbItem(); }
      if (e.key === 'ArrowRight') { lbIdx = (lbIdx + 1) % lbItems.length; showLbItem(); }
    }
    if (e.key === 'Escape') closeMenu();
  });

  // Touch swipe
  let touchX = 0;
  if (lightbox) {
    lightbox.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) {
        if (dx < 0) { lbIdx = (lbIdx + 1) % lbItems.length; showLbItem(); }
        else { lbIdx = (lbIdx - 1 + lbItems.length) % lbItems.length; showLbItem(); }
      }
    });
  }

  /* ── Hero load ── */
  const heroTl = gsap.timeline({ delay: 0.2 });
  heroTl
    .from('.navbar', { opacity: 0, y: -16, duration: 0.4 })
    .from('.inner-hero .back-link', { opacity: 0, x: -12, duration: 0.4 }, 0.3)
    .from('.inner-hero .section-index-row', { opacity: 0, y: 10, duration: 0.4 }, 0.4)
    .from('.inner-hero .section-headline', { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' }, 0.5)
    .from('.inner-hero .section-subtext', { opacity: 0, y: 10, duration: 0.4 }, 0.7);

  /* ── Footer canvas ── */
  const fc = document.getElementById('footer-canvas');
  if (fc) {
    const ctx = fc.getContext('2d');
    function resize() { fc.width = fc.offsetWidth; fc.height = fc.offsetHeight; }
    resize(); window.addEventListener('resize', resize, { passive: true });
    function draw() {
      const w = fc.width, h = fc.height, vp = { x: w/2, y: h*0.55 }, n = 22;
      ctx.clearRect(0,0,w,h);
      const g = ctx.createLinearGradient(0, vp.y-16, 0, h);
      g.addColorStop(0, 'rgba(25,227,255,0.07)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, vp.y-16, w, h-vp.y+16);
      for (let i = 0; i <= n; i++) { const t = i/n, y = vp.y + (h-vp.y)*(t*t); ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.strokeStyle = `rgba(25,227,255,${0.04+t*0.04})`; ctx.lineWidth = 0.5; ctx.stroke(); }
      for (let i = -n; i <= n; i++) { ctx.beginPath(); ctx.moveTo(vp.x, vp.y); ctx.lineTo(vp.x + i*(w/n)*1.5, h); ctx.strokeStyle = 'rgba(25,227,255,0.04)'; ctx.lineWidth = 0.5; ctx.stroke(); }
    }
    draw(); window.addEventListener('resize', draw, { passive: true });
  }

  /* ── Footer 3D block text + moon + back to top ── */
  const blockWrap = document.getElementById('footer-3d-block-wrap');
  if (blockWrap) {
    const isMobile = window.innerWidth <= 768;
    const targetRotate = isMobile ? 8 : 14;
    gsap.fromTo(blockWrap, { y: 30, opacity: 0, rotateX: 20 }, { y: 0, opacity: 1, rotateX: targetRotate, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.footer', start: 'top 90%', once: true } });
  }
  const mn = document.querySelector('.footer-moon');
  if (mn) {
    gsap.fromTo(mn, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, ease: 'power2.out', scrollTrigger: { trigger: '.footer-grid-scene', start: 'top 85%', once: true } });
  }
  const backToTopBtn = document.getElementById('footer-back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.lenis) { window.lenis.scrollTo(0, { duration: 1.4 }); }
      else { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });
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
