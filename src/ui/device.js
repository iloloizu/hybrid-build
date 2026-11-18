/* ---------- small device niceties ---------- */
export const buzz = (ms = 12) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

// Keep the screen on while a workout is open (iOS 16.4+, Android Chrome).
let lock = null, want = false;
export async function keepAwake(on) {
  want = on;
  try {
    if (on && !lock && "wakeLock" in navigator && document.visibilityState === "visible") { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; }); }
    if (!on && lock) { await lock.release(); lock = null; }
  } catch (e) { lock = null; }
}
document.addEventListener("visibilitychange", () => { if (want && document.visibilityState === "visible") keepAwake(true); });

// Horizontal swipe on an element: calls fn(-1) for swipe right (previous), fn(1) for swipe left (next).
// Ignores swipes that start on inputs, horizontal scrollers or open sheets.
export function onSwipe(el, fn) {
  let x0, y0, t0, ok;
  el.addEventListener("touchstart", e => {
    const t = e.target;
    ok = e.touches.length === 1 && !t.closest("input, textarea, .warm, .noswipe, .sheet-panel");
    if (!ok) return; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; t0 = Date.now();
  }, { passive: true });
  el.addEventListener("touchend", e => {
    if (!ok) return; ok = false;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 70 && Math.abs(dy) < Math.abs(dx) * 0.5 && Date.now() - t0 < 700) fn(dx < 0 ? 1 : -1);
  }, { passive: true });
}
