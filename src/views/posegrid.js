import { solve, figure } from "../figure/engine.js";
import { EX } from "../plan/exercises.js";

/* ---------- pose check grid (dev only, open with #posegrid) ---------- */
export function renderPoseGrid() {
  document.getElementById("app").style.maxWidth = "100%";
  document.getElementById("app").innerHTML = `<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px">${Object.keys(EX).map(id => { const e = EX[id]; return `<div><div style="font-size:11px">${id}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:2px">${figure(solve(Object.assign({ v: e.v }, e.A)), Object.assign({ _t: e.A.t }, e))}${figure(solve(Object.assign({ v: e.v }, e.B)), Object.assign({ _t: e.B.t }, e))}</div></div>`; }).join("")}</div>`;
}
