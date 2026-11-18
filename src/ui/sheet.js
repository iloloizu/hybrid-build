import { pushOverlay, interceptPop } from "../router.js";
import { ICON } from "./icons.js";

/* ---------- bottom sheet: slides up, closes on backdrop, ✕, Escape or the back gesture ---------- */
let current = null;
interceptPop(() => { if (!current) return false; teardown(); return true; });

// render(body) fills the sheet; call api.refresh() to redraw it in place.
export function openSheet({ title, render, tall = false }) {
  if (current) teardown();
  const root = document.getElementById("sheets");
  root.innerHTML = `<div class="scrim" data-close></div><section class="sheet-panel${tall ? " tall" : ""}" role="dialog" aria-modal="true" aria-label="${title}">
    <div class="grab" aria-hidden="true"></div>
    <header class="sheet-head"><h3>${title}</h3><button class="iconbtn" data-close aria-label="Close">${ICON.close}</button></header>
    <div class="sheet-body"></div></section>`;
  const body = root.querySelector(".sheet-body");
  const api = { refresh: () => render(body, api), close: () => closeSheet() };
  current = { root, api, prevFocus: document.activeElement };
  root.querySelectorAll("[data-close]").forEach(b => b.onclick = () => closeSheet());
  document.body.classList.add("locked");
  pushOverlay();
  render(body, api);
  requestAnimationFrame(() => root.classList.add("open"));
  const panel = root.querySelector(".sheet-panel"); panel.tabIndex = -1; panel.focus({ preventScroll: true });
  dragToClose(panel, root.querySelector(".grab"));
  return api;
}
export const sheetOpen = () => !!current;
export function closeSheet() { if (current) history.back(); }
function teardown() {
  const { root, prevFocus } = current; current = null;
  root.classList.remove("open"); document.body.classList.remove("locked");
  setTimeout(() => { if (!current) root.innerHTML = ""; }, 220);
  if (prevFocus && prevFocus.focus && document.contains(prevFocus)) prevFocus.focus({ preventScroll: true });
}
document.addEventListener("keydown", e => { if (e.key === "Escape" && current) closeSheet(); });

// Pull the grab handle (or the header) down to dismiss.
function dragToClose(panel, grab) {
  let y0 = null, dy = 0;
  const startEls = [grab, panel.querySelector(".sheet-head")];
  startEls.forEach(el => el.addEventListener("touchstart", e => { y0 = e.touches[0].clientY; dy = 0; panel.style.transition = "none"; }, { passive: true }));
  panel.addEventListener("touchmove", e => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); panel.style.transform = `translateY(${dy}px)`; }, { passive: true });
  panel.addEventListener("touchend", () => { if (y0 == null) return; panel.style.transition = ""; panel.style.transform = ""; if (dy > 90) closeSheet(); y0 = null; });
}
