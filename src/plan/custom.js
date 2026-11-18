import { EX } from "./exercises.js";
import { dose, DAYS } from "./plan.js";
import { slots } from "../schedule.js";
import { muscleKeys } from "../figure/engine.js";
import { sget, sset, setKey } from "../storage.js";
import { ref, earlier } from "./blocks.js";

/* ---------- your changes to a session: extra sets and substitutes ---------- */
// Stored with the session's logs, e.g. "w3s0|extra-0" = 2, "w3s0|sub-1" = "machinepress".
export const extraKey = (w, s, i) => setKey(ref(w), s, "extra", i);
export const subKey = (w, s, i) => setKey(ref(w), s, `sub`, i);

export const extraSets = (w, s, i) => +sget(extraKey(w, s, i)) || 0;
export function addSet(w, s, i) { sset(extraKey(w, s, i), extraSets(w, s, i) + 1); }
export function removeSet(w, s, i) { const n = extraSets(w, s, i) - 1; sset(extraKey(w, s, i), n > 0 ? n : null); }
// Planned sets plus any you added.
export function totalSets(it, w, s, i) { const ds = dose(it, ref(w).pw); return ds ? ds.s + extraSets(w, s, i) : 0; }

// A substitute holds from the week you pick it onward (same gym), until you switch back.
export function activeSub(w, s, i) {
  for (const W of [ref(w)].concat(earlier(ref(w)))) { const v = sget(subKey(W, s, i)); if (v !== undefined) return v && EX[v] ? v : null; }
  return null;
}
export function setSub(w, s, i, id, original) {
  const back = !id || id === original;
  const prev = earlier(ref(w))[0], before = prev ? activeSub(prev, s, i) : null;
  if (back) sset(subKey(w, s, i), before ? "" : null); // "" = back to the plan's lift from here on
  else sset(subKey(w, s, i), id === before ? null : id);
}
// Exercises you add to a session yourself. Stored per session as a list of ids
// ("w3s0|added-0"); a removed one becomes null so later ones keep their logs.
export const ADD0 = 100; // log index of the first added exercise
const addedKey = (w, s) => setKey(ref(w), s, "added", 0);
export const addedList = (w, s) => sget(addedKey(w, s)) || [];
const addedItem = (x, k) => ({ x, s: 3, r: "10", added: true, k });
export function addExercise(w, s, id) { const l = addedList(w, s).concat([id]); sset(addedKey(w, s), l); return ADD0 + l.length - 1; }
export function removeExercise(w, s, k) {
  const l = addedList(w, s).slice(); l[k] = null;
  for (let n = 0; n < 12; n++) sset(setKey(ref(w), s, ADD0 + k, n), null);
  sset(extraKey(w, s, ADD0 + k), null);
  sset(addedKey(w, s), l.some(Boolean) ? l : null);
}
// Planned items plus added ones, each with its log index.
export function itemsFor(w, s) {
  const plan = DAYS[s] ? DAYS[s].items.map((it, i) => ({ it, i })) : [];
  return plan.concat(addedList(w, s).map((x, k) => x && EX[x] ? { it: addedItem(x, k), i: ADD0 + k } : null).filter(Boolean));
}
export const itemAt = (w, s, i) => i >= ADD0 ? addedItem(addedList(w, s)[i - ADD0], i - ADD0) : DAYS[s].items[i];
// Exercise shown for a planned item this week.
export const exFor = (it, w, s, i) => it.added ? it.x : activeSub(w, s, i) || it.x;

const MOVES = [/squat/i, /press/i, /curl(?!.*jefferson)/i, /raise(?!.*leg|.*calf|.*tib|.*soleus)/i, /row/i, /pulldown|pull-up/i, /extension|pushdown/i, /deadlift/i, /step-up/i, /fly|pec deck/i, /crunch|leg raise|ab /i, /jump|bound/i, /calf|soleus/i];
const moveOf = e => MOVES.findIndex(re => re.test(e.name));
// Every other exercise, most similar first: same primary muscles, then overlap, then same movement.
export function similar(id) {
  const a = EX[id], [pa, sa] = muscleKeys(a.muscles), fam = e => e.alt || e.from || null;
  const both = (x, y) => [...x].filter(k => y.has(k)).length;
  return Object.keys(EX).filter(k => k !== id).map(k => {
    const b = EX[k], [pb, sb] = muscleKeys(b.muscles);
    let score = 4 * both(pa, pb) + 2 * (both(pa, sb) + both(sa, pb)) + both(sa, sb);
    if (score && moveOf(a) >= 0 && moveOf(a) === moveOf(b)) score += 2;
    if (score && (fam(b) === id || fam(a) === k || (fam(a) && fam(a) === fam(b)))) score += 3;
    return { id: k, score };
  }).sort((x, y) => y.score - x.score || EX[x.id].name.localeCompare(EX[y.id].name));
}

// The last time each exercise was logged before this day: { exerciseId: [{ w, r } per set] }.
// Looks across every session, week and block, so a lift remembers its weight wherever it shows up.
export function lastLogs(W, dayIdx) {
  const map = {};
  const visit = (Wk, upTo) => {
    const a = slots(Wk);
    for (let d = 0; d < upTo; d++) {
      const s = a[d]; if (s < 0 || !DAYS[s]) continue;
      itemsFor(Wk, s).forEach(({ it, i }) => {
        const sets = []; for (let n = 0; n < 12; n++) { const v = sget(setKey(Wk, s, i, n)); if (v && v.w) sets[n] = { w: v.w, r: v.r }; }
        if (sets.length) map[exFor(it, Wk, s, i)] = sets;
      });
    }
  };
  earlier(ref(W)).reverse().forEach(Wk => visit(Wk, 7));
  visit(ref(W), dayIdx);
  return map;
}
