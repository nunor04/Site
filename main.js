const { app, BrowserWindow, shell } = require("electron");

// Pretend to be an iPhone so Instagram serves its mobile layout.
const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

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
  const win = new BrowserWindow({
    width: 430,
    height: 900,
    minWidth: 360,
    title: "Scrolly Kirk",
    autoHideMenuBar: true,
    webPreferences: {
      partition: "persist:instagram", // keeps you logged in between launches
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setUserAgent(MOBILE_UA);

  // Links to other sites open in your normal browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowed(url)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!isAllowed(url)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  win.loadURL("https://www.instagram.com/");
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
