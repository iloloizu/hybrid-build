import { ui } from "../state.js";
import { solve, figure, NF, clipSVG, bodyMap } from "../figure/engine.js";
import { EX } from "../plan/exercises.js";
import { esc } from "./common.js";
import { back } from "../router.js";
import { topbar } from "../ui/topbar.js";

/* ---------- exercise view ---------- */
let raf = null, playing = true, t0 = 0, tPaused = 0, mode = "diagram";
const CLIP = 10000, REP = 2500;
const ease = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
function phaseK(ms) { const p = ms % REP; if (p < 1000) return ease(p / 1000); if (p < 1300) return 1; if (p < 2300) return 1 - ease((p - 1300) / 1000); return 0; }
export function stopEx() { cancelAnimationFrame(raf); raf = null; }
const PLAY = `<svg viewBox="0 0 14 14"><path d="M3 1.5v11l9-5.5z"/></svg>`, PAUSE = `<svg viewBox="0 0 14 14"><rect x="2.5" y="1.5" width="3.2" height="11" rx="1"/><rect x="8.3" y="1.5" width="3.2" height="11" rx="1"/></svg>`;
// from: { label, path } of the screen you came from, for the back buttons.
export function renderEx(id, from) {
  ui.exId = id; const e = EX[id]; if (!e) return back("#/exercises");
  const JA = solve(Object.assign({ v: e.v }, e.A)), JB = solve(Object.assign({ v: e.v }, e.B));
  const ex = Object.assign({ _t: e.A.t }, e);
  const photo = e.photo && mode === "photo";
  const stage = photo ? `<div class="pstage"><img src="img/${e.photo}/0.jpg" alt="${esc(e.name)} start position"><img id="p1" src="img/${e.photo}/1.jpg" alt="${esc(e.name)} finish position"></div>` : `<div id="stage">${clipSVG(e)}</div>`;
  const stills = photo
    ? `<figure class="still"><img src="img/${e.photo}/0.jpg" alt="Start"><figcaption><b>01</b>Start</figcaption></figure><figure class="still"><img src="img/${e.photo}/1.jpg" alt="Finish"><figcaption><b>02</b>Finish</figcaption></figure>`
    : `<figure class="still">${figure(JA, ex, { label: "start" })}<figcaption><b>01</b>Start</figcaption></figure><figure class="still">${figure(JB, Object.assign({}, ex, { _t: e.B.t }), { label: "finish" })}<figcaption><b>02</b>Finish</figcaption></figure>`;
  document.getElementById("app").className = "wrap exview";
  document.getElementById("app").innerHTML = topbar({ title: "How to", sub: e.muscles[0], back: { label: from.label } }) + `
    <div class="dtitle"><h2>${e.name}</h2><div class="mus">${e.muscles.map((m, i) => `<span class="${i === 0 ? "hl" : ""}">${m}</span>`).join("")}</div></div>
    ${e.photo ? `<div class="modes"><button data-mode="diagram" aria-pressed="${mode === "diagram"}">Animation</button><button data-mode="photo" aria-pressed="${mode === "photo"}">Real photo</button></div>` : ""}
    <div class="player">${stage}<div class="pbar"><button class="pbtn" id="pp" aria-label="Pause">${PAUSE}</button><div class="track"><i id="prog"></i></div><span class="time" id="tm">0:00 / 0:10</span></div></div>
    <div class="stills">${stills}</div>
    <section class="howto"><div class="lbl">Muscles worked</div><div class="bmap">${bodyMap(e.muscles)}</div></section>
    <section class="howto"><div class="lbl">How to</div><ol>${e.steps.map(x => `<li>${x}</li>`).join("")}</ol></section>
    <section class="howto"><div class="lbl">Cues</div><ul>${e.cues.map(x => `<li>${x}</li>`).join("")}</ul></section>
    <section class="howto warn"><div class="lbl">Don't</div><div style="font-size:14.5px">${e.mistake}</div></section>
    ${from.workout ? `<button class="backbig" id="back2">Back to workout</button>` : ""}
    <div class="equip">Equipment: ${e.equip}${e.photo ? ` · Photos: <a href="https://github.com/yuhonas/free-exercise-db">Free Exercise DB</a> (public domain)` : ""}</div>`;
  const goBack = () => back(from.path); document.getElementById("tb-back").onclick = goBack; const b2 = document.getElementById("back2"); if (b2) b2.onclick = goBack;
  document.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => { mode = b.dataset.mode; cancelAnimationFrame(raf); renderEx(id, from); });
  const st = document.getElementById("stage"), p1 = document.getElementById("p1"), prog = document.getElementById("prog"), tm = document.getElementById("tm"), pp = document.getElementById("pp");
  const frs = st ? st.querySelectorAll(".fr") : []; let cur = 0;
  playing = !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); tPaused = 0; t0 = performance.now();
  const setBtn = () => { pp.innerHTML = playing ? PAUSE : PLAY; pp.setAttribute("aria-label", playing ? "Pause" : "Play"); };
  setBtn();
  const frame = now => {
    if (ui.view !== "ex" || ui.exId !== id) return;
    const ms = playing ? (now - t0) % CLIP : tPaused;
    if (playing) tPaused = ms;
    const k = phaseK(ms);
    if (p1) p1.style.opacity = k; else if (frs.length) { const fi = Math.round(k * (NF - 1)); if (fi !== cur) { frs[cur].style.display = "none"; frs[fi].style.display = "inline"; cur = fi; } }
    prog.style.width = (ms / CLIP * 100) + "%";
    tm.textContent = `0:${String(Math.floor(ms / 1000)).padStart(2, "0")} / 0:10`;
    raf = requestAnimationFrame(frame);
  };
  pp.onclick = () => { playing = !playing; if (playing) t0 = performance.now() - tPaused; setBtn(); };
  cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
}
