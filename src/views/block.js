import { ui } from "../state.js";
import { PHASES, phaseOf, phaseName, fmt } from "../plan/plan.js";
import { blocks, blockById, weeksOf, weekLabel, dayDate, blockEnd, parseISO, startBlock, removeBlock, nextMonday, phaseOfWeek } from "../plan/blocks.js";
import { planById } from "../plans/index.js";
import { slots } from "../schedule.js";
import { progress } from "./common.js";
import { go } from "../router.js";
import { topbar } from "../ui/topbar.js";
import { toast } from "../ui/toast.js";
import { openSheet } from "../ui/sheet.js";
import { todayWD } from "./today.js";
import { saveBar, bindSaveBar } from "./savebar.js";
import { rerender } from "./app.js";
import { twoTap } from "../ui/confirm.js";

/* ---------- block screen: weeks by phase, other blocks, your data ---------- */
export function weekProgress(W) {
  if (W.pause) return [0, 0];
  let n = 0, t = 0; slots(W).forEach(s => { const [a, b] = progress(W, s); n += a; t += b; }); return [n, t];
}
export function renderBlock() {
  const app = document.getElementById("app"); app.className = "wrap block";
  const B = blockById(ui.b), all = blocks(), t = todayWD();
  let h = topbar({ title: `Block ${B.id}`, sub: `${planById(B.plan || "hybrid").short} · ${fmt(parseISO(B.start))} – ${fmt(blockEnd(B))}` });
  if (all.length > 1) h += `<div class="chips noswipe" role="group" aria-label="Blocks">${all.map(b => `<button data-b="${b.id}" aria-pressed="${b.id === B.id}">Block ${b.id} · ${planById(b.plan || "hybrid").short}</button>`).join("")}</div>`;
  let last = null;
  h += `<div class="weeklist">`;
  for (const W of weeksOf(B)) {
    const now = t && t.b === B.id && t.w === W.cw;
    const PI = W.pause ? null : phaseOfWeek(W), name = W.pause ? "Paused" : PI.name, ph = W.pause ? "cut" : PI.cls, [n, tot] = weekProgress(W);
    if (name !== last && !W.pause) { h += `<div class="phasehead ${ph}"><b>${name}</b><span>${PI.rule}</span></div>`; last = name; }
    h += `<button class="weekrow${now ? " now" : ""} ${ph}" data-w="${W.cw}"><span class="pbib">${W.pause ? "II" : String(W.pw).padStart(2, "0")}</span>
      <span class="dn"><b>${fmt(dayDate(W, 0))} – ${fmt(dayDate(W, 6))}</b><small>${now ? "<em>This week</em> · " : ""}${W.pause ? "Paused week" : (W.rep ? "Repeat · " : "") + PI.rir}</small>${W.pause ? "" : `<i class="bar"><em style="width:${tot ? n / tot * 100 : 0}%"></em></i>`}</span>
      <span class="ds"><b>${n ? `${n}/${tot}` : ""}</b></span></button>`;
  }
  h += `</div><button class="bigbtn ghost" id="newblock">Start a new block</button>`;
  if (B.id !== 1 && B.id === Math.max(...all.map(b => b.id))) h += `<button class="textbtn" id="delblock">Delete Block ${B.id}</button>`;
  h += `<div class="lbl">Your data</div>` + saveBar();
  app.innerHTML = h;
  app.querySelectorAll("[data-w]").forEach(b => b.onclick = () => go(`#/w/${b.dataset.w}`));
  app.querySelectorAll("[data-b]").forEach(b => b.onclick = () => { ui.b = +b.dataset.b; ui.week = 1; rerender(); });
  document.getElementById("newblock").onclick = newBlockSheet;
  const del = document.getElementById("delblock");
  twoTap(del, `Tap again to delete Block ${B.id}`, () => { removeBlock(B.id); ui.b = 1; toast(`Block ${B.id} deleted.`); rerender(); });
  bindSaveBar();
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
