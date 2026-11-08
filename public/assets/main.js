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
     Wayne Applied Sciences — Acoustic Terminal (Soundtrack Drawer & Engine)
     Cinematic background themes on loop via YouTube IFrame API + 32-ch FFT
  ---------------------------------------------------------------------- */
  const SOUNDTRACKS = [
    {
      id: 'arkham',
      title: 'Arkham City Main Theme',
      artist: 'Nick Arundel & Ron Fish · Batman: Arkham City',
      ytId: 'SXKrsJZWqK0',
      tempo: 72,
      sub: 'DEFAULT'
    },
    {
      id: 'batfleck',
      title: 'A Beautiful Lie',
      artist: 'Hans Zimmer & Junkie XL · Batfleck',
      ytId: 'jioG6eFBiew',
      tempo: 60,
      sub: 'BvS'
    },
    {
      id: 'battinson',
      title: 'The Batman Theme',
      artist: 'Michael Giacchino · Battinson',
      ytId: '_WEonvtesdc',
      tempo: 80,
      sub: '2022'
    },
    {
      id: 'batbale',
      title: 'Molossus / Dark Knight Theme',
      artist: 'Hans Zimmer & J.N. Howard · Batbale',
      ytId: 'iGx5a1ifSDs',
      tempo: 110,
      sub: 'TRILOGY'
    }
  ];

  let ytPlayer = null;
  let isPlayerReady = false;
  let currentTrackIndex = 0;
  let isSoundtrackPlaying = false;
  let soundtrackVolume = 40;
  let isSoundtrackMuted = false;
  let pendingSoundtrackPlay = false;
  let userGestureReceived = false;

  const triggerEl = document.getElementById('soundtrack-trigger');
  const drawerEl = document.getElementById('soundtrack-drawer');
  const backdropEl = document.getElementById('soundtrack-backdrop');
  const closeBtn = document.getElementById('soundtrack-close');
  const playBtn = document.getElementById('soundtrack-play');
  const prevBtn = document.getElementById('soundtrack-prev');
  const nextBtn = document.getElementById('soundtrack-next');
  const volumeSlider = document.getElementById('soundtrack-volume');
  const volumeValEl = document.getElementById('soundtrack-volume-val');
  const volumeMuteBtn = document.getElementById('soundtrack-volume-mute');
  const currentTitleEl = document.getElementById('soundtrack-current-title');
  const currentArtistEl = document.getElementById('soundtrack-current-artist');
  const eqStateEl = document.getElementById('soundtrack-eq-state');
  const trackCards = document.querySelectorAll('.soundtrack-track-card');
  const visualizerCanvas = document.getElementById('soundtrack-canvas');

  // Load YouTube IFrame API script tag
  if (!window.YT) {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(tag, firstScript);
    } else {
      document.head.appendChild(tag);
    }
  }

  const prevYTReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (typeof prevYTReady === 'function') prevYTReady();
    initSoundtrackPlayer();
  };

  if (window.YT && window.YT.Player) {
    initSoundtrackPlayer();
  }

  function initSoundtrackPlayer() {
    const container = document.getElementById('yt-soundtrack-player');
    if (!container || ytPlayer) return;

    try {
      ytPlayer = new window.YT.Player('yt-soundtrack-player', {
        height: '180',
        width: '320',
        videoId: SOUNDTRACKS[currentTrackIndex].ytId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          loop: 1,
          playlist: SOUNDTRACKS[currentTrackIndex].ytId,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin || undefined
        },
        events: {
          onReady: (event) => {
            isPlayerReady = true;
            try {
              event.target.setVolume(soundtrackVolume);
            } catch (e) {}
            if (pendingSoundtrackPlay) {
              pendingSoundtrackPlay = false;
              playCurrentSoundtrack();
            }
          },
          onStateChange: (event) => {
            const state = event.data;
            const YTState = window.YT ? window.YT.PlayerState : {};
            if (state === (YTState.PLAYING !== undefined ? YTState.PLAYING : 1)) {
              isSoundtrackPlaying = true;
              syncSoundtrackUI(true);
            } else if (state === (YTState.ENDED !== undefined ? YTState.ENDED : 0)) {
              // Ensure continuous loop
              try {
                ytPlayer.seekTo(0);
                ytPlayer.playVideo();
              } catch (e) {}
            } else if (state === (YTState.PAUSED !== undefined ? YTState.PAUSED : 2)) {
              isSoundtrackPlaying = false;
              syncSoundtrackUI(false);
            }
          },
          onError: (event) => {
            console.warn('YouTube Player Event Notice:', event.data);
          }
        }
      });
    } catch (err) {
      console.warn('YT.Player initialization deferred', err);
    }
  }

  function syncSoundtrackUI(playing) {
    if (playBtn) {
      const iconPlay = playBtn.querySelector('.icon-play');
      const iconPause = playBtn.querySelector('.icon-pause');
      if (iconPlay) iconPlay.style.display = playing ? 'none' : 'block';
      if (iconPause) iconPause.style.display = playing ? 'block' : 'none';
      playBtn.setAttribute('aria-label', playing ? 'Pause soundtrack' : 'Play soundtrack');
    }

    if (drawerEl) drawerEl.classList.toggle('is-playing', playing);
    if (triggerEl) triggerEl.classList.toggle('is-playing', playing);
    if (eqStateEl) eqStateEl.textContent = playing ? 'TRANSMITTING' : 'STANDBY';
  }

  function playCurrentSoundtrack() {
    if (!isPlayerReady || !ytPlayer || typeof ytPlayer.playVideo !== 'function') {
      pendingSoundtrackPlay = true;
      return;
    }
    try {
      ytPlayer.setVolume(soundtrackVolume);
      if (isSoundtrackMuted) {
        ytPlayer.mute();
      } else {
        ytPlayer.unMute();
      }
      ytPlayer.playVideo();
      isSoundtrackPlaying = true;
      syncSoundtrackUI(true);
    } catch (e) {
      console.warn('Error starting soundtrack playback', e);
    }
  }

  function pauseCurrentSoundtrack() {
    if (!isPlayerReady || !ytPlayer || typeof ytPlayer.pauseVideo !== 'function') return;
    try {
      ytPlayer.pauseVideo();
      isSoundtrackPlaying = false;
      syncSoundtrackUI(false);
    } catch (e) {}
  }

  function loadSoundtrack(index, autoPlay = true) {
    if (index < 0) index = SOUNDTRACKS.length - 1;
    if (index >= SOUNDTRACKS.length) index = 0;
    currentTrackIndex = index;
    const track = SOUNDTRACKS[index];

    if (currentTitleEl) currentTitleEl.textContent = track.title;
    if (currentArtistEl) currentArtistEl.textContent = track.artist;

    trackCards.forEach((card, idx) => {
      const isActive = idx === index;
      card.classList.toggle('is-active', isActive);
      card.setAttribute('aria-checked', String(isActive));
    });

    if (isPlayerReady && ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
      try {
        if (autoPlay) {
          ytPlayer.loadVideoById({
            videoId: track.ytId,
            startSeconds: 0
          });
          isSoundtrackPlaying = true;
          syncSoundtrackUI(true);
        } else {
          ytPlayer.cueVideoById({
            videoId: track.ytId,
            startSeconds: 0
          });
        }
      } catch (e) {
        console.warn('Error switching soundtrack', e);
      }
    } else if (autoPlay) {
      pendingSoundtrackPlay = true;
    }
  }

  // Autoplay on first user interaction gesture (complying with browser autoplay policy)
  const triggerAutoplayOnGesture = () => {
    if (userGestureReceived) return;
    userGestureReceived = true;
    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((evt) => {
      window.removeEventListener(evt, triggerAutoplayOnGesture);
    });
    playCurrentSoundtrack();
  };

  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((evt) => {
    window.addEventListener(evt, triggerAutoplayOnGesture, { passive: true, once: true });
  });

  // Drawer Open / Close / Accessibility
  function openSoundtrackDrawer() {
    if (!drawerEl || !backdropEl || !triggerEl) return;
    drawerEl.removeAttribute('hidden');
    drawerEl.classList.add('is-open');
    backdropEl.classList.add('is-open');
    drawerEl.setAttribute('aria-hidden', 'false');
    triggerEl.setAttribute('aria-expanded', 'true');
    wayneAudio.play('chirp');
    triggerHaptic(18);

    if (!isSoundtrackPlaying && !userGestureReceived) {
      userGestureReceived = true;
      playCurrentSoundtrack();
    }

    if (closeBtn) closeBtn.focus();
  }

  function closeSoundtrackDrawer() {
    if (!drawerEl || !backdropEl || !triggerEl) return;
    drawerEl.classList.remove('is-open');
    backdropEl.classList.remove('is-open');
    drawerEl.setAttribute('aria-hidden', 'true');
    drawerEl.setAttribute('hidden', '');
    triggerEl.setAttribute('aria-expanded', 'false');
    wayneAudio.play('click');
    triggerHaptic(12);
    triggerEl.focus();
  }

  if (triggerEl) {
    triggerEl.addEventListener('click', () => {
      userGestureReceived = true;
      const isOpen = drawerEl && drawerEl.classList.contains('is-open');
      if (isOpen) closeSoundtrackDrawer();
      else openSoundtrackDrawer();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeSoundtrackDrawer);
  if (backdropEl) backdropEl.addEventListener('click', closeSoundtrackDrawer);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawerEl && drawerEl.classList.contains('is-open')) {
      closeSoundtrackDrawer();
    }
  });

  // Transport Controls
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      userGestureReceived = true;
      wayneAudio.play('click');
      triggerHaptic(14);
      if (isSoundtrackPlaying) {
        pauseCurrentSoundtrack();
      } else {
        playCurrentSoundtrack();
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      userGestureReceived = true;
      wayneAudio.play('click');
      triggerHaptic(12);
      loadSoundtrack(currentTrackIndex - 1, true);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      userGestureReceived = true;
      wayneAudio.play('click');
      triggerHaptic(12);
      loadSoundtrack(currentTrackIndex + 1, true);
    });
  }

  trackCards.forEach((card, index) => {
    card.addEventListener('click', () => {
      userGestureReceived = true;
      wayneAudio.play('click');
      triggerHaptic(12);
      loadSoundtrack(index, true);
    });
  });

  // Volume & Mute Controls
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      soundtrackVolume = isNaN(val) ? 40 : Math.max(0, Math.min(100, val));
      if (volumeValEl) volumeValEl.textContent = `${soundtrackVolume}%`;

      if (isSoundtrackMuted && soundtrackVolume > 0) {
        isSoundtrackMuted = false;
        if (volumeMuteBtn) volumeMuteBtn.classList.remove('is-muted');
        if (isPlayerReady && ytPlayer && typeof ytPlayer.unMute === 'function') {
          try { ytPlayer.unMute(); } catch (err) {}
        }
      }

      if (isPlayerReady && ytPlayer && typeof ytPlayer.setVolume === 'function') {
        try { ytPlayer.setVolume(soundtrackVolume); } catch (err) {}
      }
    });
  }

  if (volumeMuteBtn) {
    volumeMuteBtn.addEventListener('click', () => {
      isSoundtrackMuted = !isSoundtrackMuted;
      wayneAudio.play('click');
      triggerHaptic(12);

      if (isSoundtrackMuted) {
        volumeMuteBtn.classList.add('is-muted');
        volumeMuteBtn.setAttribute('aria-label', 'Unmute soundtrack');
        if (volumeValEl) volumeValEl.textContent = 'MUTED';
        if (isPlayerReady && ytPlayer && typeof ytPlayer.mute === 'function') {
          try { ytPlayer.mute(); } catch (err) {}
        }
      } else {
        volumeMuteBtn.classList.remove('is-muted');
        volumeMuteBtn.setAttribute('aria-label', 'Mute soundtrack');
        if (volumeValEl) volumeValEl.textContent = `${soundtrackVolume}%`;
        if (isPlayerReady && ytPlayer && typeof ytPlayer.unMute === 'function') {
          try {
            ytPlayer.unMute();
            ytPlayer.setVolume(soundtrackVolume);
          } catch (err) {}
        }
      }
    });
  }

  /* ----------------------------------------------------------------------
     Wayne Applied Sciences — 32-Bar Acoustic Spectrum & Oscilloscope
  ---------------------------------------------------------------------- */
  if (visualizerCanvas && visualizerCanvas.getContext) {
    const vCtx = visualizerCanvas.getContext('2d');
    const NUM_BARS = 32;
    const barHeights = new Float32Array(NUM_BARS);
    const peakCaps = new Float32Array(NUM_BARS);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayW = 340;
    const displayH = 88;
    visualizerCanvas.width = displayW * dpr;
    visualizerCanvas.height = displayH * dpr;
    vCtx.scale(dpr, dpr);

    const barWidth = 7;
    const barGap = 3.5;
    const totalW = NUM_BARS * barWidth + (NUM_BARS - 1) * barGap;
    const startX = (displayW - totalW) / 2;
    const baselineY = 70;

    let vStartTime = performance.now();

    const renderVisualizer = (timestamp) => {
      requestAnimationFrame(renderVisualizer);

      const elapsed = (timestamp - vStartTime) / 1000;
      const track = SOUNDTRACKS[currentTrackIndex];
      const tempo = track ? track.tempo : 72;
      const beatPeriod = 60 / tempo;
      const beatPhase = (elapsed / beatPeriod) % 1;

      vCtx.clearRect(0, 0, displayW, displayH);

      // Volume multiplier (0 if muted)
      const volMult = isSoundtrackMuted ? 0 : (soundtrackVolume / 100);

      // Check motion setting
      const isMotionActive = motionEnabled && !prefersReducedMotion();

      for (let i = 0; i < NUM_BARS; i++) {
        let targetEnergy = 0;

        if (isSoundtrackPlaying && isMotionActive && volMult > 0) {
          // Synthetic audio energy spectrum:
          // Low frequencies (0-7): rhythmic sub-bass pulse
          if (i < 8) {
            const kick = Math.pow(Math.max(0, 1 - 3.2 * beatPhase), 2);
            const sub = Math.sin(elapsed * 4.5 + i * 0.4) * 0.25 + 0.35;
            targetEnergy = (kick * 0.7 + sub * 0.3) * (0.8 + 0.2 * Math.sin(i * 0.8));
          }
          // Mid frequencies (8-21): harmonic orchestral movement
          else if (i < 22) {
            const swell = (Math.sin(elapsed * 2.4 + i * 0.5) * Math.cos(elapsed * 1.2 - i * 0.3) * 0.5 + 0.5);
            const harmonic = Math.sin(elapsed * 5.0 + i * 0.7) * 0.15;
            targetEnergy = (swell + harmonic) * 0.75;
          }
          // High frequencies (22-31): crisp string & percussive shimmer
          else {
            const flutter = Math.sin(elapsed * 7.5 + i * 1.2) * 0.3 + 0.35;
            const noise = ((Math.sin(elapsed * 23 + i * 17) * 43758.5453) % 1) * 0.15;
            targetEnergy = (flutter + noise) * 0.6;
          }

          targetEnergy = Math.max(0.04, Math.min(1, targetEnergy * volMult));
        } else if (isMotionActive) {
          // Idle standby subtle breathing wave
          targetEnergy = (Math.sin(elapsed * 1.5 + i * 0.25) * 0.04 + 0.06);
        } else {
          // Reduced motion static tactical profile
          targetEnergy = 0.08 + 0.12 * Math.sin((i / NUM_BARS) * Math.PI);
        }

        const targetH = Math.max(2, targetEnergy * 56);
        barHeights[i] = barHeights[i] * 0.78 + targetH * 0.22;

        if (barHeights[i] >= peakCaps[i]) {
          peakCaps[i] = barHeights[i];
        } else {
          peakCaps[i] = Math.max(2, peakCaps[i] - (isMotionActive ? 0.7 : 0.05));
        }

        const bx = startX + i * (barWidth + barGap);
        const bh = barHeights[i];
        const by = baselineY - bh;

        // Draw EQ bar gradient
        const grad = vCtx.createLinearGradient(0, baselineY, 0, by);
        grad.addColorStop(0, 'rgba(230, 237, 241, 0.18)');
        grad.addColorStop(0.6, 'rgba(230, 237, 241, 0.65)');
        grad.addColorStop(1, '#ffffff');

        vCtx.fillStyle = grad;
        vCtx.fillRect(bx, by, barWidth, bh);

        // Peak Meter Cap (Signal Red)
        const peakY = baselineY - peakCaps[i] - 2;
        vCtx.fillStyle = '#e10600';
        vCtx.fillRect(bx, peakY, barWidth, 2);
      }

      // Draw Oscilloscope Base Waveform
      vCtx.beginPath();
      const waveY = 79;
      vCtx.moveTo(startX, waveY);

      for (let x = 0; x <= totalW; x += 3) {
        let oscOffset = 0;
        if (isSoundtrackPlaying && isMotionActive && volMult > 0) {
          oscOffset = (
            Math.sin(x * 0.06 + elapsed * 6) * 3.5 +
            Math.cos(x * 0.12 - elapsed * 3) * 2.0
          ) * volMult;
        } else if (isMotionActive) {
          oscOffset = Math.sin(x * 0.03 + elapsed * 1.2) * 0.8;
        }
        vCtx.lineTo(startX + x, waveY + oscOffset);
      }

      vCtx.strokeStyle = isSoundtrackPlaying ? 'rgba(225, 6, 0, 0.55)' : 'rgba(230, 237, 241, 0.2)';
      vCtx.lineWidth = 1.2;
      vCtx.stroke();
    };

    requestAnimationFrame(renderVisualizer);
  }

  /* ----------------------------------------------------------------------
     00 — Comic Prologue: Scrollytelling Rooftop Descent Engine
     Bat-Signal projection, volumetric storm clouds, procedural lightning,
     animated comic Batman figures (Gargoyle Crouch & Standing Apex),
     flocking bats particle swarm, and smooth transition to Hero console.
  ---------------------------------------------------------------------- */
  const prologueSection = document.getElementById('prologue');
  const prologueCanvas = document.getElementById('prologue-canvas');
  const prologueFlash = document.getElementById('prologue-flash');
  const prologueCrouch = document.getElementById('prologue-figure-crouch');
  const prologueStand = document.getElementById('prologue-figure-stand');
  const headCrouch = document.getElementById('p-head-crouch');
  const headStand = document.getElementById('p-head-stand');
  const prologueSkyline = document.querySelector('.prologue__skyline');
  const prologueStatus = document.getElementById('prologue-status');
  const pStep1 = document.getElementById('p-step-1');
  const pStep2 = document.getElementById('p-step-2');
  const pStep3 = document.getElementById('p-step-3');
  const prologueSkip = document.getElementById('prologue-skip');
  const heroTarget = document.getElementById('hero');

  if (prologueSection && prologueCanvas && prologueCanvas.getContext) {
    const pCtx = prologueCanvas.getContext('2d');
    let pWidth = window.innerWidth;
    let pHeight = window.innerHeight;

    const resizePrologueCanvas = () => {
      pWidth = window.innerWidth;
      pHeight = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      prologueCanvas.width = pWidth * dpr;
      prologueCanvas.height = pHeight * dpr;
      pCtx.setTransform(1, 0, 0, 1, 0, 0);
      pCtx.scale(dpr, dpr);
    };

    resizePrologueCanvas();
    window.addEventListener('resize', resizePrologueCanvas, { passive: true });

    // Lightning State & Procedural Bolt Generator
    let lightningActive = false;
    let lightningStartTime = 0;
    let lightningBolts = [];
    let lastStage = 1;

    const generateBolt = (x1, y1, x2, y2, displace, depth) => {
      if (depth <= 0) {
        return [{ x1, y1, x2, y2 }];
      }
      const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * displace;
      const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * (displace * 0.4);
      let segments = [];
      segments = segments.concat(generateBolt(x1, y1, midX, midY, displace * 0.55, depth - 1));
      segments = segments.concat(generateBolt(midX, midY, x2, y2, displace * 0.55, depth - 1));
      // Occasional fork branch
      if (Math.random() < 0.35 && depth > 1) {
        const forkX = midX + (Math.random() - 0.5) * displace * 0.8;
        const forkY = midY + Math.random() * displace * 0.6;
        segments = segments.concat(generateBolt(midX, midY, forkX, forkY, displace * 0.4, depth - 2));
      }
      return segments;
    };

    const triggerLightning = () => {
      if (prefersReducedMotion()) return;
      lightningActive = true;
      lightningStartTime = performance.now();

      // Generate 1-2 prominent lightning branches originating from the clouds
      const startX = pWidth * (0.35 + Math.random() * 0.4);
      const startY = pHeight * 0.05;
      const endX = startX + (Math.random() - 0.5) * pWidth * 0.3;
      const endY = pHeight * (0.65 + Math.random() * 0.25);
      lightningBolts = generateBolt(startX, startY, endX, endY, pWidth * 0.12, 5);

      // Trigger screen-level sheet flash overlay (strictly visual, silent)
      if (prologueFlash) {
        prologueFlash.classList.add('is-flashing');
        setTimeout(() => {
          if (prologueFlash) {
            prologueFlash.classList.remove('is-flashing');
            prologueFlash.classList.add('is-strobe');
            setTimeout(() => {
              if (prologueFlash) {
                prologueFlash.classList.remove('is-strobe');
              }
            }, 90);
          }
        }, 65);
      }

      // Scatter bats
      for (let i = 0; i < bats.length; i++) {
        bats[i].vx += (Math.random() - 0.5) * 4;
        bats[i].vy -= Math.random() * 3 + 1;
      }
    };

    // Ambient lightning timer: fires every 4.8 - 5.8s
    let ambientLightningTimer = null;
    const scheduleNextLightning = () => {
      const delay = 4600 + Math.random() * 1200;
      ambientLightningTimer = setTimeout(() => {
        // Only trigger if prologue is partially or fully in viewport
        const rect = prologueSection.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          triggerLightning();
        }
        scheduleNextLightning();
      }, delay);
    };
    scheduleNextLightning();

    // Flocking Bats Particle Swarm (24 bats)
    const NUM_BATS = 24;
    const bats = [];
    for (let i = 0; i < NUM_BATS; i++) {
      bats.push({
        x: Math.random() * (pWidth || 1200),
        y: Math.random() * (pHeight * 0.65 || 500),
        size: Math.random() * 5 + 4,
        vx: (Math.random() - 0.45) * 1.5,
        vy: (Math.random() - 0.5) * 0.8,
        wingPhase: Math.random() * Math.PI * 2,
        wingSpeed: Math.random() * 0.2 + 0.15
      });
    }

    // Interactive pointer coordinates for head tracking and parallax
    let pMx = 0;
    let pMy = 0;
    let targetPMx = 0;
    let targetPMy = 0;

    window.addEventListener('mousemove', (e) => {
      targetPMx = (e.clientX / window.innerWidth - 0.5) * 2;
      targetPMy = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    // Skip to console handler
    if (prologueSkip && heroTarget) {
      prologueSkip.addEventListener('click', () => {
        heroTarget.scrollIntoView({ behavior: 'smooth' });
      });
    }

    let pStartTime = performance.now();

    const renderPrologue = (timestamp) => {
      requestAnimationFrame(renderPrologue);

      if (document.hidden) return;

      const rect = prologueSection.getBoundingClientRect();
      // If completely out of view, skip render work
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      const isMotionActive = motionEnabled && !prefersReducedMotion();

      // Smooth pointer tracking
      pMx += (targetPMx - pMx) * 0.08;
      pMy += (targetPMy - pMy) * 0.08;

      // Update head rotation on both figures
      if (isMotionActive) {
        if (headCrouch) {
          headCrouch.style.transform = `rotate(${pMx * 8}deg)`;
        }
        if (headStand) {
          headStand.style.transform = `rotate(${pMx * 8}deg)`;
        }
        if (prologueSkyline) {
          prologueSkyline.style.transform = `translate3d(${pMx * 6}px, ${pMy * 3}px, 0)`;
        }
      }

      // Calculate scroll progress p in [0, 1]
      const totalScrollable = Math.max(1, rect.height - window.innerHeight);
      const scrolled = Math.max(0, -rect.top);
      const p = Math.min(1, Math.max(0, scrolled / totalScrollable));

      // 3-Stage State Handling
      let currentStage = 1;
      if (p < 0.35) {
        currentStage = 1;
        if (prologueCrouch) prologueCrouch.classList.add('is-visible');
        if (prologueStand) prologueStand.classList.remove('is-visible');
        if (prologueStatus) prologueStatus.textContent = 'GOTHAM RECON // ELEVATION 412M';
        if (pStep1) pStep1.classList.add('is-active');
        if (pStep2) pStep2.classList.remove('is-active');
        if (pStep3) pStep3.classList.remove('is-active');
      } else if (p < 0.72) {
        currentStage = 2;
        if (prologueCrouch) prologueCrouch.classList.remove('is-visible');
        if (prologueStand) prologueStand.classList.add('is-visible');
        if (prologueStatus) prologueStatus.textContent = 'GOTHAM ROOFTOP APEX // ELEVATION 280M';
        if (pStep1) pStep1.classList.remove('is-active');
        if (pStep2) pStep2.classList.add('is-active');
        if (pStep3) pStep3.classList.remove('is-active');
      } else {
        currentStage = 3;
        // Dissolve both figures gracefully into the hero vista
        const fadeOut = Math.max(0, 1 - (p - 0.72) / 0.28);
        if (prologueCrouch) {
          prologueCrouch.classList.remove('is-visible');
          prologueCrouch.style.opacity = '0';
        }
        if (prologueStand) {
          prologueStand.style.opacity = `${fadeOut}`;
        }
        if (prologueStatus) prologueStatus.textContent = 'ARKHAM CITY GRID // INFILTRATION';
        if (pStep1) pStep1.classList.remove('is-active');
        if (pStep2) pStep2.classList.remove('is-active');
        if (pStep3) pStep3.classList.add('is-active');
      }

      // If crossed into new stage via scroll, fire instant dramatic lightning
      if (currentStage !== lastStage) {
        lastStage = currentStage;
        triggerLightning();
      }

      pCtx.clearRect(0, 0, pWidth, pHeight);

      const elapsed = (timestamp - pStartTime) / 1000;

      // 1. Storm Cloud Layers (Upper 60% of sky)
      if (pWidth > 0 && pHeight > 0) {
        const cloudCount = 4;
        for (let i = 0; i < cloudCount; i++) {
          const cx = ((elapsed * 12 * (i + 1) * 0.3) % (pWidth + 600)) - 300;
          const cy = pHeight * (0.08 + i * 0.08);
          const cr = pHeight * 0.35 + i * 40;
          const cg = pCtx.createRadialGradient(cx, cy, 20, cx, cy, cr);
          cg.addColorStop(0, 'rgba(20, 28, 40, 0.45)');
          cg.addColorStop(0.5, 'rgba(12, 17, 26, 0.28)');
          cg.addColorStop(1, 'rgba(0, 0, 0, 0)');
          pCtx.fillStyle = cg;
          pCtx.beginPath();
          pCtx.arc(cx, cy, cr, 0, Math.PI * 2);
          pCtx.fill();
        }
      }

      // 2. Colossal Volumetric Bat-Signal (Capullo Reference)
      if (pWidth > 0 && pHeight > 0) {
        const sigOriginX = pWidth * 0.3;
        const sigOriginY = pHeight * 1.05;
        const sigTargetX = pWidth * 0.68 + Math.sin(elapsed * 0.25) * 20;
        const sigTargetY = pHeight * 0.22 + Math.cos(elapsed * 0.2) * 10;
        const sigRadius = Math.min(pWidth * 0.16, 120);

        // Volumetric Cone
        const angle = Math.atan2(sigTargetY - sigOriginY, sigTargetX - sigOriginX);
        const dist = Math.hypot(sigTargetX - sigOriginX, sigTargetY - sigOriginY);
        const spread = 0.15;

        const coneGrad = pCtx.createLinearGradient(sigOriginX, sigOriginY, sigTargetX, sigTargetY);
        coneGrad.addColorStop(0, 'rgba(255, 245, 220, 0.28)');
        coneGrad.addColorStop(0.3, 'rgba(230, 240, 255, 0.12)');
        coneGrad.addColorStop(0.8, 'rgba(180, 215, 255, 0.04)');
        coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        pCtx.beginPath();
        pCtx.moveTo(sigOriginX, sigOriginY);
        pCtx.lineTo(sigOriginX + Math.cos(angle - spread) * dist * 1.1, sigOriginY + Math.sin(angle - spread) * dist * 1.1);
        pCtx.lineTo(sigOriginX + Math.cos(angle + spread) * dist * 1.1, sigOriginY + Math.sin(angle + spread) * dist * 1.1);
        pCtx.closePath();
        pCtx.fillStyle = coneGrad;
        pCtx.fill();

        // Moonlight / Halogen Halo in Storm Clouds
        const haloGrad = pCtx.createRadialGradient(sigTargetX, sigTargetY, 5, sigTargetX, sigTargetY, sigRadius * 1.6);
        haloGrad.addColorStop(0, 'rgba(255, 252, 240, 0.75)');
        haloGrad.addColorStop(0.35, 'rgba(240, 248, 255, 0.35)');
        haloGrad.addColorStop(0.7, 'rgba(160, 205, 245, 0.08)');
        haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        pCtx.beginPath();
        pCtx.arc(sigTargetX, sigTargetY, sigRadius * 1.6, 0, Math.PI * 2);
        pCtx.fillStyle = haloGrad;
        pCtx.fill();

        // Bat Silhouette Emblem inside Signal Halo
        pCtx.save();
        pCtx.translate(sigTargetX, sigTargetY);
        const scale = (sigRadius / 50) * (1 + Math.sin(elapsed * 1.4) * 0.03);
        pCtx.scale(scale, scale);
        pCtx.fillStyle = '#020304';
        pCtx.beginPath();
        // Canonical comic bat emblem path
        pCtx.moveTo(0, -18);
        pCtx.bezierCurveTo(4, -13, 8, -12, 16, -15);
        pCtx.bezierCurveTo(24, -12, 38, 2, 32, 14);
        pCtx.bezierCurveTo(24, 8, 14, 18, 0, 24);
        pCtx.bezierCurveTo(-14, 18, -24, 8, -32, 14);
        pCtx.bezierCurveTo(-38, 2, -24, -12, -16, -15);
        pCtx.bezierCurveTo(-8, -12, -4, -13, 0, -18);
        pCtx.closePath();
        pCtx.fill();
        pCtx.restore();
      }

      // 3. Lightning Bolts (Procedural Jagged Branches)
      if (lightningActive) {
        const lElapsed = timestamp - lightningStartTime;
        if (lElapsed < 320) {
          const lAlpha = Math.max(0, 1 - lElapsed / 320);
          pCtx.save();
          pCtx.strokeStyle = `rgba(230, 245, 255, ${lAlpha})`;
          pCtx.lineWidth = 2.4;
          pCtx.shadowColor = '#00d4ff';
          pCtx.shadowBlur = 12;

          for (let i = 0; i < lightningBolts.length; i++) {
            const b = lightningBolts[i];
            pCtx.beginPath();
            pCtx.moveTo(b.x1, b.y1);
            pCtx.lineTo(b.x2, b.y2);
            pCtx.stroke();
          }
          pCtx.restore();
        } else {
          lightningActive = false;
        }
      }

      // 4. Flocking Bats Particle Swarm
      for (let i = 0; i < NUM_BATS; i++) {
        const bat = bats[i];
        if (isMotionActive) {
          bat.x += bat.vx;
          bat.y += bat.vy;
          bat.wingPhase += bat.wingSpeed;

          // Wrap screen bounds
          if (bat.x < -40) bat.x = pWidth + 30;
          else if (bat.x > pWidth + 40) bat.x = -30;
          if (bat.y < -40) bat.y = pHeight * 0.7;
          else if (bat.y > pHeight * 0.75) bat.y = -30;

          // Gentle ambient steering
          bat.vy += (Math.random() - 0.5) * 0.15;
          bat.vx += (Math.random() - 0.48) * 0.15;
          bat.vx = Math.max(-3, Math.min(3, bat.vx));
          bat.vy = Math.max(-2, Math.min(2, bat.vy));
        }

        // Draw bat silhouette with beating wings
        const wingFlap = Math.sin(bat.wingPhase) * (bat.size * 0.8);
        pCtx.save();
        pCtx.translate(bat.x, bat.y);
        pCtx.fillStyle = '#000000';
        pCtx.beginPath();
        pCtx.moveTo(0, 0);
        pCtx.lineTo(-bat.size, -wingFlap);
        pCtx.lineTo(-bat.size * 0.5, 0);
        pCtx.lineTo(0, bat.size * 0.4);
        pCtx.lineTo(bat.size * 0.5, 0);
        pCtx.lineTo(bat.size, -wingFlap);
        pCtx.closePath();
        pCtx.fill();
        pCtx.restore();
      }
    };

    requestAnimationFrame(renderPrologue);
  }

  /* ----------------------------------------------------------------------
     Wayne Applied Sciences — Arkham City Hero Atmospheric VFX
     Fixed global snowfall, ash embers, dual sweeping volumetric searchlights,
     scroll wind dynamics, and 3D cursor parallax
  ---------------------------------------------------------------------- */
  const arkhamCanvas = document.getElementById('arkham-canvas');
  const heroSection = document.getElementById('hero');
  const arkhamPerch = document.querySelector('.arkham-perch');
  const arkhamSkyline = document.querySelector('.arkham-skyline');

  if (arkhamCanvas && arkhamCanvas.getContext) {
    const aCtx = arkhamCanvas.getContext('2d');
    let cWidth = window.innerWidth;
    let cHeight = window.innerHeight;

    const resizeArkhamCanvas = () => {
      cWidth = window.innerWidth;
      cHeight = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      arkhamCanvas.width = cWidth * dpr;
      arkhamCanvas.height = cHeight * dpr;
      aCtx.setTransform(1, 0, 0, 1, 0, 0);
      aCtx.scale(dpr, dpr);
    };

    resizeArkhamCanvas();
    window.addEventListener('resize', resizeArkhamCanvas, { passive: true });

    // Occluder Tiles (Photos, Graphs, Hardware Cards) under which searchlights pass
    const TILE_SELECTORS = [
      '.hero__frame',
      '.machine__frame',
      '.gallery__card',
      '.chip-table-wrap',
      '.bandwidth',
      '.workload',
      '.die',
      '.proof__hero',
      '.bench',
      '.spec-table',
      '.model',
      '.outro'
    ].join(',');
    let occluderElements = [];
    const refreshOccluders = () => {
      occluderElements = Array.from(document.querySelectorAll(TILE_SELECTORS));
    };
    refreshOccluders();
    window.addEventListener('resize', refreshOccluders, { passive: true });

    // Snowflakes (150 multi-depth particles drifting across full viewport)
    const NUM_SNOW = 150;
    const snowflakes = [];
    for (let i = 0; i < NUM_SNOW; i++) {
      snowflakes.push({
        x: Math.random() * (cWidth || 1200),
        y: Math.random() * (cHeight || 800),
        radius: Math.random() * 2.2 + 0.6,
        alpha: Math.random() * 0.6 + 0.25,
        speedY: Math.random() * 1.3 + 0.6,
        windDrift: Math.random() * 0.8 + 0.2,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 1.5 + 0.8
      });
    }

    // Ash Embers (28 glowing particles drifting upward from urban floor)
    const NUM_EMBERS = 28;
    const embers = [];
    for (let i = 0; i < NUM_EMBERS; i++) {
      embers.push({
        x: Math.random() * (cWidth || 1200),
        y: (cHeight || 800) + Math.random() * 120,
        radius: Math.random() * 1.8 + 0.8,
        speedY: -(Math.random() * 0.9 + 0.4),
        speedX: (Math.random() - 0.5) * 0.6,
        alpha: Math.random() * 0.7 + 0.2,
        maxLife: Math.random() * 220 + 110,
        life: Math.random() * 110
      });
    }

    // Mouse Parallax coordinates (smoothed with spring interpolation)
    let currentMx = 0;
    let currentMy = 0;
    let targetMx = 0;
    let targetMy = 0;

    window.addEventListener('mousemove', (e) => {
      targetMx = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMy = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    // Scroll Velocity Wind Draft
    let lastScrollY = window.scrollY || window.pageYOffset || 0;
    let scrollVelocity = 0;

    window.addEventListener('scroll', () => {
      const currentY = window.scrollY || window.pageYOffset || 0;
      scrollVelocity = currentY - lastScrollY;
      lastScrollY = currentY;
    }, { passive: true });

    let vfxStartTime = performance.now();

    const renderArkhamVFX = (timestamp) => {
      requestAnimationFrame(renderArkhamVFX);

      if (document.hidden) return;

      // Check motion preference
      const isMotionActive = motionEnabled && !prefersReducedMotion();

      // Smooth parallax damping
      currentMx += (targetMx - currentMx) * 0.08;
      currentMy += (targetMy - currentMy) * 0.08;

      // Smooth scroll velocity damping
      scrollVelocity *= 0.91;
      const scrollDraft = Math.max(-5, Math.min(9, scrollVelocity * 0.14));

      if (isMotionActive) {
        if (arkhamPerch) {
          arkhamPerch.style.transform = `translate3d(${currentMx * -10}px, ${currentMy * -6}px, 0) rotateY(${currentMx * 2}deg) rotateX(${currentMy * -1.5}deg)`;
        }
        if (arkhamSkyline) {
          arkhamSkyline.style.transform = `translate3d(${currentMx * 8}px, ${currentMy * 3}px, 0)`;
        }
      }

      aCtx.clearRect(0, 0, cWidth, cHeight);

      const elapsed = (timestamp - vfxStartTime) / 1000;

      // 1. Draw Dual Volumetric Searchlights
      if (isMotionActive && cWidth > 0 && cHeight > 0) {
        // Searchlight 1: Anchor Left Horizon
        const sl1X = cWidth * 0.22;
        const sl1Y = cHeight * 0.88;
        const sl1Angle = -0.75 + Math.sin(elapsed * 0.32) * 0.42;
        const sl1Len = cHeight * 1.35;
        const sl1Spread = 0.16;

        const g1 = aCtx.createRadialGradient(sl1X, sl1Y, 10, sl1X + Math.cos(sl1Angle) * sl1Len * 0.5, sl1Y + Math.sin(sl1Angle) * sl1Len * 0.5, sl1Len * 0.8);
        g1.addColorStop(0, 'rgba(215, 230, 255, 0.14)');
        g1.addColorStop(0.35, 'rgba(160, 195, 240, 0.06)');
        g1.addColorStop(0.8, 'rgba(120, 160, 210, 0.012)');
        g1.addColorStop(1, 'rgba(0, 0, 0, 0)');

        aCtx.beginPath();
        aCtx.moveTo(sl1X, sl1Y);
        aCtx.lineTo(sl1X + Math.cos(sl1Angle - sl1Spread) * sl1Len, sl1Y + Math.sin(sl1Angle - sl1Spread) * sl1Len);
        aCtx.lineTo(sl1X + Math.cos(sl1Angle + sl1Spread) * sl1Len, sl1Y + Math.sin(sl1Angle + sl1Spread) * sl1Len);
        aCtx.closePath();
        aCtx.fillStyle = g1;
        aCtx.fill();

        // Searchlight 2: Anchor Right Horizon
        const sl2X = cWidth * 0.78;
        const sl2Y = cHeight * 0.92;
        const sl2Angle = -2.35 + Math.cos(elapsed * 0.26) * 0.38;
        const sl2Len = cHeight * 1.45;
        const sl2Spread = 0.18;

        const g2 = aCtx.createRadialGradient(sl2X, sl2Y, 10, sl2X + Math.cos(sl2Angle) * sl2Len * 0.5, sl2Y + Math.sin(sl2Angle) * sl2Len * 0.5, sl2Len * 0.8);
        g2.addColorStop(0, 'rgba(215, 230, 255, 0.13)');
        g2.addColorStop(0.35, 'rgba(160, 195, 240, 0.05)');
        g2.addColorStop(0.8, 'rgba(120, 160, 210, 0.01)');
        g2.addColorStop(1, 'rgba(0, 0, 0, 0)');

        aCtx.beginPath();
        aCtx.moveTo(sl2X, sl2Y);
        aCtx.lineTo(sl2X + Math.cos(sl2Angle - sl2Spread) * sl2Len, sl2Y + Math.sin(sl2Angle - sl2Spread) * sl2Len);
        aCtx.lineTo(sl2X + Math.cos(sl2Angle + sl2Spread) * sl2Len, sl2Y + Math.sin(sl2Angle + sl2Spread) * sl2Len);
        aCtx.closePath();
        aCtx.fillStyle = g2;
        aCtx.fill();

        // 1.5. Dynamic Tile Occlusion for Searchlight Beams
        // Lighthouse beams pass UNDER solid tiles (photos, graphs, hardware cards).
        // If a tile cuts off only half of the beam, the remaining half shines uninterrupted in the night sky.
        // Editorial text, titles, and ambient space remain illuminated by the beam.
        if (occluderElements.length > 0) {
          aCtx.save();
          aCtx.globalCompositeOperation = 'destination-out';
          aCtx.fillStyle = '#000000';
          for (let i = 0; i < occluderElements.length; i++) {
            const rect = occluderElements[i].getBoundingClientRect();
            if (rect.bottom > 0 && rect.top < cHeight && rect.right > 0 && rect.left < cWidth) {
              aCtx.fillRect(rect.left, rect.top, rect.width, rect.height);
            }
          }
          const openDrawer = document.querySelector('.soundtrack-drawer.is-open');
          if (openDrawer) {
            const dRect = openDrawer.getBoundingClientRect();
            if (dRect.bottom > 0 && dRect.top < cHeight && dRect.right > 0 && dRect.left < cWidth) {
              aCtx.fillRect(dRect.left, dRect.top, dRect.width, dRect.height);
            }
          }
          const activeTooltip = document.querySelector('.pin[aria-expanded="true"] .pin__tooltip');
          if (activeTooltip) {
            const tRect = activeTooltip.getBoundingClientRect();
            if (tRect.bottom > 0 && tRect.top < cHeight && tRect.right > 0 && tRect.left < cWidth) {
              aCtx.fillRect(tRect.left, tRect.top, tRect.width, tRect.height);
            }
          }
          aCtx.restore();
        }
      }

      // 2. Snowflakes (Full Viewport with Scroll Drift)
      for (let i = 0; i < NUM_SNOW; i++) {
        const s = snowflakes[i];
        if (isMotionActive) {
          s.y += s.speedY + scrollDraft;
          s.x += Math.sin(elapsed * s.swaySpeed + s.swayPhase) * s.windDrift + (scrollDraft * 0.2);
          if (s.y > cHeight + 10) {
            s.y = -10;
            s.x = Math.random() * cWidth;
          } else if (s.y < -10) {
            s.y = cHeight + 10;
            s.x = Math.random() * cWidth;
          }
          if (s.x > cWidth + 10) s.x = -10;
          else if (s.x < -10) s.x = cWidth + 10;
        }

        aCtx.beginPath();
        aCtx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        aCtx.fillStyle = `rgba(230, 237, 241, ${s.alpha})`;
        aCtx.fill();
      }

      // 3. Ash Embers (Rising with Scroll Reaction)
      for (let i = 0; i < NUM_EMBERS; i++) {
        const em = embers[i];
        if (isMotionActive) {
          em.y += em.speedY - (scrollDraft * 0.35);
          em.x += em.speedX + Math.sin(elapsed * 2 + i) * 0.3;
          em.life++;

          if (em.life > em.maxLife || em.y < 0) {
            em.y = cHeight + Math.random() * 40;
            em.x = Math.random() * cWidth;
            em.life = 0;
            em.maxLife = Math.random() * 220 + 110;
          } else if (em.y > cHeight + 60) {
            em.y = 0;
            em.x = Math.random() * cWidth;
          }
        }

        const lifeRatio = 1 - (em.life / em.maxLife);
        const emberAlpha = Math.max(0, em.alpha * lifeRatio);

        aCtx.beginPath();
        aCtx.arc(em.x, em.y, em.radius, 0, Math.PI * 2);
        aCtx.fillStyle = `rgba(225, 45, 20, ${emberAlpha})`;
        aCtx.shadowColor = '#e10600';
        aCtx.shadowBlur = 6;
        aCtx.fill();
        aCtx.shadowBlur = 0;
      }
    };

    requestAnimationFrame(renderArkhamVFX);
  }

  /* ----------------------------------------------------------------------
     Wayne Applied Sciences — Arkham City Menu Controller
     Laser reticle tracking, chromatic glitch, audio chime, and soundtrack sync
  ---------------------------------------------------------------------- */
  const arkhamMenu = document.querySelector('.arkham-menu');
  const arkhamReticle = document.getElementById('arkham-reticle');
  const arkhamMenuItems = document.querySelectorAll('.arkham-menu__item');

  if (arkhamMenu && arkhamReticle && arkhamMenuItems.length > 0) {
    const positionReticle = (item) => {
      if (!item) {
        arkhamReticle.classList.remove('is-visible');
        return;
      }
      const itemTop = item.offsetTop;
      const itemHeight = item.offsetHeight;
      arkhamReticle.style.transform = `translateY(${itemTop}px)`;
      arkhamReticle.style.height = `${itemHeight}px`;
      arkhamReticle.classList.add('is-visible');
    };

    // Position on active item initially
    const activeInitial = arkhamMenu.querySelector('.arkham-menu__item.is-active') || arkhamMenuItems[0];
    if (activeInitial) {
      setTimeout(() => positionReticle(activeInitial), 100);
    }

    arkhamMenuItems.forEach((item) => {
      // Hover interaction
      item.addEventListener('mouseenter', () => {
        positionReticle(item);
        wayneAudio.play('click');
        triggerHaptic(10);
        item.classList.add('is-glitching');
        setTimeout(() => item.classList.remove('is-glitching'), 280);
      });

      // Keyboard focus
      item.addEventListener('focus', () => {
        positionReticle(item);
        wayneAudio.play('click');
        triggerHaptic(10);
        item.classList.add('is-glitching');
        setTimeout(() => item.classList.remove('is-glitching'), 280);
      });

      // Click: trigger tactical chime, haptic, and auto-engage soundtrack!
      item.addEventListener('click', () => {
        wayneAudio.play('chirp');
        triggerHaptic(16);

        arkhamMenuItems.forEach((m) => m.classList.remove('is-active'));
        item.classList.add('is-active');

        // Engage background soundtrack if not playing
        if (!isSoundtrackPlaying) {
          userGestureReceived = true;
          playCurrentSoundtrack();
        }
      });
    });

    // When mouse leaves menu container, return reticle to active item
    arkhamMenu.addEventListener('mouseleave', () => {
      const currentActive = arkhamMenu.querySelector('.arkham-menu__item.is-active');
      if (currentActive) positionReticle(currentActive);
    });
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
