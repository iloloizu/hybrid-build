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

## Layout

| Path | What's in it |
| --- | --- |
| `src/plan/plan.js` | Sessions (`DAYS`), phases, `MAIN`/`KOT` tables, `dose()`, swaps, dates |
| `src/plan/exercises.js` | Exercise library `EX`: poses, props, muscles, steps, cues, mistakes |
| `src/figure/engine.js` | Mannequin engine: `solve`, `figInner`, `tweenJ`, `clipSVG`, `bodyMap` |
| `src/storage.js` | Local store (`hb4`), artifact db sync (`connect`), key helpers |
| `src/schedule.js` | `slots`, `pushToTomorrow`, `swapDays`, `skipDay`, `warnings` |
| `src/state.js` | Shared UI state (week, day, open sheets) |
| `src/views/` | Plan view, exercise view, `#posegrid` dev view, shared bits |
| `prototype/index.html` | The original single-file prototype, kept as the reference |
| `scripts/parity.mjs` | Clicks through prototype and build side by side and diffs the DOM and saved data |

`npm run parity` (after `npm run build`) needs Playwright with Chromium. Set `PARITY_HOST=1` to run it against a fake artifact db, and `PARITY_NOW=2026-12-25T09:00:00` to pick the date the app opens on.
