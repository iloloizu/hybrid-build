import { renderWelcome, renderAuth, renderProfile } from "./account.js";
import { ui } from "../state.js";
import { DAYS } from "../plan/plan.js";
import { slots } from "../schedule.js";
import { weekRef, weekLabel, sessionsFor } from "../plan/blocks.js";
import { renderExplore, renderPlanPage } from "./explore.js";
import { route, onRoute, go, start } from "../router.js";
import { ICON } from "../ui/icons.js";
import { onSwipe } from "../ui/device.js";
import { keepAwake } from "../ui/device.js";
import { sheetOpen } from "../ui/sheet.js";
import { renderDay, stepDay } from "./day.js";
import { resetZoom } from "./workout.js";
import { renderWeek, stepWeek } from "./week.js";
import { renderBlock } from "./block.js";
import { renderSettings } from "./settings.js";
import { renderLibrary } from "./library.js";
import { renderEx, stopEx } from "./exercise.js";
import { renderPoseGrid } from "./posegrid.js";
import { todayTarget, todayWD } from "./today.js";

/* ---------- app shell: tabs, routing, swipes ---------- */
const TABS = [["today", "Today", "#/today"], ["week", "Week", "#/week"], ["block", "Block", "#/block"], ["explore", "Explore", "#/explore"], ["library", "Exercises", "#/exercises"]];
let last = null, from = { label: "Exercises", path: "#/exercises" };

function tabFor(r) {
  if (r.name === "today") return "today";
  if (r.name === "day") { const t = todayWD(); return t && t.b === ui.b && t.w === r.w && t.d === r.d ? "today" : "week"; }
  if (r.name === "ex") return (last && last.tab) || "library";
  if (r.name === "plan") return "explore";
  if (r.name === "settings" || r.name === "profile") return r.name;
  if (["signup", "signin", "reset", "welcome"].includes(r.name)) return "profile";
  return r.name === "library" ? "library" : r.name;
}

export function rerender() { draw(route()); }
function draw(r) {
  if (r.name !== "ex") { stopEx(); ui.view = "plan"; }
  if (r.name !== "day" && r.name !== "today") { keepAwake(false); resetZoom(); }
  document.body.classList.toggle("bare", r.name === "welcome");
  switch (r.name) {
    case "today": { const t = todayTarget(); ui.b = t.b; renderDay(t.w, t.d, true); break; }
    case "day": renderDay(r.w, r.d, false); break;
    case "week": renderWeek(r.w || ui.week || 1); break;
    case "block": renderBlock(); break;
    case "settings": renderSettings(r.sub); break;
    case "welcome": renderWelcome(); break;
    case "signup": case "signin": case "reset": renderAuth(r.name); break;
    case "profile": renderProfile(); break;
    case "library": renderLibrary(); break;
    case "explore": renderExplore(); break;
    case "plan": renderPlanPage(r.id); break;
    case "ex": ui.view = "ex"; renderEx(r.id, from); break;
    case "posegrid": renderPoseGrid(); return;
  }
  const tab = tabFor(r);
  document.querySelectorAll("#tabs [data-tab]").forEach(a => a.setAttribute("aria-current", a.dataset.tab === tab ? "page" : "false"));
  // Remember where an exercise screen was opened from, for its back button.
  if (r.name !== "ex") {
    const W = weekRef(ui.b, ui.week), s = (r.name === "day" || r.name === "today") && !W.pause ? slots(W)[ui.dayIdx] : -1;
    from = r.name === "day" || r.name === "today" ? { label: s >= 0 ? sessionsFor(W)[s].name : "Day", path: location.hash || "#/today", workout: true } : r.name === "week" ? { label: weekLabel(W), path: location.hash } : r.name === "block" ? { label: `Block ${ui.b}`, path: "#/block" } : r.name === "plan" ? { label: "Plan", path: location.hash } : { label: "Exercises", path: "#/exercises" };
  }
  last = { name: r.name, tab };
}

export function boot() {
  const tabs = document.getElementById("tabs");
  tabs.innerHTML = TABS.map(([k, l, p]) => `<a href="${p}" data-tab="${k}">${ICON[k]}<span>${l}</span></a>`).join("")
    + `<i class="menu-only menu-sep"></i><a class="menu-only" href="#/profile" data-tab="profile">${ICON.user}<span>Profile</span></a><a class="menu-only" href="#/settings" data-tab="settings">${ICON.gear}<span>Settings</span></a>`;
  // Phones and small tablets: the tabs live behind a hamburger button.
  const mb = document.createElement("button"); mb.id = "menubtn"; mb.className = "menubtn"; mb.setAttribute("aria-label", "Menu"); mb.setAttribute("aria-controls", "tabs"); mb.setAttribute("aria-expanded", "false");
  mb.innerHTML = `${ICON.menu}${ICON.close}`;
  const scrim = document.createElement("div"); scrim.className = "navscrim";
  document.body.append(scrim, mb);
  const setMenu = open => { document.body.classList.toggle("navopen", open); mb.setAttribute("aria-expanded", String(open)); if (open) (tabs.querySelector('[aria-current="page"]') || tabs.querySelector("a")).focus({ preventScroll: true }); };
  mb.onclick = () => setMenu(!document.body.classList.contains("navopen"));
  scrim.onclick = () => setMenu(false);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && document.body.classList.contains("navopen")) { setMenu(false); mb.focus(); } });
  tabs.addEventListener("click", () => setMenu(false));
  tabs.querySelectorAll("a").forEach(a => a.onclick = e => { e.preventDefault(); const r = route(); if (a.getAttribute("aria-current") === "page" && (r.name !== "day" && r.name !== "ex")) { window.scrollTo({ top: 0, behavior: "smooth" }); return; } go(a.getAttribute("href")); });
  onRoute(({ scroll }) => { draw(route()); window.scrollTo(0, scroll || 0); });
  onSwipe(document.getElementById("app"), k => { if (sheetOpen()) return; const r = route(); if (r.name === "day" || r.name === "today") stepDay(k); else if (r.name === "week") stepWeek(k); });
  // Open on today's block.
  const t = todayTarget(); ui.b = t.b; ui.week = t.w; ui.dayIdx = t.d;
  start();
}
