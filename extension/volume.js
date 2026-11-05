// Scrolly Kirk: a quiet, per-video volume control for Instagram.
// Shared by the desktop app (main.js injects it) and the browser extension.
(function () {
  if (window.__skVolume) return;
  window.__skVolume = true;

  function load(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }
  const clamp = (n) => Math.max(0, Math.min(1, n));

  // Level new videos start at (the last non-zero level you chose).
  let lastLevel = clamp(load("sk_volume", 1)) || 1;

  const style = document.createElement("style");
  style.textContent = `
    .sk-vol { position: fixed; z-index: 2147483646; display: flex; flex-direction: column;
      align-items: center; gap: 6px; padding: 8px 5px; border-radius: 14px;
      background: rgba(0,0,0,.45); color: #fff; font: 13px sans-serif;
      opacity: 0; pointer-events: none; transition: opacity .25s ease; }
    .sk-vol.sk-show { opacity: 1; pointer-events: auto; }
    .sk-vol .sk-ico { line-height: 1; user-select: none; }
    .sk-vol input { writing-mode: vertical-lr; direction: rtl; height: 80px; width: 14px;
      margin: 0; cursor: pointer; accent-color: #fff; }
    .sk-vol input:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
  `;
  document.documentElement.appendChild(style);

  const controls = new Map(); // video -> { box, slider, icon }
  const levels = new WeakMap(); // video -> level you chose for that video
  let lastMove = { t: 0, x: -1, y: -1 };
  let flashUntil = 0;
  let current = null;

  function icon(level) {
    return level === 0 ? "🔇" : level < 0.5 ? "🔉" : "🔊";
  }
  function effective(v) {
    return v.muted ? 0 : v.volume;
  }
  function refresh(c, v) {
    const lvl = effective(v);
    c.slider.value = String(Math.round(lvl * 100));
    c.slider.setAttribute("aria-valuetext", lvl === 0 ? "muted" : Math.round(lvl * 100) + " percent");
    c.icon.textContent = icon(lvl);
  }
  function setLevel(v, level) {
    level = clamp(level);
    levels.set(v, level);
    if (level > 0) {
      lastLevel = level;
      save("sk_volume", level);
    }
    v.volume = level;
    v.muted = level === 0;
    const c = controls.get(v);
    if (c) refresh(c, v);
    flashUntil = Date.now() + 1500;
  }
  // Browsers block unmuting before you've interacted with the page.
  function canUnmute() {
    return !navigator.userActivation || navigator.userActivation.hasBeenActive;
  }
  function adopt(v) {
    if (controls.has(v)) return;
    const box = document.createElement("div");
    box.className = "sk-vol";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", "Volume for this video");
    const ico = document.createElement("span");
    ico.className = "sk-ico";
    ico.setAttribute("aria-hidden", "true");
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.step = "5";
    slider.setAttribute("aria-label", "Volume (0 is muted)");
    slider.setAttribute("aria-orientation", "vertical");
    box.appendChild(ico);
    box.appendChild(slider);
    document.documentElement.appendChild(box);
    ["click", "pointerdown", "pointerup", "touchstart", "dblclick"].forEach(function (t) {
      box.addEventListener(t, function (e) { e.stopPropagation(); });
    });
    const c = { box: box, slider: slider, icon: ico };
    controls.set(v, c);
    slider.addEventListener("input", function () { setLevel(v, Number(slider.value) / 100); });
    // Stay in sync if Instagram's own button changes the volume.
    v.addEventListener("volumechange", function () { refresh(c, v); });
    const start = function () {
      if (!levels.has(v) && canUnmute()) setLevel(v, lastLevel);
    };
    v.addEventListener("play", start);
    start();
    refresh(c, v);
  }

  document.addEventListener("pointermove", function (e) {
    lastMove = { t: Date.now(), x: e.clientX, y: e.clientY };
  }, true);

  function tick() {
    const now = Date.now();
    document.querySelectorAll("video").forEach(adopt);
    let best = null, bestArea = 0;
    controls.forEach(function (c, v) {
      if (!v.isConnected) {
        c.box.remove();
        controls.delete(v);
        return;
      }
      const r = v.getBoundingClientRect();
      const vh = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
      const vw = Math.min(r.right, innerWidth) - Math.max(r.left, 0);
      const visible = r.width > 150 && r.height > 150 && vh / r.height > 0.5 && vw > 0;
      if (!visible) {
        c.box.classList.remove("sk-show");
        return;
      }
      c.box.style.left = Math.max(r.left, 0) + 8 + "px";
      c.box.style.top = (Math.max(r.top, 0) + Math.min(r.bottom, innerHeight)) / 2 - 55 + "px";
      const area = vh * vw;
      if (area > bestArea) { bestArea = area; best = v; }
      const overVideo = now - lastMove.t < 2000 &&
        lastMove.x >= r.left && lastMove.x <= r.right && lastMove.y >= r.top && lastMove.y <= r.bottom;
      const active = overVideo || c.box.matches(":hover") || c.box.contains(document.activeElement) ||
        (now < flashUntil && v === current);
      c.box.classList.toggle("sk-show", active);
    });
    current = best;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Keyboard: M = mute/unmute, Alt+Up / Alt+Down = volume, for the video on screen.
  document.addEventListener("keydown", function (e) {
    const t = e.target;
    const typing = t && (t.tagName === "TEXTAREA" || t.isContentEditable ||
      (t.tagName === "INPUT" && t.type !== "range"));
    if (typing || !current) return;
    if ((e.key === "m" || e.key === "M") && !e.ctrlKey && !e.metaKey && !e.altKey) {
      setLevel(current, effective(current) === 0 ? lastLevel : 0);
    } else if (e.altKey && e.key === "ArrowUp") {
      e.preventDefault();
      setLevel(current, effective(current) + 0.1);
    } else if (e.altKey && e.key === "ArrowDown") {
      e.preventDefault();
      setLevel(current, effective(current) - 0.1);
    }
  });
})();
