import { solve, figure } from "../figure/engine.js";
import { EX } from "../plan/exercises.js";
import { DAYS, dose } from "../plan/plan.js";
import { sget, setKey } from "../storage.js";

export function progress(w, s) {
  let n = 0, t = 0; if (s < 0) return [0, 0];
  DAYS[s].items.forEach((it, i) => { const ds = dose(it, w); if (!ds) return; for (let k = 0; k < ds.s; k++) { t++; const v = sget(setKey(w, s, i, k)); if (v && v.d) n++; } });
  return [n, t];
}
export const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const thumbHTML = id => { const e = EX[id]; return figure(solve(Object.assign({ v: e.v }, e.B)), Object.assign({ _t: e.B.t }, e), { thumb: true }); };
export const CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>`;
export const RUNICON = `<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="currentColor"/></svg>`;
export const keep = fn => { const y = window.scrollY; fn(); window.scrollTo(0, y); };
