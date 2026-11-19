/* ---------- your own plans: duplicate any plan, then edit it ----------
   Editing works on rows parsed from the plan's day lines ("Name | =id | muscles | 3x8;3x8 | flags"). */
import { EX } from "../plan/exercises.js";
import { DAYS, dose } from "../plan/plan.js";
import { planById, savePlan, uniqueId, customPlans, cleanText } from "./index.js";

const HYBRID_WEEKS = 10;
const doseText = d => d ? `${d.s}x${d.r}${d.u ? "" : ""}${d.note ? ` @ ${d.note}` : ""}` : "";
const splitLine = l => { const [name = "", ref = "", muscles = "", doses = "", flags = ""] = l.split("|").map(x => x.trim()); return { name, ref, muscles, doses: doses.split(";").map(x => x.trim()).filter(Boolean), flags }; };
export const rowLine = r => [r.name, r.ref, r.muscles, r.doses.join("; "), r.flags].join(" | ").replace(/(\s\|\s)+$/, "");

// The library exercise a row shows (its own entry, or the one it borrows a look from).
export function rowEx(r) {
  const ref = (r.ref || "").replace(/^[=~]/, "");
  if (r.ref.startsWith("=") && EX[ref]) return ref;
  const own = "x-" + r.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  return EX[own] ? own : EX[ref] ? ref : "bench";
}

// Any plan → an editable copy of its data.
export function toEditable(planId) {
  const P = planById(planId);
  if (P.hybrid) {
    const days = DAYS.map(D => !D.items.length ? null : { name: D.name, rows: D.items.map(it => {
      const doses = []; let last = "3x10";
      for (let w = 1; w <= HYBRID_WEEKS; w++) { const d = dose(it, w); if (d) last = `${d.s}x${d.r}${it.u || ""}${d.note ? ` @ ${d.note}` : ""}`; doses.push(last); }
      return { name: EX[it.x].name, ref: "=" + it.x, muscles: "", doses, flags: [it.tag === "main" ? "main" : "", it.ss ? "ss" + it.ss : "", it.bw ? "core" : ""].filter(Boolean).join(" ") };
    }) });
    return { name: P.name, by: P.by, short: P.short, blurb: P.blurb || "", weeks: HYBRID_WEEKS, phases: [{ from: 1, to: HYBRID_WEEKS, name: "Weeks 1–10", rule: "", days }] };
  }
  const src = P.src || P;
  return { id: src.id, name: src.name, by: src.by, short: src.short, blurb: src.blurb || "", note: src.note || "", weeks: src.weeks, from: src.from,
    phases: src.phases.map(ph => ({ from: ph.from, to: ph.to, name: ph.name, rule: ph.rule || "", days: (ph.days || []).slice(0, 7).concat(Array(7).fill(null)).slice(0, 7).map(d =>
      d ? { name: d.name || "", type: d.type, rows: String(d.lines || "").split("\n").map(x => x.trim()).filter(Boolean).map(splitLine) } : null) })) };
}
export function fromEditable(e) {
  return { id: e.id, name: e.name, by: e.by, short: e.short, blurb: e.blurb, note: e.note, weeks: e.weeks, from: e.from,
    phases: e.phases.map(ph => ({ from: ph.from, to: ph.to, name: ph.name, rule: ph.rule, days: ph.days.map(d => d && d.rows.length ? { name: d.name, type: d.type, lines: d.rows.map(rowLine).join("\n") } : null) })) };
}
export const isMine = id => customPlans().some(p => p.id === id);

export function duplicatePlan(planId, who) {
  const e = toEditable(planId), P = planById(planId);
  e.name = cleanText(`${P.name} (my copy)`, 80); e.id = uniqueId(e.name); e.by = who || "You"; e.short = cleanText((P.short || P.name) + " +", 24);
  e.from = planId; e.blurb = `Your copy of ${P.name}. Change anything.`; e.note = "";
  return savePlan(fromEditable(e));
}
export const saveEditable = e => savePlan(fromEditable(e));

// Sets × reps for every week of a phase at once ("4x8").
export function setDose(row, weeks, sets, reps) {
  const s = Math.min(Math.max(parseInt(sets) || 1, 1), 20), r = cleanText(reps, 16) || "10";
  row.doses = Array(Math.max(1, weeks)).fill(`${s}x${r}`);
}
export function firstDose(row) { const m = String(row.doses[0] || "3x10").match(/^(\d+)\s*x\s*([^@;]+)/i); return m ? { s: m[1], r: m[2].trim() } : { s: "3", r: "10" }; }
export const varies = row => new Set(row.doses).size > 1;
