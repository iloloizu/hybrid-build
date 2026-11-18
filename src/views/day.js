import { ui } from "../state.js";
import { EX } from "../plan/exercises.js";
import { KNEE, SWAPS, DAYS, DOW, PHASES, phaseOf, phaseName, dose, flagFor, fmt, iso } from "../plan/plan.js";
import { weekRef, prevRef, weekLabel, weeksOf, blockById, dayDate } from "../plan/blocks.js";
import { STORE, ACTS, SYNC, dirty, persistLocal, sget, sset, flush, setKey, warmKey, schedKey } from "../storage.js";
import { exFor, extraSets, addSet, removeSet, setSub, similar, totalSets, lastLogs, itemsFor, itemAt, addExercise, removeExercise, ADD0 } from "../plan/custom.js";
import { slots, pushToTomorrow, pushPlan, swapDays, skipDay } from "../schedule.js";
import { getRun, setRun, pace, isFinished, setFinished } from "../plan/runs.js";
import { confetti } from "../ui/confetti.js";
import { progress, esc, thumbHTML, CHECK, keep } from "./common.js";
import { go, back } from "../router.js";
import { topbar } from "../ui/topbar.js";
import { ICON } from "../ui/icons.js";
import { openSheet } from "../ui/sheet.js";
import { toast } from "../ui/toast.js";
import { startRest } from "../ui/timer.js";
import { buzz, keepAwake } from "../ui/device.js";
import { todayWD } from "./today.js";
import { rerender } from "./app.js";

/* ---------- day screen: one session, nothing else ---------- */
let LAST = {};
const dayPath = (w, d) => `#/w/${w}/d/${d}`;
const nWeeks = () => weeksOf(blockById(ui.b)).length;
function step(w, d, k) { let x = (w - 1) * 7 + d + k; x = Math.max(0, Math.min(nWeeks() * 7 - 1, x)); return [Math.floor(x / 7) + 1, x % 7]; }
export function stepDay(k) { const [w, d] = step(ui.week, ui.dayIdx, k); if (w !== ui.week || d !== ui.dayIdx) go(dayPath(w, d), { replace: true }); }

export function renderDay(w, d, isTodayTab) {
  w = Math.max(1, Math.min(nWeeks(), w));
  ui.week = w; ui.dayIdx = d;
  const W = weekRef(ui.b, w);
  LAST = W.pause ? {} : lastLogs(W, d);
  const app = document.getElementById("app"); app.className = "wrap day";
  const a = W.pause ? [-1, -1, -1, -1, -1, -1, -1] : slots(W), sess = a[d], s = sess >= 0 ? DAYS[sess] : null, P = W.pause ? { rir: "Paused" } : PHASES[phaseOf(W.pw)];
  const date = dayDate(W, d), acts = ACTS[iso(date)] || [], t = todayWD(), isToday = t && t.b === ui.b && t.w === w && t.d === d;
  const [n, tot] = progress(W, sess);
  const [pw, pd] = step(w, d, -1), [nw, nd] = step(w, d, 1);
  const flag = flagFor(date);

  let h = topbar({
    title: isToday ? "Today" : `${DOW[d]}, ${fmt(date)}`,
    sub: isToday ? `${DOW[d]}, ${fmt(date)} · ${weekLabel(W)}` : W.pause ? "Paused week" : `${weekLabel(W)} · ${phaseName(W.pw)}`,
    back: isTodayTab ? null : { label: weekLabel(W) },
    right: `<button class="iconbtn" id="opts" aria-label="Day options">${ICON.more}</button>`,
    progress: s && s.kind !== "run" && tot ? n / tot : null
  });
  h += `<div class="daynav"><button class="stepbtn" data-step="-1" ${w === 1 && d === 0 ? "disabled" : ""} aria-label="Previous day, ${DOW[pd]}">${ICON.prev}<span>${DOW[pd]} ${dayDate(weekRef(ui.b, pw), pd).getDate()}</span></button>
    ${!isToday && t ? `<button class="pill" id="jumptoday">Today</button>` : ""}
    <button class="stepbtn" data-step="1" ${w === nWeeks() && d === 6 ? "disabled" : ""} aria-label="Next day, ${DOW[nd]}"><span>${DOW[nd]} ${dayDate(weekRef(ui.b, nw), nd).getDate()}</span>${ICON.next}</button></div>`;

  const strava = acts.length ? `<div class="strava"><div class="lbl">From Strava<em>${SYNC ? "synced " + SYNC : ""}</em></div>${acts.map(x => `<div class="act"><span class="aname">${esc(x.name || x.type)}</span><span class="astat">${[x.distance_mi ? x.distance_mi + " mi" : "", x.moving_time || "", x.pace ? x.pace + "/mi" : "", x.avg_hr ? x.avg_hr + " bpm" : ""].filter(Boolean).map(esc).join(" · ")}</span></div>`).join("")}</div>` : "";

  if (!s) {
    const skipped = sess === -2;
    h += `<section class="hero"><h2 class="dim">${W.pause ? "Paused" : skipped ? "Skipped" : "Rest Day"}</h2><div class="meta">${flag ? `<span class="flag">${flag}</span>` : ""}<span>${P.rir}</span></div></section>
      <div class="longrun">${W.pause ? "Paused week. The plan picks up where you left off next week." : skipped ? "Skipped. Got 20 minutes? Pump Only keeps the priority muscles moving." : "Nothing scheduled. Easy run or full rest."}</div>${strava}
      ${skipped ? `<button class="bigbtn ghost" data-quick="S5"><b>20 min</b> Pump Only</button>` : ""}${W.pause ? "" : (acts.length ? "" : runLine(date)) + finishBlock(date, null)}`;
    app.innerHTML = h; bindDay(sess); keepAwake(false); return;
  }
  if (s.kind === "run") {
    h += `<section class="hero"><h2 class="run">${s.name}</h2><div class="meta"><span>Long run</span><span>No lifting</span>${flag ? `<span class="flag">${flag}</span>` : ""}</div></section>${strava}${acts.length ? "" : runLine(date)}${finishBlock(date, null)}`;
    app.innerHTML = h; bindDay(sess); keepAwake(false); return;
  }
  const moved = sess !== d ? `<span class="hot">Moved from ${DOW[sess]}</span>` : "";
  h += `<section class="hero"><h2>${s.name}</h2><div class="meta"><span class="hot">${P.rir}</span>${moved}<span>${s.mins} min</span><span>${s.run}</span>${flag ? `<span class="flag">${flag}</span>` : ""}</div></section>`;
  if (!(n === tot && tot)) h += `<button class="cantbtn" id="cant">Can't train today?</button>`;
  h += strava;
  const warmDone = KNEE.filter((_, i) => sget(warmKey(W, sess, i))).length;
  h += `<div class="lbl">Knee Ready<em>${warmDone}/${KNEE.length} · 10 min</em></div><div class="warm">${KNEE.map(([id, dz], i) => { const on = !!sget(warmKey(W, sess, i)); return `<div class="wcard${on ? " on" : ""}"><button class="thumb" data-ex="${id}" aria-label="How to do ${esc(EX[id].name)}">${thumbHTML(id)}</button><div class="wb"><span><span class="wn">${EX[id].name}</span><br><span class="wd">${dz}</span></span><button class="chk" aria-label="${esc(EX[id].name)} done" aria-pressed="${on}" data-warm="${i}">${CHECK}</button></div></div>`; }).join("")}</div>`;
  h += `<div class="lbl">Workout<em>${n}/${tot} sets</em></div><div class="list">`;
  let i = 0;
  while (i < s.items.length) {
    const it = s.items[i];
    if (it.ss) {
      const g0 = it.ss; let g = "", cnt = 0;
      while (i < s.items.length && s.items[i].ss === g0) { const c = exCard(s.items[i], i, sess); if (c) { g += c; cnt++; } i++; }
      if (cnt) h += `<div class="ss"><div class="ss-tag">${g0 === 3 ? "Arm finisher" : "Superset"} · no rest between</div>${g}</div>`;
    } else { const c = exCard(it, i, sess); if (c) h += c; i++; }
  }
  itemsFor(W, sess).filter(x => x.it.added).forEach(({ it, i }) => { h += exCard(it, i, sess); });
  h += `</div><div class="endrow"><button class="endbtn" id="addex">${ICON.plus}<span>Add exercise</span></button><button class="endbtn" id="shorttime">${ICON.timer}<span>Short on time</span></button></div>`;
  if (!acts.length) h += runLine(date);
  h += finishBlock(date, [n, tot]);
  app.innerHTML = h; bindDay(sess); keepAwake(true);
}

export function exCard(it, i, sess) {
  const W = weekRef(ui.b, ui.week), ds = dose(it, W.pw); if (!ds) return "";
  const x = exFor(it, W, sess, i), e = EX[x], subbed = x !== it.x;
  const extra = extraSets(W, sess, i), total = ds.s + extra;
  const L = (LAST[x] || []).filter(Boolean);
  let all = true, rows = "";
  for (let s = 0; s < total; s++) {
    const v = sget(setKey(W, sess, i, s)) || {};
    const prev = (LAST[x] || [])[s] || L[L.length - 1] || {};
    if (!v.d) all = false;
    rows += `<div class="set${v.d ? " is-done" : ""}${v.z ? " zeroed" : ""}${s >= ds.s ? " extra" : ""}"><span class="n">${s + 1}</span>
      <label class="field"><input inputmode="decimal" enterkeyhint="next" aria-label="Set ${s + 1} weight" data-i="${i}" data-s="${s}" data-f="w" value="${esc(v.w || (v.z ? "" : prev.w) || "")}" placeholder="${it.bw && !subbed ? "BW" : "—"}"><span>lb</span></label>
      <label class="field"><input inputmode="numeric" enterkeyhint="${s + 1 < total ? "next" : "done"}" aria-label="Set ${s + 1} reps" data-i="${i}" data-s="${s}" data-f="r" value="${esc(v.r)}" placeholder="${esc(ds.r)}"><span>reps</span></label>
      <button class="chk" aria-label="Set ${s + 1} done" aria-pressed="${!!v.d}" data-i="${i}" data-s="${s}" data-done="1">${CHECK}</button></div>`;
  }
  const sub = [it.added ? `<span class="p">Added</span>` : subbed ? `<span class="p">For ${esc(EX[it.x].name)}</span>` : it.tag === "main" ? `<span class="p">Main lift</span>` : it.tag === "pri" ? `<span class="p">Priority</span>` : "", ds.note].filter(Boolean).join(" · ");
  const foot = `<div class="exfoot"><button class="ib" data-addset="${i}" aria-label="Add a set" title="Add a set">${ICON.plus}</button>${extra ? `<button class="ib" data-rmset="${i}" aria-label="Remove the last added set" title="Remove a set">${ICON.minus}</button>` : ""}${it.added ? `<button class="ib" data-rmex="${it.k}" aria-label="Remove ${esc(e.name)}" title="Remove">${ICON.close}</button>` : `<button class="ib" data-subopen="${i}" aria-label="Substitute ${esc(e.name)}" title="Substitute">${ICON.swap}</button>`}</div>`;
  return `<article class="ex${all ? " done" : ""}${subbed ? " subbed" : ""}" id="ex-${i}"><button class="exhead" data-ex="${x}" aria-label="How to do ${esc(e.name)}"><span class="thumb">${thumbHTML(x)}</span><span><span class="exname">${e.name}</span>${sub ? `<span class="exsub">${sub}</span>` : ""}</span><span class="dose">${total}×${ds.r}<small>${extra ? `+${extra} extra` : it.u ? it.u.replace("/", "per ") : "sets × reps"}</small></span></button><div class="sets">${rows}</div>${foot}</article>`;
}

// Rest after a checked set: none mid-superset (go straight to the partner exercise).
function restFor(items, i) {
  if (i >= ADD0) return 75;
  const it = items[i], nx = items[i + 1];
  if (it.ss && nx && nx.ss === it.ss) return 0;
  return it.tag === "main" ? 120 : 75;
}

function bindDay(sess) {
  const app = document.getElementById("app"), W = weekRef(ui.b, ui.week), w = W, d = ui.dayIdx;
  const on = (sel, fn) => app.querySelectorAll(sel).forEach(b => b.onclick = () => fn(b));
  const tb = document.getElementById("tb-back"); if (tb) tb.onclick = () => back(`#/w/${ui.week}`);
  on("[data-step]", b => stepDay(+b.dataset.step));
  const cant = document.getElementById("cant"); if (cant) cant.onclick = () => cantSheet(sess);
  const fin = document.getElementById("finish"); if (fin) fin.onclick = () => finishSheet(W, d, sess);
  const rmi = document.getElementById("day-run-mi"), rmin = document.getElementById("day-run-min");
  if (rmi) {
    const k = iso(dayDate(W, d)), save = () => { const v = { mi: rmi.value.trim(), min: rmin.value.trim() }; setRun(k, v); document.getElementById("day-run-pace").textContent = pace(v); };
    rmi.onchange = save; rmin.onchange = save;
    rmi.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); rmin.focus(); } };
    rmin.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); rmin.blur(); } };
  }
  const jt = document.getElementById("jumptoday"); if (jt) jt.onclick = () => go("#/today");
  on("[data-ex]", b => go(`#/ex/${b.dataset.ex}`));
  document.getElementById("opts").onclick = () => dayOptions(sess);
  const st = document.getElementById("shorttime"); if (st) st.onclick = () => quickSheet(DAYS[sess].swaps);
  on("[data-quick]", b => quickSheet([b.dataset.quick]));
  on("[data-warm]", b => { const k = warmKey(w, sess, +b.dataset.warm); const was = sget(k); sset(k, was ? null : 1); if (!was) buzz(); keep(rerender); });
  on("[data-done]", b => {
    const i = +b.dataset.i, s = +b.dataset.s, k = setKey(w, sess, i, s), v = Object.assign({}, sget(k) || {});
    const items = DAYS[sess].items;
    if (v.z) { delete v.z; v.d = 0; v.r = ""; } else if (!v.d) { if (!v.r) v.r = dose(itemAt(W, sess, i), W.pw).r; const wi = app.querySelector(`input[data-i="${i}"][data-s="${s}"][data-f="w"]`); if (!v.w && wi && wi.value.trim()) v.w = wi.value.trim(); v.d = 1; buzz(); const r = restFor(items, i); if (r) startRest(r); } else v.d = 0;
    sset(k, v); keep(rerender);
  });
  app.querySelectorAll("input[data-f]").forEach(inp => {
    inp.onchange = () => {
      const i = +inp.dataset.i, s = +inp.dataset.s, f = inp.dataset.f, k = setKey(w, sess, i, s), v = Object.assign({}, sget(k) || {});
      v[f] = inp.value.trim(); sset(k, v);
      if (f === "w" && v.w) { const n = totalSets(itemAt(W, sess, i), w, sess, i); for (let t = s + 1; t < n; t++) { const kk = setKey(w, sess, i, t), vv = Object.assign({}, sget(kk) || {}); if (!vv.w) { vv.w = v.w; sset(kk, vv); const el = app.querySelector(`input[data-i="${i}"][data-s="${t}"][data-f="w"]`); if (el) el.value = v.w; } } }
    };
    // Enter moves weight → reps → next set's weight.
    inp.onkeydown = e => {
      if (e.key !== "Enter") return; e.preventDefault();
      const all = [...app.querySelectorAll("input[data-f]")], k = all.indexOf(inp);
      if (all[k + 1]) all[k + 1].focus(); else inp.blur();
    };
  });
  on("[data-addset]", b => { addSet(w, sess, +b.dataset.addset); keep(rerender); });
  on("[data-rmset]", b => { const i = +b.dataset.rmset; sset(setKey(w, sess, i, totalSets(itemAt(W, sess, i), w, sess, i) - 1), null); removeSet(w, sess, i); keep(rerender); });
  on("[data-subopen]", b => subSheet(sess, +b.dataset.subopen));
  on("[data-rmex]", b => { const k = +b.dataset.rmex, name = EX[itemAt(W, sess, ADD0 + k).x].name; removeExercise(W, sess, k); toast(`${name} removed.`); keep(rerender); });
  const ax = document.getElementById("addex"); if (ax) ax.onclick = () => addSheet(sess);
}

/* ---------- done for the day ---------- */
// Run line near the end of the day: miles + minutes, saved as you type.
function runLine(date) {
  const r = getRun(iso(date)) || {};
  return `<div class="runlog inline"><span class="rl-lbl">${ICON.run}<span>Run</span></span><label class="field"><input inputmode="decimal" enterkeyhint="next" id="day-run-mi" aria-label="Miles run" value="${esc(r.mi)}" placeholder="—"><span>mi</span></label><label class="field"><input inputmode="numeric" enterkeyhint="done" id="day-run-min" aria-label="Minutes run" value="${esc(r.min)}" placeholder="—"><span>min</span></label><span class="rl-pace" id="day-run-pace">${pace(r)}</span></div>`;
}
function finishBlock(date, prog) {
  const k = iso(date), r = getRun(k);
  if (isFinished(k)) return `<button class="donebanner" id="finish"><b>Done</b><span>${prog && prog[1] ? `${prog[0]}/${prog[1]} sets` : ""}${prog && prog[1] && r && r.mi ? " · " : ""}${r && r.mi ? `${r.mi} mi` : ""}</span></button>`;
  return `<button class="bigbtn finish" id="finish">Done</button>`;
}
function finishSheet(W, d, sess) {
  const date = dayDate(W, d), k = iso(date), [n, tot] = progress(W, sess);
  // Per exercise: real sets only (not the 0s from closing out), compared with the last time you did it.
  const before = sess >= 0 ? lastLogs(W, d) : {}, num = v => parseFloat(v && v.w) || 0, avg = a => a.reduce((t, v) => t + num(v), 0) / a.length;
  let vol = 0, real = 0; const rows = [];
  if (sess >= 0) itemsFor(W, sess).forEach(({ it, i }) => {
    const x = exFor(it, W, sess, i), sets = [];
    for (let s = 0; s < 12; s++) { const v = sget(setKey(W, sess, i, s)); if (v && v.d && !v.z) { real++; if (num(v)) sets.push(v); } }
    if (!sets.length) return;
    const v0 = sets.reduce((t, v) => t + num(v) * (parseInt(v.r) || 0), 0); vol += v0;
    const prev = (before[x] || []).filter(v => v && num(v)), a = avg(sets), diff = prev.length ? Math.round((a - avg(prev)) * 10) / 10 : null;
    rows.push({ name: EX[x].name, a: Math.round(a * 10) / 10, diff, v0 });
  });
  const trend = r => r.diff == null ? `<em class="new">New</em>` : r.diff > 0 ? `<em class="up">▲ ${r.diff}</em>` : r.diff < 0 ? `<em class="down">▼ ${Math.abs(r.diff)}</em>` : `<em class="same">=</em>`;
  const ups = rows.filter(r => r.diff > 0).length, downs = rows.filter(r => r.diff < 0).length;
  const act = (ACTS[k] || [])[0], R = getRun(k) || (act ? { mi: act.distance_mi ? String(act.distance_mi) : "", min: "" } : {});
  openSheet({ title: "Done", render: (body, api) => {
    body.innerHTML = `${tot ? `<div class="stats"><div><b>${vol ? Math.round(vol).toLocaleString() : "—"}</b><span>lb lifted</span></div><div><b>${real}/${tot}</b><span>Sets</span></div></div>` : ""}
      ${rows.length ? `<div class="lbl">How it went<em>${ups ? `${ups} up` : ""}${ups && downs ? " · " : ""}${downs ? `${downs} down` : ""}${!ups && !downs ? "vs last time" : ""}</em></div><div class="liftstats">${rows.map(r => `<div class="ls"><span class="ln">${esc(r.name)}</span><span class="la">${r.a} lb avg</span>${trend(r)}<span class="lv">${Math.round(r.v0).toLocaleString()} lb</span></div>`).join("")}</div>` : ""}
      <div class="lbl">Run today?<em>${act ? "From Strava" : "Skip if you didn't"}</em></div>
      <div class="runlog"><label class="field"><input inputmode="decimal" enterkeyhint="next" id="run-mi" aria-label="Miles run" value="${esc(R.mi)}" placeholder="—"><span>mi</span></label><label class="field"><input inputmode="numeric" enterkeyhint="done" id="run-min" aria-label="Minutes run" value="${esc(R.min)}" placeholder="—"><span>min</span></label><span class="rl-pace" id="run-pace">${pace(R)}</span></div>
      <button class="bigbtn" id="fin-go">Finish</button>`;
    const mi = body.querySelector("#run-mi"), min = body.querySelector("#run-min"), upd = () => { body.querySelector("#run-pace").textContent = pace({ mi: mi.value, min: min.value }); };
    mi.oninput = upd; min.oninput = upd;
    mi.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); min.focus(); } };
    min.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); min.blur(); } };
    body.querySelector("#fin-go").onclick = () => {
      setRun(k, { mi: mi.value.trim(), min: min.value.trim() }); setFinished(k, true);
      // Close out anything not lifted: 0 reps, marked so it never becomes a remembered weight.
      if (sess >= 0) itemsFor(W, sess).forEach(({ it, i }) => { const nSets = totalSets(it, W, sess, i); for (let s = 0; s < nSets; s++) { const key = setKey(W, sess, i, s), v = sget(key) || {}; if (!v.d) sset(key, Object.assign({}, v, { r: "0", d: 1, z: 1 })); } });
      api.close(); buzz(30); keepAwake(false); confetti();
      setTimeout(() => { rerender(); setTimeout(() => stepDay(1), 650); }, 250);
    };
  } });
}

/* ---------- sheets ---------- */
// Add any library exercise to the end of today's session.
function addSheet(sess) {
  const w = weekRef(ui.b, ui.week), here = new Set(itemsFor(w, sess).map(x => exFor(x.it, w, sess, x.i)));
  let q = "";
  openSheet({ title: "Add exercise", tall: true, render: (body, api) => {
    if (!body.firstChild) {
      body.innerHTML = `<label class="search">${ICON.search}<input type="search" placeholder="Search name, muscle, equipment" aria-label="Search exercises" enterkeyhint="search"></label><div class="subnote">Added to this session only</div><div class="subres"></div>`;
      body.querySelector("input").oninput = e => { q = e.target.value.trim().toLowerCase(); api.refresh(); };
    }
    const ids = Object.keys(EX).filter(id => !q || (EX[id].name + " " + EX[id].muscles.join(" ") + " " + EX[id].equip).toLowerCase().includes(q)).sort((a, b) => EX[a].name.localeCompare(EX[b].name));
    body.querySelector(".subres").innerHTML = ids.length ? `<div class="sublist">${ids.map(id => `<button class="subrow" data-addid="${id}"><span class="thumb">${thumbHTML(id)}</span><span><b>${EX[id].name}</b><small>${esc(EX[id].equip)}</small></span><em>${here.has(id) ? `<span class="inplan">Today</span>` : ""}${esc(EX[id].muscles[0])}</em></button>`).join("")}</div>` : `<div class="optnote">No match for “${esc(q)}”.</div>`;
    body.querySelectorAll("[data-addid]").forEach(b => b.onclick = () => {
      const id = b.dataset.addid, i = addExercise(w, sess, id); api.close(); toast(`${EX[id].name} added.`);
      setTimeout(() => { keep(rerender); const el = document.getElementById(`ex-${i}`); if (el) el.scrollIntoView({ block: "center", behavior: "smooth" }); }, 0);
    });
  } });
}

// Sick, wiped or busy: see what the week becomes before moving or skipping.
function cantSheet(sess) {
  const w = weekRef(ui.b, ui.week), d = ui.dayIdx, s = DAYS[sess], a = slots(w), { a: after, dropped, past } = pushPlan(a, d);
  const row = i => { const x = after[i], was = a[i], name = x >= 0 ? DAYS[x].name : "Rest"; return `<li class="${x !== was ? "chg" : ""}"><b>${DOW[i]}</b><span>${name}</span></li>`; };
  openSheet({ title: "Can't train today?", render: (body, api) => {
    body.innerHTML = `<div class="optnote">Sick or wiped out? Rest. If you're still down tomorrow, push again.</div>
      <div class="cantopt"><div class="lbl">Move ${s.name} to tomorrow</div>
        ${past ? `<div class="optnote">Nowhere left to move it this week, so it drops.</div>` : `<ol class="preview">${[d, d + 1, d + 2, d + 3, d + 4, d + 5].filter(i => i <= 5).map(row).join("")}</ol>${dropped != null ? `<div class="optnote drop">${DAYS[dropped].name} drops this week to make room.</div>` : ""}`}
        <button class="bigbtn" data-c="push">${past ? "Drop it" : "Move it"}</button></div>
      <div class="cantopt"><div class="lbl">Skip ${s.name}</div><div class="optnote">${s.rank <= 2 ? "It's a priority session, so moving it usually beats skipping." : "The rest of the week stays where it is."}</div>
        <button class="bigbtn ghost" data-c="skip">Skip it</button></div>`;
    body.querySelectorAll("[data-c]").forEach(b => b.onclick = () => {
      const msg = b.dataset.c === "push" ? pushToTomorrow(w, d) : (skipDay(w, d), "Skipped. Rest up.");
      api.close(); toast(msg); setTimeout(rerender, 0);
    });
  } });
}

function quickSheet(keys) {
  let openK = keys.length === 1 ? keys[0] : null;
  openSheet({ title: "Short on time", render: (body, api) => {
    body.innerHTML = `<div class="optlist">${keys.map(k => `<button class="optrow" data-k="${k}" aria-expanded="${openK === k}"><b class="tag">${SWAPS[k].m}</b><span>${SWAPS[k].t}</span></button>${openK === k ? `<ol class="quickol">${SWAPS[k].l.map(x => `<li>${x}</li>`).join("")}</ol>` : ""}`).join("")}</div>`;
    body.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { openK = openK === b.dataset.k ? null : b.dataset.k; api.refresh(); });
  } });
}

function dayOptions(sess) {
  const w = weekRef(ui.b, ui.week), d = ui.dayIdx, s = sess >= 0 ? DAYS[sess] : null, lifting = s && s.kind !== "run" && !w.pause;
  const changed = !!sget(schedKey(w));
  let mode = null;
  openSheet({ title: `${DOW[d]} options`, render: (body, api) => {
    const a = slots(w);
    let h = `<div class="optlist">`;
    if (lifting) {
      h += `<button class="optrow" data-m="push" aria-expanded="${mode === "push"}"><b class="tag">→</b><span>Push to tomorrow</span></button>`;
      if (mode === "push") h += `<div class="optnote">${d < 5 ? "Today becomes rest and the rest of the week slides a day. If the week runs out of room, the least important session drops (Pump Fiction, then Hinge Benefits)." : "Saturday's session has nowhere to go, so it drops this week."}<button class="bigbtn" data-do="push">Push it</button></div>`;
      h += `<button class="optrow" data-m="swap" aria-expanded="${mode === "swap"}"><b class="tag">⇄</b><span>Swap with another day</span></button>`;
      if (mode === "swap") h += `<div class="optnote"><div class="daychips">${a.map((x, i) => i === d || i === 6 ? "" : `<button data-swapwith="${i}"><b>${DOW[i]}</b>${x >= 0 ? DAYS[x].name : "Rest"}</button>`).join("")}</div></div>`;
      h += `<button class="optrow" data-m="skip" aria-expanded="${mode === "skip"}"><b class="tag">✕</b><span>Skip</span></button>`;
      if (mode === "skip") h += `<div class="optnote">${s.rank <= 2 ? "This is a priority session. Pushing it usually beats skipping it." : "Skipping keeps the rest of the week where it is."}<div class="btnrow"><button class="bigbtn" data-do="skip">Skip it</button>${s.rank <= 2 ? `<button class="bigbtn ghost" data-do="push">Push instead</button>` : ""}</div></div>`;
      h += `<button class="optrow" data-do="quick"><b class="tag">⏱</b><span>Short on time</span></button>`;
      h += `<button class="optrow danger" data-do="clear"><b class="tag">⌫</b><span>Clear this session's log</span></button>`;
    }
    if (changed) h += `<button class="optrow" data-do="reset"><b class="tag">↺</b><span>Undo schedule changes this week</span></button>`;
    if (!lifting && !changed) h += `<div class="optnote">Nothing to change on a ${s ? "long run" : "rest"} day.</div>`;
    body.innerHTML = h + `</div>`;
    body.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { mode = mode === b.dataset.m ? null : b.dataset.m; api.refresh(); });
    body.querySelectorAll("[data-swapwith]").forEach(b => b.onclick = () => { const to = +b.dataset.swapwith; swapDays(w, d, to); api.close(); toast(`Swapped with ${DOW[to]}.`); setTimeout(rerender, 0); });
    body.querySelectorAll("[data-do]").forEach(b => b.onclick = () => {
      const k = b.dataset.do;
      if (k === "quick") { api.close(); setTimeout(() => quickSheet(s.swaps), 250); return; }
      if (k === "clear" && !confirm("Clear every set logged for this session?")) return;
      let msg = "";
      if (k === "push") msg = pushToTomorrow(w, d);
      if (k === "skip") { skipDay(w, d); msg = "Skipped. The rest of the week stays put."; }
      if (k === "clear") { const g = `${w.key}s${sess}`; STORE[g] = {}; persistLocal(); dirty.add(g); flush(); msg = "Session log cleared."; }
      if (k === "reset") { sset(schedKey(w), null); msg = "Week back to the original plan."; }
      api.close(); toast(msg); setTimeout(rerender, 0);
    });
  } });
}

function subSheet(sess, i) {
  const w = weekRef(ui.b, ui.week), it = DAYS[sess].items[i], cur = exFor(it, w, sess, i);
  let q = "";
  openSheet({ title: `Swap ${EX[it.x].name}`, tall: true, render: (body, api) => {
    const first = !body.firstChild;
    if (first) {
      body.innerHTML = `<label class="search">${ICON.search}<input type="search" placeholder="Search exercises" aria-label="Search exercises" enterkeyhint="search"></label><div class="subnote">Applies from ${weekLabel(w).toLowerCase()} on</div><div class="subres"></div>`;
      body.querySelector("input").oninput = e => { q = e.target.value.trim().toLowerCase(); api.refresh(); };
    }
    const match = id => !q || (EX[id].name + " " + EX[id].muscles.join(" ") + " " + EX[id].equip).toLowerCase().includes(q);
    const list = similar(it.x), close = list.filter(r => r.score >= 4 && match(r.id)), rest = list.filter(r => r.score < 4 && match(r.id)).sort((a, b) => EX[a.id].name.localeCompare(EX[b.id].name));
    const row = id => `<button class="subrow" data-pick="${id}" aria-pressed="${id === cur}"><span class="thumb">${thumbHTML(id)}</span><span><b>${EX[id].name}</b><small>${esc(EX[id].equip)}</small></span><em>${esc(EX[id].muscles[0])}</em></button>`;
    body.querySelector(".subres").innerHTML = (cur !== it.x ? `<button class="subrow back" data-pick="${it.x}"><span class="thumb">${thumbHTML(it.x)}</span><span><b>Back to ${EX[it.x].name}</b><small>The planned lift</small></span><em>Plan</em></button>` : "")
      + (close.length ? `<div class="sublbl">Closest</div><div class="sublist">${close.map(r => row(r.id)).join("")}</div>` : "")
      + (rest.length ? `<div class="sublbl">Everything else</div><div class="sublist">${rest.map(r => row(r.id)).join("")}</div>` : "")
      + (!close.length && !rest.length ? `<div class="optnote">No match for “${esc(q)}”.</div>` : "");
    body.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => {
      const id = b.dataset.pick; setSub(w, sess, i, id, it.x); api.close();
      toast(id === it.x ? `Back to ${EX[it.x].name}.` : `${EX[id].name} from ${weekLabel(w).toLowerCase()} on.`);
      setTimeout(() => { keep(rerender); const el = document.getElementById(`ex-${i}`); if (el) el.scrollIntoView({ block: "center" }); }, 0);
    });
  } });
}
