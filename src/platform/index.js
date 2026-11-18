/* ---------- platform: everything that differs between the web app and a future iOS app ----------
   The web versions live here. An iOS build (Capacitor) swaps each one for its native plugin:
     store      → @capacitor/preferences (or SQLite) so iOS never clears logs
     haptic     → @capacitor/haptics
     keepAwake  → @capacitor-community/keep-awake
     notifyAt   → @capacitor/local-notifications (rest timer with the screen locked)
     health     → a HealthKit plugin (runs and workouts from Apple Health / Watch)
   Screens import from here only, never from the browser APIs directly. */

const hasWindow = typeof window !== "undefined";
const isNative = () => hasWindow && !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
export const platform = { name: isNative() ? "ios" : "web" };

// Key-value storage (sync reads from a cache the app loads at start).
export const store = {
  get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (e) {} },
};

export function haptic(kind = "tap") {
  const ms = { tap: 12, success: [30, 40, 30], alert: [120, 80, 120] }[kind] || 12;
  try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {}
}

// Keep the screen on during a workout.
let lock = null, want = false;
export async function keepAwake(on) {
  want = on;
  try {
    if (on && !lock && "wakeLock" in navigator && document.visibilityState === "visible") { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); }
    if (!on && lock) { await lock.release(); lock = null; }
  } catch (e) { lock = null; }
}
if (hasWindow) document.addEventListener("visibilitychange", () => { if (want && document.visibilityState === "visible") keepAwake(true); });

// A notification at a time (rest timer). Web: only if already allowed and the page is open.
const timers = {};
export function notifyAt(id, when, title, body) {
  cancelNotify(id);
  const ms = when - Date.now(); if (ms <= 0) return;
  timers[id] = setTimeout(() => { try { if (document.visibilityState !== "visible" && "Notification" in window && Notification.permission === "granted") new Notification(title, { body }); } catch (e) {} }, ms);
}
export function cancelNotify(id) { clearTimeout(timers[id]); delete timers[id]; }

// Workouts from Apple Health. Web has no access; iOS returns [{ date, type, distance_mi, minutes, source }].
export const health = { available: false, async workouts(/* fromISO, toISO */) { return []; } };
