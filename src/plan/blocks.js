import { sget, sset } from "../storage.js";

/* ---------- blocks: repeat the 10-week template, with repeated or paused weeks ---------- */
// Stored as "blocks|list": [{ id, start: "YYYY-MM-DD", ops: [{ type: "repeat" | "pause", at: calendarWeek }] }]
// Block 1 log keys stay "w3s0|…" (the original format); later blocks use "b2w3s0|…", repeats add "r1".
export const BLOCK1_START = "2026-11-16";
const KEY = "blocks|list";
export const parseISO = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const isoOf = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;

export function blocks() { const v = sget(KEY); return Array.isArray(v) && v.length ? v : [{ id: 1, start: BLOCK1_START, ops: [] }]; }
const save = list => sset(KEY, list);
export const blockById = id => blocks().find(b => b.id === id) || blocks()[0];

// Calendar weeks of a block: { b, cw, pw, rep, pause, key }
export function weeksOf(b) {
  const arr = Array.from({ length: 10 }, (_, k) => ({ pw: k + 1, rep: 0 }));
  for (const op of b.ops || []) {
    const at = op.at - 1; if (at < 0 || at > arr.length) continue;
    if (op.type === "repeat" && arr[at] && !arr[at].pause) { const e = arr[at]; arr.splice(at + 1, 0, { pw: e.pw, rep: arr.filter(x => x.pw === e.pw).length }); }
    if (op.type === "pause") arr.splice(at, 0, { pause: true });
  }
  return arr.map((e, i) => Object.assign({ b: b.id, cw: i + 1 }, e, { key: e.pause ? null : `${b.id > 1 ? "b" + b.id : ""}w${e.pw}${e.rep ? "r" + e.rep : ""}` }));
}
export const weekRef = (bid, cw) => { const ws = weeksOf(blockById(bid)); return ws[Math.max(1, Math.min(ws.length, cw)) - 1]; };
// Old call sites pass a plain week number: that's block 1's calendar week.
export const ref = w => typeof w === "object" ? w : weekRef(1, w);
export const weekLabel = W => W.pause ? "Paused" : `Week ${W.pw}${W.rep ? " again" : ""}`;

// Every logged week in order, across blocks (for "last time" hints and substitutes that carry over).
function timeline() { return blocks().slice().sort((a, b) => a.start.localeCompare(b.start) || a.id - b.id).flatMap(weeksOf).filter(W => !W.pause); }
export function earlier(W) { const t = timeline(), i = t.findIndex(x => x.key === W.key); return i > 0 ? t.slice(0, i).reverse() : []; }
export const prevRef = W => earlier(W)[0] || null;

export function dayDate(W, d) { const s = parseISO(blockById(W.b).start); return new Date(s.getFullYear(), s.getMonth(), s.getDate() + (W.cw - 1) * 7 + d); }
export const blockEnd = b => { const s = parseISO(b.start); return new Date(s.getFullYear(), s.getMonth(), s.getDate() + weeksOf(b).length * 7 - 1); };

// Which block/week/day a date falls on. A newer block takes over from its start date.
export function findDate(now = new Date()) {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (const b of blocks().slice().sort((a, c) => c.start.localeCompare(a.start) || c.id - a.id)) {
    const diff = Math.round((day - parseISO(b.start)) / 86400000), n = weeksOf(b).length;
    if (diff >= 0 && diff < n * 7) return { b: b.id, cw: Math.floor(diff / 7) + 1, d: diff % 7 };
  }
  return null;
}
// Nearest point when today is outside every block.
export function landing(now = new Date()) {
  const f = findDate(now); if (f) return f;
  const list = blocks().slice().sort((a, c) => a.start.localeCompare(c.start)), first = list[0], last = list[list.length - 1];
  return now < parseISO(first.start) ? { b: first.id, cw: 1, d: 0 } : { b: last.id, cw: weeksOf(last).length, d: 6 };
}

export function startBlock(startISO) {
  const list = blocks(), id = Math.max(...list.map(b => b.id)) + 1;
  save(list.concat([{ id, start: startISO, ops: [] }])); return id;
}
export function removeBlock(id) { if (id === 1) return; save(blocks().filter(b => b.id !== id)); }
function editOps(bid, fn) { save(blocks().map(b => b.id === bid ? Object.assign({}, b, { ops: fn((b.ops || []).slice()) }) : b)); }
export const repeatWeek = (bid, cw) => editOps(bid, ops => ops.concat([{ type: "repeat", at: cw }]));
export const pauseWeek = (bid, cw) => editOps(bid, ops => ops.concat([{ type: "pause", at: cw }]));
export const undoLastChange = bid => editOps(bid, ops => ops.slice(0, -1));
export const nextMonday = (from = new Date()) => { const d = new Date(from.getFullYear(), from.getMonth(), from.getDate()); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return isoOf(d); };
export { isoOf };
