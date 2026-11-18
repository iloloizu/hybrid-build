import { EX } from "../plan/exercises.js";
import { DAYS, KNEE } from "../plan/plan.js";
import { muscleKeys } from "../figure/engine.js";
import { esc, thumbHTML } from "./common.js";
import { go } from "../router.js";
import { topbar } from "../ui/topbar.js";
import { ICON } from "../ui/icons.js";

/* ---------- exercises screen: search + muscle filter ---------- */
const GROUPS = [["all", "All"], ["chest", "Chest"], ["back", "Back"], ["shoulders", "Shoulders"], ["arms", "Arms"], ["legs", "Legs"], ["knees", "Knees"], ["core", "Core"]];
const KEYS = { chest: ["chest"], back: ["lats", "upperback", "traps", "lowerback"], shoulders: ["delt", "reardelt"], arms: ["biceps", "triceps", "forearm"], legs: ["quads", "glutes", "hams", "calves"], core: ["abs", "hipflex"] };
const KNEES = new Set(KNEE.map(k => k[0]).concat(["atg", "nordic", "slant", "tib", "soleus", "jefferson", "poliquin", "backwalk"]));
const inPlan = new Set(DAYS.flatMap(d => d.items.map(i => i.x)).concat(KNEE.map(k => k[0])));
export function groupOf(id, g) {
  if (g === "all") return true;
  if (g === "knees") return KNEES.has(id);
  const [pri] = muscleKeys(EX[id].muscles); return KEYS[g].some(k => pri.has(k));
}
let state = { q: "", g: "all" };
export function renderLibrary() {
  const app = document.getElementById("app"); app.className = "wrap library";
  app.innerHTML = topbar({ title: "Exercises", sub: `${Object.keys(EX).length} moves` })
    + `<div class="libtools"><label class="search">${ICON.search}<input type="search" id="q" placeholder="Search name, muscle, equipment" aria-label="Search exercises" enterkeyhint="search" value="${esc(state.q)}"></label>
      <div class="chips noswipe" role="group" aria-label="Muscle group">${GROUPS.map(([k, l]) => `<button data-g="${k}" aria-pressed="${state.g === k}">${l}</button>`).join("")}</div></div>
      <div class="sublist" id="libres"></div>`;
  const draw = () => {
    const q = state.q.toLowerCase();
    const ids = Object.keys(EX).filter(id => groupOf(id, state.g) && (!q || (EX[id].name + " " + EX[id].muscles.join(" ") + " " + EX[id].equip).toLowerCase().includes(q))).sort((a, b) => EX[a].name.localeCompare(EX[b].name));
    document.getElementById("libres").innerHTML = ids.length ? ids.map(id => `<button class="subrow" data-ex="${id}"><span class="thumb">${thumbHTML(id)}</span><span><b>${EX[id].name}</b><small>${esc(EX[id].equip)}</small></span><em>${inPlan.has(id) ? `<span class="inplan">In plan</span>` : ""}${esc(EX[id].muscles[0])}</em></button>`).join("") : `<div class="optnote">No match.</div>`;
    document.querySelectorAll("#libres [data-ex]").forEach(b => b.onclick = () => go(`#/ex/${b.dataset.ex}`));
  };
  document.getElementById("q").oninput = e => { state.q = e.target.value.trim(); draw(); };
  app.querySelectorAll("[data-g]").forEach(b => b.onclick = () => { state.g = b.dataset.g; app.querySelectorAll("[data-g]").forEach(x => x.setAttribute("aria-pressed", x === b)); draw(); });
  draw();
}
