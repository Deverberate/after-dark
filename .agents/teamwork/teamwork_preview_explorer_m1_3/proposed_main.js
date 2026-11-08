/* ==========================================================================
   M4 AFTER DARK — behaviour
   Navigation, motion preference, reveal, workload fit, die-map canvas, print
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = () => reduceQuery.matches;

  /* ----------------------------------------------------------------------
     Motion preference (global control for auto-playing loops)
  ---------------------------------------------------------------------- */
  const motionToggle = document.getElementById('motion-toggle');
  const motionLabel = motionToggle
    ? motionToggle.querySelector('.motion-toggle__label')
    : null;

  let storedMotion = null;

  try {
    storedMotion = window.localStorage.getItem('after-dark-motion');
  } catch {
    storedMotion = null;
  }

  let motionEnabled =
    storedMotion === 'on' || storedMotion === 'off'
      ? storedMotion === 'on'
      : !prefersReducedMotion();

  const applyMotionState = () => {
    root.classList.toggle('motion-off', !motionEnabled);
    root.classList.toggle('motion-forced', motionEnabled && prefersReducedMotion());

    if (motionToggle) {
      motionToggle.setAttribute('aria-pressed', String(motionEnabled));
      if (motionLabel) {
        motionLabel.textContent = motionEnabled ? 'Motion On' : 'Motion Off';
      }
    }
  };

  const setMotion = (enabled, { persist = true } = {}) => {
    motionEnabled = enabled;

    if (persist) {
      try {
        window.localStorage.setItem('after-dark-motion', enabled ? 'on' : 'off');
      } catch {
        // Storage can be unavailable in private mode; the toggle still works.
      }
    }

    applyMotionState();

    window.dispatchEvent(
      new CustomEvent('motionchange', { detail: { enabled } })
    );
  };

  if (motionToggle) {
    motionToggle.addEventListener('click', () => setMotion(!motionEnabled));
  }

  applyMotionState();

  /* ----------------------------------------------------------------------
     Local time (New York)
  ---------------------------------------------------------------------- */
  const clocks = document.querySelectorAll('[data-clock]');

  if (clocks.length) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/New_York',
    });

    const tick = () => {
      const now = new Date();
      const label = formatter.format(now);
      clocks.forEach((node) => {
        node.textContent = label;
        if (node.tagName === 'TIME') node.dateTime = now.toISOString();
      });
    };

    tick();
    window.setInterval(tick, 30000);
  }

  /* ----------------------------------------------------------------------
     Header state + reading progress
  ---------------------------------------------------------------------- */
  const header = document.querySelector('.site-header');
  const progressBar = document.getElementById('progress-bar');
  let scrollQueued = false;

  const onScroll = () => {
    if (scrollQueued) return;
    scrollQueued = true;

    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (header) header.classList.toggle('is-scrolled', y > 24);

      if (progressBar) {
        const max = root.scrollHeight - window.innerHeight;
        const value = max > 0 ? Math.min(y / max, 1) : 0;
        progressBar.style.transform = `scaleX(${value})`;
      }

      scrollQueued = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ----------------------------------------------------------------------
     Scroll reveal
  ---------------------------------------------------------------------- */
  const revealNodes = document.querySelectorAll('.reveal');

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    revealNodes.forEach((node) => node.classList.add('is-in'));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );

    revealNodes.forEach((node) => observer.observe(node));
  }

  /* ----------------------------------------------------------------------
     Mobile navigation
  ---------------------------------------------------------------------- */
  const menuToggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('site-nav');
  const brand = document.querySelector('.brand');
  const main = document.getElementById('main');
  const footer = document.querySelector('.site-footer');
  let menuOpen = false;

  const menuMedia = window.matchMedia('(min-width: 981px)');

  const focusableInNav = () => {
    if (!nav) return [];
    return Array.from(nav.querySelectorAll('a[href]'));
  };

  const onMenuKeydown = (event) => {
    if (!menuOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusables = [...focusableInNav(), menuToggle].filter(Boolean);
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  function openMenu() {
    if (!nav || !menuToggle) return;
    menuOpen = true;
    root.classList.add('nav-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    if (brand) brand.inert = true;
    if (main) main.inert = true;
    if (footer) footer.inert = true;
    document.addEventListener('keydown', onMenuKeydown);
    const firstLink = focusableInNav()[0];
    if (firstLink) requestAnimationFrame(() => firstLink.focus());
  }

  function closeMenu({ restoreFocus = true } = {}) {
    if (!nav || !menuToggle) return;
    menuOpen = false;
    root.classList.remove('nav-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    if (brand) brand.inert = false;
    if (main) main.inert = false;
    if (footer) footer.inert = false;
    document.removeEventListener('keydown', onMenuKeydown);
    if (restoreFocus) menuToggle.focus();
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      if (menuOpen) closeMenu();
      else openMenu();
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (!menuOpen) return;

        const href = link.getAttribute('href') || '';
        closeMenu({ restoreFocus: false });

        // Hand focus to the destination heading so keyboard focus is never lost
        // on the now-hidden menu.
        if (href.startsWith('#') && href.length > 1) {
          window.setTimeout(() => {
            const target = document.querySelector(href);
            const heading = target ? target.querySelector('h1, h2') : null;
            if (!heading) return;
            heading.setAttribute('tabindex', '-1');
            heading.focus({ preventScroll: true });
          }, 0);
        }
      });
    });

    const onMenuMediaChange = (event) => {
      if (event.matches && menuOpen) closeMenu({ restoreFocus: false });
    };

    if (menuMedia.addEventListener) menuMedia.addEventListener('change', onMenuMediaChange);
    else menuMedia.addListener(onMenuMediaChange);
  }

  /* ----------------------------------------------------------------------
     Hero pointer glow (fine pointers only)
  ---------------------------------------------------------------------- */
  const hero = document.querySelector('.hero');

  if (hero && window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion()) {
    let mx = 74;
    let my = 24;
    let queued = false;
    let heroRect = hero.getBoundingClientRect();

    const updateHeroRect = () => {
      heroRect = hero.getBoundingClientRect();
    };

    window.addEventListener('resize', updateHeroRect, { passive: true });
    window.addEventListener('scroll', updateHeroRect, { passive: true });
    hero.addEventListener('pointerenter', updateHeroRect, { passive: true });

    hero.addEventListener('pointermove', (event) => {
      if (!motionEnabled) return;

      const width = heroRect.width || 1;
      const height = heroRect.height || 1;
      mx = Math.max(0, Math.min(100, ((event.clientX - heroRect.left) / width) * 100));
      my = Math.max(0, Math.min(100, ((event.clientY - heroRect.top) / height) * 100));

      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        hero.style.setProperty('--mx', `${mx}%`);
        hero.style.setProperty('--my', `${my}%`);
        queued = false;
      });
    });
  }

  /* ----------------------------------------------------------------------
     Workload → configuration recommendation
  ---------------------------------------------------------------------- */
  const workloadInputs = Array.from(
    document.querySelectorAll('input[name="workload"]')
  );
  const fitName = document.getElementById('fit-name');
  const fitModel = document.getElementById('fit-model');
  const fitCopy = document.getElementById('fit-copy');

  const fits = {
    everyday: {
      name: 'M4',
      model: '14-inch MacBook Pro with M4',
      copy:
        'Ten CPU cores and ten GPU cores are plenty for writing, research, photo work, and a browser with too many tabs. The base machine is the quiet choice.',
    },
    professional: {
      name: 'M4 Pro',
      model: '14- or 16-inch MacBook Pro with M4 Pro',
      copy:
        'Up to 14 CPU cores, up to 20 GPU cores, and 273\u00A0GB/s of bandwidth give 4K multicam, large Xcode builds, 3D scenes, and local models room to breathe.',
    },
    extreme: {
      name: 'M4 Max',
      model: '16-inch MacBook Pro with M4 Max',
      copy:
        'Up to 16 CPU cores, up to 40 GPU cores, and 546\u00A0GB/s of unified memory bandwidth. Built for 8K, simulation, model training, and every heavy app open at once.',
    },
  };

  const updateFit = (value) => {
    const fit = fits[value];
    if (!fit) return;
    if (fitName) fitName.textContent = fit.name;
    if (fitModel) fitModel.textContent = fit.model;
    if (fitCopy) fitCopy.textContent = fit.copy;
  };

  const syncWorkloadToUrl = (value) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('workload', value);
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {
      window.history.replaceState(null, '', `?workload=${encodeURIComponent(value)}`);
    }
  };

  if (workloadInputs.length) {
    workloadInputs.forEach((input) => {
      input.addEventListener('change', () => {
        if (input.checked) {
          updateFit(input.value);
          syncWorkloadToUrl(input.value);
        }
      });
    });

    let initialWorkload = null;
    try {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get('workload');
      if (requested && Object.prototype.hasOwnProperty.call(fits, requested)) {
        initialWorkload = requested;
      }
    } catch {
      initialWorkload = null;
    }

    if (initialWorkload) {
      const targetInput = workloadInputs.find((input) => input.value === initialWorkload);
      if (targetInput) {
        workloadInputs.forEach((input) => {
          input.checked = input === targetInput;
        });
        updateFit(initialWorkload);
      }
    } else {
      const checked = workloadInputs.find((input) => input.checked);
      if (checked) updateFit(checked.value);
    }
  }

  /* ----------------------------------------------------------------------
     Stylized M4 Max die map
  ---------------------------------------------------------------------- */
  const canvas = document.getElementById('die-canvas');
  const dieToggle = document.getElementById('die-toggle');

  if (canvas && dieToggle && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const toggleLabel = dieToggle.querySelector('.die__toggle-label');
    const mono = '"Geist Mono", ui-monospace, monospace';

    let width = 0;
    let height = 0;
    let time = 3.2;
    let lastFrame = 0;
    let rafId = 0;
    let playing = motionEnabled;
    let inView = true;
    let pageVisible = !document.hidden;

    const line = (x1, y1, x2, y2, color, lw = 1) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = lw;
      ctx.stroke();
    };

    const label = (text, x, y, color = 'rgba(230,237,241,0.42)', size = 10) => {
      ctx.font = `${size}px ${mono}`;
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(text, x, y);
    };

    const pointOnPath = (points, progress) => {
      const lengths = [];
      let total = 0;

      for (let i = 1; i < points.length; i += 1) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        const length = Math.hypot(dx, dy);
        lengths.push(length);
        total += length;
      }

      let target = Math.max(0, Math.min(1, progress)) * total;

      for (let i = 0; i < lengths.length; i += 1) {
        if (target <= lengths[i] || i === lengths.length - 1) {
          const ratio = lengths[i] ? target / lengths[i] : 0;
          return {
            x: points[i].x + (points[i + 1].x - points[i].x) * ratio,
            y: points[i].y + (points[i + 1].y - points[i].y) * ratio,
          };
        }
        target -= lengths[i];
      }

      return points[points.length - 1];
    };

    const draw = (t) => {
      if (!width || !height) return;

      ctx.clearRect(0, 0, width, height);

      // Background
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, '#05090a');
      bg.addColorStop(0.55, '#040708');
      bg.addColorStop(1, '#070b0d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const blueGlow = ctx.createRadialGradient(
        width * 0.78,
        height * 0.12,
        0,
        width * 0.78,
        height * 0.12,
        width * 0.52
      );
      blueGlow.addColorStop(0, 'rgba(112,170,204,0.13)');
      blueGlow.addColorStop(1, 'rgba(112,170,204,0)');
      ctx.fillStyle = blueGlow;
      ctx.fillRect(0, 0, width, height);

      const redGlow = ctx.createRadialGradient(
        width * 0.74,
        height * 1.04,
        0,
        width * 0.74,
        height * 1.04,
        width * 0.44
      );
      redGlow.addColorStop(0, 'rgba(225,6,0,0.16)');
      redGlow.addColorStop(1, 'rgba(225,6,0,0)');
      ctx.fillStyle = redGlow;
      ctx.fillRect(0, 0, width, height);

      // Background grid
      const step = Math.max(28, width / 38);
      for (let x = step; x < width; x += step) {
        line(x, 0, x, height, 'rgba(230,237,241,0.035)');
      }
      for (let y = step; y < height; y += step) {
        line(0, y, width, y, 'rgba(230,237,241,0.035)');
      }

      // Moving scan line
      const scanY = (t * 26) % height;
      const scan = ctx.createLinearGradient(0, scanY - 24, 0, scanY + 24);
      scan.addColorStop(0, 'rgba(112,170,204,0)');
      scan.addColorStop(0.5, 'rgba(112,170,204,0.055)');
      scan.addColorStop(1, 'rgba(112,170,204,0)');
      ctx.fillStyle = scan;
      ctx.fillRect(0, scanY - 24, width, 48);

      // Die outline
      const die = {
        x: width * 0.055,
        y: height * 0.14,
        w: width * 0.89,
        h: height * 0.66,
      };

      ctx.fillStyle = 'rgba(9,14,16,0.92)';
      ctx.fillRect(die.x, die.y, die.w, die.h);
      ctx.strokeStyle = 'rgba(230,237,241,0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(die.x + 0.5, die.y + 0.5, die.w - 1, die.h - 1);
      ctx.strokeStyle = 'rgba(230,237,241,0.08)';
      ctx.strokeRect(die.x + 7.5, die.y + 7.5, die.w - 15, die.h - 15);

      // Die pins
      for (let x = die.x + 12; x < die.x + die.w - 12; x += 11) {
        const alpha = 0.1 + 0.04 * Math.sin(x * 0.08 + t * 1.2);
        line(x, die.y - 5, x, die.y - 2, `rgba(230,237,241,${alpha})`);
        line(x, die.y + die.h + 2, x, die.y + die.h + 5, `rgba(230,237,241,${alpha})`);
      }

      // Regions
      const cpu = {
        x: die.x + die.w * 0.035,
        y: die.y + die.h * 0.115,
        w: die.w * 0.355,
        h: die.h * 0.59,
      };
      const gpu = {
        x: die.x + die.w * 0.45,
        y: die.y + die.h * 0.115,
        w: die.w * 0.515,
        h: die.h * 0.59,
      };
      const ne = {
        x: die.x + die.w * 0.035,
        y: die.y + die.h * 0.765,
        w: die.w * 0.285,
        h: die.h * 0.145,
      };
      const mem = {
        x: die.x + die.w * 0.36,
        y: die.y + die.h * 0.765,
        w: die.w * 0.605,
        h: die.h * 0.145,
      };

      label('CPU · 16 CORES', cpu.x, cpu.y - 8, 'rgba(230,237,241,0.58)', Math.max(8, width * 0.0058));
      label('GPU · 40 CORES', gpu.x, gpu.y - 8, 'rgba(230,237,241,0.58)', Math.max(8, width * 0.0058));
      label('NEURAL ENGINE · 16 CORES', ne.x, ne.y - 8, 'rgba(225,6,0,0.8)', Math.max(8, width * 0.0058));
      label('UNIFIED MEMORY FABRIC · 546\u00A0GB/s', mem.x, mem.y - 8, 'rgba(230,237,241,0.48)', Math.max(8, width * 0.0058));

      // CPU cluster: 4 × 4
      const cpuGap = Math.max(3, cpu.w * 0.018);
      const cpuCols = 4;
      const cpuRows = 4;
      const cpuCellW = (cpu.w - cpuGap * (cpuCols - 1)) / cpuCols;
      const cpuCellH = (cpu.h - cpuGap * (cpuRows - 1)) / cpuRows;
      const cpuWave = ((t * 0.18) % 1.5) - 0.25;

      for (let i = 0; i < cpuCols * cpuRows; i += 1) {
        const col = i % cpuCols;
        const row = Math.floor(i / cpuCols);
        const x = cpu.x + col * (cpuCellW + cpuGap);
        const y = cpu.y + row * (cpuCellH + cpuGap);
        const norm = row / (cpuRows - 1);
        const hot = Math.abs(norm - cpuWave) < 0.085;

        ctx.fillStyle = hot
          ? 'rgba(225,6,0,0.72)'
          : `rgba(230,237,241,${0.055 + 0.035 * Math.abs(Math.sin(i * 1.7 + t * 0.5))})`;
        ctx.fillRect(x, y, cpuCellW, cpuCellH);

        ctx.strokeStyle = hot
          ? 'rgba(255,90,77,0.9)'
          : 'rgba(230,237,241,0.14)';
        ctx.strokeRect(x + 0.5, y + 0.5, cpuCellW - 1, cpuCellH - 1);

        // Inner core mark
        if (!hot) {
          line(
            x + cpuCellW * 0.3,
            y + cpuCellH * 0.5,
            x + cpuCellW * 0.7,
            y + cpuCellH * 0.5,
            'rgba(230,237,241,0.13)'
          );
        }
      }

      // GPU cluster: 8 × 5
      const gpuGap = Math.max(2.5, gpu.w * 0.009);
      const gpuCols = 8;
      const gpuRows = 5;
      const gpuCellW = (gpu.w - gpuGap * (gpuCols - 1)) / gpuCols;
      const gpuCellH = (gpu.h - gpuGap * (gpuRows - 1)) / gpuRows;
      const gpuWave = ((t * 0.28) % 1.6) - 0.3;

      for (let i = 0; i < gpuCols * gpuRows; i += 1) {
        const col = i % gpuCols;
        const row = Math.floor(i / gpuCols);
        const x = gpu.x + col * (gpuCellW + gpuGap);
        const y = gpu.y + row * (gpuCellH + gpuGap);
        const norm = col / (gpuCols - 1);
        const hot = Math.abs(norm - gpuWave) < 0.07;

        ctx.fillStyle = hot
          ? 'rgba(225,6,0,0.62)'
          : `rgba(143,182,200,${0.06 + 0.035 * Math.abs(Math.sin(i * 1.3 + t * 0.45))})`;
        ctx.fillRect(x, y, gpuCellW, gpuCellH);

        ctx.strokeStyle = hot
          ? 'rgba(255,90,77,0.8)'
          : 'rgba(143,182,200,0.16)';
        ctx.strokeRect(x + 0.5, y + 0.5, gpuCellW - 1, gpuCellH - 1);
      }

      // Neural Engine: 4 × 2 cells
      const neGap = Math.max(2.5, ne.w * 0.014);
      const neCols = 4;
      const neRows = 2;
      const neCellW = (ne.w - neGap * (neCols - 1)) / neCols;
      const neCellH = (ne.h - neGap * (neRows - 1)) / neRows;
      const nePulse = 0.35 + 0.3 * Math.abs(Math.sin(t * 1.1));

      for (let i = 0; i < neCols * neRows; i += 1) {
        const col = i % neCols;
        const row = Math.floor(i / neCols);
        const x = ne.x + col * (neCellW + neGap);
        const y = ne.y + row * (neCellH + neGap);

        ctx.fillStyle = `rgba(225,6,0,${nePulse})`;
        ctx.fillRect(x, y, neCellW, neCellH);
        ctx.strokeStyle = 'rgba(255,90,77,0.55)';
        ctx.strokeRect(x + 0.5, y + 0.5, neCellW - 1, neCellH - 1);
      }

      // Memory controllers: four channels
      const memGap = Math.max(4, mem.w * 0.012);
      const memCols = 4;
      const memCellW = (mem.w - memGap * (memCols - 1)) / memCols;

      for (let i = 0; i < memCols; i += 1) {
        const x = mem.x + i * (memCellW + memGap);
        const level = 0.25 + 0.45 * Math.abs(Math.sin(t * 0.9 + i * 0.9));

        ctx.fillStyle = 'rgba(230,237,241,0.05)';
        ctx.fillRect(x, mem.y, memCellW, mem.h);
        ctx.strokeStyle = 'rgba(230,237,241,0.16)';
        ctx.strokeRect(x + 0.5, mem.y + 0.5, memCellW - 1, mem.h - 1);

        ctx.fillStyle = `rgba(225,6,0,${level})`;
        ctx.fillRect(x + 3, mem.y + mem.h - mem.h * level, memCellW - 6, mem.h * level - 3);
      }

      // Signal path
      const path = [
        { x: cpu.x + cpu.w * 0.5, y: cpu.y + cpu.h * 0.5 },
        { x: gpu.x + gpu.w * 0.12, y: cpu.y + cpu.h * 0.5 },
        { x: gpu.x + gpu.w * 0.5, y: gpu.y + gpu.h * 0.5 },
        { x: ne.x + ne.w * 0.5, y: ne.y + ne.h * 0.5 },
        { x: mem.x + mem.w * 0.5, y: mem.y + mem.h * 0.5 },
      ];

      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i += 1) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.strokeStyle = 'rgba(225,6,0,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.setLineDash([5, 9]);
      ctx.lineDashOffset = -t * 26;
      ctx.strokeStyle = 'rgba(255,90,77,0.58)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Pulse
      const progress = (t * 0.09) % 1;
      const pulse = pointOnPath(path, progress);
      const pulseGlow = ctx.createRadialGradient(
        pulse.x,
        pulse.y,
        0,
        pulse.x,
        pulse.y,
        Math.max(16, width * 0.022)
      );
      pulseGlow.addColorStop(0, 'rgba(255,90,77,0.42)');
      pulseGlow.addColorStop(1, 'rgba(255,90,77,0)');
      ctx.fillStyle = pulseGlow;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, Math.max(16, width * 0.022), 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, Math.max(2.5, width * 0.0035), 0, Math.PI * 2);
      ctx.fillStyle = '#ff5a4d';
      ctx.fill();

      // Frame details
      const m = Math.max(12, width * 0.018);
      label('M4 MAX / PACKAGE STUDY', m, m, 'rgba(230,237,241,0.55)', Math.max(8, width * 0.0062));
      ctx.textAlign = 'right';
      label('3 NM / 2024', width - m, m, 'rgba(230,237,241,0.4)', Math.max(8, width * 0.0062));
      label(`T+${String(Math.floor(t) % 100).padStart(2, '0')}`, width - m, height - m, 'rgba(230,237,241,0.3)', Math.max(8, width * 0.0062));
      ctx.textAlign = 'left';

      // Corner brackets
      const b = Math.max(10, width * 0.012);
      const corners = [
        [m, m, 1, 1],
        [width - m, m, -1, 1],
        [m, height - m, 1, -1],
        [width - m, height - m, -1, -1],
      ];

      corners.forEach(([x, y, sx, sy]) => {
        line(x, y, x + b * sx, y, 'rgba(230,237,241,0.35)');
        line(x, y, x, y + b * sy, 'rgba(230,237,241,0.35)');
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(rect.width, 1);
      height = Math.max(rect.height, 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(time);
    };

    const syncToggle = () => {
      const active = playing && motionEnabled;
      dieToggle.dataset.playing = String(active);
      dieToggle.setAttribute('aria-label', active ? 'Pause die animation' : 'Play die animation');
      if (toggleLabel) toggleLabel.textContent = active ? 'Pause' : 'Resume';
    };

    const loop = (now) => {
      if (!lastFrame) lastFrame = now;
      const delta = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;
      time += delta;
      draw(time);
      rafId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (rafId || !playing || !motionEnabled || !inView || !pageVisible) return;
      lastFrame = 0;
      rafId = requestAnimationFrame(loop);
    };

    const stop = () => {
      if (!rafId) return;
      cancelAnimationFrame(rafId);
      rafId = 0;
      lastFrame = 0;
    };

    dieToggle.addEventListener('click', () => {
      if (!motionEnabled) {
        setMotion(true);
        return;
      }

      playing = !playing;
      syncToggle();
      if (playing) start();
      else {
        stop();
        draw(time);
      }
    });

    if ('ResizeObserver' in window) {
      new ResizeObserver(resize).observe(canvas);
    } else {
      window.addEventListener('resize', resize);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            inView = entry.isIntersecting;
            if (inView) start();
            else stop();
          });
        },
        { threshold: 0.05 }
      ).observe(canvas);
    }

    document.addEventListener('visibilitychange', () => {
      pageVisible = !document.hidden;
      if (pageVisible) start();
      else stop();
    });

    window.addEventListener('motionchange', (event) => {
      if (event.detail.enabled) {
        playing = true;
        syncToggle();
        start();
        return;
      }

      playing = false;
      syncToggle();
      stop();
      draw(time);
    });

    resize();
    syncToggle();
    if (playing) start();
  }

  /* ----------------------------------------------------------------------
     Print / save the spec sheet
  ---------------------------------------------------------------------- */
  const printButton = document.getElementById('print-specs');
  if (printButton) {
    printButton.addEventListener('click', () => window.print());
  }

  /* ----------------------------------------------------------------------
     Footer year
  ---------------------------------------------------------------------- */
  const yearNode = document.getElementById('year');
  if (yearNode) yearNode.textContent = String(new Date().getFullYear());

  /* ----------------------------------------------------------------------
     Reduced-motion changes follow the OS when no explicit preference is set
  ---------------------------------------------------------------------- */
  const onReduceChange = (event) => {
    if (event.matches) setMotion(false, { persist: false });
  };

  if (reduceQuery.addEventListener) reduceQuery.addEventListener('change', onReduceChange);
  else reduceQuery.addListener(onReduceChange);
})();
