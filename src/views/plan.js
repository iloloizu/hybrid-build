import { ui } from "../state.js";
import { saveBar, bindSaveBar } from "./savebar.js";
import { EX } from "../plan/exercises.js";
import { KNEE, SWAPS, DAYS, DOW, PHASES, phaseOf, phaseName, dose, FLAGS, dayDate, fmt, iso } from "../plan/plan.js";
import { STORE, ACTS, SYNC, dirty, persistLocal, sget, sset, flush, setKey, warmKey, schedKey } from "../storage.js";
import { slots, pushToTomorrow, swapDays, skipDay, warnings } from "../schedule.js";
import { progress, esc, thumbHTML, CHECK, RUNICON, keep } from "./common.js";
import { openEx } from "./exercise.js";

/* ---------- plan view ---------- */
export function renderPlan() {
  const app = document.getElementById("app");
  const a = slots(ui.week), sess = a[ui.dayIdx], d = sess >= 0 ? DAYS[sess] : null, P = PHASES[phaseOf(ui.week)];
  const date = dayDate(ui.week, ui.dayIdx), acts = ACTS[iso(date)] || [];
  let h = `<div class="brand"><span class="mark">HYBRID <b>BUILD</b></span><span class="bib"><i>${String(ui.week).padStart(2, "0")}</i>Week ${ui.week} of 10</span></div>
    <div class="weeks" role="group" aria-label="Week">${Array.from({ length: 10 }, (_, k) => { const w = k + 1, c = phaseOf(w); return `<button class="wk ${c === "cut" ? "cut" : c === "test" ? "test" : ""}" aria-pressed="${w === ui.week}" aria-label="Week ${w}, ${phaseName(w)}" data-w="${w}"><span>${String(w).padStart(2, "0")}</span><em></em></button>`; }).join("")}</div>
    <div class="phase"><b>${phaseName(ui.week)}</b><span>${P.rule}</span></div>
    <nav class="lanes" role="tablist" aria-label="Days">${a.map((s, i) => {
      const [n, t] = progress(ui.week, s); const ran = (ACTS[iso(dayDate(ui.week, i))] || []).length;
      const tag = s >= 0 ? DAYS[s].ln : s === -2 ? "SKIPPED" : "REST";
      return `<button class="lane ${s === 6 ? "run" : ""} ${s < 0 ? "off" : ""}" role="tab" aria-selected="${i === ui.dayIdx}" data-d="${i}"><span class="dow">${DOW[i]}</span><span class="ln">${dayDate(ui.week, i).getDate()}</span><span class="tag">${tag}</span>${ran ? `<span class="ran">${RUNICON}</span>` : ""}<span class="fill"><i style="width:${t ? n / t * 100 : 0}%"></i></span></button>`;
    }).join("")}</nav>`;
  warnings(ui.week).forEach(x => h += `<div class="warnline">${x}</div>`);
  if (ui.toast) { h += `<div class="toast">${ui.toast}</div>`; ui.toast = ""; }

  const flag = FLAGS[`${ui.week}-${ui.dayIdx}`];
  const stravaCard = acts.length ? `<div class="strava"><div class="lbl">From Strava<em>${SYNC ? "synced " + SYNC : ""}</em></div>${acts.map(x => `<div class="act"><span class="aname">${esc(x.name || x.type)}</span><span class="astat">${[x.distance_mi ? x.distance_mi + " mi" : "", x.moving_time || "", x.pace ? x.pace + "/mi" : "", x.avg_hr ? x.avg_hr + " bpm" : ""].filter(Boolean).map(esc).join(" · ")}</span></div>`).join("")}</div>` : "";

  if (!d) {
    const skipped = sess === -2;
    h += `<section class="hero"><h2 class="dim">${skipped ? "Skipped" : "Rest Day"}</h2><div class="meta"><span>${fmt(date)}</span>${flag ? `<span class="flag">${flag}</span>` : ""}</div></section>
      <div class="longrun">${skipped ? "You skipped today. If you've got 20 minutes, Pump Only keeps the priority muscles moving." : "Nothing scheduled after the shuffle. Easy run or full rest."}</div>${stravaCard}
      ${skipped ? `<div class="chips"><button data-sw="S5" aria-pressed="${ui.swapOpen === "S5"}"><b>20 min</b>Pump Only</button></div>${ui.swapOpen ? `<div class="swapbox"><ol>${SWAPS[ui.swapOpen].l.map(x => `<li>${x}</li>`).join("")}</ol></div>` : ""}` : ""}
      <button class="textbtn" id="resetweek">Undo all changes this week</button>`;
    app.innerHTML = h + saveBar(); bindPlan(); return;
  }
  if (d.kind === "run") {
    h += `<section class="hero"><h2 class="run">${d.name}</h2><div class="meta"><span>${fmt(date)}</span><span>Long run</span><span>No lifting</span></div></section>${stravaCard || `<div class="longrun">Long run day. It shows up here once Strava syncs tonight.</div>`}`;
    app.innerHTML = h + saveBar(); bindPlan(); return;
  }
  const [n, t] = progress(ui.week, sess);
  const moved = sess !== ui.dayIdx ? `<span class="hot">Moved from ${DOW[sess]}</span>` : "";
  h += `<section class="hero"><h2>${d.name}</h2><div class="meta"><span>${fmt(date)}</span><span class="hot">${P.rir}</span>${moved}<span>${d.mins} min</span><span>${d.run}</span>${flag ? `<span class="flag">${flag}</span>` : ""}</div></section>`;

  // day actions
  h += `<div class="actions"><button data-act="push" aria-pressed="${ui.actionMode === "push"}">Push to tomorrow</button><button data-act="swap" aria-pressed="${ui.actionMode === "swap"}">Swap day</button><button data-act="skip" aria-pressed="${ui.actionMode === "skip"}">Skip</button></div>`;
  if (ui.actionMode === "swap") h += `<div class="sheet"><div class="lbl">Swap with</div><div class="chips">${a.map((s, i) => i === ui.dayIdx || i === 6 ? "" : `<button data-swapwith="${i}"><b>${DOW[i]}</b>${s >= 0 ? DAYS[s].name : "Rest"}</button>`).join("")}</div></div>`;
  if (ui.actionMode === "push") h += `<div class="sheet"><div class="note">${ui.dayIdx < 5 ? "Today becomes rest and everything after slides a day. If the week runs out of room, the least important session (Pump Fiction, then Hinge Benefits) drops." : "Saturday's session has nowhere to go, so it drops this week."}</div><div class="chips"><button data-confirm="push"><b>OK</b>Push it</button></div></div>`;
  if (ui.actionMode === "skip") h += `<div class="sheet"><div class="note">${d.rank <= 2 ? "This is a priority session. Pushing it usually beats skipping it." : "Skipping keeps the rest of the week where it is."}</div><div class="chips"><button data-confirm="skip"><b>OK</b>Skip it</button>${d.rank <= 2 ? `<button data-confirm="push"><b>Better</b>Push instead</button>` : ""}</div></div>`;
  h += stravaCard;

  h += `<div class="lbl">Knee Ready<em>10 min</em></div><div class="warm">${KNEE.map(([id, dz], i) => { const on = !!sget(warmKey(ui.week, sess, i)); return `<div class="wcard${on ? " on" : ""}"><button class="thumb" data-ex="${id}" aria-label="How to do ${esc(EX[id].name)}">${thumbHTML(id)}</button><div class="wb"><span><span class="wn">${EX[id].name}</span><br><span class="wd">${dz}</span></span><button class="chk" aria-label="${esc(EX[id].name)} done" aria-pressed="${on}" data-warm="${i}">${CHECK}</button></div></div>`; }).join("")}</div>`;
  h += `<div class="lbl">Workout<em>${n}/${t} sets</em></div><div class="list">`;
  let i = 0;
  while (i < d.items.length) {
    const it = d.items[i];
    if (it.ss) {
      const g0 = it.ss; let g = "", cnt = 0;
      while (i < d.items.length && d.items[i].ss === g0) { const c = exCard(d.items[i], i, sess); if (c) { g += c; cnt++; } i++; }
      if (cnt) h += `<div class="ss"><div class="ss-tag">${g0 === 3 ? "Arm finisher" : "Superset"} · no rest between</div>${g}</div>`;
    } else { const c = exCard(it, i, sess); if (c) h += c; i++; }
  }
  h += `</div><div class="lbl">Short on time</div><div class="chips">${d.swaps.map(k => `<button data-sw="${k}" aria-pressed="${ui.swapOpen === k}"><b>${SWAPS[k].m}</b>${SWAPS[k].t}</button>`).join("")}</div>`;
  if (ui.swapOpen) h += `<div class="swapbox"><ol>${SWAPS[ui.swapOpen].l.map(x => `<li>${x}</li>`).join("")}</ol></div>`;
  h += `<div class="foot"><button class="textbtn" id="clearday">Clear this session's log</button><button class="textbtn" id="resetweek">Undo schedule changes</button></div>`;
  app.innerHTML = h + saveBar(); bindPlan();
}
export function exCard(it, i, sess) {
  const ds = dose(it, ui.week); if (!ds) return "";
  const e = EX[it.x];
  let all = true, rows = "";
  for (let s = 0; s < ds.s; s++) {
    const v = sget(setKey(ui.week, sess, i, s)) || {};
    const prev = ui.week > 1 ? (sget(setKey(ui.week - 1, sess, i, s)) || {}) : {};
    if (!v.d) all = false;
    rows += `<div class="set${v.d ? " is-done" : ""}"><span class="n">${s + 1}</span>
      <label class="field"><input inputmode="decimal" aria-label="Set ${s + 1} weight" data-i="${i}" data-s="${s}" data-f="w" value="${esc(v.w)}" placeholder="${esc(prev.w || (it.bw ? "BW" : "—"))}"><span>lb</span></label>
      <label class="field"><input inputmode="numeric" aria-label="Set ${s + 1} reps" data-i="${i}" data-s="${s}" data-f="r" value="${esc(v.r)}" placeholder="${esc(ds.r)}"><span>reps</span></label>
      <button class="chk" aria-label="Set ${s + 1} done" aria-pressed="${!!v.d}" data-i="${i}" data-s="${s}" data-done="1">${CHECK}</button></div>`;
  }
  const sub = [it.tag === "main" ? `<span class="p">Main lift</span>` : it.tag === "pri" ? `<span class="p">Priority</span>` : "", ds.note].filter(Boolean).join(" · ");
  return `<article class="ex${all ? " done" : ""}"><button class="exhead" data-ex="${it.x}" aria-label="How to do ${esc(e.name)}"><span class="thumb">${thumbHTML(it.x)}</span><span><span class="exname">${e.name}</span>${sub ? `<span class="exsub">${sub}</span>` : ""}</span><span class="dose">${ds.s}×${ds.r}<small>${it.u ? it.u.replace("/", "per ") : "sets × reps"}</small></span></button><div class="sets">${rows}</div></article>`;
}
export function bindPlan() {
  bindSaveBar();
  const app = document.getElementById("app");
  const sess = slots(ui.week)[ui.dayIdx];
  const on = (sel, fn) => app.querySelectorAll(sel).forEach(b => b.onclick = () => fn(b));
  on("[data-w]", b => { ui.week = +b.dataset.w; ui.swapOpen = null; ui.actionMode = null; renderPlan(); });
  on("[data-d]", b => { ui.dayIdx = +b.dataset.d; ui.swapOpen = null; ui.actionMode = null; renderPlan(); });
  on("[data-sw]", b => { ui.swapOpen = ui.swapOpen === b.dataset.sw ? null : b.dataset.sw; keep(renderPlan); });
  on("[data-ex]", b => openEx(b.dataset.ex));
  on("[data-act]", b => { ui.actionMode = ui.actionMode === b.dataset.act ? null : b.dataset.act; keep(renderPlan); });
  on("[data-confirm]", b => { if (b.dataset.confirm === "push") ui.toast = pushToTomorrow(ui.week, ui.dayIdx); else { skipDay(ui.week, ui.dayIdx); ui.toast = "Skipped. The rest of the week stays put."; } ui.actionMode = null; renderPlan(); });
  on("[data-swapwith]", b => { const to = +b.dataset.swapwith; swapDays(ui.week, ui.dayIdx, to); ui.toast = `Swapped with ${DOW[to]}.`; ui.actionMode = null; renderPlan(); });
  on("[data-warm]", b => { const k = warmKey(ui.week, sess, +b.dataset.warm); sset(k, sget(k) ? null : 1); keep(renderPlan); });
  on("[data-done]", b => {
    const i = +b.dataset.i, s = +b.dataset.s, k = setKey(ui.week, sess, i, s), v = Object.assign({}, sget(k) || {});
    if (!v.d) { if (!v.r) v.r = dose(DAYS[sess].items[i], ui.week).r; v.d = 1; } else v.d = 0;
    sset(k, v); keep(renderPlan);
  });
  app.querySelectorAll("input[data-f]").forEach(inp => inp.onchange = () => {
    const i = +inp.dataset.i, s = +inp.dataset.s, f = inp.dataset.f, k = setKey(ui.week, sess, i, s), v = Object.assign({}, sget(k) || {});
    v[f] = inp.value.trim(); sset(k, v);
    if (f === "w" && v.w) { const ds = dose(DAYS[sess].items[i], ui.week); for (let t = s + 1; t < ds.s; t++) { const kk = setKey(ui.week, sess, i, t), vv = Object.assign({}, sget(kk) || {}); if (!vv.w) { vv.w = v.w; sset(kk, vv); const el = app.querySelector(`input[data-i="${i}"][data-s="${t}"][data-f="w"]`); if (el) el.value = v.w; } } }
  });
  const c = document.getElementById("clearday");
  if (c) c.onclick = () => { const g = `w${ui.week}s${sess}`; STORE[g] = {}; persistLocal(); dirty.add(g); flush(); renderPlan(); };
  const r = document.getElementById("resetweek");
  if (r) r.onclick = () => { sset(schedKey(ui.week), null); ui.toast = "Week reset to the original plan."; renderPlan(); };
}
