import { backupJSON, restoreJSON, isSynced } from "../storage.js";
import { iso } from "../plan/plan.js";
import { ui } from "../state.js";
import { renderPlan } from "./plan.js";

/* ---------- save bar: where logs live, plus backup / restore ---------- */
export function saveBar() {
  return `<div class="savebar"><span class="saved"><i></i>${isSynced() ? "Saved · synced" : "Saved on this phone"}</span><button class="textbtn" id="backup">Back up</button><button class="textbtn" id="restore">Restore</button><input type="file" id="restorefile" accept="application/json,.json" hidden></div>`;
}

export function bindSaveBar() {
  const b = document.getElementById("backup"), r = document.getElementById("restore"), f = document.getElementById("restorefile");
  if (!b) return;
  b.onclick = () => {
    const url = URL.createObjectURL(new Blob([backupJSON()], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `hybrid-build-${iso(new Date())}.json` });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  r.onclick = () => f.click();
  f.onchange = async () => {
    const file = f.files && f.files[0]; if (!file) return;
    const text = await file.text();
    if (!confirm("Replace the logs on this phone with this backup?")) { f.value = ""; return; }
    try { const n = restoreJSON(text); ui.toast = `Restored ${n} ${n === 1 ? "log" : "logs"} from backup.`; }
    catch (e) { ui.toast = e.message + ". Nothing changed."; }
    f.value = ""; renderPlan();
  };
}
