/* ---------- small device niceties ---------- */
import { haptic, keepAwake as platformKeepAwake } from "../platform/index.js";
export const buzz = ms => haptic(ms && ms > 20 ? "success" : "tap");
export const keepAwake = platformKeepAwake;

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
