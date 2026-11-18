# Hybrid Build – spec and handoff

Owner: Ilolo Izu. The app is a Vite project under `src/` (see README for the module map); the original single-file prototype is kept at `prototype/index.html`. It is also published as a Claude artifact, which gives it a small document database (`claude.use("db")`) for synced logs and the Strava feed. Outside that host the page falls back to localStorage.

## Goal
10-week strength block run alongside marathon training. Priorities: arms, shoulders, back (high volume), chest moderate, legs near maintenance, knees-over-toes work every session. Block starts Mon Nov 16 2026.

## Week layout (default)
| Day | Session | Focus | Run that day |
| --- | --- | --- | --- |
| Mon | Press Conference | chest, triceps, side delts | rest |
| Tue | Knee Deep | squat, KOT, arm finisher | quality run (run first) |
| Wed | Wingspan | back, biceps | easy |
| Thu | Hinge Benefits | trap bar, KOT, arm finisher | easy / medium-long (run first) |
| Fri | Boulder Dash | shoulders, arms, abs | easy or off |
| Sat | Pump Fiction (optional) | upper volume | easy, off or F45 |
| Sun | Long Haul | long run, no lifting | long run |

Drop order when a week is crushed (`rank` in `DAYS`): Pump Fiction, Hinge Benefits, Knee Deep, Boulder Dash, Wingspan, Press Conference.

## Phases (`phaseOf(week)`)
1-2 Rust Off (3 reps in reserve) · 3 Ignition · 4 Pit Stop (deload) · 5-7 Project Get Big · 8 Pit Stop II · 9 Han Swolo Returns · 10 Moment of Truth (3RM tests, photos).
Sets and reps per phase: `MAIN` (main lifts), `KOT` (knee work), `dose()` for accessories. Deload weeks line up with the marathon plan's recovery weeks.

## Features in the prototype
- Per-set logging (weight, reps, check), last week's weight shown as placeholder.
- Day controls: push to tomorrow (slides the week, drops lowest-rank session if no room), swap day, skip. Stored per week as a 7-slot array (`sched<week>|slots`); logs are keyed by session, not weekday, so they follow a moved session.
- Short-on-time swaps (S1-S7 in `SWAPS`).
- Per exercise: **+ Set / − Set** to log more (or fewer added) sets than planned, and **Substitute** to swap in any library exercise, closest matches first (`similar()` in `src/plan/custom.js`: shared primary muscles, then overlap, then same movement). A substitute holds from that week on. Equipment alternates (`dbbench`, `smithincline`, `machineshoulder`, `dbcurl`, `cablecurl`, `dbohext`, `assistpull`) exist only as substitutes; the plan doesn't use them.
- Navigation (Nov 2026 redesign): tabs Today / Week / Block / Exercises, hash routes `#/today`, `#/w/<w>`, `#/w/<w>/d/<d>`, `#/block`, `#/exercises`, `#/ex/<id>`; back buttons use real history. Day options and substitutes are bottom sheets. Rest timer, Enter-to-next-field, wake lock, swipe between days/weeks.
- Layout: phone first; from 700px wide (iPad mini/Air, open foldables) cards go two-up and supersets sit side by side; from 960px the exercise screen splits into animation and how-to columns.
- Exercise screen: animated mannequin (figure engine v2: `figInner`, `tweenJ`, `clipSVG`), start/finish stills, muscle map, steps, cues, common mistake. Poses are authored per exercise in `EX` as start (`A`) and finish (`B`) joint targets.
- Strava feed: reads `strava/<date>-<activityId>` docs and `meta/sync` from the artifact db; a nightly scheduled Claude task writes them by reading Strava in the owner's signed-in Chrome.

## Data model (db / localStorage `hb4`)
- `data/users/<uid>/w<week>s<session>` → `{ v: { "<key>|<item>-<set>": {w, r, d}, "…|warm-<i>": 1 } }`
- Same session doc also holds `"w<week>s<session>|extra-<item>": n` (sets added beyond the plan) and `"…|sub-<item>": "<exercise id>"` (substitute from that week on; `""` = back to the planned lift).
- `data/users/<uid>/sched<week>` → `{ v: { "sched<week>|slots": [session index, -1 rest, -2 skipped] } }`
- `strava/<YYYY-MM-DD>-<id>` → `{date, type, name, distance_mi, moving_time, pace, avg_hr, url, synced_at}`
- `meta/sync` → `{at, status, count}`

## Next steps (real app)
1. ~~Split `index.html` into modules with a build step and tests for `dose()`, `pushToTomorrow()`, `tweenJ()`.~~ Done. Known issue found by the tests: in 13 exercises the elbow snaps for one frame mid-rep (`KNOWN_ELBOW_SNAPS` in `test/tween.test.js`).
2. iOS app (or PWA first): Apple Health / Apple Watch via HealthKit for runs and workouts; replaces the Chrome-based Strava scrape. Strava API as a second source.
3. Auto-adjust lifting when the run log shows a hard or long day (cap lower-body load, suggest swaps).
4. Progress screen: top-set trends, weekly sets per muscle, waist and photo check-ins (weeks 0, 5, 10).
5. More key poses per exercise (3-4 keyframes) for jumps, Nordics, pull-ups.
