import { EX } from "./exercises.js";
import { dose } from "./plan.js";
import { muscleKeys } from "../figure/engine.js";
import { sget, sset } from "../storage.js";

/* ---------- your changes to a session: extra sets and substitutes ---------- */
// Stored with the session's logs, e.g. "w3s0|extra-0" = 2, "w3s0|sub-1" = "machinepress".
export const extraKey = (w, s, i) => `w${w}s${s}|extra-${i}`;
export const subKey = (w, s, i) => `w${w}s${s}|sub-${i}`;

export const extraSets = (w, s, i) => +sget(extraKey(w, s, i)) || 0;
export function addSet(w, s, i) { sset(extraKey(w, s, i), extraSets(w, s, i) + 1); }
export function removeSet(w, s, i) { const n = extraSets(w, s, i) - 1; sset(extraKey(w, s, i), n > 0 ? n : null); }
// Planned sets plus any you added.
export function totalSets(it, w, s, i) { const ds = dose(it, w); return ds ? ds.s + extraSets(w, s, i) : 0; }

// A substitute holds from the week you pick it onward (same gym), until you switch back.
export function activeSub(w, s, i) {
  for (let k = w; k >= 1; k--) { const v = sget(subKey(k, s, i)); if (v !== undefined) return v && EX[v] ? v : null; }
  return null;
}
export function setSub(w, s, i, id, original) {
  const back = !id || id === original;
  const earlier = w > 1 ? activeSub(w - 1, s, i) : null;
  if (back) sset(subKey(w, s, i), earlier ? "" : null); // "" = back to the plan's lift from here on
  else sset(subKey(w, s, i), id === earlier ? null : id);
}
// Exercise shown for a planned item this week.
export const exFor = (it, w, s, i) => activeSub(w, s, i) || it.x;

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
