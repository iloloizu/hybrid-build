import { startStrava } from "./strava.js";
import { startAccount } from "./account.js";
import { welcomed, hasSession } from "./views/account.js";
import { route } from "./router.js";
import { flush } from "./storage.js";
import "./styles.css";
import { ui } from "./state.js";
import { connect } from "./storage.js";
import { boot, rerender } from "./views/app.js";
import { sheetOpen } from "./ui/sheet.js";
import { keep } from "./views/common.js";
import { applyTheme } from "./ui/theme.js";
applyTheme();

// Re-render when synced data arrives, unless the user is typing or a sheet is open.
const safeRender = () => { if (ui.view !== "ex" && !sheetOpen() && !(document.activeElement && document.activeElement.tagName === "INPUT")) keep(rerender); };

// First open on this device: offer an account before the app.
if (!welcomed() && !hasSession() && !/[?&]code=/.test(location.search) && /^(#\/?(today)?)?$/.test(location.hash)) history.replaceState(history.state, "", location.pathname + location.search + "#/welcome");
const ACCT = new Set(["profile", "signin", "signup", "reset", "settings", "welcome"]);
boot();
connect(safeRender);
startAccount(() => { const r = route(); if (ACCT.has(r.name) && !(document.activeElement && document.activeElement.tagName === "INPUT")) keep(rerender); else safeRender(); });
window.addEventListener("online", () => flush());
startStrava(() => { const r = route(); if (r.name === "settings") keep(rerender); else safeRender(); });

// Installable + offline when self-hosted. Skipped inside the Claude artifact host and from file://.
if (import.meta.env.PROD && "serviceWorker" in navigator && location.protocol.startsWith("http") && !(window.claude && window.claude.use)) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
