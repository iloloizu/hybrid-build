import { ui } from "../state.js";
import { DAYS, DOW, PHASES, phaseOf, phaseName, fmt, iso, flagFor } from "../plan/plan.js";
import { weekRef, weeksOf, blockById, weekLabel, dayDate, repeatWeek, pauseWeek, undoLastChange } from "../plan/blocks.js";
import { ACTS, sget, sset, schedKey } from "../storage.js";
import { slots, warnings } from "../schedule.js";
import { getRun, isFinished } from "../plan/runs.js";
import { progress, RUNICON } from "./common.js";
import { go } from "../router.js";
import { topbar } from "../ui/topbar.js";
import { ICON } from "../ui/icons.js";
import { toast } from "../ui/toast.js";
import { openSheet } from "../ui/sheet.js";
import { todayWD } from "./today.js";
import { rerender } from "./app.js";

/* ---------- week screen: seven tappable days ---------- */
const nWeeks = () => weeksOf(blockById(ui.b)).length;
export function stepWeek(k) { const w = Math.max(1, Math.min(nWeeks(), ui.week + k)); if (w !== ui.week) go(`#/w/${w}`, { replace: true }); }

export function renderWeek(w) {
  w = Math.max(1, Math.min(nWeeks(), w)); ui.week = w;
  const W = weekRef(ui.b, w), all = weeksOf(blockById(ui.b));
  const app = document.getElementById("app"); app.className = "wrap week";
  const t = todayWD(), here = t && t.b === ui.b;
  let h = topbar({ title: weekLabel(W), sub: `${fmt(dayDate(W, 0))} – ${fmt(dayDate(W, 6))}`,
    right: `${here && t.w !== w ? `<button class="pill" id="thisweek">This week</button>` : ""}<button class="iconbtn" id="wopts" aria-label="Week options">${ICON.more}</button>` });
  h += `<div class="daynav"><button class="stepbtn" data-wstep="-1" ${w === 1 ? "disabled" : ""} aria-label="Previous week">${ICON.prev}<span>Prev</span></button>
    <div class="wkdots" aria-hidden="true">${all.map(x => `<i class="${x.cw === w ? "on" : ""} ${x.pause ? "pause" : ["cut", "test"].includes(phaseOf(x.pw)) ? phaseOf(x.pw) : ""}"></i>`).join("")}</div>
    <button class="stepbtn" data-wstep="1" ${w === all.length ? "disabled" : ""} aria-label="Next week"><span>Next</span>${ICON.next}</button></div>`;
  if (W.pause) {
    h += `<section class="phasecard cut"><span class="pbib">II</span><div><b>Paused</b><span>Sick, travel or life. The plan picks up next week.</span></div></section>`;
  } else {
    const ph = phaseOf(W.pw), P = PHASES[ph], a = slots(W);
    h += `<section class="phasecard ${ph}"><span class="pbib">${String(W.pw).padStart(2, "0")}</span><div><b>${phaseName(W.pw)}${W.rep ? " · again" : ""}</b><span>${P.rule}</span></div></section>`;
    h += `<div class="days">${a.map((s, i) => {
      const date = dayDate(W, i), [n, tot] = progress(W, s), mine = getRun(iso(date)), ran = (ACTS[iso(date)] || []).length || (mine && (mine.mi || mine.min)), today = here && t.w === w && t.d === i;
      const sd = s >= 0 ? DAYS[s] : null, run = sd && sd.kind === "run", off = !sd, flag = flagFor(date);
      const name = sd ? sd.name : s === -2 ? "Skipped" : "Rest";
      const info = sd ? (run ? "Long run" : `${sd.mins} min · ${sd.run === "Rest day" ? "No run" : sd.run}`) : "";
      const fin = isFinished(iso(date)), state = fin ? "✓" : run ? (ran ? "✓" : "") : tot ? (n === tot ? "✓" : n ? `${n}/${tot}` : "") : "";
      return `<button class="dayrow${today ? " today" : ""}${off ? " off" : ""}${run ? " run" : ""}${(n && n === tot) || fin ? " done" : ""}" data-day="${i}">
        <span class="dd"><small>${DOW[i]}</small><b>${date.getDate()}</b></span>
        <span class="dn"><b>${name}</b><small>${today ? `<em>Today</em> · ` : ""}${flag ? `<em class="fl">${flag}</em> · ` : ""}${s >= 0 && s !== i ? `Moved from ${DOW[s]} · ` : ""}${info}${mine && mine.mi ? ` · <em class="rn">${mine.mi} mi</em>` : ""}</small>${tot ? `<i class="bar"><em style="width:${n / tot * 100}%"></em></i>` : ""}</span>
        <span class="ds">${ran ? `<span class="ran">${RUNICON}</span>` : ""}${state ? `<b>${state}</b>` : ""}${ICON.next}</span></button>`;
    }).join("")}</div>`;
    warnings(W).forEach(x => h += `<div class="warnline">${x}</div>`);
    if (sget(schedKey(W))) h += `<button class="textbtn" id="resetweek">Undo schedule changes this week</button>`;
  }
  app.innerHTML = h;
  app.querySelectorAll("[data-day]").forEach(b => b.onclick = () => go(`#/w/${w}/d/${b.dataset.day}`));
  app.querySelectorAll("[data-wstep]").forEach(b => b.onclick = () => stepWeek(+b.dataset.wstep));
  const tw = document.getElementById("thisweek"); if (tw) tw.onclick = () => go(`#/w/${t.w}`, { replace: true });
  const r = document.getElementById("resetweek"); if (r) r.onclick = () => { sset(schedKey(W), null); toast("Week back to the original plan."); rerender(); };
  document.getElementById("wopts").onclick = () => weekOptions(W);
}

function weekOptions(W) {
  const b = blockById(ui.b), hasOps = (b.ops || []).length > 0;
  openSheet({ title: `${weekLabel(W)} options`, render: (body, api) => {
    body.innerHTML = `<div class="optlist">
      ${W.pause ? "" : `<button class="optrow" data-o="repeat"><b class="tag">↻</b><span>Repeat this week next week<small>Everything after moves back a week</small></span></button>`}
      <button class="optrow" data-o="pause"><b class="tag">II</b><span>Pause next week<small>Sick or travelling. The plan waits a week.</small></span></button>
      ${hasOps ? `<button class="optrow" data-o="undo"><b class="tag">↺</b><span>Undo last repeat or pause</span></button>` : ""}
      <button class="optrow" data-o="block"><b class="tag">▦</b><span>Start a new block<small>On the Block tab</small></span></button></div>`;
    body.querySelectorAll("[data-o]").forEach(x => x.onclick = () => {
      const o = x.dataset.o; api.close();
      if (o === "block") return setTimeout(() => go("#/block"), 0);
      if (o === "repeat") { repeatWeek(ui.b, W.cw); toast(`${weekLabel(W)} repeats next week.`); }
      if (o === "pause") { pauseWeek(ui.b, W.cw + 1); toast("Next week paused."); }
      if (o === "undo") { undoLastChange(ui.b); toast("Undone."); }
      setTimeout(rerender, 0);
    });
  } });
}
