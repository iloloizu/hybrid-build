import { START } from "../plan/plan.js";
// Today's week (1-10) and day (0 = Mon), or null outside the block.
export function todayWD(now = new Date()) {
  const diff = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - START) / 86400000);
  return diff >= 0 && diff < 70 ? { w: Math.floor(diff / 7) + 1, d: diff % 7 } : null;
}
// Where the Today tab lands: today, or the nearest end of the block.
export function todayTarget(now = new Date()) {
  const t = todayWD(now); if (t) return t;
  return now < START ? { w: 1, d: 0 } : { w: 10, d: 6 };
}
