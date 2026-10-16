/* ═══════════════════════════════════════════════
   NOVA 5.0 — main.js  v2
   Fixed hero · GSAP ScrollTrigger · Lenis smooth
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  // Check if user has already entered the site during this session
  const preloaderEl = document.getElementById('site-preloader');
  let hasEntered = false;
  try {
    hasEntered = sessionStorage.getItem('nova_entered') === 'true';
  } catch (e) {
    hasEntered = false;
  }

  if (hasEntered && preloaderEl) {
    preloaderEl.style.display = 'none';
    document.body.classList.remove('is-loading');
  } else if (!hasEntered && preloaderEl) {
    document.body.classList.add('is-loading');
  }

  // Ensure fresh, consistent state on page reload (avoids premature hero scroll scrub)
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

  /* ─────────────────────────────────────────────
     1.  LENIS  — smooth scrolling
     ───────────────────────────────────────────── */
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    wheelMultiplier: 1.0,
    touchMultiplier: isTouchDevice ? 1.5 : 1.0,
    infinite: false,
    smoothWheel: true,
    smoothTouch: false,
  });

  // Link Lenis → GSAP ticker for perfect sync
  gsap.registerPlugin(ScrollTrigger);

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  // GSAP lag smoothing: prevents micro-stuttering on frame drops
  gsap.ticker.lagSmoothing(500, 33);

  window.lenis = lenis;

  // Intercept anchor links for smooth Lenis scrolling
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (a.closest('.mobile-menu')) return; // handled in mobile menu
      const targetId = a.getAttribute('href');
      // If clicking Home link (#hero, #top): smoothly scroll to top (0)
      if (targetId === '#hero' || targetId === '#top') {
        e.preventDefault();
        if (window.lenis) {
          window.lenis.start();
          window.lenis.scrollTo(0, { duration: 1.2 });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }
      if (targetId && targetId !== '#') {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          if (window.lenis) {
            window.lenis.start();
            window.lenis.scrollTo(targetEl, { offset: -70, duration: 1.2 });
          } else {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    });
  });

  // Logo click: smoothly scroll to top (0)
  document.querySelectorAll('.nav-logo').forEach((logo) => {
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.lenis) {
        window.lenis.start();
        window.lenis.scrollTo(0, { duration: 1.2 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            if (href === '#' + sec.id || (sec.id === 'hero' && (href === '#hero' || href === '/' || href === 'index.html'))) {
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
    if (!mobileMenu) return;
    mobileMenu.classList.add('open');
    mobileMenu.removeAttribute('aria-hidden');
    if (hamburger) {
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
    }
    if (window.lenis) lenis.stop();
  }
  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    if (hamburger) {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
    if (window.lenis) lenis.start();
  }

  if (hamburger) {
    hamburger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (mobileMenu && mobileMenu.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }
  if (mobileClose) {
    mobileClose.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeMenu();
    });
  }

  mobileLinks.forEach((l) => {
    l.addEventListener('click', (e) => {
      const href = l.getAttribute('href');
      // If clicking Home link (#hero, #top, /, index.html): smoothly scroll to top (0)
      if (href === '#hero' || href === '#top' || href === '/' || href === 'index.html') {
        e.preventDefault();
        closeMenu();
        setTimeout(() => {
          if (window.lenis) {
            window.lenis.start();
            window.lenis.scrollTo(0, { duration: 1.2 });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 120);
        return;
      }
      if (href && href.startsWith('#') && href !== '#') {
        e.preventDefault();
        closeMenu();
        const targetEl = document.querySelector(href);
        if (targetEl) {
          setTimeout(() => {
            if (window.lenis) {
              window.lenis.start();
              window.lenis.scrollTo(targetEl, { offset: -70, duration: 1.2 });
            } else {
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 120);
        }
        return;
      }
      closeMenu();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('open')) {
      closeMenu();
    }
  });

  /* ─────────────────────────────────────────────
     4.  TERMINAL CHIP  — cycling messages
     ───────────────────────────────────────────── */
  const messages = [
    'mission@nova ~ $ T-minus 8 days',
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

    // Canvas sizing: Cap DPR at 1.25x (source frames are ~1983x793).
    // Avoids massive 3840x2160 bitmap allocations that choke the GPU on high-DPI displays.
    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const w = window.innerWidth;
      const h = window.innerHeight;
      heroCanvas.width = Math.round(w * dpr);
      heroCanvas.height = Math.round(h * dpr);
      render();
    }

    // Throttled window preloading: only re-trigger when scrolled >= 6 frames away from last preloaded index
    let lastPreloadIdx = -999;
    function preloadWindow(centerIdx) {
      if (Math.abs(centerIdx - lastPreloadIdx) < 6) return;
      lastPreloadIdx = centerIdx;

      const isMob = isMobile;
      const total = isMob ? CONFIG.mobile.totalFrames : CONFIG.desktop.totalFrames;
      const windowRadius = isMob ? 12 : 20;

      const start = Math.max(0, centerIdx - 4);
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

    // Mission Telemetry HUD updates across full page journey — DOM throttled
    let lastStage = '', lastAlt = '', lastSub = '', lastHudVis = false;
    function updateTelemetry(progress) {
      if (!telemetryHUD) return;

      const shouldBeVis = progress > 0.02 && progress < 0.995;
      if (shouldBeVis !== lastHudVis) {
        lastHudVis = shouldBeVis;
        telemetryHUD.classList.toggle('visible', shouldBeVis);
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

      if (telemetryStage && stage !== lastStage) { telemetryStage.textContent = stage; lastStage = stage; }
      if (telemetryAlt && alt !== lastAlt) { telemetryAlt.textContent = alt; lastAlt = alt; }
      if (telemetrySub && sub !== lastSub) { telemetrySub.textContent = sub; lastSub = sub; }
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
    function calculateTargetProgress() {
      const spacer = document.querySelector('.hero-spacer');
      const spacerH = spacer ? spacer.offsetHeight : window.innerHeight * 3.2;
      const totalScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const contentScroll = Math.max(1, totalScroll - spacerH);
      const sy = Math.max(0, window.scrollY || window.pageYOffset || 0);

      if (sy <= spacerH) {
        const ratio = Math.max(0, sy / spacerH);
        return ratio * 0.44;
      } else {
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

    // Initial sync
    targetProgress = calculateTargetProgress();
    smoothProgress = targetProgress;

    // Smooth physics ticker: faster settle factor (0.16) eliminates floaty lag
    gsap.ticker.add(() => {
      const diff = targetProgress - smoothProgress;
      if (Math.abs(diff) > 0.0002) {
        smoothProgress += diff * 0.16;
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
          window.lenis.scrollTo('#about', { offset: -60, duration: 1.0 });
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

    // Subtle mouse parallax on desktop pointer — throttled with requestAnimationFrame
    if (window.matchMedia('(pointer: fine)').matches) {
      let mouseX = 0, mouseY = 0, mouseTicking = false;
      document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 6;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 3;
        if (!mouseTicking) {
          mouseTicking = true;
          requestAnimationFrame(() => {
            gsap.to(heroCanvas, { x: mouseX, y: mouseY, duration: 1.2, ease: 'power2.out', overwrite: 'auto' });
            mouseTicking = false;
          });
        }
      }, { passive: true });
    }
  }

  /* ─────────────────────────────────────────────
     6.  HERO — entrance animation on load
     ───────────────────────────────────────────── */
  const heroTl = gsap.timeline({ delay: 0.15, paused: !hasEntered });
  heroTl
    .fromTo(
      '.hero-logos-bar .hero-logo-item',
      { opacity: 0, y: -10 },
      {
        opacity: 0.95,
        y: 0,
        duration: 0.45,
        stagger: 0.02,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      }
    )
    .from('.hero-edition-of', { opacity: 0, y: 10, duration: 0.45, ease: 'power2.out' }, '-=0.25')
    .from('.hero-nova-logo', { opacity: 0, scale: 0.93, duration: 0.75, ease: 'power3.out' }, '-=0.35')
    .from('.hero-college-name', { opacity: 0, y: 12, duration: 0.55, ease: 'power3.out' }, '-=0.3')
    .from('.hero-scroll-hint', { opacity: 0, duration: 0.4 }, '-=0.15');

  function triggerHeroIntro() {
    if (heroTl.paused()) {
      heroTl.play();
    }
  }

  /* ─────────────────────────────────────────────
     6.1 SITE ENTRY INTRO PRELOADER CONTROLLER
     Only runs on initial website entry per session
     ───────────────────────────────────────────── */
  (function initSitePreloader() {
    if (hasEntered || !preloaderEl) {
      if (preloaderEl) preloaderEl.style.display = 'none';
      document.body.classList.remove('is-loading');
      triggerHeroIntro();
      return;
    }

    document.body.classList.add('is-loading');
    if (window.lenis) window.lenis.stop();

    const progressBar = document.getElementById('preloader-progress-bar');
    const progressCounter = document.getElementById('preloader-counter');
    const progressMsg = document.getElementById('preloader-msg');
    const skipBtn = document.getElementById('preloader-skip-btn');

    let isDismissed = false;

    const stages = [
      { at: 0, text: 'INITIALIZING NOVA 5.0 CORE ARCHITECTURE...' },
      { at: 26, text: 'SYNCHRONIZING INTER-COLLEGIATE NODES...' },
      { at: 58, text: 'CALIBRATING OBSERVATORY TELEMETRY...' },
      { at: 85, text: 'SYSTEMS NOMINAL · ORBITAL INSERTION CONFIRMED' },
      { at: 100, text: 'SYSTEM OPERATIONAL // ENTERING NOVA 5.0' }
    ];

    function updateStageText(pct) {
      if (!progressMsg) return;
      for (let i = stages.length - 1; i >= 0; i--) {
        if (pct >= stages[i].at) {
          if (progressMsg.textContent !== stages[i].text) {
            progressMsg.textContent = stages[i].text;
          }
          break;
        }
      }
    }

    function dismissPreloader() {
      if (isDismissed) return;
      isDismissed = true;
      try {
        sessionStorage.setItem('nova_entered', 'true');
      } catch (e) {}

      if (progressCounter) progressCounter.textContent = '100%';
      if (progressBar) progressBar.style.width = '100%';
      if (progressMsg) progressMsg.textContent = 'SYSTEM OPERATIONAL // ENTERING NOVA 5.0';

      setTimeout(() => {
        preloaderEl.classList.add('dismissing');
        triggerHeroIntro();
        document.body.classList.remove('is-loading');
        if (window.lenis) window.lenis.start();

        setTimeout(() => {
          preloaderEl.style.display = 'none';
        }, 700);
      }, 250);
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.preventDefault();
        dismissPreloader();
      });
    }

    document.addEventListener('keydown', function onPreloaderKey(e) {
      if (isDismissed) {
        document.removeEventListener('keydown', onPreloaderKey);
        return;
      }
      if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        dismissPreloader();
      }
    });

    const startTime = performance.now();
    const duration = 2100; // ms

    function animateProgress(now) {
      if (isDismissed) return;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // High-tech ease curve: quick pickup, steady glide, smooth lock
      const eased = Math.min(1, Math.pow(progress, 0.88));
      const currentPercent = Math.min(100, Math.floor(eased * 100));

      if (progressBar) progressBar.style.width = `${currentPercent}%`;
      if (progressCounter) progressCounter.textContent = `${String(currentPercent).padStart(2, '0')}%`;
      updateStageText(currentPercent);

      if (progress < 1) {
        requestAnimationFrame(animateProgress);
      } else {
        dismissPreloader();
      }
    }

    requestAnimationFrame(animateProgress);
  })();

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
    const revealEls = document.querySelectorAll('.reveal-up');

    revealEls.forEach((el) => {
      const delay = parseFloat(getComputedStyle(el).getPropertyValue('--delay')) || 0;

      gsap.fromTo(
        el,
        { y: 28, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          delay,
          ease: 'power2.out',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            once: true,
          },
        }
      );
    });

    // Bordered blocks that do NOT already have .reveal-up (avoids duplicate tweens)
    document.querySelectorAll('.bordered-block:not(.reveal-up)').forEach((block) => {
      gsap.fromTo(
        block,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: block,
            start: 'top 90%',
            once: true,
          },
        }
      );
    });

    // Section headlines that do NOT already have .reveal-up
    document.querySelectorAll('.section-headline:not(.reveal-up)').forEach((h) => {
      gsap.fromTo(
        h,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: h,
            start: 'top 88%',
            once: true,
          },
        }
      );
    });

    // Section index rows that do NOT already have .reveal-up
    document.querySelectorAll('.section-index-row:not(.reveal-up)').forEach((row) => {
      gsap.fromTo(
        row,
        { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
        {
          opacity: 1,
          clipPath: 'inset(0 0% 0 0)',
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: row,
            start: 'top 92%',
            once: true,
          },
        }
      );
    });

    // Pillar cards — stagger
    const pillarCards = document.querySelectorAll('.pillar-card');
    if (pillarCards.length) {
      gsap.fromTo(
        pillarCards,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.06,
          ease: 'power2.out',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: pillarCards[0].parentElement,
            start: 'top 88%',
            once: true,
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
          stagger: 0.08,
          ease: 'power2.out',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: formatTiles[0].parentElement,
            start: 'top 88%',
            once: true,
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
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.05,
            ease: 'power2.out',
            clearProps: 'transform',
            scrollTrigger: {
              trigger: grid,
              start: 'top 90%',
              once: true,
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
        { scale: 0.88, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          stagger: { amount: 0.4, from: 'center' },
          ease: 'power2.out',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: logoTiles[0].parentElement,
            start: 'top 88%',
            once: true,
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
          stagger: 0.08,
          ease: 'power2.out',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: ritTiles[0].parentElement,
            start: 'top 90%',
            once: true,
          },
        }
      );
    }

    // Contact section
    const contactBlock = document.querySelector('.contact-block');
    if (contactBlock) {
      gsap.fromTo(
        contactBlock,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: contactBlock,
            start: 'top 88%',
            once: true,
          },
        }
      );
    }

    // Poster strips — horizontal slide
    document.querySelectorAll('.posters-strip').forEach((strip) => {
      gsap.fromTo(
        strip,
        { x: -30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: strip,
            start: 'top 92%',
            once: true,
          },
        }
      );
    });

    // Glimpse preview cards
    const glimpseCards = document.querySelectorAll('.glimpse-card');
    if (glimpseCards.length) {
      gsap.fromTo(
        glimpseCards,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.06,
          ease: 'power2.out',
          clearProps: 'transform',
          scrollTrigger: {
            trigger: glimpseCards[0].parentElement,
            start: 'top 90%',
            once: true,
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
  /* ─────────────────────────────────────────────
     9.  EVENTS DATABASE & EVENT DETAILS OPENING CARD ENGINE
     Full details for Inauguration, Pre-Events, and Main Online Events
     ───────────────────────────────────────────── */
  const EVENTS_DATABASE = {
    'inauguration': {
      id: 'inauguration',
      category: 'ONLINE INAUGURATION',
      type: 'Inaugural Ceremony & Keynote',
      title: 'Online Inaugural Ceremony & Talk Session',
      assoc: 'ASRIT, RIT in collaboration with Institution’s Innovation Council (IIC)',
      quote: 'Join us as NOVA 5.0 officially begins, bringing together space enthusiasts, ideas, and a shared curiosity about the universe.',
      date: '05 October 2026',
      time: '7:00 PM IST',
      mode: 'Online (Live Stream)',
      fee: 'Free Access',
      cert: 'Provided for All Attendees',
      ktu: false,
      poster: 'Posters/Online Inauguration/Inaugural Cermony and Talk Session.jpeg',
      speaker: {
        label: 'CHIEF GUEST & KEYNOTE SPEAKER',
        name: 'Dr. Tirtha Pratim Das',
        desig: 'Director, Space Science Programme, ISRO HQ'
      },
      desc: 'NOVA 5.0 is a flagship collaborative initiative united by the space clubs of premier engineering colleges across Kerala, hosted by ASRIT at Rajiv Gandhi Institute of Technology (RIT), Kottayam, in collaboration with the Institution\'s Innovation Council (IIC). The journey officially commences with the grand ceremonial launch followed by an insightful keynote session by Dr. Tirtha Pratim Das, Director of Space Science Programme at ISRO Headquarters.',
      extra: [
        'Interactive Q&A session with ISRO Director after the inaugural address',
        'Official unveiling of NOVA 5.0 inter-collegiate mission roadmap and timeline',
        'Participation open to all students, faculty, and astronomy enthusiasts across India'
      ],
      queries: [
        { name: 'Jonadhan O Abraham', phone: '+91 73066 45286' },
        { name: 'Sana B Salam', phone: '+91 94465 03823' }
      ],
      link: 'https://forms.gle/ST9f3BTZqgW9uEug6',
      ig: 'https://www.instagram.com/p/Dd_zzciIIxo/?stkn=MWw5cGFibnFrYzJucQ=='
    },
    'pre-1': {
      id: 'pre-1',
      category: 'PRE-EVENT 01',
      type: 'Online Workshop',
      title: 'Spatial Data Analytics',
      assoc: 'Presented by NOVA 5.0',
      quote: 'Data helps us understand the world. Spatial data helps us understand where it happens.',
      date: '12 September 2026',
      time: '7:30 PM IST',
      mode: 'Online Interactive Workshop',
      fee: '₹80 (Early Bird / Discounted)',
      cert: 'Official Certificate Provided',
      ktu: false,
      poster: 'Posters/Pre-Events/WhatsApp Image 2026-10-13 at 10.19.41 PM.jpeg',
      speaker: {
        label: 'WORKSHOP LEAD',
        name: 'Vyasan J',
        desig: 'CEO & Founder, TransEduverse · Data Engineering Technologist'
      },
      desc: 'Explore how spatial data and geospatial analytics uncover hidden geographic patterns, telemetry coordinates, and real-world earth phenomena, with state-of-the-art applications extending to satellite observation, astrophysics, and remote mapping.',
      extra: [
        'Hands-on walkthrough using modern geospatial data tools and Python libraries',
        'Real-world datasets covering remote earth observation and spatial coordinates',
        'E-certificates provided to all registered participants'
      ],
      queries: [
        { name: 'Jonadhan O Abraham', phone: '+91 73066 45286' },
        { name: 'Sana B Salam', phone: '+91 94465 03823' }
      ],
      link: 'https://tinyurl.com/nova5-o-spatial-analysis',
      ig: 'https://www.instagram.com/p/Dc8i_jxIxhu/?stkn=Mnd3ZzZpdnc4djJx'
    },
    'pre-2': {
      id: 'pre-2',
      category: 'PRE-EVENT 02',
      type: 'Online Talk Session',
      title: 'History of Space Exploration',
      assoc: 'In association with Celestia NSSCE',
      quote: 'The journey beyond Earth is a story of curiosity, courage, and discovery.',
      date: '16 September 2026',
      time: '7:30 PM IST',
      mode: 'Online Talk Session',
      fee: 'Free Registration',
      cert: 'Provided for All Attendees',
      ktu: false,
      poster: 'Posters/Pre-Events/WhatsApp Image 2026-10-13 at 10.19.42 PM.jpeg',
      speaker: {
        label: 'DISTINGUISHED SPEAKER',
        name: 'Dr. Sudeep U',
        desig: 'Professor, NSS College of Engineering'
      },
      desc: 'Explore the remarkable journey of humanity beyond Earth — from humanity\'s earliest cosmic inquiries to Sputnik, Apollo lunar landings, deep space probes (Voyager, James Webb), and the ongoing race for Mars and Artemis lunar bases.',
      extra: [
        'Comprehensive timeline analysis of key technological milestones',
        'The geopolitics, engineering hurdles, and breakthroughs of human spaceflight',
        'E-certificates provided to all attendees'
      ],
      queries: [
        { name: 'Nandana', phone: '+91 87145 55711' },
        { name: 'Nandana Biju', phone: '+91 70126 50464' }
      ],
      link: 'https://forms.gle/ea1BpSaYPXErbpai7',
      ig: 'https://www.instagram.com/p/DdBzWyfhmTR/?stkn=eTQ5dGxjeHozNTg0'
    },
    'pre-3': {
      id: 'pre-3',
      category: 'PRE-EVENT 03',
      type: 'Online Talk Session',
      title: 'Introduction to Rocket Propulsion',
      assoc: 'In association with ASRIT · ISTE SC RIT',
      quote: 'The journey to space begins with the power that takes us there.',
      date: '18 September 2026',
      time: '7:30 PM IST',
      mode: 'Online Talk Session',
      fee: 'Free Registration',
      cert: 'Provided for All Attendees',
      ktu: false,
      poster: 'Posters/Pre-Events/WhatsApp Image 2026-10-13 at 10.19.42 PM (1).jpeg',
      speaker: {
        label: 'GUEST SPEAKER',
        name: 'Anurag S',
        desig: 'Assistant Professor, Mount Zion College of Engineering · NITK Alumnus'
      },
      desc: 'Ever wondered how rockets generate millions of pounds of thrust to break free from Earth\'s gravitational pull? Join us for an engaging masterclass covering Newton\'s third law, chemical rocket propulsion, solid vs. liquid vs. cryogenic propellant cycles, de Laval nozzle expansion, and launch vehicle staging.',
      extra: [
        'Thermodynamics of combustion chambers and supersonic exhaust expansion',
        'Specific impulse (Isp), mass ratio, and Tsiolkovsky rocket equation fundamentals',
        'Q&A session on aerospace career pathways and rocketry research'
      ],
      queries: [
        { name: 'Jonadhan O Abraham', phone: '+91 73066 45286' },
        { name: 'Sana B Salam', phone: '+91 94465 03823' }
      ],
      link: 'https://forms.gle/VXgj5pnN1nVyNTCVA',
      ig: 'https://www.instagram.com/p/DdWSa0pzm9u/?stkn=MnBrZmI2bWV1Z2Nj'
    },
    'pre-4': {
      id: 'pre-4',
      category: 'PRE-EVENT 04',
      type: 'Online Competition',
      title: 'Cosmic Commentary: A Cosmic Image Captioning Competition',
      assoc: 'In association with Vyom Space Club, CEP',
      quote: 'Same Universe. Different Perspectives. Think cosmic. Caption creatively. Make us laugh.',
      date: '21 September 2026',
      time: '8:00 PM IST',
      mode: 'Online (Google Forms Submission)',
      fee: '₹15 per entry',
      cert: 'Prize Pool: ₹300 + Winner Certificates',
      ktu: false,
      poster: 'Posters/Pre-Events/WhatsApp Image 2026-10-13 at 10.19.42 PM (2).jpeg',
      speaker: null,
      desc: 'Get ready to see deep space through a witty, creative lens! Participants receive unexpected and fascinating space photographs (astronaut bloopers, cosmic illusions, telescope artifacts) and compete to craft the funniest, most original, and witty caption.',
      extra: [
        'Individual participation — submit your creative entry online',
        'Judged on humour, astronomical wit, originality, and creative relevance',
        'Top submissions featured across NOVA 5.0 and partner club media channels'
      ],
      queries: [
        { name: 'Anaan Shaji', phone: '+91 96338 21241' },
        { name: 'Anamika V S', phone: '+91 82816 10358' }
      ],
      link: 'https://forms.gle/gwpaYS9AX6xbyhXD8',
      ig: 'https://www.instagram.com/p/DdY3OCPzHWc/?stkn=N282amk2dHBudXlw'
    },
    'pre-5': {
      id: 'pre-5',
      category: 'PRE-EVENT 05',
      type: 'Online Lecture',
      title: 'Understanding Stellar Formation',
      assoc: 'In association with Celestials, IIST',
      quote: 'Every star has a story that begins in the vastness of space.',
      date: '23 September 2026',
      time: '8:00 PM IST',
      mode: 'Online Academic Lecture',
      fee: '₹10',
      cert: 'Official Certificate Provided',
      ktu: false,
      poster: 'Posters/Pre-Events/WhatsApp Image 2026-10-13 at 10.19.43 PM.jpeg',
      speaker: {
        label: 'GUEST PROFESSOR',
        name: 'Dr. D. Jagadheep',
        desig: 'Professor, Indian Institute of Space Science and Technology (IIST), Thiruvananthapuram'
      },
      desc: 'Delve into the physics of how stars ignite from turbulent giant molecular clouds in interstellar space. Professor Jagadheep from IIST unpacks gravitational Jeans instability, protostellar accretion discs, Herbig-Haro jets, nuclear fusion ignition, and the Hertzsprung-Russell life track of diverse stellar masses.',
      extra: [
        'Authoritative academic insights from India\'s premier space institute (IIST)',
        'Spectroscopic evidence, infrared telescope observations, and stellar astrophysics',
        'Certificates provided to all verified attendees'
      ],
      queries: [
        { name: 'Ranvir Singh', phone: '+91 77809 16230' },
        { name: 'Kaarthick L Rajakumar', phone: '+91 95664 26689' }
      ],
      link: 'https://forms.gle/SdJtni8yeHFkGmWV9',
      ig: 'https://www.instagram.com/p/DdeBtMaTf_0/?stkn=MXY5eHRhYm0zb2J0Zw=='
    },
    'pre-6': {
      id: 'pre-6',
      category: 'PRE-EVENT 06',
      type: 'Team Ideathon',
      title: 'Astrothon — Ideas Beyond Infinity',
      assoc: 'In association with AstroCET, CET',
      quote: 'Great ideas are the first step towards shaping the future of space exploration.',
      date: '02 October 2026',
      time: 'Full Day Event Submission',
      mode: 'Online Team Ideathon & Presentation',
      fee: '₹60 per team (3 Members)',
      cert: 'Prize Pool: ₹600 + Winner Certificates',
      ktu: false,
      poster: 'Posters/Pre-Events/WhatsApp Image 2026-10-13 at 10.19.43 PM (1).jpeg',
      speaker: null,
      desc: 'Ready to engineer visionary solutions for humanity’s next frontier? Teams of 3 choose from three pressing mission challenges and formulate creative, practical, and sustainable solutions utilizing AI/ML, simulation, software, or hardware architectures.',
      extra: [
        'Challenge 1: Zero Waste Space (orbital debris cleanup & closed-loop life support)',
        'Challenge 2: Interplanetary Space Cargo Transportation (propulsion & logistics)',
        'Challenge 3: Space Farming (hydroponics, lunar/Martian regolith agriculture)',
        'Key Deadlines: Sep 25 (Abstract submission begins), Sep 28 (PPT submission window)',
        'Working hardware prototype not mandatory — pure innovation & feasibility matter!'
      ],
      queries: [
        { name: 'Euwan', phone: '+91 62356 64564' },
        { name: 'Ananthakrishna', phone: '+91 89210 84670' }
      ],
      link: 'https://forms.gle/nJcYK5SjzcBCQfas8',
      ig: 'https://www.instagram.com/p/DdioA6TCJkf/?img_index=1&stkn=MWkzaHEyc25mN3RyMg=='
    },
    'pre-7': {
      id: 'pre-7',
      category: 'PRE-EVENT 07',
      type: 'Talk Session',
      title: 'Satellite Remote Sensing',
      assoc: 'In association with Calypso, GCEK',
      quote: 'From pixels to possibilities — unlock the power of satellite data to understand our changing world.',
      date: '28 September 2026',
      time: '8:00 PM IST',
      mode: 'Online Talk Session',
      fee: 'Free Registration',
      cert: 'Provided for All Attendees',
      ktu: false,
      poster: 'Posters/Pre-Events/WhatsApp Image 2026-10-13 at 10.19.43 PM (2).jpeg',
      speaker: {
        label: 'INDUSTRY EXPERT',
        name: 'Lekshmi S',
        desig: 'Remote Sensing Associate, Zeta Space'
      },
      desc: 'Ever wondered how raw multispectral satellite sensor data is transformed into high-impact planetary intelligence? Discover the foundational principles of optical, infrared, and synthetic aperture radar (SAR) remote sensing, and how earth observation data drives climate research, disaster management, and urban modeling.',
      extra: [
        'Real-world case studies in space data processing from Zeta Space',
        'Sensor bands, NDVI vegetation indexing, and geospatial pipeline architecture',
        'Certificates provided to all attendees'
      ],
      queries: [
        { name: 'Abhina E', phone: '+91 91881 69402' },
        { name: 'Jeyas C', phone: '+91 82899 09017' }
      ],
      link: 'https://forms.gle/SzKELfv6HzkeK8is8',
      ig: 'https://www.instagram.com/p/DdtrNGwIB0b/?stkn=bDZ4ejN0YWRrYm1s'
    },
    'pre-8': {
      id: 'pre-8',
      category: 'PRE-EVENT 08',
      type: 'Online Talk Session',
      title: 'Space Environment and Materials for Spacecraft',
      assoc: 'In association with NEXORA, LBSITW',
      quote: 'Space does not forgive weakness; every material that travels beyond Earth must be built to endure.',
      date: '30 September 2026',
      time: '8:00 PM IST',
      mode: 'Online Talk Session',
      fee: '₹10',
      cert: 'Official Certificate Provided',
      ktu: false,
      poster: 'Posters/Pre-Events/WhatsApp Image 2026-10-13 at 10.19.44 PM.jpeg',
      speaker: {
        label: 'AEROSPACE PROFESSOR',
        name: 'Dr. P. Chakravarthy',
        desig: 'Professor, Department of Aerospace Engineering, IIST'
      },
      desc: 'What does it take to manufacture a spacecraft skin that withstands atomic oxygen erosion, ionizing solar flare radiation, micrometeoroid impacts, and thermal shocks from -150°C in shadow to +150°C in direct sunlight? Learn about advanced carbon-carbon composites, nickel superalloys, and thermal protection systems from IIST Professor Chakravarthy.',
      extra: [
        'Material behavior under extreme ultra-high vacuum outgassing conditions',
        'Aerospace engineering insights into re-entry heat shields and ablative tiles',
        'Certificates awarded to all verified participants'
      ],
      queries: [
        { name: 'Afra B', phone: '+91 75589 48838' },
        { name: 'Gopika S Nair', phone: '+91 90615 23526' }
      ],
      link: 'https://forms.gle/qqsqz4HTdce4mjxA7',
      ig: 'https://www.instagram.com/p/Dd1gXBwzk9s/?stkn=NzVjbWdheWYxeGdj'
    },
    'main-1': {
      id: 'main-1',
      category: 'MAIN EVENT — ONLINE',
      type: 'Online Workshop',
      title: 'Introduction to Rocketry: Design, Fabrication, Avionics',
      assoc: 'In association with Institution’s Innovation Council (IIC)',
      quote: 'The only way of discovering the limits of the possible is to venture a little way past them into the impossible. — Arthur C. Clarke',
      date: '17 October 2026',
      time: '7:30 PM IST',
      mode: 'Online Interactive Workshop',
      fee: '₹30',
      cert: 'KTU Activity Points + Certificate for All',
      ktu: true,
      poster: 'Posters/Main Events/WhatsApp Image 2026-10-13 at 10.21.44 PM.jpeg',
      speaker: {
        label: 'WORKSHOP PRESENTED BY',
        name: 'Rocketry Engineering Team',
        desig: 'Astral Space Club, Government Engineering College Thrissur (GECT)'
      },
      desc: 'An intensive, hands-on workshop covering the three foundational pillars of modern rocketry: 1. Aerodynamic design and stability simulation using OpenRocket; 2. Structural fabrication, lightweight composites, motor casings, and fin alignment; 3. Flight avionics, altimeter telemetry, sensor logging, and dual-deployment parachute ejection systems.',
      extra: [
        'Eligible for KTU Activity Points for participating engineering students',
        'Live demonstration of flight trajectory calculations and apogee prediction',
        'Comprehensive rocketry resource kit & guidance for student rocketry teams'
      ],
      queries: [
        { name: 'Cieniya', phone: '+91 85940 93808' },
        { name: 'Amal', phone: '+91 82898 82877' }
      ],
      link: 'https://forms.gle/7GyeoLo9LEGg8M9X7',
      ig: 'https://www.instagram.com/p/DeT-zZPzSwY/?obrf=aGpwOGRlanJjYjFq'
    },
    'main-2': {
      id: 'main-2',
      category: 'MAIN EVENT — ONLINE',
      type: 'Online Workshop',
      title: 'Cosmic Navigator: Journey Using Celestia',
      assoc: 'In association with Institution’s Innovation Council (IIC)',
      quote: 'Somewhere, something incredible is waiting to be known. — Carl Sagan',
      date: '18 October 2026',
      time: '7:30 PM IST',
      mode: 'Online Interactive Workshop',
      fee: '₹20',
      cert: 'KTU Activity Points + Certificate for All',
      ktu: true,
      poster: 'Posters/Main Events/WhatsApp Image 2026-10-13 at 10.21.43 PM.jpeg',
      speaker: {
        label: 'ASTRONOMY EDUCATOR',
        name: 'Jayakrishnan K',
        desig: 'Joint Secretary, Breakthrough Science Society, Thiruvananthapuram Chapter'
      },
      desc: 'Ever wanted to chart paths through interstellar space, orbit Jupiter’s moons, and observe solar eclipses from alien worlds? Learn to command Celestia, an open-source real-time 3D space simulator used by astronomers, educators, and space agencies worldwide to model planetary orbits, spacecraft trajectories, and deep sky catalogues.',
      extra: [
        'Eligible for KTU Activity Points for participating engineering students',
        'Learn how to track real spacecraft trajectories (Cassini, New Horizons, Chandrayaan)',
        'Installation files and astronomy scripts provided to all attendees'
      ],
      queries: [
        { name: 'Eldho Kuriakose', phone: '+91 94471 48243' },
        { name: 'Adithya P S', phone: '+91 89219 06564' }
      ],
      link: 'https://bit.ly/Nova5-o-CosmicNavigator',
      ig: 'https://www.instagram.com/p/DeWjIQTIfZg/?dlrf=MTkyY296aWkydHU4bQ=='
    }
  };

  // Render Combined Pre-Events (Posters + Details)
  const preGrid = document.getElementById('pre-events-grid');
  if (preGrid) {
    preGrid.innerHTML = '';
    const preIds = ['pre-1', 'pre-2', 'pre-3', 'pre-4', 'pre-5', 'pre-6', 'pre-7', 'pre-8'];
    preIds.forEach((id) => {
      const ev = EVENTS_DATABASE[id];
      if (!ev) return;
      const card = document.createElement('div');
      card.className = 'pre-event-card';
      card.setAttribute('data-event-id', ev.id);
      card.innerHTML = `
        <div class="pre-event-poster-wrap" data-event-id="${ev.id}" role="button" tabindex="0" aria-label="View ${ev.title} details">
          <img src="${ev.poster}" alt="${ev.title} poster" class="pre-event-poster" loading="lazy" />
          <div class="pre-event-poster-badge">
            <span class="mono-label">${ev.type}</span>
          </div>
        </div>
        <div class="pre-event-body">
          <div class="pre-event-date-row">
            <span class="mono-label accent">${ev.date}</span>
            <span class="pre-event-fee-badge">${ev.fee}</span>
          </div>
          <h3 class="pre-event-title" data-event-id="${ev.id}" role="button" tabindex="0">${ev.title}</h3>
          <p class="pre-event-assoc-line mono-label dim">${ev.assoc}</p>
          <div class="pre-event-actions">
            <button type="button" class="btn-more-details" data-event-id="${ev.id}" aria-label="Open full details for ${ev.title}">
              <span>More Details</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17l9.2-9.2M17 17V8H8"/></svg>
            </button>
            <a href="${ev.link}" target="_blank" rel="noopener" class="pre-event-reg-btn">Register →</a>
          </div>
        </div>
      `;
      preGrid.appendChild(card);
    });
  }

  // ──── EVENT DETAILS MODAL ENGINE ────
  const eventModal = document.getElementById('event-modal');
  const eventModalCard = document.getElementById('event-modal-card');
  const eventModalClose = document.getElementById('event-modal-close');

  function openEventModal(eventId) {
    const data = EVENTS_DATABASE[eventId];
    if (!data || !eventModal) return;

    // Poster Column setup
    const posterCol = document.getElementById('modal-poster-col');
    const posterImg = document.getElementById('modal-poster-img');
    const posterZoom = document.getElementById('modal-poster-zoom');
    const posterWrap = document.getElementById('modal-poster-wrap');
    const posterActions = document.getElementById('modal-poster-actions');

    const oldBadge = posterCol.querySelector('.modal-no-poster-badge');
    if (oldBadge) oldBadge.remove();

    if (data.poster) {
      posterImg.src = data.poster;
      posterImg.alt = data.title + ' official poster';
      posterZoom.href = data.poster;
      posterWrap.style.display = 'flex';
      posterActions.style.display = 'block';
    } else {
      posterWrap.style.display = 'none';
      posterActions.style.display = 'none';
      const badge = document.createElement('div');
      badge.className = 'modal-no-poster-badge';
      badge.innerHTML = `
        <div class="modal-no-poster-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
        </div>
        <h4 class="modal-no-poster-title">NOVA 5.0</h4>
        <span class="modal-no-poster-sub mono-label">OFFICIAL INAUGURAL CEREMONY</span>
        <div style="margin-top:16px; padding:12px 16px; background:rgba(25,227,255,0.08); border-radius:8px; border:1px solid rgba(25,227,255,0.25);">
          <span style="font-size:12px; color:#FFFFFF; font-weight:700; display:block;">KEYNOTE TALK SESSION</span>
          <span style="font-size:11px; color:var(--accent);">Dr. Tirtha Pratim Das · ISRO HQ</span>
        </div>
      `;
      posterCol.prepend(badge);
    }

    // Header Badges & Titles
    document.getElementById('modal-category').textContent = data.category;
    document.getElementById('modal-mode').textContent = data.mode.toUpperCase();
    
    const ktuBadge = document.getElementById('modal-ktu-badge');
    if (data.ktu) {
      ktuBadge.style.display = 'inline-flex';
    } else {
      ktuBadge.style.display = 'none';
    }

    document.getElementById('modal-event-title').textContent = data.title;
    document.getElementById('modal-event-assoc').textContent = data.assoc;

    // Quote
    const quoteEl = document.getElementById('modal-event-quote');
    if (data.quote) {
      quoteEl.textContent = `“${data.quote}”`;
      quoteEl.style.display = 'block';
    } else {
      quoteEl.style.display = 'none';
    }

    // Quick Facts
    document.getElementById('modal-date').textContent = data.date;
    document.getElementById('modal-time').textContent = data.time;
    document.getElementById('modal-fee').textContent = data.fee;
    document.getElementById('modal-cert').textContent = data.cert || 'Provided';

    // Speaker Section
    const speakerCard = document.getElementById('modal-speaker-card');
    if (data.speaker) {
      document.getElementById('modal-speaker-lbl').textContent = data.speaker.label;
      document.getElementById('modal-speaker-name').textContent = data.speaker.name;
      document.getElementById('modal-speaker-desig').textContent = data.speaker.desig;
      speakerCard.style.display = 'flex';
    } else {
      speakerCard.style.display = 'none';
    }

    // Description & Extra Bullet Points
    document.getElementById('modal-description').textContent = data.desc;
    const extraContainer = document.getElementById('modal-extra-details');
    extraContainer.innerHTML = '';
    if (data.extra && data.extra.length) {
      data.extra.forEach(item => {
        const div = document.createElement('div');
        div.className = 'modal-extra-item';
        div.textContent = `• ${item}`;
        extraContainer.appendChild(div);
      });
      extraContainer.style.display = 'flex';
    } else {
      extraContainer.style.display = 'none';
    }

    // Coordinators & Queries
    const contactsList = document.getElementById('modal-contacts-list');
    contactsList.innerHTML = '';
    if (data.queries && data.queries.length) {
      data.queries.forEach(q => {
        const cleanPhone = q.phone.replace(/[^0-9+]/g, '');
        const a = document.createElement('a');
        a.href = `tel:${cleanPhone}`;
        a.className = 'modal-contact-chip';
        a.setAttribute('aria-label', `Call coordinator ${q.name} at ${q.phone}`);
        a.innerHTML = `<span class="contact-icon" style="display:inline-flex; align-items:center; color:var(--accent); margin-right:4px;" aria-hidden="true"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span><span><strong>${q.name}:</strong> ${q.phone}</span>`;
        contactsList.appendChild(a);
      });
      document.getElementById('modal-contact-section').style.display = 'flex';
    } else {
      document.getElementById('modal-contact-section').style.display = 'none';
    }

    // Action Buttons
    document.getElementById('modal-register-btn').href = data.link;
    const igBtn = document.getElementById('modal-ig-btn');
    if (data.ig) {
      igBtn.href = data.ig;
      igBtn.style.display = 'inline-flex';
    } else {
      igBtn.style.display = 'none';
    }

    // Fade In Effect Opening
    eventModal.classList.remove('closing');
    eventModal.classList.add('open');
    eventModal.removeAttribute('aria-hidden');
    if (eventModalCard) {
      eventModalCard.scrollTop = 0;
      eventModalCard.focus();
    }
    if (window.lenis) window.lenis.stop();
  }

  function closeEventModal() {
    if (!eventModal || !eventModal.classList.contains('open')) return;
    // Fade Out Effect Closing
    eventModal.classList.add('closing');
    setTimeout(() => {
      eventModal.classList.remove('open', 'closing');
      eventModal.setAttribute('aria-hidden', 'true');
      if (window.lenis) window.lenis.start();
    }, 280);
  }

  if (eventModalClose) {
    eventModalClose.addEventListener('click', closeEventModal);
  }

  if (eventModal) {
    eventModal.addEventListener('click', (e) => {
      if (e.target === eventModal) {
        closeEventModal();
      }
    });

    // Forward backdrop wheel scrolling into the card
    eventModal.addEventListener('wheel', (e) => {
      if (e.target === eventModal && eventModalCard) {
        eventModalCard.scrollTop += e.deltaY;
      }
    }, { passive: true });
  }

  if (eventModalCard) {
    // Stop propagation so Lenis does not intercept card scrolling
    eventModalCard.addEventListener('wheel', (e) => {
      e.stopPropagation();
    }, { passive: true });

    eventModalCard.addEventListener('touchmove', (e) => {
      e.stopPropagation();
    }, { passive: true });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && eventModal && eventModal.classList.contains('open')) {
      closeEventModal();
    }
  });

  // Event Delegation for Opening Modal Cards
  document.addEventListener('click', (e) => {
    // Prevent modal triggering if user clicked an external registration link
    if (e.target.closest('a[href*="forms.gle"]') || e.target.closest('a[href*="tinyurl.com"]') || e.target.closest('a[href*="bit.ly"]')) {
      return;
    }

    const trigger = e.target.closest('[data-event-id]');
    if (trigger) {
      const eventId = trigger.getAttribute('data-event-id');
      if (eventId && EVENTS_DATABASE[eventId]) {
        e.preventDefault();
        openEventModal(eventId);
      }
    }
  });

  // Deep-link direct opening e.g. index.html?event=pre-1 or ?event=inauguration or ?scroll=events
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const eventParam = urlParams.get('event');
    if (eventParam && EVENTS_DATABASE[eventParam]) {
      setTimeout(() => openEventModal(eventParam), 400);
    }
    if (urlParams.get('scroll') === 'events') {
      setTimeout(() => {
        if (window.lenis) {
          window.lenis.scrollTo('#events', { immediate: true });
        } else {
          const el = document.getElementById('events');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }, 400);
    }
  } catch (err) {}

  /* ─────────────────────────────────────────────
     10.  LOGO TILES  — handled via pure CSS (.logo-tile:hover .logo-img)
     ───────────────────────────────────────────── */

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
      navigator.clipboard.writeText('istescrit@rit.ac.in').then(() => {
        if (copyToast) {
          copyToast.classList.add('show');
          setTimeout(() => copyToast.classList.remove('show'), 2000);
        }
      }).catch(() => {
        window.location.href = 'mailto:istescrit@rit.ac.in';
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
     15.  FOOTER — 3D block wordmark + tilt + moon rise + back to top
     ───────────────────────────────────────────── */
  const blockWrap = document.getElementById('footer-3d-block-wrap');
  if (blockWrap) {
    const isMobile = window.innerWidth <= 768;
    const targetRotate = isMobile ? 8 : 14;
    gsap.fromTo(
      blockWrap,
      { y: 30, opacity: 0, rotateX: 20 },
      {
        y: 0,
        opacity: 1,
        rotateX: targetRotate,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.footer',
          start: 'top 90%',
          once: true,
        },
      }
    );
  }

  // Interactive 3D mouse parallax on footer hover — throttled with requestAnimationFrame
  const footerEl = document.getElementById('footer');
  if (footerEl && blockWrap && window.matchMedia('(pointer: fine)').matches) {
    let footerTicking = false;
    footerEl.addEventListener('mousemove', (e) => {
      if (!footerTicking) {
        footerTicking = true;
        const clientX = e.clientX;
        const clientY = e.clientY;
        requestAnimationFrame(() => {
          const rect = footerEl.getBoundingClientRect();
          const nx = (clientX - rect.left) / rect.width - 0.5;
          const ny = (clientY - rect.top) / rect.height - 0.5;
          gsap.to(blockWrap, {
            rotateX: 14 - ny * 8,
            rotateY: nx * 8,
            xPercent: nx * 1.5,
            duration: 0.5,
            ease: 'power1.out',
            overwrite: 'auto',
          });
          footerTicking = false;
        });
      }
    }, { passive: true });
    footerEl.addEventListener('mouseleave', () => {
      gsap.to(blockWrap, {
        rotateX: 14,
        rotateY: 0,
        xPercent: 0,
        duration: 0.9,
        ease: 'power2.out',
        overwrite: 'auto',
      });
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

  // Back to Top smooth scroll
  const backToTopBtn = document.getElementById('footer-back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.lenis) {
        window.lenis.scrollTo(0, { duration: 1.4 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
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
