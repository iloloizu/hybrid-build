import { START } from "./plan/plan.js";

/* ---------- state: shared UI state for the plan and exercise views ---------- */
export const ui = { week: 1, dayIdx: 0, swapOpen: null, view: "plan", exId: null, actionMode: null, toast: "", subOpen: null };
(function pickToday() { const diff = Math.floor((new Date() - START) / 86400000); if (diff >= 0 && diff < 70) { ui.week = Math.floor(diff / 7) + 1; ui.dayIdx = diff % 7; } })();
