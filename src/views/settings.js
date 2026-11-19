import { STRAVA, refreshStatus, importRuns, connectStrava, disconnectStrava, autoPost, setAutoPost } from "../strava.js";
import { signedIn } from "../account.js";
import { toast } from "../ui/toast.js";
import { ask } from "../ui/confirm.js";
import { esc } from "./common.js";
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
export function renderSettings(sub = "") {
  const app = document.getElementById("app"); app.className = "wrap settings";
  const th = getTheme(), custom = th !== "auto" && !SWATCHES.some(([v]) => v === th);
  const refs = Object.values(SOURCES).reduce((t, v) => t + (v.sources || []).length, 0);
  let h = topbar({ title: "Settings", back: { label: "Back" } });
  h += accountCard();
  h += stravaCard();
  h += `<div class="lbl">Your color</div><section class="swatches" role="radiogroup" aria-label="App color">${SWATCHES.map(([v, n]) => `<button role="radio" aria-checked="${th === v}" aria-label="${n}" data-th="${v}" class="sw${v === "auto" ? " auto" : ""}" style="--c:${v === "auto" ? "#7cf2c2" : v}"><i></i><span>${n}</span></button>`).join("")}<label class="sw custom" aria-checked="${custom}" style="--c:${custom ? th : "#888"}"><i></i><span>Custom</span><input type="color" id="thpick" value="${th === "auto" ? "#7cf2c2" : th}" aria-label="Custom color"></label></section>`;
  h += `<div class="lbl">Your data</div>` + saveBar();
  h += `<div class="lbl">Contact us</div><section class="about"><p>Found a problem or have an idea? Email <a href="mailto:${CONTACT}?subject=Stride%20app">${CONTACT}</a>.</p></section>`;
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
  bindStrava();
  const said = { "strava-connected": "Strava connected.", "strava-cancelled": "Strava wasn't connected.", "strava-expired": "That took too long. Try connecting again.", "strava-failed": "Strava didn't connect. Try again." }[sub];
  if (said) { toast(said); history.replaceState(history.state, "", "#/settings"); if (sub === "strava-connected") refreshStatus().then(importRuns); }
}

function stravaCard() {
  const S = STRAVA;
  let h = `<div class="lbl">Strava</div><section class="pf-rows strava-card">`;
  if (!signedIn()) h += `<div class="pf-row"><span>Sign in to connect Strava</span></div>`;
  else if (!S.checked) h += `<div class="pf-row"><span class="muted">Checking…</span></div>`;
  else if (!S.connected) h += `<button class="pf-row" id="sv-connect"><span><b class="sv-dot"></b>Connect Strava</span><small class="muted">Runs in, workouts out</small></button>`;
  else h += `<div class="pf-row"><span><b class="sv-dot on"></b>Connected${S.name ? ` as ${esc(S.name)}` : ""}</span></div>
    <label class="pf-row"><span>Post workouts when I tap Done</span><input type="checkbox" class="switch" id="sv-auto"${autoPost() ? " checked" : ""}></label>
    <button class="pf-row danger" id="sv-off"><span>Disconnect Strava</span></button>`;
  return h + `</section>${S.connected ? `<p class="af-note">Runs from Strava show up on their days. If your watch already sent the workout to Strava, Stride adds its lifts to that one instead of posting twice.</p>` : ""}`;
}
function bindStrava() {
  const c = document.getElementById("sv-connect"), a = document.getElementById("sv-auto"), off = document.getElementById("sv-off");
  if (c) c.onclick = async () => { c.disabled = true; try { await connectStrava(); } catch (x) { toast(x.message); c.disabled = false; } };
  if (a) a.onchange = () => { setAutoPost(a.checked); toast(a.checked ? "Workouts will post to Strava." : "Workouts won't post to Strava."); };
  if (off) off.onclick = async () => { const ok = await ask({ title: "Disconnect Strava?", body: "Stride stops reading runs and posting workouts. Nothing already on Strava is removed.", yes: "Disconnect", no: "Keep" }); if (!ok) return; try { await disconnectStrava(); toast("Strava disconnected."); rerender(); } catch (x) { toast(x.message); } };
}
