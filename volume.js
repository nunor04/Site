// Injected into Instagram pages: adds an accessible volume slider + mute button on Reels.
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

  let volume = load("sk_volume", 1);
  let muted = load("sk_muted", false);

  const style = document.createElement("style");
  style.textContent = `
    #sk-vol { position: fixed; right: 8px; top: 50%; transform: translateY(-50%);
      z-index: 2147483647; display: none; flex-direction: column; align-items: center;
      gap: 8px; padding: 10px 6px; border-radius: 22px; background: rgba(0,0,0,.6);
      color: #fff; font: 16px sans-serif; }
    #sk-vol button { all: unset; cursor: pointer; font-size: 20px; line-height: 1;
      padding: 4px; border-radius: 8px; }
    #sk-vol input { writing-mode: vertical-lr; direction: rtl; height: 120px; width: 28px;
      margin: 0; cursor: pointer; accent-color: #fff; }
    #sk-vol button:focus-visible, #sk-vol input:focus-visible { outline: 2px solid #fff;
      outline-offset: 2px; }
  `;
  document.documentElement.appendChild(style);

  const box = document.createElement("div");
  box.id = "sk-vol";
  box.setAttribute("role", "group");
  box.setAttribute("aria-label", "Reel volume");

  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Mute");

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "100";
  slider.step = "5";
  slider.setAttribute("aria-label", "Volume");
  slider.setAttribute("aria-orientation", "vertical");

  box.appendChild(btn);
  box.appendChild(slider);
  document.documentElement.appendChild(box);

  // Keep clicks on the control from pausing/skipping the reel underneath.
  ["click", "pointerdown", "pointerup", "touchstart", "dblclick"].forEach(function (t) {
    box.addEventListener(t, function (e) { e.stopPropagation(); });
  });

  function render() {
    slider.value = String(Math.round(volume * 100));
    slider.setAttribute("aria-valuetext", Math.round(volume * 100) + " percent" + (muted ? ", muted" : ""));
    btn.textContent = muted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊";
    btn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
    btn.setAttribute("aria-pressed", String(muted));
    apply();
  }

  let lastSentMute = null;
  function apply() {
    if (lastSentMute !== muted && window.skAudio) {
      window.skAudio.setMuted(muted);
      lastSentMute = muted;
    }
    document.querySelectorAll("video, audio").forEach(function (v) {
      if (v.muted !== muted) v.muted = muted;
      if (Math.abs(v.volume - volume) > 0.001) v.volume = volume;
    });
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    if (volume > 0) muted = false;
    save("sk_volume", volume);
    save("sk_muted", muted);
    render();
  }
  function toggleMute() {
    muted = !muted;
    if (!muted && volume === 0) volume = 0.5;
    save("sk_volume", volume);
    save("sk_muted", muted);
    render();
  }

  slider.addEventListener("input", function () { setVolume(Number(slider.value) / 100); });
  btn.addEventListener("click", toggleMute);

  // Keyboard: M = mute, Alt+Up / Alt+Down = volume.
  document.addEventListener("keydown", function (e) {
    const t = e.target;
    const typing = t && (t.tagName === "TEXTAREA" || t.isContentEditable ||
      (t.tagName === "INPUT" && t !== slider));
    if (typing) return;
    if ((e.key === "m" || e.key === "M") && !e.ctrlKey && !e.metaKey && !e.altKey) {
      toggleMute();
    } else if (e.altKey && e.key === "ArrowUp") {
      e.preventDefault();
      setVolume(volume + 0.1);
    } else if (e.altKey && e.key === "ArrowDown") {
      e.preventDefault();
      setVolume(volume - 0.1);
    }
  });

  // Instagram resets volume/mute on each new reel, so keep re-applying.
  setInterval(function () {
    // Show on any page that has a video (reels, feed, stories, profiles).
    const hasVideo = !!document.querySelector("video");
    box.style.display = hasVideo ? "flex" : "none";
    apply();
  }, 300);

  render();
})();
