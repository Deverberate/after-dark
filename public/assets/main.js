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
     Haptics — Vibration API
  ---------------------------------------------------------------------- */
  let userHasInteracted = false;
  const markInteraction = () => { userHasInteracted = true; };
  window.addEventListener('pointerdown', markInteraction, { passive: true, once: true });
  window.addEventListener('keydown', markInteraction, { passive: true, once: true });

  const triggerHaptic = (pattern = 10) => {
    if (!userHasInteracted || !motionEnabled || prefersReducedMotion()) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(pattern); } catch {}
    }
  };

  /* ----------------------------------------------------------------------
     Wayne Applied Sciences — Synthetic Audio Architecture (Web Audio API)
  ---------------------------------------------------------------------- */
  class WayneAudioManager {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.enabled = false;
      this.initialized = false;
      this.storageKey = 'after-dark-audio';
    }

    init() {
      if (this.initialized) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.42, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.initialized = true;

        const stored = localStorage.getItem(this.storageKey);
        const reducedMotion = prefersReducedMotion();

        // Muted by default; strictly disabled under reduced motion
        this.enabled = (!reducedMotion && stored === 'true');
        this.syncUI();
      } catch (e) {
        console.warn('Web Audio init failed', e);
      }
    }

    ensureContext() {
      if (!this.initialized) this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        return this.ctx.resume().catch(() => {});
      }
      return Promise.resolve();
    }

    toggle() {
      if (!this.initialized) this.init();
      if (prefersReducedMotion()) {
        this.enabled = false;
        try { localStorage.setItem(this.storageKey, 'false'); } catch {}
        this.syncUI();
        return false;
      }

      this.enabled = !this.enabled;
      try {
        localStorage.setItem(this.storageKey, this.enabled ? 'true' : 'false');
      } catch {}
      this.syncUI();

      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          if (this.enabled) this.playChirp(this.ctx.currentTime);
        }).catch(() => {});
      } else if (this.enabled) {
        this.play('chirp');
      }
      return this.enabled;
    }

    isEnabled() {
      return this.enabled;
    }

    play(name) {
      if (!this.enabled || prefersReducedMotion()) return;
      if (!this.initialized) this.init();
      if (!this.ctx) return;

      const run = () => {
        const t = this.ctx.currentTime;
        switch (name) {
          case 'click':
            this.playClick(t);
            break;
          case 'chirp':
            this.playChirp(t);
            break;
          case 'sweep':
            this.playSweep(t);
            break;
          case 'lock':
            this.playLock(t);
            break;
        }
      };

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().then(run).catch(() => {});
      } else {
        run();
      }
    }

    playClick(t) {
      const dest = this.masterGain || this.ctx.destination;

      // High transient tick
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(2400, t);
      osc1.frequency.exponentialRampToValueAtTime(700, t + 0.015);
      gain1.gain.setValueAtTime(0.35, t);
      gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.016);
      osc1.connect(gain1);
      gain1.connect(dest);
      osc1.start(t);
      osc1.stop(t + 0.02);

      // Tactile body clack
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(620, t);
      osc2.frequency.exponentialRampToValueAtTime(180, t + 0.035);
      gain2.gain.setValueAtTime(0.4, t);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
      osc2.connect(gain2);
      gain2.connect(dest);
      osc2.start(t);
      osc2.stop(t + 0.04);
    }

    playChirp(t) {
      const dest = this.masterGain || this.ctx.destination;

      // Targeting reticle two-tone diagnostic chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, t);
      osc.frequency.setValueAtTime(2640, t + 0.025);
      osc.frequency.exponentialRampToValueAtTime(3520, t + 0.055);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.38, t + 0.01);
      gain.gain.setValueAtTime(0.38, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.095);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.1);
    }

    playSweep(t) {
      const dest = this.masterGain || this.ctx.destination;

      // Telemetry radar sweep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(700, t);
      filter.frequency.exponentialRampToValueAtTime(1800, t + 0.16);
      filter.Q.setValueAtTime(2.2, t);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(340, t);
      osc.frequency.exponentialRampToValueAtTime(720, t + 0.18);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.24);
    }

    playLock(t) {
      const dest = this.masterGain || this.ctx.destination;

      // Heavy tactical clunk (audible on laptop & mobile speakers)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(240, t);
      osc1.frequency.exponentialRampToValueAtTime(70, t + 0.12);
      gain1.gain.setValueAtTime(0.48, t);
      gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      osc1.connect(gain1);
      gain1.connect(dest);
      osc1.start(t);
      osc1.stop(t + 0.14);

      // Mid-range metallic accent
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(480, t);
      osc2.frequency.exponentialRampToValueAtTime(120, t + 0.08);
      gain2.gain.setValueAtTime(0.32, t);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      osc2.connect(gain2);
      gain2.connect(dest);
      osc2.start(t);
      osc2.stop(t + 0.09);
    }

    syncUI() {
      const toggles = document.querySelectorAll('#audio-toggle, [data-audio-toggle], .hud-audio-btn');
      const indicators = document.querySelectorAll('#telemetry-audio-ind, #telemetry-audio-status');

      toggles.forEach((btn) => {
        btn.setAttribute('aria-pressed', String(this.enabled));
        const lbl = btn.querySelector('.hud-audio-btn__label, .telemetry-audio-btn__label');
        if (lbl) lbl.textContent = this.enabled ? 'Audio: On' : 'Audio: Off';
      });

      indicators.forEach((ind) => {
        ind.textContent = this.enabled ? 'Audio: On' : 'Audio: Off';
      });

      window.dispatchEvent(new CustomEvent('audiostatechange', { detail: { enabled: this.enabled } }));
    }
  }

  const wayneAudio = new WayneAudioManager();
  window.wayneAudio = wayneAudio;

  const onFirstInteraction = () => {
    wayneAudio.init();
    document.removeEventListener('pointerdown', onFirstInteraction);
    document.removeEventListener('keydown', onFirstInteraction);
  };
  document.addEventListener('pointerdown', onFirstInteraction, { passive: true });
  document.addEventListener('keydown', onFirstInteraction, { passive: true });
  wayneAudio.init();

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

  const updateFit = (value, { userInitiated = false } = {}) => {
    const fit = fits[value];
    if (!fit) return;
    if (fitName) fitName.textContent = fit.name;
    if (fitModel) fitModel.textContent = fit.model;
    if (fitCopy) fitCopy.textContent = fit.copy;
    window.dispatchEvent(new CustomEvent('workloadchange', { detail: fit }));
    if (userInitiated) {
      if (window.wayneAudio) window.wayneAudio.play('lock');
      if (typeof triggerHaptic === 'function') triggerHaptic([12, 24, 15]);
    }
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
          updateFit(input.value, { userInitiated: true });
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
        updateFit(initialWorkload, { userInitiated: false });
      }
    } else {
      const checked = workloadInputs.find((input) => input.checked);
      if (checked) updateFit(checked.value, { userInitiated: false });
    }

    window.addEventListener('popstate', () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const requested = params.get('workload');
        if (requested && Object.prototype.hasOwnProperty.call(fits, requested)) {
          const targetInput = workloadInputs.find((input) => input.value === requested);
          if (targetInput) {
            workloadInputs.forEach((input) => {
              input.checked = input === targetInput;
            });
            updateFit(requested, { userInitiated: false });
          }
        }
      } catch {}
    });
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
     Wayne Tech Diagnostic Inspection Pins (Hero & Armor)
  ---------------------------------------------------------------------- */
  const pins = Array.from(document.querySelectorAll('.pin, [data-pin-id]'));

  const closeAllPins = () => {
    pins.forEach((p) => p.setAttribute('aria-expanded', 'false'));
  };

  pins.forEach((pin) => {
    pin.addEventListener('click', (event) => {
      event.stopPropagation();
      const isExpanded = pin.getAttribute('aria-expanded') === 'true';
      closeAllPins();
      if (!isExpanded) {
        pin.setAttribute('aria-expanded', 'true');
        wayneAudio.play('chirp');
        triggerHaptic(18);
      }
    });

    pin.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const isExpanded = pin.getAttribute('aria-expanded') === 'true';
        if (isExpanded) {
          event.preventDefault();
          event.stopPropagation();
          pin.setAttribute('aria-expanded', 'false');
          pin.focus();
        }
      }
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.pin')) {
      closeAllPins();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const activeExpanded = document.querySelector('.pin[aria-expanded="true"]');
      if (activeExpanded) {
        activeExpanded.setAttribute('aria-expanded', 'false');
        activeExpanded.focus();
      }
    }
  });

  /* ----------------------------------------------------------------------
     Batcomputer Telemetry HUD Tray & Real-Time Waveforms
  ---------------------------------------------------------------------- */
  const hudTray = document.getElementById('telemetry-hud');
  const hudToggle = document.getElementById('telemetry-toggle');
  const hudPanel = document.getElementById('telemetry-panel');
  const hudClose = document.getElementById('telemetry-close');
  const hudAudioBtn = document.getElementById('audio-toggle');
  const hudSec = document.getElementById('telemetry-sec');
  const hudScroll = document.getElementById('telemetry-scroll');
  const hudTime = document.getElementById('telemetry-time');
  const hudWorkload = document.getElementById('telemetry-workload-name');

  let hudOpen = false;

  const setHudOpen = (open) => {
    hudOpen = open;
    if (hudToggle) hudToggle.setAttribute('aria-expanded', String(open));
    if (hudPanel) {
      if (open) {
        hudPanel.removeAttribute('hidden');
        wayneAudio.play('sweep');
        triggerHaptic(25);
      } else {
        hudPanel.setAttribute('hidden', '');
      }
    }
  };

  if (hudToggle) {
    hudToggle.addEventListener('click', () => setHudOpen(!hudOpen));
  }
  if (hudClose) {
    hudClose.addEventListener('click', () => setHudOpen(false));
  }

  document.querySelectorAll('#audio-toggle, [data-audio-toggle], .hud-audio-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      wayneAudio.toggle();
      triggerHaptic(15);
    });
  });

  // Update Telemetry on scroll
  const sections = Array.from(document.querySelectorAll('section[id], header[id]'));
  const sectionLabels = {
    top: 'SEC: 00 ORBIT',
    hero: 'SEC: 01 HERO',
    machine: 'SEC: 02 MACHINE',
    silicon: 'SEC: 03 SILICON',
    proof: 'SEC: 04 PROOF',
    armor: 'SEC: 05 ARMOR',
    specs: 'SEC: 06 SPECS',
    models: 'SEC: 07 MODELS',
  };

  let activeSectionId = 'hero';

  if ('IntersectionObserver' in window && sections.length) {
    const secObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            activeSectionId = entry.target.id;
            if (hudSec) {
              hudSec.textContent = sectionLabels[activeSectionId] || `SEC: ${activeSectionId.toUpperCase()}`;
            }
          }
        });
      },
      { threshold: 0.25 }
    );
    sections.forEach((sec) => secObserver.observe(sec));
  }

  // Footer collision avoidance
  const footerElement = document.querySelector('.site-footer');
  if (hudTray && footerElement && 'IntersectionObserver' in window) {
    const footerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const overlap = Math.max(0, window.innerHeight - entry.boundingClientRect.top);
            hudTray.style.transform = `translate3d(0, -${overlap + 16}px, 0)`;
          } else {
            hudTray.style.transform = '';
          }
        });
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0] }
    );
    footerObserver.observe(footerElement);
  }

  // Gotham Clock Sync for HUD
  const updateHudClock = () => {
    if (hudTime) {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/New_York',
      });
      hudTime.textContent = `Gotham ${formatter.format(now)}`;
    }
  };
  updateHudClock();
  window.setInterval(updateHudClock, 30000);

  // Sync scroll depth in HUD
  window.addEventListener('scroll', () => {
    if (!hudScroll) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const pct = maxScroll > 0 ? Math.min(100, Math.max(0, Math.round((window.scrollY / maxScroll) * 100))) : 0;
    hudScroll.textContent = `${String(pct).padStart(2, '0')}%`;
  }, { passive: true });

  // Update HUD workload display
  window.addEventListener('workloadchange', (e) => {
    if (hudWorkload && e.detail && e.detail.name) {
      hudWorkload.textContent = `${e.detail.name} Profile`;
    }
  });

  // Animated Waveform Canvases (CPU / GPU)
  const cpuCanvas = document.getElementById('telemetry-cpu-canvas');
  const gpuCanvas = document.getElementById('telemetry-gpu-canvas');

  if (cpuCanvas && gpuCanvas && cpuCanvas.getContext) {
    const cpuCtx = cpuCanvas.getContext('2d');
    const gpuCtx = gpuCanvas.getContext('2d');
    let waveT = 0;

    const renderWaveforms = () => {
      if (hudOpen && motionEnabled) {
        waveT += 0.06;

        const cw = cpuCanvas.width;
        const ch = cpuCanvas.height;
        cpuCtx.clearRect(0, 0, cw, ch);
        cpuCtx.strokeStyle = '#e10600';
        cpuCtx.lineWidth = 1.5;
        cpuCtx.beginPath();
        for (let x = 0; x < cw; x += 4) {
          const y = (ch / 2) + Math.sin(x * 0.08 + waveT) * 7 + Math.cos(x * 0.16 + waveT * 1.5) * 4;
          if (x === 0) cpuCtx.moveTo(x, y);
          else cpuCtx.lineTo(x, y);
        }
        cpuCtx.stroke();

        const gw = gpuCanvas.width;
        const gh = gpuCanvas.height;
        gpuCtx.clearRect(0, 0, gw, gh);
        gpuCtx.strokeStyle = '#70aacc';
        gpuCtx.lineWidth = 1.5;
        gpuCtx.beginPath();
        for (let x = 0; x < gw; x += 4) {
          const y = (gh / 2) + Math.sin(x * 0.05 - waveT) * 8 + Math.sin(x * 0.18 + waveT) * 3;
          if (x === 0) gpuCtx.moveTo(x, y);
          else gpuCtx.lineTo(x, y);
        }
        gpuCtx.stroke();
      }
      requestAnimationFrame(renderWaveforms);
    };
    requestAnimationFrame(renderWaveforms);
  }

  /* ----------------------------------------------------------------------
     Stat Counter & Benchmark Bar Interpolations
  ---------------------------------------------------------------------- */
  const countElements = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && countElements.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        counterObserver.unobserve(el);

        const targetStr = el.dataset.count;
        const targetVal = parseFloat(targetStr);
        if (isNaN(targetVal)) return;

        if (!motionEnabled || prefersReducedMotion()) {
          el.childNodes[0].nodeValue = targetStr;
          return;
        }

        const isFloat = targetStr.includes('.');
        const duration = 1200;
        const startTime = performance.now();

        const animateCount = (now) => {
          const progress = Math.min(1, (now - startTime) / duration);
          const ease = 1 - Math.pow(1 - progress, 3);
          const current = (targetVal * ease).toFixed(isFloat ? 1 : 0);
          el.childNodes[0].nodeValue = current;

          if (progress < 1) requestAnimationFrame(animateCount);
          else el.childNodes[0].nodeValue = targetStr;
        };
        requestAnimationFrame(animateCount);
      });
    }, { threshold: 0.2 });

    countElements.forEach((el) => counterObserver.observe(el));
  }

  // Audio click on buttons and interactive navigation
  document.querySelectorAll('.btn, .specs__print, .menu-toggle, .nav__link, .hud-quicknav a, .footer__nav a').forEach((btn) => {
    btn.addEventListener('click', () => {
      wayneAudio.play('click');
      triggerHaptic(12);
    });
  });

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
