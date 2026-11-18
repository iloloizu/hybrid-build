/* ---------- snackbar: short confirmation that fades on its own ---------- */
let t = null;
export function toast(msg) {
  const el = document.getElementById("toast"); if (!el || !msg) return;
  el.textContent = msg; el.classList.add("on");
  clearTimeout(t); t = setTimeout(() => el.classList.remove("on"), 3200);
}
