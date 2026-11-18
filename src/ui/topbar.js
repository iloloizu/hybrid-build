import { ICON } from "./icons.js";
import { esc } from "../views/common.js";

/* ---------- sticky top bar: back on the left, title, one action on the right ---------- */
// back: { label, id } · right: html · progress: 0..1 for the thin bar along the bottom edge
export function topbar({ title, sub = "", back = null, right = "", progress = null }) {
  return `<header class="topbar${back ? "" : " root"}">
    <div class="tb-left">${back ? `<button class="tb-back" id="tb-back" aria-label="Back to ${esc(back.label)}">${ICON.back}<span>${esc(back.label)}</span></button>` : ""}</div>
    <div class="tb-title"><b>${title}</b>${sub ? `<span>${sub}</span>` : ""}</div>
    <div class="tb-right">${right}</div>
    ${progress != null ? `<i class="tb-prog" style="width:${Math.round(progress * 100)}%"></i>` : ""}
  </header>`;
}
