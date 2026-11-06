// Scrolly Kirk: "Most viewed" for profiles. Reads the view counts Instagram already shows
// on each reel thumbnail and lists the reels sorted from most to least viewed.
(function () {
  if (window.__skMostViewed) return;
  window.__skMostViewed = true;

  const RESERVED = ["explore", "reels", "reel", "p", "direct", "accounts", "stories", "tv", "web", "about"];

  function parseCount(text) {
    let s = String(text).trim().toLowerCase().replace(/\s+/g, "");
    const m = s.match(/^([\d.,]+)([kmb])?$/);
    if (!m) return null;
    let num = m[1];
    if (m[2]) num = num.replace(",", "."); // "1,2M" -> 1.2M
    else num = num.replace(/[.,]/g, ""); // "1,234" / "1.234" -> 1234
    const n = parseFloat(num);
    if (isNaN(n)) return null;
    return Math.round(n * ({ k: 1e3, m: 1e6, b: 1e9 }[m[2]] || 1));
  }

  // Find the first piece of text in a tile that looks like a count ("1.2M", "45K", "1,234").
  function tileCount(a) {
    const walker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const t = node.nodeValue.trim();
      if (t && t.length <= 8) {
        const n = parseCount(t);
        if (n !== null) return { n: n, label: t };
      }
    }
    return null;
  }

  function collect() {
    const seen = new Map();
    document.querySelectorAll('a[href*="/reel/"]').forEach(function (a) {
      const m = a.getAttribute("href").match(/\/reel\/([^/?#]+)/);
      if (!m || seen.has(m[1])) return;
      const c = tileCount(a);
      const img = a.querySelector("img");
      seen.set(m[1], { href: a.href, n: c ? c.n : -1, label: c ? c.label : "?", img: img ? img.src : "" });
    });
    return Array.from(seen.values());
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function loadAll(onProgress) {
    let stable = 0, last = -1;
    for (let i = 0; i < 40 && stable < 3; i++) {
      window.scrollTo(0, document.documentElement.scrollHeight);
      document.querySelectorAll("main, [role=main]").forEach(function (el) { el.scrollTop = el.scrollHeight; });
      await wait(900);
      const n = document.querySelectorAll('a[href*="/reel/"]').length;
      onProgress(n);
      stable = n === last ? stable + 1 : 0;
      last = n;
    }
    window.scrollTo(0, 0);
  }

  const style = document.createElement("style");
  style.textContent = `
    #sk-mv-btn { position: fixed; right: 12px; bottom: 80px; z-index: 2147483645; display: none;
      padding: 8px 14px; border: 0; border-radius: 999px; background: rgba(0,0,0,.7); color: #fff;
      font: 600 14px sans-serif; cursor: pointer; }
    #sk-mv-btn:focus-visible, #sk-mv-close:focus-visible, .sk-mv-tile:focus-visible {
      outline: 2px solid #fff; outline-offset: 2px; }
    #sk-mv { position: fixed; inset: 0; z-index: 2147483647; background: #000; color: #fff;
      overflow-y: auto; font: 14px sans-serif; display: none; }
    #sk-mv header { position: sticky; top: 0; display: flex; align-items: center; gap: 12px;
      padding: 12px; background: #000; font-weight: 600; }
    #sk-mv-close { margin-left: auto; border: 0; background: #262626; color: #fff;
      border-radius: 8px; padding: 6px 12px; cursor: pointer; font: inherit; }
    #sk-mv-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; padding: 0 2px 12px; }
    .sk-mv-tile { position: relative; display: block; aspect-ratio: 9 / 16; background: #111; }
    .sk-mv-tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .sk-mv-rank { position: absolute; top: 4px; left: 6px; font-weight: 700; text-shadow: 0 0 4px #000; }
    .sk-mv-count { position: absolute; bottom: 4px; left: 6px; font-weight: 700; text-shadow: 0 0 4px #000; }
  `;
  document.documentElement.appendChild(style);

  const btn = document.createElement("button");
  btn.id = "sk-mv-btn";
  btn.type = "button";
  btn.textContent = "Most viewed";
  document.documentElement.appendChild(btn);

  const panel = document.createElement("div");
  panel.id = "sk-mv";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Most viewed reels");
  panel.innerHTML = '<header><span id="sk-mv-title"></span><button id="sk-mv-close" type="button">Close</button></header><div id="sk-mv-grid"></div>';
  document.documentElement.appendChild(panel);
  const title = panel.querySelector("#sk-mv-title");
  const grid = panel.querySelector("#sk-mv-grid");
  const closeBtn = panel.querySelector("#sk-mv-close");

  function close() {
    panel.style.display = "none";
    btn.focus();
  }
  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.style.display === "block") close();
  });

  let busy = false;
  btn.addEventListener("click", async function () {
    if (busy) return;
    busy = true;
    panel.style.display = "block";
    grid.textContent = "";
    title.textContent = "Loading reels…";
    closeBtn.focus();
    await loadAll(function (n) { title.textContent = "Loading reels… " + n; });
    const items = collect().filter(function (i) { return i.n >= 0; }).sort(function (a, b) { return b.n - a.n; });
    busy = false;
    if (!items.length) {
      title.textContent = "No view counts found. Open the Reels tab of a profile and try again.";
      return;
    }
    title.textContent = "Most viewed (" + items.length + " reels)";
    items.forEach(function (it, i) {
      const a = document.createElement("a");
      a.className = "sk-mv-tile";
      a.href = it.href;
      a.setAttribute("aria-label", "Rank " + (i + 1) + ", " + it.label + " views");
      if (it.img) {
        const img = document.createElement("img");
        img.src = it.img;
        img.alt = "";
        a.appendChild(img);
      }
      const r = document.createElement("span");
      r.className = "sk-mv-rank";
      r.textContent = "#" + (i + 1);
      const c = document.createElement("span");
      c.className = "sk-mv-count";
      c.textContent = "▶ " + it.label;
      a.appendChild(r);
      a.appendChild(c);
      grid.appendChild(a);
    });
  });

  function onProfile() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (!parts.length || RESERVED.indexOf(parts[0]) !== -1) return false;
    return parts.length === 1 || (parts.length === 2 && parts[1] === "reels");
  }
  setInterval(function () {
    const show = onProfile() && !!document.querySelector('a[href*="/reel/"]');
    btn.style.display = show ? "block" : "none";
  }, 500);
})();
