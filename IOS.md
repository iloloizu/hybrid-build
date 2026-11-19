# iOS app plan

The web app is built to be wrapped with [Capacitor](https://capacitorjs.com) so the same code runs as a native iPhone app.

## Already in place
- One codebase, one self-contained `dist/index.html`; hash routes, no server.
- Everything device-specific goes through `src/platform/index.js`: storage, haptics, keep-awake, notifications, Apple Health. Screens never call browser APIs directly.
- No browser pop-ups (`confirm`/`alert`): confirmations are in-app (`src/ui/confirm.js`).
- Safe-area insets for the notch and home bar; 44 px touch targets; back gesture works through real history.
- Plans are plain data (`src/plans/`), so an AI importer or a server can produce the same format later.

## Steps (needs a Mac with Xcode)
1. `npm i @capacitor/core @capacitor/ios @capacitor/preferences @capacitor/haptics @capacitor/local-notifications @capacitor-community/keep-awake && npm i -D @capacitor/cli`
2. `npx cap init "Move" com.ilolo.move --web-dir dist` (home-screen name "Move"; App Store name "Move: Workout Tracker"), then `npm run build && npx cap add ios`.
3. In `src/platform/index.js`, when `platform.name === "ios"`, use the plugins: Preferences for `store` (load once into memory at start), Haptics for `haptic`, KeepAwake for `keepAwake`, LocalNotifications for `notifyAt` (rest timer with the screen locked).
4. Apple Health: add a HealthKit plugin (e.g. `@perfood/capacitor-healthkit`), request workout + distance read access, and implement `health.workouts()`; the day screen shows them where Strava runs show today.
5. `npx cap open ios`, set the signing team, run on your iPhone. TestFlight / App Store needs the Apple Developer Program ($99/yr).

## Later
- Apple Watch: a small SwiftUI watchOS target for start session / log set / rest timer, sharing data with the phone app.
- Accounts and sync, AI plan import: need a backend (e.g. Supabase) and an Anthropic API key held server-side. Not started; needs the owner's accounts.
