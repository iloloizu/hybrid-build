import { avatarBtn } from "./account.js";
import { ICON } from "../ui/icons.js";
import { ui } from "../state.js";
import { PHASES, phaseOf, phaseName, fmt } from "../plan/plan.js";
import { skipWeeks, skippedWeeks, unskipAll, blocks, blockById, weeksOf, weekLabel, dayDate, blockEnd, parseISO, startBlock, removeBlock, nextMonday, phaseOfWeek } from "../plan/blocks.js";
import { planById } from "../plans/index.js";
import { slots } from "../schedule.js";
import { progress, esc, keep } from "./common.js";
import { go } from "../router.js";
import { topbar } from "../ui/topbar.js";
import { toast } from "../ui/toast.js";
import { openSheet } from "../ui/sheet.js";
import { todayWD } from "./today.js";
import { rerender } from "./app.js";
import { twoTap, ask } from "../ui/confirm.js";

let sel = null; // weeks picked to skip (plan week numbers), or null when not selecting
// "Week 3" · "Weeks 1–4" · "Weeks 2, 5 and 7"
function weekRange(list) {
  if (list.length === 1) return `Week ${list[0]}`;
  const run = list.every((n, i) => !i || n === list[i - 1] + 1);
  return run ? `Weeks ${list[0]}–${list[list.length - 1]}` : `Weeks ${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}
/* ---------- block screen: weeks by phase, other blocks, your data ---------- */
export function weekProgress(W) {
  if (W.pause) return [0, 0];
  let n = 0, t = 0; slots(W).forEach(s => { const [a, b] = progress(W, s); n += a; t += b; }); return [n, t];
}
export function renderBlock() {
  const app = document.getElementById("app"); app.className = "wrap block";
  const B = blockById(ui.b), all = blocks(), t = todayWD();
  let h = topbar({ title: `Block ${B.id}`, sub: `${planById(B.plan || "hybrid").short} · ${fmt(parseISO(B.start))} – ${fmt(blockEnd(B))}`, right: avatarBtn() + `<button class="iconbtn" id="gear" aria-label="Settings">${ICON.gear}</button>` });
  if (all.length > 1) h += `<div class="chips noswipe" role="group" aria-label="Blocks">${all.map(b => `<button data-b="${b.id}" aria-pressed="${b.id === B.id}">Block ${b.id} · ${planById(b.plan || "hybrid").short}</button>`).join("")}</div>`;
  let last = null;
  const skipped = skippedWeeks(B.id);
  h += `<div class="blocktools">${sel ? `<span class="muted">Tap the weeks to skip</span><button class="textbtn" id="selcancel">Cancel</button>` : `<button class="textbtn" id="selweeks">Select weeks</button>`}${skipped.length && !sel ? `<span class="skipnote">${weekRange(skipped)} skipped · <button class="textbtn" id="unskip">Bring back</button></span>` : ""}</div>`;
  h += `<div class="weeklist">`;
  for (const W of weeksOf(B)) {
    const now = t && t.b === B.id && t.w === W.cw;
    const PI = W.pause ? null : phaseOfWeek(W), name = W.pause ? "Paused" : PI.name, ph = W.pause ? "cut" : PI.cls, [n, tot] = weekProgress(W);
    if (name !== last && !W.pause) { h += `<div class="phasehead ${ph}"><b>${name}</b><span>${PI.rule}</span>${sel ? "" : `<button class="phskip" data-skipph="${esc(name)}" aria-label="Skip ${esc(name)}">Skip</button>`}</div>`; last = name; }
    const picked = sel && !W.pause && sel.has(W.pw);
    h += `<button class="weekrow${now ? " now" : ""}${picked ? " picked" : ""} ${ph}" data-w="${W.cw}"${sel && !W.pause ? ` data-pick="${W.pw}" aria-pressed="${picked}"` : ""}><span class="pbib">${W.pause ? "II" : String(W.pw).padStart(2, "0")}</span>
      <span class="dn"><b>${fmt(dayDate(W, 0))} – ${fmt(dayDate(W, 6))}</b><small>${now ? "<em>This week</em> · " : ""}${W.pause ? "Paused week" : (W.rep ? "Repeat · " : "") + PI.rir}</small>${W.pause ? "" : `<i class="bar"><em style="width:${tot ? n / tot * 100 : 0}%"></em></i>`}</span>
      <span class="ds"><b>${n ? `${n}/${tot}` : ""}</b></span></button>`;
  }
  h += `</div>`;
  if (sel) h += `<div class="selbar"><button class="bigbtn" id="skipsel"${sel.size ? "" : " disabled"}>${sel.size ? `Skip ${sel.size} week${sel.size > 1 ? "s" : ""}` : "Pick weeks to skip"}</button></div>`;
  h += `<button class="bigbtn ghost" id="newblock">Start a new block</button>`;
  if (B.id !== 1 && B.id === Math.max(...all.map(b => b.id))) h += `<button class="textbtn" id="delblock">Delete Block ${B.id}</button>`;
  app.innerHTML = h;
  document.getElementById("gear").onclick = () => go("#/settings");
  app.querySelectorAll("[data-w]").forEach(b => b.onclick = () => {
    if (!sel) return go(`#/w/${b.dataset.w}`);
    if (!b.dataset.pick) return;
    const pw = +b.dataset.pick; sel.has(pw) ? sel.delete(pw) : sel.add(pw); keep(rerender);
  });
  const doSkip = async (pws, what) => {
    const left = weeksOf(B).filter(W => !W.pause && !pws.includes(W.pw));
    if (!left.length) { toast("Keep at least one week."); return; }
    const ok = await ask({ title: `Skip ${what}?`, body: `The block runs straight on from week ${left[0].pw}${left[0].cw === 1 ? `, starting ${fmt(parseISO(B.start))}` : ""}. Anything you logged in those weeks is kept and comes back if you bring them back.`, yes: "Skip", no: "Cancel" });
    if (!ok) return;
    skipWeeks(B.id, pws); sel = null; toast(`${what[0].toUpperCase() + what.slice(1)} skipped.`); rerender();
  };
  app.querySelectorAll("[data-skipph]").forEach(b => b.onclick = e => { e.stopPropagation(); const nm = b.dataset.skipph; doSkip(weeksOf(B).filter(W => !W.pause && phaseOfWeek(W).name === nm).map(W => W.pw), nm); });
  const sw = document.getElementById("selweeks"); if (sw) sw.onclick = () => { sel = new Set(); rerender(); };
  const sc = document.getElementById("selcancel"); if (sc) sc.onclick = () => { sel = null; rerender(); };
  const ss = document.getElementById("skipsel"); if (ss) ss.onclick = () => doSkip([...sel], weekRange([...sel].sort((a, b) => a - b)).toLowerCase());
  const us = document.getElementById("unskip"); if (us) us.onclick = () => { unskipAll(B.id); toast("Skipped weeks are back."); rerender(); };
  app.querySelectorAll("[data-b]").forEach(b => b.onclick = () => { ui.b = +b.dataset.b; ui.week = 1; rerender(); });
  document.getElementById("newblock").onclick = newBlockSheet;
  const del = document.getElementById("delblock");
  twoTap(del, `Tap again to delete Block ${B.id}`, () => { removeBlock(B.id); ui.b = 1; toast(`Block ${B.id} deleted.`); rerender(); });
}

const B0 = () => blockById(ui.b);
function newBlockSheet() {
  openSheet({ title: "New block", render: (body, api) => {
    body.innerHTML = `<div class="optnote">Same plan from week 1 (${planById(B0().plan || "hybrid").name}). Your logs stay, and your last weights carry over.</div>
      <label class="datefield"><span>Starts</span><input type="date" id="bstart" value="${nextMonday()}"></label>
      <div class="optnote">Starting on a date inside the current block replaces the rest of it from that day.</div>
      <button class="bigbtn" id="bgo">Start block</button>`;
    body.querySelector("#bgo").onclick = () => {
      const v = body.querySelector("#bstart").value; if (!v) return;
      const id = startBlock(v, B0().plan || "hybrid"); ui.b = id; ui.week = 1; api.close(); toast(`Block ${id} starts ${fmt(parseISO(v))}.`); setTimeout(() => go("#/block", { replace: true }), 0);
    };
  } });
}
