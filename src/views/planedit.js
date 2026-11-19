import { EX } from "../plan/exercises.js";
import { similar } from "../plan/custom.js";
import { planById, cleanText } from "../plans/index.js";
import { toEditable, saveEditable, isMine, rowEx, setDose, firstDose, varies } from "../plans/edit.js";
import { topbar } from "../ui/topbar.js";
import { ICON } from "../ui/icons.js";
import { openSheet } from "../ui/sheet.js";
import { toast } from "../ui/toast.js";
import { go, back } from "../router.js";
import { esc, thumbHTML } from "./common.js";
import { rerender } from "./app.js";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
let E = null, editing = null, phaseIdx = 0;

/* ---------- edit your own plan: name, days, exercises, sets × reps ---------- */
export function renderPlanEdit(id) {
  if (!isMine(id)) return back(`#/plan/${encodeURIComponent(id)}`);
  if (editing !== id) { E = toEditable(id); E.id = id; editing = id; phaseIdx = 0; }
  const app = document.getElementById("app"); app.className = "wrap explore planedit";
  const ph = E.phases[Math.min(phaseIdx, E.phases.length - 1)], weeks = ph.to - ph.from + 1;
  let h = topbar({ title: "Edit plan", sub: "Changes save as you go", back: { label: "Plan" } });
  h += `<label class="af"><span>Plan name</span><input id="pe-name" maxlength="80" value="${esc(E.name)}"></label>`;
  if (E.phases.length > 1) h += `<div class="chips noswipe" role="group" aria-label="Phase">${E.phases.map((p, k) => `<button data-ph="${k}" aria-pressed="${k === phaseIdx}">${esc(p.name)} · wk ${p.from}${p.to > p.from ? `–${p.to}` : ""}</button>`).join("")}</div>`;
  h += ph.days.map((d, di) => {
    if (!d) return `<section class="pe-day pe-off"><div class="pe-dh"><b>${DOW[di]}</b><span class="muted">Rest day</span><button class="pe-addday" data-addday="${di}">${ICON.plus}<span>Add workout</span></button></div></section>`;
    return `<section class="pe-day"><div class="pe-dh"><b>${DOW[di]}</b><input class="pe-dname" data-dname="${di}" maxlength="40" value="${esc(d.name)}" placeholder="Session name" aria-label="${DOW[di]} session name">
      <button class="iconbtn" data-rest="${di}" aria-label="Make ${DOW[di]} a rest day">${ICON.close}</button></div>
      <ol class="pe-rows">${d.rows.map((r, ri) => { const x = rowEx(r), f = firstDose(r); return `<li class="pe-row">
        <span class="thumb">${thumbHTML(x)}</span>
        <div class="pe-main"><b>${esc(r.name)}</b><div class="pe-dose"><input inputmode="numeric" data-sets="${di}:${ri}" value="${esc(f.s)}" aria-label="Sets"><span>×</span><input data-reps="${di}:${ri}" value="${esc(f.r)}" aria-label="Reps"></div>${varies(r) ? `<small>Varies by week</small>` : ""}</div>
        <div class="pe-acts"><button class="iconbtn" data-up="${di}:${ri}" aria-label="Move up"${ri ? "" : " disabled"}>${ICON.prev}</button><button class="iconbtn" data-swap="${di}:${ri}" aria-label="Swap ${esc(r.name)}">${ICON.swap}</button><button class="iconbtn" data-del="${di}:${ri}" aria-label="Remove ${esc(r.name)}">${ICON.close}</button></div></li>`; }).join("")}</ol>
      <button class="endbtn" data-add="${di}">${ICON.plus}<span>Add exercise</span></button></section>`;
  }).join("");
  h += `<button class="bigbtn" id="pe-done">Done editing</button>`;
  app.innerHTML = h;

  const save = (msg) => { try { saveEditable(E); if (msg) toast(msg); } catch (x) { toast(x.message); } };
  const at = s => { const [di, ri] = s.split(":").map(Number); return { d: ph.days[di], di, ri }; };
  const redraw = () => { save(); rerender(); };
  document.getElementById("tb-back").onclick = () => back(`#/plan/${encodeURIComponent(id)}`);
  document.getElementById("pe-done").onclick = () => { save("Plan saved."); editing = null; go(`#/plan/${encodeURIComponent(id)}`); };
  const nm = document.getElementById("pe-name");
  nm.onchange = () => { const v = cleanText(nm.value, 80); if (!v) { nm.value = E.name; return; } E.name = v; E.short = cleanText(v.split(" ")[0], 24); save(); };
  app.querySelectorAll("[data-ph]").forEach(b => b.onclick = () => { phaseIdx = +b.dataset.ph; rerender(); });
  app.querySelectorAll("[data-dname]").forEach(i => i.onchange = () => { ph.days[+i.dataset.dname].name = cleanText(i.value, 40); save(); });
  app.querySelectorAll("[data-sets],[data-reps]").forEach(i => i.onchange = () => {
    const { d, ri } = at(i.dataset.sets || i.dataset.reps), row = d.rows[ri], f = firstDose(row);
    setDose(row, weeks, i.dataset.sets ? i.value : f.s, i.dataset.reps ? i.value : f.r); redraw();
  });
  app.querySelectorAll("[data-up]").forEach(b => b.onclick = () => { const { d, ri } = at(b.dataset.up); [d.rows[ri - 1], d.rows[ri]] = [d.rows[ri], d.rows[ri - 1]]; redraw(); });
  app.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
    const { d, ri } = at(b.dataset.del), gone = d.rows.splice(ri, 1)[0];
    if (!d.rows.length) ph.days[ph.days.indexOf(d)] = null;
    redraw(); toast(`${gone.name} removed.`);
  });
  app.querySelectorAll("[data-rest]").forEach(b => b.onclick = () => { const di = +b.dataset.rest; ph.days[di] = null; redraw(); toast(`${DOW[di]} is a rest day.`); });
  app.querySelectorAll("[data-addday]").forEach(b => b.onclick = () => { const di = +b.dataset.addday; pickExercise(`Add to ${DOW[di]}`, null, x => { ph.days[di] = { name: "", rows: [newRow(x, weeks)] }; redraw(); }); });
  app.querySelectorAll("[data-add]").forEach(b => b.onclick = () => { const di = +b.dataset.add; pickExercise(`Add to ${DOW[di]}`, null, x => { ph.days[di].rows.push(newRow(x, weeks)); redraw(); toast(`${EX[x].name} added.`); }); });
  app.querySelectorAll("[data-swap]").forEach(b => b.onclick = () => {
    const { d, ri } = at(b.dataset.swap), row = d.rows[ri];
    pickExercise(`Swap ${row.name}`, rowEx(row), x => { const old = row.name; Object.assign(row, { name: EX[x].name, ref: "=" + x, muscles: "" }); redraw(); toast(`${old} → ${EX[x].name}.`); });
  });
}
const newRow = (x, weeks) => ({ name: EX[x].name, ref: "=" + x, muscles: "", doses: Array(Math.max(1, weeks)).fill("3x10"), flags: "" });

// Search the library; similar moves first when swapping.
function pickExercise(title, like, done) {
  let q = "";
  openSheet({ title, tall: true, render: (body, api) => {
    if (!body.firstChild) {
      body.innerHTML = `<label class="search">${ICON.search}<input type="search" placeholder="Search name, muscle, equipment" aria-label="Search exercises" enterkeyhint="search"></label><div class="subres"></div>`;
      body.querySelector("input").oninput = e => { q = e.target.value.trim().toLowerCase(); api.refresh(); };
    }
    const ok = id => (!q || (EX[id].name + " " + EX[id].muscles.join(" ") + " " + EX[id].equip).toLowerCase().includes(q));
    const row = id => `<button class="subrow" data-pick="${id}"><span class="thumb">${thumbHTML(id)}</span><span><b>${esc(EX[id].name)}</b><small>${esc(EX[id].equip)}</small></span><em>${esc(EX[id].muscles[0] || "")}</em></button>`;
    const close = like ? similar(like).filter(r => r.score >= 4 && ok(r.id)).map(r => r.id) : [];
    const rest = Object.keys(EX).filter(id => ok(id) && !close.includes(id) && id !== like).sort((a, b) => EX[a].name.localeCompare(EX[b].name));
    body.querySelector(".subres").innerHTML = (close.length ? `<div class="sublbl">Closest</div><div class="sublist">${close.map(row).join("")}</div>` : "")
      + (rest.length ? `<div class="sublbl">${close.length ? "Everything else" : "All exercises"}</div><div class="sublist">${rest.map(row).join("")}</div>` : "")
      + (!close.length && !rest.length ? `<div class="optnote">No match for “${esc(q)}”.</div>` : "");
    body.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => { api.close(); setTimeout(() => done(b.dataset.pick), 0); });
  } });
}
export const resetEditor = () => { editing = null; };
