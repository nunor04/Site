# Scrolly Kirk

Instagram with our modifications.

- **Desktop app** (`main.js`): Instagram in a phone-style window. Run `npm install` once, then `npm start` (Windows PowerShell: `npm.cmd start`).
- **Browser extension** (`extension/`): the same modifications in Chrome, Edge or Brave. Open `chrome://extensions`, turn on Developer mode, click **Load unpacked** and pick the `extension` folder.

Versions follow MAJOR.MINOR.MICRO. See [CHANGELOG.md](CHANGELOG.md).

Never commit API keys: keep them in a `.env` file, which is git-ignored.
