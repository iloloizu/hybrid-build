import { DAYS } from "./plan/plan.js";
import { sget, sset, schedKey } from "./storage.js";

/* ---------- schedule: which session sits on which day ---------- */
export function slots(w) { const v = sget(schedKey(w)); return Array.isArray(v) && v.length === 7 ? v.slice() : [0, 1, 2, 3, 4, 5, 6]; }
export function saveSlots(w, arr) { const def = arr.every((x, i) => x === i); sset(schedKey(w), def ? null : arr); }
// value: session index, or -1 = rest (moved), -2 = skipped
export function pushToTomorrow(w, d) {
  const a = slots(w); const lastLift = 5;
  if (d >= lastLift) { a[d] = -1; return saveSlots(w, a), "Pushed past Saturday, so it's dropped this week."; }
  const queue = a.slice(d, lastLift + 1).filter(x => x >= 0);
  let dropped = null;
  if (queue.length > lastLift - d) { // too many sessions for the days left: drop the least important
    let wi = 0; queue.forEach((x, i) => { if (DAYS[x].rank > DAYS[queue[wi]].rank) wi = i; });
    dropped = queue.splice(wi, 1)[0];
  }
  a[d] = -1;
  for (let k = d + 1; k <= lastLift; k++) a[k] = queue.length ? queue.shift() : -1;
  saveSlots(w, a);
  return dropped != null ? `${DAYS[dropped].name} dropped this week to make room.` : "Everything after today slid one day.";
}
export function swapDays(w, d1, d2) { const a = slots(w); [a[d1], a[d2]] = [a[d2], a[d1]]; saveSlots(w, a); }
export function skipDay(w, d) { const a = slots(w); a[d] = -2; saveSlots(w, a); }
export function warnings(w) {
  const a = slots(w), out = [];
  const at = s => a.indexOf(s);
  if (at(1) === 5) out.push("Knee Deep lands the day before the long run. Swap it earlier if you can.");
  const legs = [at(1), at(3)].filter(x => x >= 0).sort();
  if (legs.length === 2 && legs[1] - legs[0] === 1) out.push("Two leg days back to back. Fine if the run between is easy.");
  if (at(1) >= 0 && at(1) === at(0) + 0 && false) out.push("");
  return out;
}
