# Hybrid Build

Ilolo's 10-week strength + marathon hybrid training app.

## Run it

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (dose, schedule, tweening, subs, backup, routes)
npm run build      # one self-contained file: dist/index.html
```

`dist/index.html` has everything inlined, so it can be opened from disk or published as a Claude artifact exactly like the old prototype.

## Screens

Tab bar (left rail on iPad landscape): **Today** (today's session) · **Week** (seven days, tap one) · **Block** (10 weeks by phase, plus backup/restore) · **Exercises** (search + muscle filter). Day options (push, swap, skip, short on time, clear) live in the ⋯ sheet. Swipe left/right to change day or week. Checking a set starts a rest timer (2:00 main lifts, 1:15 others, none mid-superset). The screen stays awake on a workout.

## Saving

Every set, check and schedule change saves to the phone the moment you enter it, with no network needed. The app asks the browser to keep that data permanently, and **Back up** / **Restore** at the bottom of the plan downloads or reloads all logs as a JSON file. Inside the Claude artifact, logs also sync to the artifact's database as before.

## Hosting (GitHub Pages, password-locked)

Every push to `main` runs `.github/workflows/pages.yml`: tests, build, then `scripts/lock.mjs` encrypts the page with the `PAGE_PASSWORD` repo secret (AES-GCM, PBKDF2 600k rounds). The published URL shows only a password box; the plan and code inside the page aren't readable without it. After the first unlock the key is remembered on that device, so it opens straight in, offline too. If the secret isn't set, the workflow skips the deploy rather than publish an unlocked page.

One-time setup:
1. Settings → General → Danger Zone → Change visibility → Public (free Pages needs a public repo; the source is then readable on GitHub, logs never are since they stay on the phone).
2. Settings → Pages → Source: **GitHub Actions**.
3. Settings → Secrets and variables → Actions → New repository secret: `PAGE_PASSWORD` (10+ characters).
4. Actions → Deploy to GitHub Pages → Run workflow. The app is then at `https://iloloizu.github.io/hybrid-build/`.

Changing the password: update the secret and re-run the workflow. Each device asks once more.

## Install on iPhone

Open the Pages URL in Safari, unlock it, then Share → Add to Home Screen. After the first visit it opens and logs offline. (Installing also stops Safari from clearing the data after weeks without use.)

## Layout

| Path | What's in it |
| --- | --- |
| `src/plan/plan.js` | Sessions (`DAYS`), phases, `MAIN`/`KOT` tables, `dose()`, swaps, dates |
| `src/plan/exercises.js` | Exercise library `EX`: poses, props, muscles, steps, cues, mistakes, equipment alternates |
| `src/plan/custom.js` | Your per-session changes: extra sets, substitutes, `similar()` ranking |
| `src/figure/engine.js` | Mannequin engine: `solve`, `figInner`, `tweenJ`, `clipSVG`, `bodyMap` |
| `src/storage.js` | Local store (`hb4`), persistence request, backup/restore, artifact db sync (`connect`) |
| `src/schedule.js` | `slots`, `pushToTomorrow`, `swapDays`, `skipDay`, `warnings` |
| `src/router.js` | Hash routes with a real history stack (back buttons + OS back gesture) |
| `src/state.js` | Shared UI state (current week/day) |
| `src/views/` | Screens: `day` (Today), `week`, `block`, `library`, `exercise`, plus the app shell in `app.js` |
| `src/ui/` | Top bar, bottom sheet, snackbar, rest timer, icons, swipe / wake lock / haptics |
| `public/` | PWA manifest, service worker, icons |
| `prototype/index.html` | The original single-file prototype, kept as the reference |

