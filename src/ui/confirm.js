import { openSheet } from "./sheet.js";
/* ---------- confirmations without browser pop-ups ---------- */
// Tap once: the button asks "Tap again to …"; tap again within 3 s: it runs.
export function twoTap(btn, again, fn) {
  if (!btn) return;
  const label = btn.innerHTML; let armed = null;
  btn.onclick = () => {
    if (armed) { clearTimeout(armed); armed = null; btn.innerHTML = label; btn.classList.remove("armed"); return fn(); }
    btn.innerHTML = again; btn.classList.add("armed");
    armed = setTimeout(() => { armed = null; btn.innerHTML = label; btn.classList.remove("armed"); }, 3000);
  };
}
// A small sheet with a clear yes / no. Resolves true only on the yes button.
export function ask({ title, body = "", yes = "OK", no = "Cancel" }) {
  return new Promise(resolve => {
    let done = false; const finish = v => { if (!done) { done = true; resolve(v); } };
    openSheet({ title, onClose: () => finish(false), render: (el, api) => {
      el.innerHTML = `${body ? `<div class="optnote">${body}</div>` : ""}<div class="btnrow"><button class="bigbtn ghost" data-a="0">${no}</button><button class="bigbtn" data-a="1">${yes}</button></div>`;
      el.querySelectorAll("[data-a]").forEach(b => b.onclick = () => { finish(b.dataset.a === "1"); api.close(); });
    } });
  });
}
