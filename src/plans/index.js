import { EX } from "../plan/exercises.js";
import { muscleKeys } from "../figure/engine.js";
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
// Name a session from what it trains when the plan doesn't: "Chest + Triceps", "Legs".
const GROUP = { chest: "Chest", delt: "Shoulders", reardelt: "Shoulders", triceps: "Triceps", biceps: "Biceps", forearm: "Biceps", lats: "Back", upperback: "Back", traps: "Back", lowerback: "Back", quads: "Legs", glutes: "Legs", hams: "Legs", calves: "Legs", tib: "Legs", abs: "Core", hipflex: "Core" };
export function autoName(items) {
  const score = {};
  items.filter(it => !it.cardio && EX[it.x]).forEach(it => { const [pri] = muscleKeys(EX[it.x].muscles); const w = it.tag === "main" ? 2 : 1; new Set([...pri].map(k => GROUP[k]).filter(Boolean)).forEach(g => { score[g] = (score[g] || 0) + w; }); });
  const top = Object.entries(score).sort((a, b) => b[1] - a[1]);
  if (!top.length) return items.some(it => it.cardio) ? "Cardio" : "Session";
  if (top[0][0] === "Legs" && (!top[1] || top[1][1] < top[0][1] / 2)) return "Legs";
  const two = top.slice(0, 2).filter(([, v], i) => i === 0 || v >= top[0][1] / 2).map(([g]) => g);
  return two.join(" + ");
}
// Session type from the main lift and where most sets go: Push, Pull, Upper body, Lower body,
// Full body, Accessories, Plyometrics, Cardio, Core (+ plyos when jumps feature).
export const SESSION_TYPES = ["Push", "Pull", "Upper body", "Lower body", "Full body", "Accessories", "Plyometrics", "Cardio", "Core"];
export function movementOf(it) {
  const e = EX[it.x] || {}, n = `${it.label || ""} ${e.name || ""}`.toLowerCase();
  if (it.cardio || /treadmill|walk\b|cycling|bike|stair|rowing|run\b/.test(n)) return { p: "cardio" };
  if (it.core || /crunch|v-up|plank|leg raise|leg lift|situp|sit-up|russian|ab roll|ab circuit|ab wheel|hyper series|toe touch/.test(n)) return { p: "core" };
  if (/jump|bound|hop|pogo|plyo|kettlebell swing/.test(n)) return { p: "plyo" };
  if (/squat|deadlift|\brdl\b|romanian|lunge|step-up|leg press|leg curl|leg ext|calf|soleus|hip thrust|nordic|sled|tib|hinge|clean|thigh pull|hyper|jefferson|couch|carry/.test(n)) return { p: "lower", iso: /leg curl|leg ext|calf|soleus|tib|couch/.test(n) };
  if (/\brows?\b|\bpull|\bchin|\bcurl|rear delt|reverse pec|\bshrug|face pull/.test(n)) return { p: "pull", iso: /\bcurl|rear delt|reverse pec|\bshrug|face pull/.test(n) };
  if (/press|bench|push|dip|fly|pec|extension|skull|tricep|crusher|raise/.test(n)) return { p: "push", iso: /fly|pec|extension|skull|tricep|crusher|raise|pushdown/.test(n) };
  return { p: "other", iso: true };
}
export function sessionType(items, given) {
  if (given && SESSION_TYPES.includes(given)) return given;
  const sets = it => (it.dose || (it.ds && it.ds[0]) || { s: 3 }).s || 1;
  const tally = { push: 0, pull: 0, lower: 0, plyo: 0, core: 0, cardio: 0, other: 0 }; let iso = 0, strength = 0;
  items.forEach(it => { const m = movementOf(it), s = sets(it); tally[m.p] += s; if (["push", "pull", "lower", "other"].includes(m.p)) { strength += s; if (m.iso) iso += s; } });
  if (!strength) return tally.plyo ? "Plyometrics" : tally.cardio >= tally.core ? (tally.cardio ? "Cardio" : "Core") : "Core";
  const main = items.find(it => it.tag === "main") || items.find(it => !["core", "cardio", "plyo"].includes(movementOf(it).p));
  const mp = main ? movementOf(main) : { p: "other" }, upper = tally.push + tally.pull, lower = tally.lower;
  let t;
  if (lower >= strength * 0.35 && upper >= strength * 0.35) t = "Full body";
  else if (lower >= strength * 0.5 || (mp.p === "lower" && lower >= strength * 0.4)) t = "Lower body";
  else if (!items.some(it => it.tag === "main") && iso >= strength * 0.7) t = "Accessories";
  else if (tally.push >= upper * 0.7 || (mp.p === "push" && tally.push >= upper * 0.55)) t = "Push";
  else if (tally.pull >= upper * 0.7 || (mp.p === "pull" && tally.pull >= upper * 0.55)) t = "Pull";
  else t = "Upper body";
  return tally.plyo >= 2 ? `${t} + plyos` : t;
}
// Pills for a session: estimated minutes, focus, intensity (when the plan gives a % of max).
export function sessionMeta(s) {
  if (!s || !s.items) return {};
  let min = 0; s.items.forEach(it => { const d = it.dose || { s: 3, r: "10" }; const t = String(d.r).match(/(\d+)\s*min/); min += t ? +t[1] : d.s * (it.tag === "main" ? 3.5 : 2.5); });
  const pct = s.items.map(it => it.tag === "main" && it.dose && String(it.dose.note).match(/(\d+)%/)).find(Boolean);
  return { mins: Math.max(10, Math.round(min / 5) * 5), focus: sessionType(s.items, s.type), intensity: pct ? `${pct[1]}% of max` : "" };
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
      return { name: day.name || sessionType(items, day.type), type: day.type, kind: lift ? "lift" : "cardio", items, rank: d, swaps: [], mins: day.mins, run: day.run, dow: d };
    });
    return Object.assign({}, ph, { days });
  });
  return Object.assign({}, plan, { phases });
}

const BUILT = {};
// Plans that came from outside (imports, AI, paste) are cleaned every time they're read, not just on import.
export function customPlans() { const v = sget("plans|custom"); return Array.isArray(v) ? v.map(p => { try { return cleanPlan(p); } catch (e) { return null; } }).filter(Boolean) : []; }
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
/* ---------- safety: anything from a file, paste or AI is untrusted data ----------
   Plain text only (no markup characters), bounded sizes, and exercise refs that must name a
   library exercise. Nothing from a plan is ever run as code. */
const LIMIT = { json: 300000, name: 80, short: 24, blurb: 280, rule: 120, day: 40, line: 300, lines: 40, phases: 20, weeks: 52 };
export function cleanText(v, max) {
  return String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f<>`\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
const cleanLine = l => {
  const parts = cleanText(l, LIMIT.line).split("|").map(x => x.trim()).slice(0, 5);
  if (!parts[0]) return "";
  if (parts[1] && !/^[=~][a-z0-9-]{1,40}$/.test(parts[1])) parts[1] = "~bench"; // unknown ref → a generic animation
  return parts.join(" | ");
};
function cleanPlan(src) {
  if (!src || typeof src !== "object" || Array.isArray(src)) throw new Error("Not a plan");
  const name = cleanText(src.name, LIMIT.name); if (!name) throw new Error("A plan needs a name");
  const rawPhases = Array.isArray(src.phases) ? src.phases.slice(0, LIMIT.phases) : [];
  if (!rawPhases.length) throw new Error("A plan needs at least one phase");
  const toInt = (v, lo, hi, d) => { const n = Math.round(+v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
  let weeks = toInt(src.weeks, 1, LIMIT.weeks, 0);
  const phases = rawPhases.map((ph, k) => {
    const from = toInt(ph && ph.from, 1, LIMIT.weeks, k + 1), to = toInt(ph && ph.to, from, LIMIT.weeks, from);
    const days = (Array.isArray(ph && ph.days) ? ph.days : []).slice(0, 7).map(d => {
      if (!d || typeof d !== "object") return null;
      const lines = (typeof d.lines === "string" ? d.lines.split("\n") : Array.isArray(d.exercises) ? d.exercises : []).slice(0, LIMIT.lines).map(cleanLine).filter(Boolean);
      const type = SESSION_TYPES.find(t => t === cleanText(d.type, 20)) || undefined;
      return lines.length ? { name: cleanText(d.name, LIMIT.day), type, lines: lines.join("\n") } : null;
    });
    while (days.length < 7) days.push(null);
    return { from, to, name: cleanText(ph && ph.name, LIMIT.day) || `Phase ${k + 1}`, rule: cleanText(ph && ph.rule, LIMIT.rule), days };
  });
  weeks = weeks || Math.max(...phases.map(ph => ph.to));
  if (!phases.some(ph => ph.days.some(Boolean))) throw new Error("No exercises found");
  return { id: "c-" + slug(name), name, by: cleanText(src.by, LIMIT.name) || "Imported", short: cleanText(src.short, LIMIT.short) || name.split(" ")[0].slice(0, LIMIT.short),
    blurb: cleanText(src.blurb, LIMIT.blurb), note: cleanText(src.note, LIMIT.blurb), weeks, phases };
}
export function importPlan(text) {
  if (typeof text !== "string" || text.length > LIMIT.json) throw new Error("That plan is too large");
  let raw; try { raw = JSON.parse(text); } catch (e) { throw new Error("Not a plan file"); }
  const p = cleanPlan(raw);
  build(p); // throws early on bad data
  sset("plans|custom", customPlans().filter(x => x.id !== p.id).concat([p]));
  return p;
}
export function removePlan(id) { sset("plans|custom", customPlans().filter(x => x.id !== id)); }
// Build all built-in plans now so their exercises are in the library.
[SIMON, AWO, AI].forEach(p => planById(p.id));
