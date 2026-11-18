# Hybrid Build

Ilolo's 10-week strength + marathon hybrid training app.

## Run it

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (dose, schedule, figure tweening)
npm run build      # one self-contained file: dist/index.html
```

`dist/index.html` has everything inlined, so it can be opened from disk or published as a Claude artifact exactly like the old prototype.

## Saving

Every set, check and schedule change saves to the phone the moment you enter it, with no network needed. The app asks the browser to keep that data permanently, and **Back up** / **Restore** at the bottom of the plan downloads or reloads all logs as a JSON file. Inside the Claude artifact, logs also sync to the artifact's database as before.

## Install on iPhone

Host `dist/` on any HTTPS static host, open it in Safari, then Share → Add to Home Screen. After the first visit it opens and logs offline. (Installing also stops Safari from clearing the data after weeks without use.)

## Layout

| Path | What's in it |
| --- | --- |
| `src/plan/plan.js` | Sessions (`DAYS`), phases, `MAIN`/`KOT` tables, `dose()`, swaps, dates |
| `src/plan/exercises.js` | Exercise library `EX`: poses, props, muscles, steps, cues, mistakes |
| `src/figure/engine.js` | Mannequin engine: `solve`, `figInner`, `tweenJ`, `clipSVG`, `bodyMap` |
| `src/storage.js` | Local store (`hb4`), persistence request, backup/restore, artifact db sync (`connect`) |
| `src/schedule.js` | `slots`, `pushToTomorrow`, `swapDays`, `skipDay`, `warnings` |
| `src/state.js` | Shared UI state (week, day, open sheets) |
| `src/views/` | Plan view, exercise view, save bar, `#posegrid` dev view, shared bits |
| `public/` | PWA manifest, service worker, icons |
| `prototype/index.html` | The original single-file prototype, kept as the reference |
| `scripts/parity.mjs` | Clicks through prototype and build side by side and diffs the DOM and saved data |

`npm run parity` (after `npm run build`) needs Playwright with Chromium. Set `PARITY_HOST=1` to run it against a fake artifact db, and `PARITY_NOW=2026-12-25T09:00:00` to pick the date the app opens on.
