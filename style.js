/**
 * script.js — Fully responsive version for $JESTER site
 * Handles:
 *  - SVG {x} placement across all devices (mobile, tablet, desktop)
 *  - Fixed header + adaptive hamburger menu
 */

(function () {
  'use strict';

  // === SVG constants ===
  const SVG_ID = 'svg-root';
  const PATH_TOP_ID = 'curve-top';
  const PATH_BOTTOM_ID = 'curve-bottom';
  const ON_SEL = '.on';
  const AFTER_SEL = '.after';
  const IMG_ID = 'x-img';

  const REF_WIDTH = 860;
  const REF_HEIGHT = 300;

  // Tunables (adaptive)
  let PADDING = 8;
  let MIN_SCALE = 0.3;
  let PATH_SAMPLES = 360;
  let FINE_TUNE_Y = -6;
  const ROTATION_OFFSET = 0;

  /* === Utility: Wait until fonts are ready === */
  function whenFontsReady(cb) {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(cb).catch(cb);
    } else setTimeout(cb, 250);
  }

  /* === Rebuild SVG paths (always same curve across devices) === */
  function recomputePathsFixed() {
    const svg = document.getElementById(SVG_ID);
    if (!svg) return;
    const topPath = svg.querySelector('#' + PATH_TOP_ID);
    const bottomPath = svg.querySelector('#' + PATH_BOTTOM_ID);
    if (!topPath || !bottomPath) return;

    const w = REF_WIDTH;
    const h = REF_HEIGHT;
    const margin = Math.max(30, Math.round(w * 0.05));
    const topY = Math.max(52, Math.round(h * 0.52));
    const topCtrlY = Math.round(h * 0.08) - 80;
    const bottomY = Math.min(h - 30, Math.round(h * 0.78));
    const bottomCtrlY = Math.round(h * 0.42);

    topPath.setAttribute('d', `M ${margin} ${topY} Q ${w / 2} ${topCtrlY} ${w - margin} ${topY}`);
    bottomPath.setAttribute('d', `M ${margin} ${bottomY} Q ${w / 2} ${bottomCtrlY} ${w - margin} ${bottomY}`);
  }

  /* === Adjust for screen size (different mobile widths) === */
  function adaptTunables() {
    const w = Math.max(320, window.innerWidth || document.documentElement.clientWidth);
    if (w <= 360) {
      PADDING = 5; MIN_SCALE = 0.22; PATH_SAMPLES = 160; FINE_TUNE_Y = -8;
    } else if (w <= 420) {
      PADDING = 6; MIN_SCALE = 0.24; PATH_SAMPLES = 200; FINE_TUNE_Y = -7;
    } else if (w <= 768) {
      PADDING = 7; MIN_SCALE = 0.26; PATH_SAMPLES = 260; FINE_TUNE_Y = -6;
    } else {
      PADDING = 8; MIN_SCALE = 0.3; PATH_SAMPLES = 360; FINE_TUNE_Y = -5;
    }
  }

  /* === Place and rotate the {x} icon === */
  function placeAndRotateFixed() {
    const svg = document.getElementById(SVG_ID);
    if (!svg) return;
    const path = svg.querySelector('#' + PATH_BOTTOM_ID);
    const onT = svg.querySelector(ON_SEL);
    const afterT = svg.querySelector(AFTER_SEL);
    const img = svg.querySelector('#' + IMG_ID);
    if (!path || !onT || !afterT || !img) return;

    try {
      const onBox = onT.getBBox();
      const afterBox = afterT.getBBox();
      const onWidth = onT.getComputedTextLength ? onT.getComputedTextLength() : onBox.width;

      const onEndX = onBox.x + onWidth + PADDING;
      const afterStartX = afterBox.x - PADDING;
      let available = afterStartX - onEndX;
      if (available < 6) available = 6;

      const centerX = (onEndX + afterStartX) / 2;
      const totalLen = path.getTotalLength();
      const step = totalLen / PATH_SAMPLES;

      let best = { d: Infinity, pt: path.getPointAtLength(0), t: 0 };
      for (let i = 0; i <= PATH_SAMPLES; i++) {
        const t = i * step;
        const pt = path.getPointAtLength(t);
        const diff = Math.abs(pt.x - centerX);
        if (diff < best.d) best = { d: diff, pt, t };
      }

      const target = best.pt;
      const delta = Math.max(0.5, totalLen / PATH_SAMPLES);
      const p1 = path.getPointAtLength(Math.max(0, best.t - delta));
      const p2 = path.getPointAtLength(Math.min(totalLen, best.t + delta));
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;

      let imgW = Number(img.getAttribute('width')) || img.getBBox().width;
      let imgH = Number(img.getAttribute('height')) || img.getBBox().height;
      if (imgW > available) {
        const scale = Math.max(MIN_SCALE, (available - 4) / imgW);
        imgW = Math.max(8, imgW * scale);
        imgH = Math.max(8, imgH * scale);
        img.setAttribute('width', imgW);
        img.setAttribute('height', imgH);
      }

      const imgX = Math.min(Math.max(target.x - imgW / 2, onEndX + 2), afterStartX - imgW - 2);
      const imgY = target.y - imgH / 2 + FINE_TUNE_Y;

      img.setAttribute('x', imgX);
      img.setAttribute('y', imgY);
      img.setAttribute('transform', `rotate(${angleDeg + ROTATION_OFFSET}, ${imgX + imgW / 2}, ${imgY + imgH / 2})`);
    } catch (err) {
      console.warn('placeAndRotateFixed error:', err);
    }
  }

  /* === Header auto height === */
  function updateHeaderHeight() {
    const nav = document.querySelector('.navbar');
    if (!nav) return;
    const h = Math.ceil(nav.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--header-height', h + 'px');
  }

  /* === Run recalculations === */
  function fullRun() {
    adaptTunables();
    recomputePathsFixed();
    placeAndRotateFixed();
    updateHeaderHeight();
    setTimeout(placeAndRotateFixed, 100);
    setTimeout(placeAndRotateFixed, 250);
  }

  /* === Event Bindings === */
  whenFontsReady(() => {
    fullRun();
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fullRun, 160);
    });
    window.addEventListener('orientationchange', () => setTimeout(fullRun, 180));
  });

  /* === Hamburger menu === */
  (function menuToggleHandler() {
    const toggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (!toggle || !mobileMenu) return;

    function openMenu() {
      toggle.classList.add('active');
      mobileMenu.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
      setTimeout(fullRun, 250);
    }

    function closeMenu() {
      toggle.classList.remove('active');
      mobileMenu.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      setTimeout(fullRun, 150);
    }

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (toggle.classList.contains('active')) closeMenu();
      else openMenu();
    });

    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !mobileMenu.contains(e.target)) closeMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  })();

  // Manual tweak API (optional)
  window.JesterControl = {
    recalc: fullRun,
    adjustY: (y) => { FINE_TUNE_Y = y; fullRun(); },
  };

})();
