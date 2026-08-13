(() => {
  const AtlasSound = {
    unlocked: false,
    muted: localStorage.getItem("atlas-muted") === "1",
    loops: {},
    oneshots: {},
    lastHover: 0,
    lastEl: null,

    make(name, loop, vol) {
      const el = new Audio(name + ".wav");
      el.loop = !!loop;
      el.preload = "auto";
      el.volume = vol;
      return el;
    },

    init() {
      this.loops.music = this.make("music", true, 0.22);
      const fx = {
        page: 0.32,
        hover: 0.11,
        drawer: 0.34,
        pin: 0.28,
        latch: 0.34,
        whoosh: 0.28,
        creak: 0.26
      };
      Object.keys(fx).forEach((n) => {
        this.oneshots[n] = this.make(n, false, fx[n]);
      });
      this.syncUi();
      this.unlock();
    },

    play(name) {
      if (this.muted || !this.unlocked) return;
      const el = this.oneshots[name];
      if (!el) return;
      try {
        el.pause();
        el.currentTime = 0;
        const p = el.play();
        if (p) p.catch(() => {});
      } catch (_) {}
    },

    hover() {
      const now = Date.now();
      if (now - this.lastHover < 160) return;
      this.lastHover = now;
      this.play("hover");
    },

    unlock() {
      if (!this.unlocked) this.unlocked = true;
      this.startAmbient();
    },

    startAmbient() {
      if (this.muted || !this.unlocked) return;
      const el = this.loops.music;
      if (!el) return;
      if (!el.paused) return;
      const p = el.play();
      if (p) p.catch(() => {});
    },

    stopAll() {
      Object.values(this.loops).forEach((el) => {
        try { el.pause(); } catch (_) {}
      });
    },

    setMuted(on) {
      this.muted = on;
      localStorage.setItem("atlas-muted", on ? "1" : "0");
      if (on) this.stopAll();
      else this.startAmbient();
      this.syncUi();
    },

    syncUi() {
      const btn = document.getElementById("soundBtn");
      const hint = document.getElementById("soundHint");
      if (!btn) return;
      btn.classList.toggle("is-muted", this.muted);
      btn.setAttribute("aria-pressed", this.muted ? "true" : "false");
      if (hint) hint.textContent = this.muted ? "Muted" : "Sound on";
    }
  };

  window.AtlasSound = AtlasSound;
  AtlasSound.init();

  const wake = () => AtlasSound.unlock();
  window.addEventListener("pointerdown", wake, { passive: true });
  window.addEventListener("keydown", wake, { passive: true });
  window.addEventListener("touchstart", wake, { passive: true });

  document.getElementById("soundBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    AtlasSound.unlock();
    const willMute = !AtlasSound.muted;
    AtlasSound.play(willMute ? "latch" : "page");
    AtlasSound.setMuted(willMute);
  });

  document.addEventListener("mouseover", (e) => {
    const el = e.target.closest("a, button, .folder, .pin, .tab, .drawer, .social, .btn, .horn, .backlink");
    if (!el || el === AtlasSound.lastEl) return;
    AtlasSound.lastEl = el;
    AtlasSound.hover();
  });

  document.addEventListener("click", (e) => {
    const box = e.target.closest("[data-url]");
    if (box) {
      e.preventDefault();
      e.stopPropagation();
      AtlasSound.play("latch");
      const url = box.getAttribute("data-url");
      const win = window.open(url, "_blank", "noopener");
      if (!win) window.location.assign(url);
      return;
    }
    const el = e.target.closest("a, button, .pin, .tab, .drawer, .folder");
    if (!el) return;
    if (el.classList.contains("drawer")) AtlasSound.play("drawer");
    else if (el.classList.contains("pin")) AtlasSound.play("pin");
    else if (el.classList.contains("folder")) AtlasSound.play("page");
    else if (el.classList.contains("tab")) AtlasSound.play("page");
    else if (el.classList.contains("btn") || el.classList.contains("backlink")) AtlasSound.play("page");
    else if (el.closest("nav") || el.classList.contains("mark")) AtlasSound.play("page");
  });

  const gate = document.getElementById("gate");
  if (gate) {
    const close = () => {
      if (gate.dataset.done) return;
      gate.dataset.done = "1";
      AtlasSound.unlock();
      gate.classList.add("is-gone");
      setTimeout(() => gate.remove(), 800);
    };
    window.addEventListener("load", () => setTimeout(close, 1400));
    setTimeout(close, 2200);
  }
})();
