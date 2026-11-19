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

boot();
connect(safeRender);

// Installable + offline when self-hosted. Skipped inside the Claude artifact host and from file://.
if (import.meta.env.PROD && "serviceWorker" in navigator && location.protocol.startsWith("http") && !(window.claude && window.claude.use)) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
