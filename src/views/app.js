import { ui } from "../state.js";
import { DAYS } from "../plan/plan.js";
import { slots } from "../schedule.js";
import { weekRef, weekLabel } from "../plan/blocks.js";
import { route, onRoute, go, start } from "../router.js";
import { ICON } from "../ui/icons.js";
import { onSwipe } from "../ui/device.js";
import { keepAwake } from "../ui/device.js";
import { sheetOpen } from "../ui/sheet.js";
import { renderDay, stepDay } from "./day.js";
import { renderWeek, stepWeek } from "./week.js";
import { renderBlock } from "./block.js";
import { renderLibrary } from "./library.js";
import { renderEx, stopEx } from "./exercise.js";
import { renderPoseGrid } from "./posegrid.js";
import { todayTarget, todayWD } from "./today.js";

/* ---------- app shell: tabs, routing, swipes ---------- */
const TABS = [["today", "Today", "#/today"], ["week", "Week", "#/week"], ["block", "Block", "#/block"], ["library", "Exercises", "#/exercises"]];
let last = null, from = { label: "Exercises", path: "#/exercises" };

function tabFor(r) {
  if (r.name === "today") return "today";
  if (r.name === "day") { const t = todayWD(); return t && t.b === ui.b && t.w === r.w && t.d === r.d && last && last.tab === "today" ? "today" : "week"; }
  if (r.name === "ex") return (last && last.tab) || "library";
  return r.name === "library" ? "library" : r.name;
}

export function rerender() { draw(route()); }
function draw(r) {
  if (r.name !== "ex") { stopEx(); ui.view = "plan"; }
  if (r.name !== "day" && r.name !== "today") keepAwake(false);
  switch (r.name) {
    case "today": { const t = todayTarget(); ui.b = t.b; renderDay(t.w, t.d, true); break; }
    case "day": renderDay(r.w, r.d, false); break;
    case "week": renderWeek(r.w || ui.week || 1); break;
    case "block": renderBlock(); break;
    case "library": renderLibrary(); break;
    case "ex": ui.view = "ex"; renderEx(r.id, from); break;
    case "posegrid": renderPoseGrid(); return;
  }
  const tab = tabFor(r);
  document.querySelectorAll("#tabs [data-tab]").forEach(a => a.setAttribute("aria-current", a.dataset.tab === tab ? "page" : "false"));
  // Remember where an exercise screen was opened from, for its back button.
  if (r.name !== "ex") {
    const W = weekRef(ui.b, ui.week), s = (r.name === "day" || r.name === "today") && !W.pause ? slots(W)[ui.dayIdx] : -1;
    from = r.name === "day" || r.name === "today" ? { label: s >= 0 ? DAYS[s].name : "Day", path: location.hash || "#/today", workout: true } : r.name === "week" ? { label: weekLabel(W), path: location.hash } : r.name === "block" ? { label: `Block ${ui.b}`, path: "#/block" } : { label: "Exercises", path: "#/exercises" };
  }
  last = { name: r.name, tab };
}

export function boot() {
  const tabs = document.getElementById("tabs");
  tabs.innerHTML = TABS.map(([k, l, p]) => `<a href="${p}" data-tab="${k}">${ICON[k]}<span>${l}</span></a>`).join("");
  tabs.querySelectorAll("a").forEach(a => a.onclick = e => { e.preventDefault(); const r = route(); if (a.getAttribute("aria-current") === "page" && (r.name !== "day" && r.name !== "ex")) { window.scrollTo({ top: 0, behavior: "smooth" }); return; } go(a.getAttribute("href")); });
  onRoute(({ scroll }) => { draw(route()); window.scrollTo(0, scroll || 0); });
  onSwipe(document.getElementById("app"), k => { if (sheetOpen()) return; const r = route(); if (r.name === "day" || r.name === "today") stepDay(k); else if (r.name === "week") stepWeek(k); });
  // Open on today's block.
  const t = todayTarget(); ui.b = t.b; ui.week = t.w; ui.dayIdx = t.d;
  start();
}
