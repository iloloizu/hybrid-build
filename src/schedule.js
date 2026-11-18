import { DAYS } from "./plan/plan.js";
import { ref, sessionsFor, defaultSlotsFor, planOf } from "./plan/blocks.js";
import { sget, sset, schedKey } from "./storage.js";

/* ---------- schedule: which session sits on which day ---------- */
export function slots(w) { const v = sget(schedKey(w)), def = defaultSlotsFor(ref(w)); return Array.isArray(v) && v.length === 7 ? v.slice() : def.slice(); }
export function saveSlots(w, arr) { const def = defaultSlotsFor(ref(w)), same = arr.every((x, i) => x === def[i]); sset(schedKey(w), same ? null : arr); }
// value: session index, or -1 = rest (moved), -2 = skipped
// Pure version: what the week looks like after pushing day d. Returns { a, dropped }.
export function pushPlan(a0, d, S = DAYS) {
  const a = a0.slice(), lastLift = 5;
  if (d >= lastLift) { const dropped = a[d]; a[d] = -1; return { a, dropped, past: true }; }
  const queue = a.slice(d, lastLift + 1).filter(x => x >= 0);
  let dropped = null;
  if (queue.length > lastLift - d) { // too many sessions for the days left: drop the least important
    let wi = 0; queue.forEach((x, i) => { if (S[x].rank > S[queue[wi]].rank) wi = i; });
    dropped = queue.splice(wi, 1)[0];
  }
  a[d] = -1;
  for (let k = d + 1; k <= lastLift; k++) a[k] = queue.length ? queue.shift() : -1;
  return { a, dropped };
}
export function pushToTomorrow(w, d) {
  const S = sessionsFor(ref(w)), { a, dropped, past } = pushPlan(slots(w), d, S);
  saveSlots(w, a);
  if (past) return "Pushed past Saturday, so it's dropped this week.";
  return dropped != null ? `${S[dropped].name} dropped this week to make room.` : "Everything after today slid one day.";
}
export function swapDays(w, d1, d2) { const a = slots(w); [a[d1], a[d2]] = [a[d2], a[d1]]; saveSlots(w, a); }
export function skipDay(w, d) { const a = slots(w); a[d] = -2; saveSlots(w, a); }
export function warnings(w) {
  if (planOf(ref(w)) !== "hybrid") return [];
  const a = slots(w), out = [];
  const at = s => a.indexOf(s);
  if (at(1) === 5) out.push("Knee Deep lands the day before the long run. Swap it earlier if you can.");
  const legs = [at(1), at(3)].filter(x => x >= 0).sort();
  if (legs.length === 2 && legs[1] - legs[0] === 1) out.push("Two leg days back to back. Fine if the run between is easy.");
  if (at(1) >= 0 && at(1) === at(0) + 0 && false) out.push("");
  return out;
}
