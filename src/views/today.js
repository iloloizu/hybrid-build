import { findDate, landing } from "../plan/blocks.js";
// Kept for older call sites: today's block/week/day, or null outside every block.
export const todayWD = (now = new Date()) => { const f = findDate(now); return f ? { b: f.b, w: f.cw, d: f.d } : null; };
export const todayTarget = (now = new Date()) => { const f = landing(now); return { b: f.b, w: f.cw, d: f.d }; };
