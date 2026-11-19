/* ---------- workout flow: where to go after logging a set ----------
   Supersets: logging an exercise that has a partner after it moves you to the partner with no
   rest; rest (2:00) starts after the last exercise of the pair, or after any normal exercise. */
export const REST_SEC = 120;
export function afterLog(entries, idx) {
  const e = entries[idx], nx = entries[idx + 1];
  if (e && e.ss != null && nx && nx.ss === e.ss) return { goTo: idx + 1, rest: 0 };
  return { goTo: null, rest: REST_SEC };
}
// First exercise with an open set, or -1 when everything is logged.
export function firstOpen(entries) { return entries.findIndex(e => e.done < e.total); }
// Superset letters in order of appearance: { ssValue: "A" | "B" | … }.
export function supersetLetters(entries) {
  const out = {}; let n = 0;
  entries.forEach(e => { if (e.ss != null && !(e.ss in out)) out[e.ss] = String.fromCharCode(65 + n++); });
  return out;
}
