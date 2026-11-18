import { ui } from "../state.js";
import { EX } from "../plan/exercises.js";
import { DOW, dose, fmt } from "../plan/plan.js";
import { allPlans, planById, sessionsOf, phaseInfo, importPlan, removePlan, customPlans } from "../plans/index.js";
import { blocks, startBlock, nextMonday, parseISO, isoOf, findDate } from "../plan/blocks.js";
import { esc, thumbHTML } from "./common.js";
import { go, back } from "../router.js";
import { topbar } from "../ui/topbar.js";
import { ICON } from "../ui/icons.js";
import { toast } from "../ui/toast.js";
import { openSheet } from "../ui/sheet.js";
import { rerender } from "./app.js";
import { twoTap } from "../ui/confirm.js";

/* ---------- explore: browse plans, try one as a new block ---------- */
const activePlan = () => { const f = findDate(); const b = f && blocks().find(x => x.id === f.b); return b ? (b.plan || "hybrid") : null; };
function planStats(p) {
  const P = planById(p.id), S = sessionsOf(p.id, 1), days = S.filter(s => s && s.kind !== "rest" && s.items && s.items.length).length;
  const ex = new Set(); for (let w = 1; w <= P.weeks; w++) sessionsOf(p.id, w).forEach(s => (s.items || []).forEach(it => ex.add(it.x)));
  return { weeks: P.weeks, days, ex: ex.size, phases: P.hybrid ? 6 : P.phases.length };
}

export function renderExplore() {
  const app = document.getElementById("app"); app.className = "wrap explore";
  const act = activePlan();
  let h = topbar({ title: "Explore", sub: "Plans to try" });
  h += `<div class="plans">${allPlans().map(p => { const st = planStats(p); return `<button class="plancard${p.id === act ? " active" : ""}" data-plan="${esc(p.id)}">
    <span class="pc-top"><span class="pc-by">${esc(p.by)}</span>${p.id === act ? `<span class="pc-badge">Running now</span>` : ""}</span>
    <b class="pc-name">${esc(p.name)}</b><span class="pc-blurb">${esc(p.blurb || "")}</span>
    <span class="pc-stats"><span><b>${st.weeks}</b> wks</span><span><b>${st.days}</b> days/wk</span><span><b>${st.ex}</b> exercises</span></span></button>`; }).join("")}</div>`;
  h += `<section class="importbox"><div><b>Add a plan</b><span>Import a plan file (.json) in the same format as these.</span></div>
    <button class="bigbtn ghost" id="imp">${ICON.upload}<span>Import plan</span></button><input type="file" id="impfile" accept="application/json,.json" hidden></section>`;
  app.innerHTML = h;
  app.querySelectorAll("[data-plan]").forEach(b => b.onclick = () => go(`#/plan/${encodeURIComponent(b.dataset.plan)}`));
  const f = document.getElementById("impfile");
  document.getElementById("imp").onclick = () => f.click();
  f.onchange = async () => { const file = f.files && f.files[0]; if (!file) return; try { const p = importPlan(await file.text()); toast(`${p.name} added.`); } catch (e) { toast(e.message + ". Nothing added."); } f.value = ""; rerender(); };
}

let pageWeek = {};
export function renderPlanPage(id) {
  const P = planById(id), app = document.getElementById("app"); app.className = "wrap explore";
  if (!allPlans().some(p => p.id === id)) return back("#/explore");
  const w = Math.min(P.weeks, pageWeek[id] || 1), S = sessionsOf(id, w), PI = phaseInfo(id, w), st = planStats(P), act = activePlan() === id;
  let h = topbar({ title: P.short || P.name, sub: P.by, back: { label: "Explore" } });
  h += `<section class="planhero"><h2>${esc(P.name)}</h2><p>${esc(P.blurb || "")}</p>${P.note ? `<p class="pnote">${esc(P.note)}</p>` : ""}
    <div class="meta"><span>${st.weeks} weeks</span><span>${st.days} days/week</span><span>${st.ex} exercises</span>${act ? `<span class="hot">Running now</span>` : ""}</div></section>`;
  h += `<div class="chips noswipe weekchips" role="group" aria-label="Week">${Array.from({ length: P.weeks }, (_, k) => `<button data-pw="${k + 1}" aria-pressed="${k + 1 === w}">Wk ${k + 1}</button>`).join("")}</div>`;
  h += `<section class="phasecard ${PI.cls || ""}"><span class="pbib">${String(w).padStart(2, "0")}</span><div><b>${esc(PI.name)}</b><span>${esc(PI.rule || "")}</span></div></section>`;
  h += `<div class="plandays">${S.map((s, d) => {
    if (!s || s.kind === "rest" || (!s.items.length && s.kind !== "run")) return `<div class="pday rest"><span class="pd-dow">${DOW[d]}</span><b>Rest</b></div>`;
    if (!s.items.length) return `<div class="pday"><span class="pd-dow">${DOW[d]}</span><b>${esc(s.name)}</b><span class="pd-sub">${s.kind === "run" ? "Long run" : ""}</span></div>`;
    return `<div class="pday"><span class="pd-dow">${DOW[d]}</span><b>${esc(s.name)}</b><ul>${s.items.map(it => { const ds = dose(it, w); if (!ds) return ""; const e = EX[it.x]; return `<li><button data-ex="${it.x}"><span class="thumb">${thumbHTML(it.x)}</span><span class="pi-name">${esc(it.label || e.name)}${it.optional ? ` <em>optional</em>` : ""}</span><span class="pi-dose">${ds.s}×${esc(ds.r)}${ds.note ? `<small>${esc(ds.note)}</small>` : ""}</span></button></li>`; }).join("")}</ul></div>`;
  }).join("")}</div>`;
  h += `<div class="trybar"><button class="bigbtn" id="tryplan">${act ? "Start it again" : "Try this plan"}</button>${customPlans().some(p => p.id === id) ? `<button class="textbtn" id="rmplan">Remove this plan</button>` : ""}</div>`;
  app.innerHTML = h;
  app.querySelectorAll("[data-pw]").forEach(b => b.onclick = () => { pageWeek[id] = +b.dataset.pw; rerender(); });
  app.querySelectorAll("[data-ex]").forEach(b => b.onclick = () => go(`#/ex/${b.dataset.ex}`));
  document.getElementById("tb-back").onclick = () => back("#/explore");
  document.getElementById("tryplan").onclick = () => trySheet(P);
  twoTap(document.getElementById("rmplan"), "Tap again to remove this plan", () => { removePlan(id); toast("Plan removed."); back("#/explore"); });
}

function trySheet(P) {
  const today = isoOf(new Date());
  openSheet({ title: "Try this plan", render: (body, api) => {
    body.innerHTML = `<div class="optnote">${esc(P.name)} becomes a new block from the date you pick. Your current logs stay, and weights for shared exercises carry over.</div>
      <div class="btnrow"><button class="bigbtn ghost" data-d="${today}">Start today</button><button class="bigbtn ghost" data-d="${nextMonday()}">Next Monday</button></div>
      <label class="datefield"><span>Or pick</span><input type="date" id="pstart" value="${nextMonday()}"></label>
      <button class="bigbtn" id="pgo">Start ${esc(P.short || "plan")}</button>`;
    const start = v => { const id = startBlock(v, P.id); ui.b = id; ui.week = 1; ui.dayIdx = 0; api.close(); toast(`${P.name} starts ${fmt(parseISO(v))}.`); setTimeout(() => go(v <= today ? "#/today" : "#/block"), 0); };
    body.querySelectorAll("[data-d]").forEach(b => b.onclick = () => start(b.dataset.d));
    body.querySelector("#pgo").onclick = () => { const v = body.querySelector("#pstart").value; if (v) start(v); };
  } });
}
