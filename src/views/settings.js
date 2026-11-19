import { accountCard } from "./account.js";
import { SWATCHES, getTheme, setTheme } from "../ui/theme.js";
import { topbar } from "../ui/topbar.js";
import { back } from "../router.js";
import { saveBar, bindSaveBar } from "./savebar.js";
import { rerender } from "./app.js";
import SOURCES from "../plan/sources.js";

const CONTACT = "iloloizu97@gmail.com";
// Research and coaching references behind the exercise explanations, grouped by publisher.
function publishers() {
  const n = {};
  for (const v of Object.values(SOURCES)) for (const x of (v.sources || [])) {
    const p = String(x.publisher || "").replace(/\s*\((PubMed|PMC|Springer)\)$/, "").trim();
    if (p) n[p] = (n[p] || 0) + 1;
  }
  return Object.entries(n).sort((a, b) => b[1] - a[1]);
}

/* ---------- settings: color, data, about + credits, contact ---------- */
export function renderSettings() {
  const app = document.getElementById("app"); app.className = "wrap settings";
  const th = getTheme(), custom = th !== "auto" && !SWATCHES.some(([v]) => v === th);
  const refs = Object.values(SOURCES).reduce((t, v) => t + (v.sources || []).length, 0);
  let h = topbar({ title: "Settings", back: { label: "Back" } });
  h += accountCard();
  h += `<div class="lbl">Your color</div><section class="swatches" role="radiogroup" aria-label="App color">${SWATCHES.map(([v, n]) => `<button role="radio" aria-checked="${th === v}" aria-label="${n}" data-th="${v}" class="sw${v === "auto" ? " auto" : ""}" style="--c:${v === "auto" ? "#7cf2c2" : v}"><i></i><span>${n}</span></button>`).join("")}<label class="sw custom" aria-checked="${custom}" style="--c:${custom ? th : "#888"}"><i></i><span>Custom</span><input type="color" id="thpick" value="${th === "auto" ? "#7cf2c2" : th}" aria-label="Custom color"></label></section>`;
  h += `<div class="lbl">Your data</div>` + saveBar();
  h += `<div class="lbl">Contact us</div><section class="about"><p>Found a problem or have an idea? Email <a href="mailto:${CONTACT}?subject=Hybrid%20Build">${CONTACT}</a>.</p></section>`;
  h += `<div class="lbl">About</div><section class="about credits">
    <p><b>Exercise pictures</b><br>Exercise data by <a href="https://repdb.co" target="_blank" rel="noopener noreferrer">RepDB (repdb.co)</a>. Some photos from <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener noreferrer">Free Exercise DB</a> (public domain).</p>
    <p><b>Exercise explanations</b><br>How-to steps and tips are backed by ${refs} references, listed under Sources on each exercise. They come from:</p>
    <ul>${publishers().map(([p, c]) => `<li>${p}<small>${c}</small></li>`).join("")}</ul>
  </section>`;
  app.innerHTML = h;
  document.getElementById("tb-back").onclick = () => back("#/block");
  app.querySelectorAll("[data-th]").forEach(b => b.onclick = () => { setTheme(b.dataset.th); rerender(); });
  const pick = document.getElementById("thpick"); if (pick) pick.onchange = () => { setTheme(pick.value); rerender(); };
  bindSaveBar();
}
