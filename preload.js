const { contextBridge, ipcRenderer } = require("electron");

// Lets the injected volume control mute the whole page at the app level,
// which works even when Instagram fights the <video> element's own mute state.
contextBridge.exposeInMainWorld("skAudio", {
  setMuted: (muted) => ipcRenderer.send("sk-mute", !!muted),
});
