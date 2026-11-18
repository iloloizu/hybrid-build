import { ui } from "../state.js";
import { DAYS, PHASES, phaseOf, phaseName, dayDate, fmt, START } from "../plan/plan.js";
import { slots } from "../schedule.js";
import { progress } from "./common.js";
import { go } from "../router.js";
import { topbar } from "../ui/topbar.js";
import { todayWD } from "./today.js";
import { saveBar, bindSaveBar } from "./savebar.js";

/* ---------- block screen: the 10 weeks by phase, plus your data ---------- */
export function weekProgress(w) {
  let n = 0, t = 0; slots(w).forEach(s => { const [a, b] = progress(w, s); n += a; t += b; }); return [n, t];
}
export function renderBlock() {
  const app = document.getElementById("app"); app.className = "wrap block";
  const t = todayWD();
  let h = topbar({ title: "The Block", sub: `${fmt(START)} – ${fmt(dayDate(10, 6))}` });
  let last = null;
  h += `<div class="weeklist">`;
  for (let w = 1; w <= 10; w++) {
    const name = phaseName(w), ph = phaseOf(w), [n, tot] = weekProgress(w), now = t && t.w === w;
    if (name !== last) { h += `<div class="phasehead ${ph}"><b>${name}</b><span>${PHASES[ph].rule}</span></div>`; last = name; }
    h += `<button class="weekrow${now ? " now" : ""} ${ph}" data-w="${w}"><span class="pbib">${String(w).padStart(2, "0")}</span>
      <span class="dn"><b>${fmt(dayDate(w, 0))} – ${fmt(dayDate(w, 6))}</b><small>${now ? "<em>This week</em> · " : ""}${PHASES[ph].rir}</small><i class="bar"><em style="width:${tot ? n / tot * 100 : 0}%"></em></i></span>
      <span class="ds"><b>${n ? `${n}/${tot}` : ""}</b></span></button>`;
  }
  h += `</div><div class="lbl">Your data</div>` + saveBar();
  app.innerHTML = h;
  app.querySelectorAll("[data-w]").forEach(b => b.onclick = () => go(`#/w/${b.dataset.w}`));
  bindSaveBar();
}
