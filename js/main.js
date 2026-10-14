/* ═══════════════════════════════════════════════
   NOVA 5.0 — main.js  v2
   Fixed hero · GSAP ScrollTrigger · Lenis smooth
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     1.  LENIS  — smooth scrolling
     ───────────────────────────────────────────── */
  const lenis = new Lenis({
    duration: 1.5,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    wheelMultiplier: 0.55,
    touchMultiplier: 0.8,
    infinite: false,
    smoothWheel: true,
  });

  // Link Lenis → GSAP ticker for perfect sync
  gsap.registerPlugin(ScrollTrigger);

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  window.lenis = lenis;

  // Intercept anchor links for smooth Lenis scrolling
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const targetId = a.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          lenis.scrollTo(targetEl, { offset: -60, duration: 1.4 });
        }
      }
    });
  });

  /* ─────────────────────────────────────────────
     2.  NAVBAR  — scroll class + active tracking
     ───────────────────────────────────────────── */
  const navbar = document.getElementById('navbar');

  ScrollTrigger.create({
    start: 60,
    onUpdate: (self) => {
      navbar.classList.toggle('scrolled', self.scroll() > 60);
    },
  });

  // Active nav link tracking
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  sections.forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 40%',
      end: 'bottom 40%',
      onToggle: ({ isActive }) => {
        if (isActive) {
          navLinks.forEach((lnk) => {
            lnk.classList.remove('active');
            const href = lnk.getAttribute('href');
            if (href === '#' + sec.id || (sec.id === 'hero' && (href === '/' || href === 'index.html'))) {
              lnk.classList.add('active');
            }
          });
        }
      },
    });
  });

  /* ─────────────────────────────────────────────
     3.  MOBILE MENU
     ───────────────────────────────────────────── */
  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileClose = document.getElementById('mobile-menu-close');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  function openMenu() {
    mobileMenu.classList.add('open');
    mobileMenu.removeAttribute('aria-hidden');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    lenis.stop();
  }
  function closeMenu() {
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    lenis.start();
  }

  if (hamburger) hamburger.addEventListener('click', openMenu);
  if (mobileClose) mobileClose.addEventListener('click', closeMenu);
  mobileLinks.forEach((l) => l.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ─────────────────────────────────────────────
     4.  TERMINAL CHIP  — cycling messages
     ───────────────────────────────────────────── */
  const messages = [
    'mission@nova ~ $ T-minus 10 days',
    'mission@nova ~ $ 12 clubs onboard',
    'mission@nova ~ $ countdown online',
    'mission@nova ~ $ launch pad: RIT',
    'mission@nova ~ $ signal: strong',
  ];
  let msgIdx = 0;
  const termText = document.getElementById('terminal-text');

  setInterval(() => {
    if (!termText) return;
    msgIdx = (msgIdx + 1) % messages.length;
    gsap.to(termText, {
      opacity: 0,
      duration: 0.15,
      ease: 'power1.in',
      onComplete: () => {
        termText.textContent = messages[msgIdx];
        gsap.to(termText, { opacity: 1, duration: 0.25, ease: 'power1.out' });
      },
    });
  }, 3500);

  /* ─────────────────────────────────────────────
     5.  HERO CANVAS — FRAME-BY-FRAME SCROLL ANIMATION
     Separate high-res frames for Desktop & Mobile view
     ───────────────────────────────────────────── */
  const heroCanvas = document.getElementById('hero-canvas');
  const heroPoster = document.getElementById('hero-poster');
  const heroContent = document.getElementById('hero-content');
  const heroScrollHint = document.getElementById('hero-scroll-hint');
  const telemetryHUD = document.getElementById('hero-telemetry');
  const telemetryStage = document.getElementById('telemetry-stage');
  const telemetryAlt = document.getElementById('telemetry-alt');
  const telemetrySub = document.getElementById('telemetry-sub');

  if (heroCanvas) {
    const ctx = heroCanvas.getContext('2d', { alpha: false });

    const CONFIG = {
      desktop: {
        totalFrames: 1201,
        prefix: 'Frames/Desktop View/frame_',
        ext: '.webp',
        pad: 6,
      },
      mobile: {
        totalFrames: 1200,
        prefix: 'Frames/Mobile View/frame_',
        ext: '.webp',
        pad: 6,
      },
    };

    function isMobileView() {
      return window.innerWidth < 768;
    }

    let isMobile = isMobileView();
    let totalFrames = isMobile ? CONFIG.mobile.totalFrames : CONFIG.desktop.totalFrames;
    let currentFrameIndex = 0;
    let renderedFrameIndex = -1;
    let rafId = null;

    // Cache: map of "m_0" or "d_0" -> HTMLImageElement
    const frameCache = new Map();
    const pendingLoads = new Set();

    function getFrameKey(index, isMob) {
      return `${isMob ? 'm' : 'd'}_${index}`;
    }

    function getFrameUrl(index, isMob) {
      const cfg = isMob ? CONFIG.mobile : CONFIG.desktop;
      const clamped = Math.max(0, Math.min(index, cfg.totalFrames - 1));
      const padded = String(clamped).padStart(cfg.pad, '0');
      return `${cfg.prefix}${padded}${cfg.ext}`;
    }

    // Fast image loader
    function loadSingleFrame(index, isMob, highPriority = false) {
      const key = getFrameKey(index, isMob);
      if (frameCache.has(key) || pendingLoads.has(key)) {
        return frameCache.get(key);
      }

      pendingLoads.add(key);
      const img = new Image();
      img.decoding = 'async';

      img.onload = () => {
        pendingLoads.delete(key);
        frameCache.set(key, img);

        // When initial frame 0 is ready
        if (index === 0 && !heroCanvas.classList.contains('ready')) {
          heroCanvas.classList.add('ready');
          if (heroPoster) {
            heroPoster.style.display = 'none';
          }
        }

        if (index === currentFrameIndex || Math.abs(index - currentFrameIndex) <= 2) {
          requestRender();
        }

        pruneCache();
      };

      img.onerror = () => {
        pendingLoads.delete(key);
      };

      img.src = getFrameUrl(index, isMob);
      return img;
    }

    // Prune distant frames to maintain lightweight memory footprint
    function pruneCache() {
      const maxLimit = isMobile ? 80 : 150;
      if (frameCache.size <= maxLimit) return;

      const prefix = isMobile ? 'm_' : 'd_';
      for (const [k] of frameCache.entries()) {
        if (frameCache.size <= maxLimit - 20) break;
        if (!k.startsWith(prefix)) {
          frameCache.delete(k);
          continue;
        }
        const idx = parseInt(k.slice(2), 10);
        // Keep frame 0 and sparse keyframe backbone (every 12 frames)
        if (idx === 0 || idx % 12 === 0) continue;
        if (Math.abs(idx - currentFrameIndex) > 35) {
          frameCache.delete(k);
        }
      }
    }

    // Find closest loaded frame in cache
    function getNearestLoadedFrame(targetIdx, isMob) {
      const directKey = getFrameKey(targetIdx, isMob);
      const directImg = frameCache.get(directKey);
      if (directImg && directImg.complete && directImg.naturalWidth > 0) {
        return { img: directImg, index: targetIdx };
      }

      // Search outward for the closest loaded frame
      const maxSearch = 30;
      for (let offset = 1; offset <= maxSearch; offset++) {
        const prevIdx = targetIdx - offset;
        if (prevIdx >= 0) {
          const prevImg = frameCache.get(getFrameKey(prevIdx, isMob));
          if (prevImg && prevImg.complete && prevImg.naturalWidth > 0) {
            return { img: prevImg, index: prevIdx };
          }
        }
        const nextIdx = targetIdx + offset;
        const maxF = isMob ? CONFIG.mobile.totalFrames : CONFIG.desktop.totalFrames;
        if (nextIdx < maxF) {
          const nextImg = frameCache.get(getFrameKey(nextIdx, isMob));
          if (nextImg && nextImg.complete && nextImg.naturalWidth > 0) {
            return { img: nextImg, index: nextIdx };
          }
        }
      }

      // Fallback to frame 0
      const f0 = frameCache.get(getFrameKey(0, isMob));
      if (f0 && f0.complete && f0.naturalWidth > 0) {
        return { img: f0, index: 0 };
      }

      return null;
    }

    // High performance cover drawing
    function drawFrame(img) {
      if (!ctx || !img || !img.complete || img.naturalWidth === 0) return;
      const cw = heroCanvas.width;
      const ch = heroCanvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;

      const scale = Math.max(cw / iw, ch / ih);
      const nw = iw * scale;
      const nh = ih * scale;
      const nx = (cw - nw) * 0.5;
      const ny = (ch - nh) * 0.5;

      ctx.drawImage(img, 0, 0, iw, ih, nx, ny, nw, nh);
    }

    function render() {
      rafId = null;
      const result = getNearestLoadedFrame(currentFrameIndex, isMobile);
      if (result) {
        drawFrame(result.img);
        renderedFrameIndex = result.index;
      }
    }

    function requestRender() {
      if (!rafId) {
        rafId = requestAnimationFrame(render);
      }
    }

    // Canvas sizing with Retina DPR
    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      heroCanvas.width = Math.round(w * dpr);
      heroCanvas.height = Math.round(h * dpr);
      render();
    }

    // Preload nearby window
    function preloadWindow(centerIdx) {
      const isMob = isMobile;
      const total = isMob ? CONFIG.mobile.totalFrames : CONFIG.desktop.totalFrames;
      const windowRadius = isMob ? 15 : 25;

      const start = Math.max(0, centerIdx - 6);
      const end = Math.min(total - 1, centerIdx + windowRadius);

      for (let i = start; i <= end; i++) {
        loadSingleFrame(i, isMob);
      }
    }

    // Preload sparse backbone across entire 1200 timeline
    function preloadBackbone(isMob) {
      const total = isMob ? CONFIG.mobile.totalFrames : CONFIG.desktop.totalFrames;
      const step = 12; // ~100 frames total across 1200
      let current = 0;

      function loadNextChunk() {
        const batchEnd = Math.min(total, current + step * 4);
        for (; current < batchEnd; current += step) {
          loadSingleFrame(current, isMob);
        }
        if (current < total) {
          if ('requestIdleCallback' in window) {
            requestIdleCallback(loadNextChunk, { timeout: 1000 });
          } else {
            setTimeout(loadNextChunk, 80);
          }
        }
      }

      loadNextChunk();
    }

    // Mission Telemetry HUD updates across full page journey
    function updateTelemetry(progress) {
      if (!telemetryHUD) return;

      if (progress > 0.02 && progress < 0.995) {
        telemetryHUD.classList.add('visible');
      } else {
        telemetryHUD.classList.remove('visible');
      }

      let stage = 'STAGE 01 // PLANETARY ASCENT';
      let alt = '0.0 KM';
      let sub = 'ATMOSPHERE TRAJECTORY';

      if (progress < 0.20) {
        stage = 'STAGE 01 // PLANETARY ASCENT';
        const km = (progress / 0.20 * 85).toFixed(1);
        alt = `${km} KM`;
        sub = 'ATMOSPHERE TRAJECTORY';
      } else if (progress < 0.44) {
        stage = 'STAGE 02 // ORBITAL INSERTION';
        const p = (progress - 0.20) / 0.24;
        const km = Math.round(85 + p * 340);
        alt = `${km} KM`;
        sub = 'RIVER VALLEY FLYOVER';
      } else if (progress < 0.74) {
        stage = 'STAGE 03 // LUNAR HORIZON';
        const p = (progress - 0.44) / 0.30;
        const km = Math.round(425 + p * 384000).toLocaleString();
        alt = `${km} KM`;
        sub = 'RADIO OBSERVATORY // MILKY WAY';
      } else {
        stage = 'STAGE 04 // DEEP COSMOS';
        alt = 'DEEP SPACE';
        sub = 'MARE TRANQUILLITATIS // EARTHRISE';
      }

      if (telemetryStage) telemetryStage.textContent = stage;
      if (telemetryAlt) telemetryAlt.textContent = alt;
      if (telemetrySub) telemetrySub.textContent = sub;
    }

    // Initialize
    resizeCanvas();
    window.addEventListener('resize', () => {
      const newIsMob = isMobileView();
      if (newIsMob !== isMobile) {
        isMobile = newIsMob;
        totalFrames = isMobile ? CONFIG.mobile.totalFrames : CONFIG.desktop.totalFrames;
        loadSingleFrame(0, isMobile, true);
        loadSingleFrame(currentFrameIndex, isMobile, true);
        preloadBackbone(isMobile);
      }
      resizeCanvas();
    }, { passive: true });

    // Step 1: Immediately load frame 0
    loadSingleFrame(0, isMobile, true);

    // Step 2: Preload initial runway frames
    for (let i = 1; i <= 25; i++) {
      loadSingleFrame(i, isMobile);
    }

    // Step 3: Preload sparse backbone
    setTimeout(() => {
      preloadBackbone(isMobile);
    }, 350);

    // Step 4: Full-Page Cosmic Scroll Scrubbing Engine
    // Stage 1 & 2: Played during Hero runway (0 -> 0.44 progress, frames 0 to ~528)
    // Stage 3 & 4: Played along with transparent sections (0.44 -> 1.0 progress, frames ~528 to 1200)

    function calculateTargetProgress() {
      const spacer = document.querySelector('.hero-spacer');
      const spacerH = spacer ? spacer.offsetHeight : window.innerHeight * 3.2;
      const totalScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const contentScroll = Math.max(1, totalScroll - spacerH);
      const sy = Math.max(0, window.scrollY || window.pageYOffset || 0);

      if (sy <= spacerH) {
        // Stage 1 & 2 during hero intro
        const ratio = Math.max(0, sy / spacerH);
        return ratio * 0.44;
      } else {
        // Stage 3 & 4 across all page sections
        const ratio = Math.min(1, (sy - spacerH) / contentScroll);
        return 0.44 + ratio * 0.56;
      }
    }

    let targetProgress = 0;
    let smoothProgress = 0;

    function onScrollProgressUpdate() {
      targetProgress = calculateTargetProgress();
    }

    window.addEventListener('scroll', onScrollProgressUpdate, { passive: true });
    lenis.on('scroll', onScrollProgressUpdate);

    // Initial sync
    targetProgress = calculateTargetProgress();
    smoothProgress = targetProgress;

    // Smooth physics ticker for 60fps cinematic playback
    gsap.ticker.add(() => {
      const diff = targetProgress - smoothProgress;
      if (Math.abs(diff) > 0.0001) {
        smoothProgress += diff * 0.08;
      } else {
        smoothProgress = targetProgress;
      }

      const total = isMobile ? CONFIG.mobile.totalFrames : CONFIG.desktop.totalFrames;
      const targetIdx = Math.min(total - 1, Math.max(0, Math.floor(smoothProgress * total)));

      if (targetIdx !== currentFrameIndex) {
        currentFrameIndex = targetIdx;
        loadSingleFrame(targetIdx, isMobile, true);
        preloadWindow(targetIdx);
        requestRender();
      }

      updateTelemetry(smoothProgress);
    });

    // Step 5: Fade hero content gracefully as scroll begins in the spacer
    if (heroContent) {
      gsap.to(heroContent, {
        yPercent: -20,
        opacity: 0,
        ease: 'power1.out',
        scrollTrigger: {
          trigger: '.hero-spacer',
          start: 'top top',
          end: '30% top',
          scrub: 0.8,
        },
      });
    }

    // Fade scroll hint early and make it clickable
    if (heroScrollHint) {
      heroScrollHint.addEventListener('click', () => {
        if (window.lenis) {
          window.lenis.scrollTo('#about', { offset: -60, duration: 1.4 });
        }
      });
      gsap.to(heroScrollHint, {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-spacer',
          start: 'top top',
          end: '15% top',
          scrub: 0.5,
        },
      });
    }

    // Subtle mouse parallax on desktop pointer
    if (window.matchMedia('(pointer: fine)').matches) {
      document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 6;
        const y = (e.clientY / window.innerHeight - 0.5) * 3;
        gsap.to(heroCanvas, { x, y, duration: 1.4, ease: 'power2.out' });
      });
    }
  }

  /* ─────────────────────────────────────────────
     6.  HERO — entrance animation on load
     ───────────────────────────────────────────── */
  const heroTl = gsap.timeline({ delay: 0.15 });
  heroTl
    .from('.hero-logos-bar .hero-logo-item', {
      opacity: 0,
      y: -12,
      duration: 0.5,
      stagger: 0.025,
      ease: 'power2.out',
    })
    .from('.hero-edition-of', { opacity: 0, y: 10, duration: 0.45, ease: 'power2.out' }, '-=0.25')
    .from('.hero-nova-logo', { opacity: 0, scale: 0.93, duration: 0.75, ease: 'power3.out' }, '-=0.35')
    .from('.hero-college-name', { opacity: 0, y: 12, duration: 0.55, ease: 'power3.out' }, '-=0.3')
    .from('.hero-scroll-hint', { opacity: 0, duration: 0.4 }, '-=0.15');

  // Sync hero top state for seamless navbar auto-reveal on scroll
  function updateNavHeroState() {
    const sy = window.scrollY || window.pageYOffset || 0;
    if (sy < 45) {
      document.body.classList.add('at-hero-top');
    } else {
      document.body.classList.remove('at-hero-top');
    }
  }
  window.addEventListener('scroll', updateNavHeroState, { passive: true });
  if (window.lenis) lenis.on('scroll', updateNavHeroState);
  updateNavHeroState();

  /* ─────────────────────────────────────────────
     7.  SCROLL REVEAL  — GSAP-powered
     ───────────────────────────────────────────── */
  function createReveals() {
    // Replace old CSS reveal-up with GSAP-powered reveals
    const revealEls = document.querySelectorAll('.reveal-up');

    revealEls.forEach((el) => {
      const delay = parseFloat(getComputedStyle(el).getPropertyValue('--delay')) || 0;

      gsap.fromTo(
        el,
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          delay,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // Bordered blocks — stagger entrance
    document.querySelectorAll('.bordered-block').forEach((block) => {
      gsap.fromTo(
        block,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: block,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // Section headlines — slide in
    document.querySelectorAll('.section-headline').forEach((h) => {
      gsap.fromTo(
        h,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: h,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // Section index rows — horizontal line wipe
    document.querySelectorAll('.section-index-row').forEach((row) => {
      gsap.fromTo(
        row,
        { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
        {
          opacity: 1,
          clipPath: 'inset(0 0% 0 0)',
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: row,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // Pillar cards — stagger
    const pillarCards = document.querySelectorAll('.pillar-card');
    if (pillarCards.length) {
      gsap.fromTo(
        pillarCards,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: pillarCards[0].parentElement,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    }

    // Format tiles — stagger
    const formatTiles = document.querySelectorAll('.format-tile');
    if (formatTiles.length) {
      gsap.fromTo(
        formatTiles,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: formatTiles[0].parentElement,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        }
      );
    }

    // Event cards — stagger
    document.querySelectorAll('.events-grid').forEach((grid) => {
      const cards = grid.querySelectorAll('.event-card, .pre-event-card');
      if (cards.length) {
        gsap.fromTo(
          cards,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.06,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: grid,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          }
        );
      }
    });

    // Logo tiles — stagger from center
    const logoTiles = document.querySelectorAll('.logo-tile');
    if (logoTiles.length) {
      gsap.fromTo(
        logoTiles,
        { scale: 0.85, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          stagger: { amount: 0.5, from: 'center' },
          ease: 'back.out(1.4)',
          scrollTrigger: {
            trigger: logoTiles[0].parentElement,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    }

    // RIT fact tiles — counter-style
    const ritTiles = document.querySelectorAll('.rit-fact-tile');
    if (ritTiles.length) {
      gsap.fromTo(
        ritTiles,
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: ritTiles[0].parentElement,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        }
      );
    }

    // Contact section
    const contactBlock = document.querySelector('.contact-block');
    if (contactBlock) {
      gsap.fromTo(
        contactBlock,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: contactBlock,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    }

    // Poster strips — horizontal slide
    document.querySelectorAll('.posters-strip').forEach((strip) => {
      gsap.fromTo(
        strip,
        { x: -40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: strip,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // Glimpse preview cards
    const glimpseCards = document.querySelectorAll('.glimpse-card');
    if (glimpseCards.length) {
      gsap.fromTo(
        glimpseCards,
        { y: 24, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: glimpseCards[0].parentElement,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        }
      );
    }
  }

  createReveals();

  /* ─────────────────────────────────────────────
     8.  DITHER TEXT EFFECT
     ───────────────────────────────────────────── */
  function initDitherText() {
    const dither = document.getElementById('dither-text');
    if (!dither) return;

    const original = dither.textContent;
    const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

    ScrollTrigger.create({
      trigger: dither,
      start: 'top 78%',
      once: true,
      onEnter: () => {
        let step = 0;
        const total = 18;
        const interval = setInterval(() => {
          dither.textContent = original
            .split('')
            .map((ch, i) => {
              if (i < (step / total) * original.length) return original[i];
              if (ch === ' ') return ' ';
              return glyphs[Math.floor(Math.random() * glyphs.length)];
            })
            .join('');
          step++;
          if (step >= total * 2) {
            clearInterval(interval);
            dither.textContent = original;
          }
        }, 30);
      },
    });
  }
  initDitherText();

  /* ─────────────────────────────────────────────
     9.  PRE-EVENTS GRID  — build cards from data
     ───────────────────────────────────────────── */
  const preEvents = [
    { title: 'Spatial Data Analytics', type: 'Online Workshop', date: '12 Sep 2026', time: '7:30 PM', fee: '₹80', link: 'https://tinyurl.com/nova5-o-spatial-analysis', assoc: 'NOVA 5.0' },
    { title: 'History of Space Exploration', type: 'Online Talk', date: '16 Sep 2026', time: '7:30 PM', fee: 'Free', link: 'https://forms.gle/ea1BpSaYPXErbpai7', assoc: 'Celestia NSSCE' },
    { title: 'Introduction to Rocket Propulsion', type: 'Online Talk', date: '18 Sep 2026', time: '7:30 PM', fee: 'Free', link: 'https://forms.gle/VXgj5pnN1nVyNTCVA', assoc: 'ASRIT · ISTE SC RIT' },
    { title: 'Cosmic Commentary', type: 'Online Competition', date: '21 Sep 2026', time: '8:00 PM', fee: '₹15', link: 'https://forms.gle/gwpaYS9AX6xbyhXD8', assoc: 'Vyom · CEP' },
    { title: 'Understanding Stellar Formation', type: 'Online Lecture', date: '23 Sep 2026', time: '8:00 PM', fee: '₹10', link: 'https://forms.gle/SdJtni8yeHFkGmWV9', assoc: 'Celestials · IIST' },
    { title: 'Astrothon — Ideas Beyond Infinity', type: 'Team Competition', date: '2 Oct 2026', time: 'All day', fee: '₹60/team', link: 'https://forms.gle/nJcYK5SjzcBCQfas8', assoc: 'AstroCET' },
    { title: 'Satellite Remote Sensing', type: 'Talk Session', date: '28 Sep 2026', time: '8:00 PM', fee: 'Free', link: 'https://forms.gle/SzKELfv6HzkeK8is8', assoc: 'Calypso · GCEK' },
    { title: 'Space Environment & Materials', type: 'Online Talk', date: '30 Sep 2026', time: '8:00 PM', fee: '₹10', link: 'https://forms.gle/qqsqz4HTdce4mjxA7', assoc: 'NEXORA · LBSITW' },
  ];

  const preGrid = document.getElementById('pre-events-grid');
  if (preGrid) {
    preEvents.forEach((ev) => {
      const card = document.createElement('div');
      card.className = 'pre-event-card';
      card.innerHTML = `
        <span class="mono-label accent">${ev.type.toUpperCase()} · ${ev.date.toUpperCase()}</span>
        <h3 class="pre-event-title">${ev.title}</h3>
        <div class="pre-event-meta">
          <span class="tag">${ev.time}</span>
          <span class="tag">${ev.fee}</span>
          <span class="tag">${ev.assoc}</span>
        </div>
        <a href="${ev.link}" target="_blank" rel="noopener" class="pre-event-link">Register →</a>
      `;
      preGrid.appendChild(card);
    });
  }

  /* ─────────────────────────────────────────────
     10.  LOGO TILES  — grayscale ↔ color on hover
     ───────────────────────────────────────────── */
  document.querySelectorAll('.logo-tile').forEach((tile) => {
    const img = tile.querySelector('.logo-img');
    if (!img) return;
    tile.addEventListener('mouseenter', () => gsap.to(img, { filter: 'grayscale(0%) brightness(1.15)', duration: 0.2 }));
    tile.addEventListener('mouseleave', () => gsap.to(img, { filter: 'grayscale(100%) brightness(0.85)', duration: 0.25 }));
  });

  /* ─────────────────────────────────────────────
     11.  LIGHTBOX
     ───────────────────────────────────────────── */
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbCaption = document.getElementById('lightbox-caption');
  const lbClose = document.getElementById('lightbox-close');

  function openLightbox(src, alt) {
    if (!lightbox) return;
    lbImg.src = src;
    lbImg.alt = alt || '';
    lbCaption.textContent = alt || '';
    lightbox.classList.add('open');
    lightbox.removeAttribute('aria-hidden');
    lenis.stop();
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lenis.start();
  }

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lightbox?.classList.contains('open')) closeLightbox(); });

  document.querySelectorAll('.poster-thumb').forEach((img) => {
    img.addEventListener('click', () => openLightbox(img.src, img.alt));
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') openLightbox(img.src, img.alt);
    });
  });

  /* ─────────────────────────────────────────────
     12.  COPY EMAIL
     ───────────────────────────────────────────── */
  const emailLink = document.getElementById('contact-email-link');
  const copyToast = document.getElementById('copy-toast');

  if (emailLink) {
    emailLink.addEventListener('click', (e) => {
      e.preventDefault();
      navigator.clipboard.writeText('nova@rit.ac.in').then(() => {
        if (copyToast) {
          copyToast.classList.add('show');
          setTimeout(() => copyToast.classList.remove('show'), 2000);
        }
      }).catch(() => {
        window.location.href = 'mailto:nova@rit.ac.in';
      });
    });
  }

  /* ─────────────────────────────────────────────
     13.  ENQUIRY FORM
     ───────────────────────────────────────────── */
  const form = document.getElementById('enquiry-form');
  const formStatus = document.getElementById('enquiry-status');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('enquiry-email')?.value;
      if (!email || !email.includes('@')) {
        formStatus.textContent = 'Please enter a valid email.';
        formStatus.className = 'enquiry-status error';
        return;
      }
      const btn = document.getElementById('enquiry-submit-btn');
      btn.disabled = true;
      btn.textContent = 'Transmitting…';
      formStatus.textContent = '';

      setTimeout(() => {
        formStatus.textContent = "Transmission received ✓ We'll be in touch.";
        formStatus.className = 'enquiry-status success';
        btn.textContent = '✦ REQUEST SPONSOR DETAILS';
        btn.disabled = false;
        form.reset();
      }, 1400);
    });
  }

  /* ─────────────────────────────────────────────
     14.  FOOTER — perspective grid canvas
     ───────────────────────────────────────────── */
  function initFooterCanvas() {
    const c = document.getElementById('footer-canvas');
    if (!c) return;
    const ctx = c.getContext('2d');

    function resize() { c.width = c.offsetWidth; c.height = c.offsetHeight; }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    function draw() {
      const w = c.width, h = c.height;
      const vp = { x: w / 2, y: h * 0.55 };
      const n = 22;

      ctx.clearRect(0, 0, w, h);

      // Horizon glow
      const g = ctx.createLinearGradient(0, vp.y - 16, 0, h);
      g.addColorStop(0, 'rgba(25,227,255,0.07)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, vp.y - 16, w, h - vp.y + 16);

      // Horizontal lines
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const y = vp.y + (h - vp.y) * (t * t);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.strokeStyle = `rgba(25,227,255,${0.04 + t * 0.04})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Vertical converging
      for (let i = -n; i <= n; i++) {
        ctx.beginPath();
        ctx.moveTo(vp.x, vp.y);
        ctx.lineTo(vp.x + i * (w / n) * 1.5, h);
        ctx.strokeStyle = 'rgba(25,227,255,0.04)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    draw();
    window.addEventListener('resize', draw, { passive: true });
  }
  initFooterCanvas();

  /* ─────────────────────────────────────────────
     15.  FOOTER — wordmark stagger + moon rise
     ───────────────────────────────────────────── */
  const wmLetters = document.querySelectorAll('.footer-wordmark .wm-letter, .footer-wordmark .wm-dot');
  if (wmLetters.length) {
    gsap.from(wmLetters, {
      yPercent: 100,
      opacity: 0,
      duration: 0.8,
      stagger: 0.04,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.footer-wordmark',
        start: 'top 92%',
        once: true,
      },
    });
  }

  // Moon rise
  const moon = document.querySelector('.footer-moon');
  if (moon) {
    gsap.fromTo(
      moon,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.footer-grid-scene',
          start: 'top 85%',
          once: true,
        },
      }
    );
  }

  /* ─────────────────────────────────────────────
     16.  PAGE TRANSITIONS  — internal links
     ───────────────────────────────────────────── */
  const pageTransition = document.querySelector('.page-transition');

  if (pageTransition) {
    // Wipe in on load (reveal page)
    gsap.fromTo(
      pageTransition,
      { scaleX: 1 },
      {
        scaleX: 0,
        transformOrigin: 'right',
        duration: 0.45,
        ease: 'power2.inOut',
        delay: 0.05,
      }
    );

    // Intercept internal navigation
    document.querySelectorAll('a[href]:not([href^="#"]):not([target="_blank"])').forEach((link) => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('mailto:')) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          gsap.to(pageTransition, {
            scaleX: 1,
            transformOrigin: 'left',
            duration: 0.4,
            ease: 'power2.inOut',
            onComplete: () => { window.location.href = href; },
          });
        });
      }
    });
  }

  /* ─────────────────────────────────────────────
     17.  CONTENT-WRAP edge glow  — subtle accent
     ───────────────────────────────────────────── */
  const contentWrap = document.getElementById('content-wrap');
  if (contentWrap) {
    // Fade in the content-wrap top edge as it enters
    gsap.fromTo(
      contentWrap,
      { boxShadow: '0 -20px 60px rgba(25,227,255,0.08)' },
      {
        boxShadow: '0 -2px 20px rgba(25,227,255,0.02)',
        ease: 'none',
        scrollTrigger: {
          trigger: contentWrap,
          start: 'top bottom',
          end: 'top 30%',
          scrub: true,
        },
      }
    );
  }

})();
