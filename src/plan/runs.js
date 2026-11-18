import { sget, sset } from "../storage.js";
/* ---------- runs you log yourself: { mi, min } by date, independent of the plan ---------- */
export const runKey = iso => `runs|${iso}`;
export const getRun = iso => sget(runKey(iso)) || null;
export const setRun = (iso, v) => sset(runKey(iso), v && (v.mi || v.min) ? v : null);
export function pace(v) { const mi = parseFloat(v && v.mi), min = parseFloat(v && v.min); if (!(mi > 0 && min > 0)) return ""; const p = min / mi, m = Math.floor(p), s = Math.round((p - m) * 60); return `${m}:${String(s === 60 ? 0 : s).padStart(2, "0")}/mi`; }
// Days you closed out with "Done for the day".
export const isFinished = iso => !!sget(`days|${iso}`);
export const setFinished = (iso, on) => sset(`days|${iso}`, on ? 1 : null);
