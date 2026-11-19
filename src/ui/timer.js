import { haptic, notifyAt, cancelNotify } from "../platform/index.js";
/* ---------- rest timer: "Rest 1:42 · skip" pill; tap to skip ----------
   Floats above the tab bar; the zoomed-in workout view shows its own inline copy via onRest(). */
let end = 0, total = 0, tick = null;
const subs = new Set();
const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
export const restLeft = () => Math.max(0, Math.round((end - Date.now()) / 1000));
export const restState = () => ({ left: restLeft(), total, text: fmt(restLeft()), pct: total ? Math.round(restLeft() / total * 100) : 0, on: !!tick });
export function onRest(fn) { subs.add(fn); return () => subs.delete(fn); }
export function startRest(sec) {
  total = sec; end = Date.now() + sec * 1000; notifyAt("rest", end, "Rest done", "Next set.");
  clearInterval(tick); tick = setInterval(draw, 250); draw();
}
export function stopRest() { cancelNotify("rest"); clearInterval(tick); tick = null; end = 0; draw(); }
function draw() {
  const el = document.getElementById("timer"); const st = restState();
  if (el) {
    if (!st.on) { el.className = ""; el.innerHTML = ""; }
    else {
      if (!el.firstChild) { el.innerHTML = `<button class="restpill" aria-label="Rest timer, tap to skip"><i></i><span></span></button>`; el.firstChild.onclick = stopRest; }
      el.className = "on";
      el.querySelector("i").style.width = st.pct + "%";
      el.querySelector("span").textContent = `Rest ${st.text} · skip`;
    }
  }
  subs.forEach(fn => { try { fn(st); } catch (e) {} });
  if (st.on && st.left === 0) { clearInterval(tick); tick = null; haptic("alert"); setTimeout(() => { if (!tick) draw(); }, 0); }
}
