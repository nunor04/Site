const { app, BrowserWindow, WebContentsView, session, shell } = require("electron");
const fs = require("fs");
const path = require("path");

// Speed: make sure the GPU is used for rendering and compositing.
app.commandLine.appendSwitch("ignore-gpu-blocklist");
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");

// Pretend to be an iPhone so Instagram serves its mobile layout.
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

  const win = new BrowserWindow({
    width: 480,
    height: 900,
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

  const volumeScript = fs.readFileSync(path.join(__dirname, "volume.js"), "utf8");
  const inject = () => wc.executeJavaScript(volumeScript).catch(() => {});
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
