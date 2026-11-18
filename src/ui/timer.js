import { haptic, notifyAt, cancelNotify } from "../platform/index.js";
/* ---------- rest timer: starts when a set is checked, floats above the tab bar ---------- */
let end = 0, total = 0, tick = null;
const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
export function startRest(sec) {
  total = sec; end = Date.now() + sec * 1000; notifyAt("rest", end, "Rest done", "Next set."); draw(); clearInterval(tick); tick = setInterval(draw, 250);
}
export function stopRest() { cancelNotify("rest"); clearInterval(tick); tick = null; end = 0; const el = document.getElementById("timer"); if (el) { el.className = ""; el.innerHTML = ""; } }
function draw() {
  const el = document.getElementById("timer"); if (!el) return;
  const left = Math.max(0, Math.round((end - Date.now()) / 1000));
  if (!el.firstChild) {
    el.innerHTML = `<div class="rest" role="timer" aria-label="Rest timer"><span class="rl">Rest</span><b id="rt"></b><i><em id="rbar"></em></i><button data-r="-15" aria-label="15 seconds less">−15</button><button data-r="15" aria-label="15 seconds more">+15</button><button data-r="x" aria-label="Stop rest timer">✕</button></div>`;
    el.querySelectorAll("[data-r]").forEach(b => b.onclick = () => { const v = b.dataset.r; if (v === "x") return stopRest(); end += +v * 1000; notifyAt("rest", end, "Rest done", "Next set."); total = Math.max(total + +v, 1); draw(); });
  }
  el.className = "on" + (left === 0 ? " go" : "");
  document.getElementById("rt").textContent = left ? fmt(left) : "Go";
  document.getElementById("rbar").style.width = `${total ? (left / total) * 100 : 0}%`;
  if (left === 0 && tick) {
    clearInterval(tick); tick = null;
    haptic("alert");
    setTimeout(() => { if (!tick) stopRest(); }, 6000);
  }
}
