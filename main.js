const { app, BrowserWindow, WebContentsView, screen, session, shell } = require("electron");
const fs = require("fs");
const path = require("path");

// Speed: make sure the GPU is used for rendering and compositing.
app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");

// Identify as an iPhone: Instagram serves its mobile layout with normal links.
// (An Android identity makes Instagram turn profile tiles into "open the Android app" links.)
const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

// The phone column never gets wider than this, so in full screen it stays
// centered and all icons stay lined up instead of stretching across the screen.
const MAX_PHONE_WIDTH = 480;

const ALLOWED_HOSTS = ["instagram.com", "cdninstagram.com", "facebook.com", "fbcdn.net"];

function isAllowed(url) {
  try {
    const host = new URL(url).hostname;
    return ALLOWED_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}

function createWindow() {
  const ses = session.fromPartition("persist:instagram"); // keeps you logged in
  ses.setUserAgent(MOBILE_UA);

  // Stay logged in: Instagram sets some login cookies without an expiry date,
  // and Electron drops those when the app closes. Give them a 1-year expiry,
  // and flush cookies to disk regularly and on quit.
  const ONE_YEAR = 60 * 60 * 24 * 365;
  ses.cookies.on("changed", (_e, cookie, _cause, removed) => {
    if (removed || !cookie.session) return;
    const host = cookie.domain.replace(/^\./, "");
    ses.cookies
      .set({
        url: `https://${host}${cookie.path || "/"}`,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        expirationDate: Math.floor(Date.now() / 1000) + ONE_YEAR,
      })
      .catch(() => {});
  });
  const flush = () => {
    ses.cookies.flushStore().catch(() => {});
    ses.flushStorageData();
  };
  setInterval(flush, 15000);
  app.on("before-quit", flush);

  // Open as a real phone shape (9:19.5) that fits the screen height.
  const work = screen.getPrimaryDisplay().workAreaSize;
  const startH = Math.min(work.height - 40, 1000);
  const startW = Math.max(360, Math.min(Math.round((startH * 9) / 19.5), MAX_PHONE_WIDTH));

  const win = new BrowserWindow({
    width: startW,
    height: startH,
    center: true,
    minWidth: 360,
    title: "Scrolly Kirk",
    backgroundColor: "#000000",
    autoHideMenuBar: true,
  });

  const view = new WebContentsView({
    webPreferences: {
      session: ses,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });
  win.contentView.addChildView(view);

  function layout() {
    const [w, h] = win.getContentSize();
    const vw = Math.min(w, MAX_PHONE_WIDTH);
    view.setBounds({ x: Math.round((w - vw) / 2), y: 0, width: vw, height: h });
  }
  layout();
  win.on("resize", layout);
  win.on("enter-full-screen", layout);
  win.on("leave-full-screen", layout);
  win.on("maximize", layout);
  win.on("unmaximize", layout);

  const wc = view.webContents;
  wc.setUserAgent(MOBILE_UA);

  const volumeScript = ["volume.js", "mostviewed.js"]
    .map((f) => fs.readFileSync(path.join(__dirname, "extension", f), "utf8"))
    .join("\n;\n");
  const inject = () => wc.executeJavaScript(volumeScript).catch(() => {});
  // Phone-style: no scrollbars, no sideways scrolling.
  const hideBars = () =>
    wc
      .insertCSS(
        "html, body { overflow-x: hidden !important; } " +
          "::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }"
      )
      .catch(() => {});
  wc.on("dom-ready", hideBars);
  wc.on("dom-ready", inject);
  wc.on("did-navigate-in-page", inject);

  // Links to other sites open in your normal browser.
  wc.setWindowOpenHandler(({ url }) => {
    if (isAllowed(url)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });
  wc.on("will-navigate", (e, url) => {
    if (!isAllowed(url)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  wc.loadURL("https://www.instagram.com/");
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
