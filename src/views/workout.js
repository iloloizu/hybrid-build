import { themeHue } from "../ui/theme.js";
import { ui } from "../state.js";
import { EX, picFor } from "../plan/exercises.js";
import { KNEE, dose, flagFor, fmt } from "../plan/plan.js";
import { sget, sset, setKey, warmKey } from "../storage.js";
import { exFor, extraSets, addSet, removeSet, totalSets, itemsFor, itemAt, removeExercise, ADD0, lastOnce, isOnce, setSubOnce, hideHint } from "../plan/custom.js";
import { weekLabel, dayDate } from "../plan/blocks.js";
import { sessionMeta } from "../plans/index.js";
import { afterLog, firstOpen, supersetLetters } from "../plan/flow.js";
import { parse, matchExercise } from "../plan/voice.js";
import { esc, thumbHTML, CHECK, keep } from "./common.js";
import { go, pushOverlay, interceptPop } from "../router.js";
import { ICON } from "../ui/icons.js";
import { openSheet } from "../ui/sheet.js";
import { toast } from "../ui/toast.js";
import { startRest, onRest, restState, stopRest } from "../ui/timer.js";
import { buzz } from "../ui/device.js";
import { store } from "../platform/index.js";
import { rerender } from "./app.js";

/* ---------- workout: overview (list / gallery) and zoomed-in "playlist" view ----------
   Both views read and write the same set logs (setKey / sget / sset), so a set logged in one
   shows in the other. The header colour follows the exercise in focus. */

const HUES = ["#2f6688", "#2b6f62", "#5b3f86", "#8a4b2c", "#3c4f8c", "#7a3658", "#4f6b2a", "#6b5a2a", "#2a5f7a", "#7a4a2a"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DOWS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const reduceMotion = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
let popped = "";        // "k:s" of the set just ticked, for a small pop
let focusOverride = null; // superset partner to highlight in the overview

// One entry per exercise shown today, in order, with its sets as stored.
export function buildEntries(W, sess, LAST) {
  const out = [];
  itemsFor(W, sess).forEach(({ it, i }) => {
    const ds = dose(it, W.pw); if (!ds) return;
    const x = exFor(it, W, sess, i), total = ds.s + extraSets(W, sess, i), sets = [];
    let done = 0, closed = 0;
    for (let s = 0; s < total; s++) { const v = sget(setKey(W, sess, i, s)) || {}; sets.push(v); if (v.d) closed++; if (v.d && !v.z) done++; }
    const L = (LAST[x] || []).filter(Boolean), top = L.reduce((m, v) => (parseFloat(v.w) || 0) > (parseFloat(m && m.w) || 0) ? v : m, null);
    out.push({ it, i, x, ds, total, done: closed, lifted: done, sets, ss: it.added ? null : (it.ss == null ? null : it.ss),
      name: x === it.x && it.label ? it.label : EX[x].name, prev: LAST[x] || [], last: top && parseFloat(top.w) ? `${top.w} lb` : it.bw ? "bodyweight" : "",
      once: !it.added && x !== it.x && isOnce(W, sess, i), hint: !it.added && x === it.x && !closed ? lastOnce(W, sess, i) : null });
  });
  return out.map((e, k) => Object.assign(e, { k, hue: themeHue(k, HUES[k % HUES.length]) }));
}

const pics = (x, live, cls = "") => {
  const p = picFor(x);
  if (!p) return `<span class="pics fig ${cls}">${thumbHTML(x)}</span>`;
  return `<span class="pics ${cls}${live && !p.still ? " live" : ""}"><img class="a" src="${p.a}" alt="" decoding="async"><img class="b" src="${p.b}" alt="" decoding="async"></span>`;
};
const scheme = e => `${e.total} × ${e.ds.r}${e.it.u ? e.it.u : ""}`;
const stopText = P => { const m = String(P.rir || "").match(/^([\d-]+) in the tank/); return m ? `stop ${m[1]} short` : String(P.rir || "").toLowerCase(); };

// A set row: number, weight, reps, check. Remembered weights show dimmed until logged.
function rowHTML(e, s, isOpenRow) {
  const v = e.sets[s], prevW = (e.prev[s] || e.prev.filter(Boolean).slice(-1)[0] || {}).w, wv = v.w || (v.z ? "" : prevW) || "";
  const label = `${e.name}, set ${s + 1}`;
  return `<div class="lrow${v.d ? " is-done" : ""}${v.z ? " zeroed" : ""}${isOpenRow ? " open" : ""}${s >= e.ds.s ? " extra" : ""}">
    <b class="ln">${s + 1}</b>
    <label class="lf"><input inputmode="decimal" enterkeyhint="next" aria-label="${esc(label)} weight" data-k="${e.k}" data-s="${s}" data-lw="1" value="${esc(wv)}" class="${v.w ? "" : "pre"}" placeholder="${e.it.bw ? "BW" : "—"}"><span>LB</span></label>
    <label class="lf"><input inputmode="numeric" enterkeyhint="done" aria-label="${esc(label)} reps" data-k="${e.k}" data-s="${s}" data-lr="1" value="${esc(v.r)}" placeholder="${esc(String(e.ds.r).replace(/\D.*$/, "") || e.ds.r)}"><span>REPS</span></label>
    <button class="lchk${popped === e.k + ":" + s && v.d ? " pop" : ""}" aria-label="Log ${esc(label)}" aria-pressed="${!!v.d}" data-k="${e.k}" data-s="${s}" data-log="1">${CHECK}</button></div>`;
}
const rowsHTML = (e, focus) => { const open = e.sets.findIndex(v => !v.d); return e.sets.map((v, s) => rowHTML(e, s, e.k === focus && s === open)).join(""); };

/* ---------- overview ---------- */
export function workoutHTML(ctx) {
  const { W, s, P, hybrid, date, entries, extra } = ctx;
  const letters = supersetLetters(entries), open = firstOpen(entries);
  const focus = focusOverride != null && entries[focusOverride] ? focusOverride : open;
  const F = entries[Math.max(focus, 0)] || entries[0];
  const total = entries.reduce((a, e) => a + e.total, 0), lifted = entries.reduce((a, e) => a + e.lifted, 0);
  const mins = hybrid ? s.mins : sessionMeta(s).mins, layout = getLayout();
  const kick = `${DOWS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]} · ${weekLabel(W).toUpperCase()} · ${String(P.name || "").toUpperCase()}`;
  const resume = open < 0 ? "All sets logged" : `Zoom in · ${shortName(entries[open].name)}, set ${entries[open].done + 1}`;
  const pos = e => { const grp = entries.filter(x => x.ss != null && x.ss === e.ss); return grp.indexOf(e) + 1; };
  let h = `<div class="wo-bg" style="--hue:${F ? F.hue : themeHue(0, HUES[0])}"><i class="wo-hue"></i><i class="wo-fade"></i></div>
    ${ctx.topRow}
    <header class="wo-head"><span class="kick">${esc(kick)}</span><h1>${esc(s.name)}</h1>
      <span class="wo-sub">${entries.length} exercises · ${total} sets · about ${mins} min${hybrid ? ` · ${esc(P.rir)}` : ""}</span>
      ${ctx.chips ? `<div class="meta">${ctx.chips}</div>` : ""}</header>
    <div class="wo-prog"><div class="bar"><i style="width:${total ? Math.round(lifted / total * 100) : 0}%"></i></div><span>${lifted} of ${total} sets</span></div>
    <div class="wo-ctl"><button class="zoombtn" id="zoomgo"${open < 0 ? " disabled" : ""}><svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><path d="M3 1.5v11l9-5.5z"/></svg><span>${esc(resume)}</span></button>
      <div class="seg" role="group" aria-label="Layout"><button data-layout="rows" aria-label="List with sets" aria-pressed="${layout === "rows"}">${ICON.list}</button><button data-layout="grid" aria-label="Gallery" aria-pressed="${layout === "grid"}">${ICON.grid}</button></div></div>
    ${extra.cant}${extra.strava}${extra.warm}`;
  if (layout === "grid") {
    h += `<div class="wo-grid">${entries.map(e => `<button class="tile${e.k === focus ? " cur" : ""}" data-zoom="${e.k}" aria-label="Zoom in on ${esc(e.name)}, ${e.done} of ${e.total} sets done">
      <span class="tile-pic">${pics(e.x, e.k === focus)}${e.ss != null ? `<span class="sstag">SS ${letters[e.ss]}${pos(e)}</span>` : ""}${e.done >= e.total ? `<span class="okdot">${CHECK}</span>` : ""}</span>
      <b>${esc(e.name)}</b><span class="tile-sub"><span>${esc(scheme(e))}</span><span class="dots">${e.sets.map(v => `<i class="${v.d ? "on" : ""}"></i>`).join("")}</span></span></button>`).join("")}</div>`;
  } else {
    h += `<div class="wo-list">${entries.map(e => `<section class="card${e.k === focus ? " cur" : ""}" id="ex-${e.i}">
      ${e.ss != null && pos(e) === 1 ? `<span class="sshead">SUPERSET ${letters[e.ss]} · NO REST BETWEEN</span>` : ""}
      <button class="cardhead" data-zoom="${e.k}" aria-label="Zoom in on ${esc(e.name)}, ${e.done} of ${e.total} sets done">${pics(e.x, e.k === focus, "sm")}
        <span class="ch-txt"><b>${esc(e.name)}</b><small>${esc(scheme(e))}${e.last ? ` · last ${esc(e.last)}` : ""}${e.ds.note ? ` · ${esc(e.ds.note)}` : ""}</small></span>
        <span class="ch-count">${e.done}/${e.total}${ICON.zoom}</span></button>
      ${e.once ? `<div class="swaphint"><span>Swapped for today. ${esc(EX[e.it.x].name)} comes back next time.</span></div>` : ""}
      ${e.hint ? `<div class="swaphint"><span>Last time you swapped to <b>${esc(EX[e.hint].name)}</b>.</span><button class="sh-go" data-again="${e.k}">Swap again</button><button class="sh-x" data-nohint="${e.k}" aria-label="Don't remind me">${ICON.close}</button></div>` : ""}
      <div class="lrows">${rowsHTML(e, focus)}</div>
      <div class="cardacts">
        ${e.it.added ? `<button class="cact" data-act="rmex" data-k="${e.k}" aria-label="Remove ${esc(e.name)}">${ICON.close}<span>Remove</span></button>` : `<button class="cact" data-act="sub" data-k="${e.k}" aria-label="Swap ${esc(e.name)}">${ICON.swap}<span>Swap</span></button>`}
        <button class="cact" data-act="add" data-k="${e.k}" aria-label="Add a set to ${esc(e.name)}">${ICON.plus}<span>Set</span></button>
        ${extraSets(ctx.W, ctx.sess, e.i) ? `<button class="cact" data-act="rm" data-k="${e.k}" aria-label="Remove the added set">${ICON.minus}<span>Set</span></button>` : ""}
        <button class="cact" data-act="more" data-k="${e.k}" aria-label="More for ${esc(e.name)}">${ICON.more}</button>
      </div></section>`).join("")}</div>`;
  }
  h += extra.end + `<button class="micbtn" id="micbtn" aria-label="Log by voice: say something like 5 by 5 bench at 145">${ICON.mic}</button>`;
  return h;
}

/* ---------- zoomed-in playlist view ---------- */
export function zoomHTML(ctx) {
  const { s, P, entries } = ctx, k = Math.min(Math.max(ui.zoom, 0), entries.length - 1), E = entries[k];
  const letters = supersetLetters(entries), grp = E.ss != null ? entries.filter(x => x.ss === E.ss) : [], pos = grp.indexOf(E) + 1, partner = grp[pos] || grp[0];
  const nx = entries[k + 1], rest = restState();
  return `<div class="wo-bg" style="--hue:${E.hue}"><i class="wo-hue"></i><i class="wo-fade"></i></div>
    <div class="zm-top"><button class="iconbtn" id="zback" aria-label="Back to the whole workout">${ICON.down}</button>
      <span class="zm-title">${esc(String(s.name).toUpperCase())}<b>${k + 1} of ${entries.length}</b></span>
      <span class="zm-tr"><button class="iconbtn" id="zmic" aria-label="Log by voice">${ICON.mic}</button><button class="iconbtn" id="zopts" aria-label="Exercise options">${ICON.more}</button></span></div>
    <div class="zm-pic">${pics(E.x, true, "big")}</div>
    ${E.ss != null ? `<span class="zm-ss">Superset ${letters[E.ss]} · ${pos} of ${grp.length}${partner && partner !== E ? ` · then ${esc(partner.name)}` : ""}</span>` : ""}
    <div class="zm-name"><h2>${esc(E.name)}</h2><span>${esc(scheme(E))}${E.last ? ` · last time ${esc(E.last)}` : ""}${stopText(P) ? ` · ${esc(stopText(P))}` : ""}</span></div>
    <div class="lrows">${rowsHTML(E, k)}</div>
    <div class="zm-row"><button class="linkbtn" id="zadd">+ Add set</button><span id="zrest">${rest.on ? restPill(rest) : ""}</span></div>
    <div class="zm-foot"><span class="zm-hint">Tap any exercise to jump</span>
      <div class="strip" style="--n:${Math.min(entries.length, 7)}">${entries.map(e => `<button class="strip-b${e.k === k ? " cur" : ""}" data-jump="${e.k}" aria-label="Zoom in on ${esc(e.name)}, ${e.done} of ${e.total} sets done">${pics(e.x, false)}${e.done >= e.total ? `<i class="okpip"></i>` : ""}</button>`).join("")}</div>
      <div class="btnrow"><button class="pillbtn ghost" id="zprev"${k === 0 ? " disabled" : ""}>‹ Previous</button><button class="pillbtn" id="znext">${nx ? `Next · ${esc(shortName(nx.name))} ›` : "Back to overview"}</button></div></div>`;
}
const restPill = st => `<button class="restpill sm" id="zrestbtn" aria-label="Rest timer, tap to skip"><i style="width:${st.pct}%"></i><span>Rest ${st.text} · skip</span></button>`;
const shortName = n => n.replace(/^(Barbell|Single-arm|Seated|Standing|Face-away|Half-kneeling)\s+/i, "").split(" ").slice(0, 2).join(" ").replace(/,$/, "");

/* ---------- behaviour ---------- */
const LAYOUT_KEY = "hb-layout";
// Move the zoomed view to another exercise and start at the top.
const zoomTo = k => { ui.zoom = k; rerender(); window.scrollTo(0, 0); };
const getLayout = () => (store.get(LAYOUT_KEY) === "grid" ? "grid" : "rows");

export function openZoom(k) { if (ui.zoom == null) pushOverlay(); ui.zoom = k; focusOverride = null; rerender(); window.scrollTo(0, 0); }
export function resetZoom() { ui.zoom = null; document.body.classList.remove("zooming"); }
interceptPop(() => { if (ui.zoom == null) return false; resetZoom(); rerender(); return true; });

// Bind both views. ctx: { W, sess, entries }
export function bindWorkout(ctx) {
  const { W, sess, entries } = ctx, app = document.getElementById("app");
  const on = (sel, fn) => app.querySelectorAll(sel).forEach(b => b.onclick = e => fn(b, e));
  on("[data-zoom]", b => openZoom(+b.dataset.zoom));
  const mic = document.getElementById("micbtn") || document.getElementById("zmic");
  if (mic) mic.onclick = () => voiceSheet(ctx, ui.zoom != null ? Math.min(Math.max(ui.zoom, 0), entries.length - 1) : (focusOverride != null && entries[focusOverride] ? focusOverride : firstOpen(entries)));
  on("[data-again]", b => { const E = entries[+b.dataset.again]; setSubOnce(W, sess, E.i, E.hint, E.it.x); toast(`${EX[E.hint].name} for today.`); keep(rerender); });
  on("[data-nohint]", b => { const E = entries[+b.dataset.nohint]; hideHint(W, sess, E.i); keep(rerender); });
  on("[data-act]", b => { const E = entries[+b.dataset.k]; if (E) cardAction(ctx, E, b.dataset.act); });
  on("[data-layout]", b => { store.set(LAYOUT_KEY, b.dataset.layout); keep(rerender); });
  const zg = document.getElementById("zoomgo"); if (zg) zg.onclick = () => { const o = firstOpen(entries); if (o >= 0) openZoom(o); };
  // Log / unlog a set. Supersets move to the partner; rest (2:00) starts after the pair.
  on("[data-log]", b => {
    const e = entries[+b.dataset.k], s = +b.dataset.s, key = setKey(W, sess, e.i, s), v = Object.assign({}, sget(key) || {});
    let goTo = null;
    if (v.z) { delete v.z; v.d = 0; v.r = ""; }
    else if (!v.d) {
      const wi = app.querySelector(`input[data-k="${e.k}"][data-s="${s}"][data-lw]`);
      if (!v.w && wi && wi.value.trim()) v.w = wi.value.trim();
      if (!v.r) v.r = String(e.ds.r);
      v.d = 1; v.t = Date.now(); buzz(); popped = e.k + ":" + s;
      const f = afterLog(entries, e.k);
      if (f.goTo != null) { goTo = f.goTo; stopRest(); } else startRest(f.rest);
    } else v.d = 0;
    sset(key, v);
    if (goTo != null) { if (ui.zoom != null) { zoomTo(goTo); } else { focusOverride = goTo; keep(rerender); const el = document.getElementById(`ex-${entries[goTo].i}`); if (el && el.scrollIntoView) el.scrollIntoView({ block: "center", behavior: reduceMotion() ? "auto" : "smooth" }); } }
    else { if (ui.zoom == null) focusOverride = null; keep(rerender); }
    setTimeout(() => { popped = ""; }, 400);
  });
  app.querySelectorAll("input[data-lw], input[data-lr]").forEach(inp => {
    inp.onchange = () => {
      const e = entries[+inp.dataset.k], s = +inp.dataset.s, f = inp.dataset.lw ? "w" : "r", key = setKey(W, sess, e.i, s), v = Object.assign({}, sget(key) || {});
      v[f] = inp.value.trim(); sset(key, v); if (f === "w") inp.classList.remove("pre");
      if (f === "w" && v.w) for (let t = s + 1; t < e.total; t++) { const kk = setKey(W, sess, e.i, t), vv = Object.assign({}, sget(kk) || {}); if (!vv.w) { vv.w = v.w; sset(kk, vv); const el = app.querySelector(`input[data-k="${e.k}"][data-s="${t}"][data-lw]`); if (el) { el.value = v.w; el.classList.remove("pre"); } } }
    };
    inp.onkeydown = ev => { if (ev.key !== "Enter") return; ev.preventDefault(); const all = [...app.querySelectorAll("input[data-lw], input[data-lr]")], i = all.indexOf(inp); if (all[i + 1]) all[i + 1].focus(); else inp.blur(); };
  });
  // zoom-only controls
  if (ui.zoom != null) {
    document.body.classList.add("zooming");
    const k = Math.min(Math.max(ui.zoom, 0), entries.length - 1), E = entries[k];
    document.getElementById("zback").onclick = () => history.back();
    document.getElementById("zprev").onclick = () => { if (k > 0) zoomTo(k - 1); };
    document.getElementById("znext").onclick = () => { if (k < entries.length - 1) zoomTo(k + 1); else history.back(); };
    on("[data-jump]", b => zoomTo(+b.dataset.jump));
    document.getElementById("zadd").onclick = () => { addSet(W, sess, E.i); rerender(); };
    document.getElementById("zopts").onclick = () => exerciseOptions(ctx, E);
    const paint = st => { const z = document.getElementById("zrest"); if (!z) return; z.innerHTML = st.on ? restPill(st) : ""; const b = document.getElementById("zrestbtn"); if (b) b.onclick = stopRest; };
    if (unsubRest) unsubRest(); unsubRest = onRest(paint); paint(restState());
  } else { document.body.classList.remove("zooming"); if (unsubRest) { unsubRest(); unsubRest = null; } }
}
let unsubRest = null;

/* ---------- log by voice (or typing): "5x5 bench at 145" ----------
   Uses the phone's own speech recognition (no AI, no cost); falls back to typing,
   where the keyboard's mic works too. Shows what it understood before logging. */
const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
function voiceSheet(ctx, defK) {
  const { W, sess, entries } = ctx; let rec = null;
  const plan = text => {
    const p = parse(text), e = matchExercise(p.words, entries) || entries[defK >= 0 ? defK : 0];
    if (!e) return null;
    const lb = p.weight == null ? null : p.kg ? Math.round(p.weight * 2.20462 * 2) / 2 : p.weight;
    const reps = p.reps || parseInt(e.ds.r) || null, sets = Math.min(p.sets || 1, 12);
    return { e, sets, reps, lb, named: !!matchExercise(p.words, entries), ok: !!(reps || lb) };
  };
  const say = P => !P ? "Say an exercise, sets, reps and weight." : `${P.e.name} · ${P.sets} × ${P.reps || "?"}${P.lb ? ` · ${P.lb} lb` : ""}${P.named ? "" : " (current exercise)"}`;
  openSheet({ title: "Log by voice", onClose: () => { if (rec) try { rec.abort(); } catch (e) {} }, render: (body, api) => {
    body.innerHTML = `<div class="vc-status" id="vc-st">${SR ? "Listening…" : "Type it, or tap the mic on your keyboard."}</div>
      <label class="vc-in">${SR ? `<button class="vc-mic on" id="vc-mic" aria-label="Listen again">${ICON.mic}</button>` : ICON.mic}<input id="vc-txt" placeholder="5x5 bench at 145" autocomplete="off" enterkeyhint="done"></label>
      <div class="vc-plan" id="vc-plan">${say(null)}</div>
      <div class="optnote">Try “3 sets of 8 incline at 60” or “145 for 5”. No exercise name logs the one you're on.</div>
      <button class="bigbtn" id="vc-go" disabled>Log it</button>`;
    const txt = body.querySelector("#vc-txt"), pl = body.querySelector("#vc-plan"), go1 = body.querySelector("#vc-go"), st = body.querySelector("#vc-st");
    const upd = () => { const P = txt.value.trim() ? plan(txt.value) : null; pl.textContent = say(P); go1.disabled = !(P && P.ok); };
    txt.oninput = upd; txt.onkeydown = e => { if (e.key === "Enter" && !go1.disabled) { e.preventDefault(); go1.click(); } };
    const listen = () => {
      if (!SR) { txt.focus(); return; }
      try { rec = new SR(); } catch (e) { st.textContent = "Voice isn't available here. Type it instead."; txt.focus(); return; }
      rec.lang = "en-US"; rec.interimResults = true; rec.maxAlternatives = 1;
      const m = body.querySelector("#vc-mic"); if (m) m.classList.add("on"); st.textContent = "Listening…";
      rec.onresult = ev => { txt.value = [...ev.results].map(r => r[0].transcript).join(" "); upd(); };
      rec.onerror = ev => { st.textContent = ev.error === "not-allowed" ? "Microphone is blocked. Allow it in settings, or type it." : "Didn't catch that. Tap the mic or type it."; };
      rec.onend = () => { if (m) m.classList.remove("on"); if (st.textContent === "Listening…") st.textContent = txt.value ? "Check it, then log it." : "Tap the mic to try again."; };
      try { rec.start(); } catch (e) { st.textContent = "Tap the mic to try again."; }
    };
    const m = body.querySelector("#vc-mic"); if (m) m.onclick = listen;
    go1.onclick = () => {
      const P = plan(txt.value); if (!P || !P.ok) return;
      const { e } = P; let left = P.sets, s = 0;
      while (left > 0 && s < 40) {
        if (s >= totalSets(e.it, W, sess, e.i)) addSet(W, sess, e.i);
        const key = setKey(W, sess, e.i, s), v = sget(key) || {};
        if (!v.d || v.z) { sset(key, { w: P.lb != null ? String(P.lb) : (v.w || ""), r: String(P.reps || e.ds.r), d: 1, t: Date.now() }); left--; }
        s++;
      }
      api.close(); buzz(); toast(`Logged ${P.sets} × ${P.reps}${P.lb ? ` at ${P.lb} lb` : ""} on ${e.name}.`); keep(rerender);
    };
    listen(); if (!SR) setTimeout(() => txt.focus(), 300);
  } });
}

// Swap / + set / − set / ⋯ under each card in the overview.
function cardAction(ctx, E, act) {
  const { W, sess, hooks } = ctx;
  if (act === "sub") hooks.subSheet(sess, E.i);
  else if (act === "add") { addSet(W, sess, E.i); keep(rerender); }
  else if (act === "rm") { sset(setKey(W, sess, E.i, totalSets(itemAt(W, sess, E.i), W, sess, E.i) - 1), null); removeSet(W, sess, E.i); keep(rerender); }
  else if (act === "rmex") { removeExercise(W, sess, E.i - ADD0); toast(`${E.name} removed.`); keep(rerender); }
  else exerciseOptions(ctx, E);
}

// ⋯ in the zoomed view: how-to, substitute, sets, remove an added exercise.
function exerciseOptions(ctx, E) {
  const { W, sess, hooks } = ctx, extra = extraSets(W, sess, E.i);
  openSheet({ title: E.name, render: (body, api) => {
    body.innerHTML = `<div class="optlist">
      <button class="optrow" data-o="how"><b class="tag">?</b><span>How to do it<small>Steps, cues and sources</small></span></button>
      ${E.it.added ? `<button class="optrow danger" data-o="rmex"><b class="tag">✕</b><span>Remove from today</span></button>` : `<button class="optrow" data-o="sub"><b class="tag">⇄</b><span>Substitute<small>Swap for a similar exercise</small></span></button>`}
      <button class="optrow" data-o="add"><b class="tag">+</b><span>Add a set</span></button>
      ${extra ? `<button class="optrow" data-o="rm"><b class="tag">−</b><span>Remove the last added set</span></button>` : ""}</div>`;
    body.querySelectorAll("[data-o]").forEach(b => b.onclick = () => {
      const o = b.dataset.o; api.close();
      setTimeout(() => {
        if (o === "how") go(`#/ex/${E.x}`);
        if (o === "sub") hooks.subSheet(sess, E.i);
        if (o === "add") { addSet(W, sess, E.i); rerender(); }
        if (o === "rm") { sset(setKey(W, sess, E.i, totalSets(itemAt(W, sess, E.i), W, sess, E.i) - 1), null); removeSet(W, sess, E.i); rerender(); }
        if (o === "rmex") { removeExercise(W, sess, E.i - ADD0); toast(`${E.name} removed.`); ui.zoom = Math.max(0, E.k - 1); rerender(); }
      }, 250);
    });
  } });
}

// Start/peak pictures alternate once a second on the exercise in focus (not with reduced motion).
let flip = false;
if (typeof window !== "undefined") setInterval(() => {
  if (reduceMotion() || document.hidden) return;
  flip = !flip; document.querySelectorAll(".pics.live").forEach(el => el.classList.toggle("flip", flip));
}, 1000);
