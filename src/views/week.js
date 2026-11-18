import { ui } from "../state.js";
import { DAYS, DOW, PHASES, phaseOf, phaseName, dayDate, fmt, iso } from "../plan/plan.js";
import { ACTS, sget, sset, schedKey } from "../storage.js";
import { slots, warnings } from "../schedule.js";
import { progress, RUNICON } from "./common.js";
import { go } from "../router.js";
import { topbar } from "../ui/topbar.js";
import { ICON } from "../ui/icons.js";
import { toast } from "../ui/toast.js";
import { todayWD } from "./today.js";
import { rerender } from "./app.js";

/* ---------- week screen: seven tappable days ---------- */
export function stepWeek(k) { const w = Math.max(1, Math.min(10, ui.week + k)); if (w !== ui.week) go(`#/w/${w}`, { replace: true }); }

export function renderWeek(w) {
  ui.week = w;
  const app = document.getElementById("app"); app.className = "wrap week";
  const a = slots(w), P = PHASES[phaseOf(w)], t = todayWD(), ph = phaseOf(w);
  const first = dayDate(w, 0), last = dayDate(w, 6);
  let h = topbar({ title: `Week ${w}`, sub: `${fmt(first)} – ${fmt(last)}`, right: t && t.w !== w ? `<button class="pill" id="thisweek">This week</button>` : "" });
  h += `<div class="daynav"><button class="stepbtn" data-wstep="-1" ${w === 1 ? "disabled" : ""} aria-label="Previous week">${ICON.prev}<span>Wk ${w - 1 || ""}</span></button>
    <div class="wkdots" aria-hidden="true">${Array.from({ length: 10 }, (_, k) => `<i class="${k + 1 === w ? "on" : ""} ${["cut", "test"].includes(phaseOf(k + 1)) ? phaseOf(k + 1) : ""}"></i>`).join("")}</div>
    <button class="stepbtn" data-wstep="1" ${w === 10 ? "disabled" : ""} aria-label="Next week"><span>Wk ${w < 10 ? w + 1 : ""}</span>${ICON.next}</button></div>`;
  h += `<section class="phasecard ${ph}"><span class="pbib">${String(w).padStart(2, "0")}</span><div><b>${phaseName(w)}</b><span>${P.rule}</span></div></section>`;
  h += `<div class="days">${a.map((s, i) => {
    const date = dayDate(w, i), [n, tot] = progress(w, s), ran = (ACTS[iso(date)] || []).length, today = t && t.w === w && t.d === i;
    const sd = s >= 0 ? DAYS[s] : null, run = sd && sd.kind === "run", off = !sd;
    const name = sd ? sd.name : s === -2 ? "Skipped" : "Rest";
    const info = sd ? (run ? "Long run" : `${sd.mins} min · ${sd.run === "Rest day" ? "No run" : sd.run}`) : "";
    const state = run ? (ran ? "✓" : "") : tot ? (n === tot ? "✓" : n ? `${n}/${tot}` : "") : "";
    return `<button class="dayrow${today ? " today" : ""}${off ? " off" : ""}${run ? " run" : ""}${n && n === tot ? " done" : ""}" data-day="${i}">
      <span class="dd"><small>${DOW[i]}</small><b>${date.getDate()}</b></span>
      <span class="dn"><b>${name}</b><small>${today ? `<em>Today</em> · ` : ""}${s >= 0 && s !== i ? `Moved from ${DOW[s]} · ` : ""}${info}</small>${tot ? `<i class="bar"><em style="width:${n / tot * 100}%"></em></i>` : ""}</span>
      <span class="ds">${ran ? `<span class="ran">${RUNICON}</span>` : ""}${state ? `<b>${state}</b>` : ""}${ICON.next}</span></button>`;
  }).join("")}</div>`;
  warnings(w).forEach(x => h += `<div class="warnline">${x}</div>`);
  if (sget(schedKey(w))) h += `<button class="textbtn" id="resetweek">Undo schedule changes this week</button>`;
  app.innerHTML = h;
  app.querySelectorAll("[data-day]").forEach(b => b.onclick = () => go(`#/w/${w}/d/${b.dataset.day}`));
  app.querySelectorAll("[data-wstep]").forEach(b => b.onclick = () => stepWeek(+b.dataset.wstep));
  const tw = document.getElementById("thisweek"); if (tw) tw.onclick = () => go(`#/w/${t.w}`, { replace: true });
  const r = document.getElementById("resetweek"); if (r) r.onclick = () => { sset(schedKey(w), null); toast("Week back to the original plan."); rerender(); };
}
