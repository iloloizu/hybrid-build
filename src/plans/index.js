import { EX } from "../plan/exercises.js";
import { DAYS, PHASES, phaseOf, phaseName } from "../plan/plan.js";
import { sget, sset } from "../storage.js";
import { SIMON, AWO, AI } from "./data.js";

/* ---------- plans: the hybrid plan plus coach / imported plans ---------- */
// A block runs one plan. The hybrid plan is the original engine (DAYS + dose);
// every other plan is data: phases → 7 days → exercises with sets × reps per week.

export const HYBRID = { id: "hybrid", name: "Ilolo's Hybrid Plan", by: "Ilolo", short: "Hybrid", weeks: 10, hybrid: true,
  blurb: "Ten weeks of arms, shoulders and back built around marathon training, with knee work every session.",
  note: "Phases follow the marathon plan's recovery weeks. Long run every Sunday." };

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

// "5x4 @78% · 124" → { s: 5, r: "4", note: "78% · 124" }
function parseDose(t) {
  const m = t.trim().match(/^(\d+)\s*x\s*([^@]+?)\s*(?:@\s*(.+))?$/i);
  if (!m) return { s: 1, r: t.trim(), note: "" };
  return { s: +m[1], r: m[2].trim().replace(/ea$/, "/side").replace(/\s*,\s*/g, ", "), note: (m[3] || "").trim() };
}
// Make a library entry for an exercise only this plan has, drawn with a similar animation.
function ensureExercise(name, look, muscles, plan, noSub) {
  const id = "x-" + slug(name);
  if (!EX[id]) {
    const base = EX[look] || EX.bench;
    EX[id] = Object.assign({}, base, { photo: undefined, _tw: undefined, alt: look, from: undefined, name,
      muscles: muscles && muscles.length ? muscles : base.muscles, equip: "As your plan describes", steps: [], cues: [], mistake: "", fromPlan: plan.name, noSub });
  }
  return id;
}
function parseLines(lines, nWeeks, plan) {
  return lines.trim().split("\n").map(l => l.split("|").map(x => x.trim())).filter(p => p[0]).map(([name, ref = "", mus = "", doses = "", flags = ""]) => {
    let x; const fl = flags.split(/[\s,]+/);
    if (ref.startsWith("=") && EX[ref.slice(1)]) x = ref.slice(1);
    else x = ensureExercise(name, ref.replace(/^[~=]/, ""), mus ? mus.split(",").map(s => s.trim()).filter(Boolean) : null, plan, fl.includes("core") || fl.includes("cardio"));
    const list = doses.split(";").map(s => s.trim()).filter(Boolean).map(parseDose);
    const ds = Array.from({ length: nWeeks }, (_, k) => list[Math.min(k, list.length - 1)] || { s: 3, r: "10", note: "" });
    const f = flags.split(/[\s,]+/);
    return { x, label: name, ds, tag: f.includes("main") ? "main" : undefined, core: f.includes("core"), cardio: f.includes("cardio"), optional: f.includes("opt"), bw: f.includes("cardio") || f.includes("core") ? 1 : undefined };
  });
}
// Normalize a data plan: each phase gets 7 sessions (null = rest).
function build(plan) {
  if (plan.hybrid) return plan;
  const phases = plan.phases.map(ph => {
    const n = ph.to - ph.from + 1;
    const days = Array.from({ length: 7 }, (_, d) => {
      const day = ph.days[d];
      if (!day) return { name: "Rest", kind: "rest", items: [], rank: 9 };
      const items = parseLines(day.lines || "", n, plan);
      const lift = items.some(i => !i.cardio);
      return { name: day.name, kind: lift ? "lift" : "cardio", items, rank: d, swaps: [], mins: day.mins, run: day.run, dow: d };
    });
    return Object.assign({}, ph, { days });
  });
  return Object.assign({}, plan, { phases });
}

const BUILT = {};
export function customPlans() { const v = sget("plans|custom"); return Array.isArray(v) ? v : []; }
export function allPlans() { return [HYBRID, SIMON, AWO, AI].concat(customPlans()); }
export function planById(id) {
  const p = allPlans().find(x => x.id === id) || HYBRID;
  if (!BUILT[p.id] || BUILT[p.id].src !== p) BUILT[p.id] = Object.assign(build(p), { src: p });
  return BUILT[p.id];
}
export const phaseFor = (plan, pw) => plan.phases.find(ph => pw >= ph.from && pw <= ph.to) || plan.phases[plan.phases.length - 1];

// Sessions for a plan week: the hybrid DAYS, or this phase's seven days with that week's doses.
export function sessionsOf(planId, pw) {
  const plan = planById(planId); if (plan.hybrid) return DAYS;
  const ph = phaseFor(plan, pw), k = pw - ph.from;
  return ph.days.map(day => day.kind === "rest" ? day : Object.assign({}, day, { items: day.items.map(it => Object.assign({}, it, { dose: it.ds[Math.min(k, it.ds.length - 1)] })) }));
}
// Which day each session sits on by default (rest days empty).
export function defaultSlots(planId, pw) {
  const S = sessionsOf(planId, pw); if (planById(planId).hybrid) return [0, 1, 2, 3, 4, 5, 6];
  return S.map((s, i) => s.kind === "rest" ? -1 : i);
}
// Phase card info for a plan week.
export function phaseInfo(planId, pw) {
  const plan = planById(planId);
  if (plan.hybrid) { const ph = phaseOf(pw); return Object.assign({ name: phaseName(pw), cls: ph }, PHASES[ph]); }
  const ph = phaseFor(plan, pw); return { name: ph.name, rule: ph.rule, rir: plan.short, cls: "" };
}

// Import a plan file (same shape as data.js plans, JSON). Returns the plan.
export function importPlan(text) {
  let p; try { p = JSON.parse(text); } catch (e) { throw new Error("Not a plan file"); }
  if (!p || !p.name || !Array.isArray(p.phases) || !p.phases.length) throw new Error("A plan needs a name and phases");
  p.id = "c-" + slug(p.name); p.weeks = +p.weeks || Math.max(...p.phases.map(ph => ph.to || 1)); p.by = p.by || "Imported";
  p.short = p.short || p.name.split(" ")[0];
  p.phases.forEach(ph => { ph.days = (ph.days || []).slice(0, 7); while (ph.days.length < 7) ph.days.push(null); ph.days = ph.days.map(d => d && (d.lines || (Array.isArray(d.exercises) ? d.exercises.join("\n") : "")) ? { name: d.name || "Session", lines: d.lines || d.exercises.join("\n") } : null); });
  build(p); // throws early on bad data
  sset("plans|custom", customPlans().filter(x => x.id !== p.id).concat([p]));
  return p;
}
export function removePlan(id) { sset("plans|custom", customPlans().filter(x => x.id !== id)); }
// Build all built-in plans now so their exercises are in the library.
[SIMON, AWO, AI].forEach(p => planById(p.id));
