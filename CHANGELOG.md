# Changelog

Versioning follows MAJOR.MINOR.MICRO:

- **MAJOR**: big or breaking changes (redesigns, rewrites)
- **MINOR**: new features that don't break existing ones
- **MICRO**: bug fixes and small tweaks

Every release is also a git tag (`vX.Y.Z`). The version lives in `package.json`.

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
