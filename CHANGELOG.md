# Changelog

Versioning follows MAJOR.MINOR.MICRO:

- **MAJOR**: big or breaking changes (redesigns, rewrites)
- **MINOR**: new features that don't break existing ones
- **MICRO**: bug fixes and small tweaks

Every release is also a git tag (`vX.Y.Z`). The version lives in `package.json`.

## 1.7.1
- Secret protection: a pre-commit check blocks API keys, tokens, cookies and secret files; more secret file types are git-ignored.

## 1.7.0
- Bigger window (nearly full screen height) and a wider phone column (up to 560px), in the app and the site popup.
- App starts zoomed out (85%) so more fits and it is easier to navigate. Ctrl+ / Ctrl- / Ctrl+0 adjust the zoom, and it is remembered.

## 1.6.2
- Phone window now opens in a real phone shape (9:19.5) sized to your screen height and centered, in both the app and the site popup.

## 1.6.1
- Fix Most viewed not appearing: the button now shows on every profile, and reels are found by their view-count text instead of /reel/ links.
- Switch back to an iPhone identity: the Android one made Instagram turn profile tiles into open-the-Android-app links.
- Clicking a ranked reel opens the original tile.

## 1.6.0
- Site redesign: animated background, glowing version badge (read live from package.json), 3D phone mockup, scroll and hover effects.

## 1.5.0
- Most viewed: on a profile with reels, a Most viewed button loads the reels and lists them sorted by the view counts Instagram shows (app and extension).

## 1.4.1
- Site: Open Instagram now opens a phone-sized window, so Instagram shows its mobile layout in a normal browser.

## 1.4.0
- Single-file Windows app: run `npm run dist` to build dist/Scrolly-Kirk-<version>.exe, a portable app you double-click (no install, no terminal).

## 1.3.1
- Simplified the site page: install steps are collapsed by default.

## 1.3.0
- Volume control redesigned: a slim bar per video (replaces the single mute button), hidden until you hover the video. Slider at 0 = muted; M mutes, Alt+Up/Down changes volume.
- Browser extension (extension/): the same modifications in Chrome/Edge/Brave on instagram.com. Install steps are on the site page (index.html).
- Keep extension/manifest.json version in sync with package.json.

## 1.2.3
- Hide scrollbars and block sideways scrolling (phone-style).

## 1.2.2
- Stay logged in: login cookies without an expiry now get a 1-year expiry, and cookies are flushed to disk every 15s and on quit.

## 1.2.1
- Volume control now shows on any page with video (feed, stories, reels), not just Reels.
- Mute now works at the app level, so Instagram cannot override it.
- Identify as Chrome on Android instead of a fake iPhone/Safari, to avoid slower video/code paths.

## 1.2.0
- Full screen: the phone column stays centered at a fixed width, so icons and layout stay lined up.
- Reels: added an accessible volume slider and mute button (M = mute, Alt+Up/Down = volume), remembered between launches.
- Speed: GPU rasterization, no background throttling, no spellcheck (best effort).

## 1.1.0
- Phone-style wrapper: a desktop app (Electron) that opens Instagram in a phone-sized window using the mobile layout.
- Login is kept between launches. Links to other sites open in your normal browser.
- Run with `npm install` then `npm start`.

## 1.0.0
- Initial release: empty website.
