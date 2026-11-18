/* ---------- router: hash routes with a real history stack ---------- */
// #/today · #/week · #/w/3 · #/w/3/d/2 · #/block · #/exercises · #/ex/<id>
let handler = () => {};
const popHooks = [];
export const onRoute = fn => { handler = fn; };
// A hook returns true when it handled the back press itself (e.g. closing a sheet).
export const interceptPop = fn => popHooks.push(fn);

export function parse(h) {
  if (h === "#posegrid") return { name: "posegrid" };
  const p = h.replace(/^#\/?/, "").split("/").filter(Boolean);
  const wk = +p[1], dy = +p[3];
  if (p[0] === "week") return { name: "week" };
  if (p[0] === "w" && wk >= 1 && wk <= 10 && Number.isInteger(wk)) {
    if (p[2] === "d" && dy >= 0 && dy <= 6 && Number.isInteger(dy) && p[3] !== "") return { name: "day", w: wk, d: dy };
    return { name: "week", w: wk };
  }
  if (p[0] === "block") return { name: "block" };
  if (p[0] === "exercises") return { name: "library" };
  if (p[0] === "ex" && p[1]) return { name: "ex", id: decodeURIComponent(p[1]) };
  return { name: "today" };
}
export const route = () => parse(location.hash);
export const depth = () => (history.state && history.state.depth) || 0;
const remember = () => { try { history.replaceState(Object.assign({}, history.state, { y: window.scrollY }), ""); } catch (e) {} };

export function go(path, { replace = false } = {}) {
  if (!replace && location.hash === path) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
  remember();
  if (replace) history.replaceState({ depth: depth() }, "", path);
  else history.pushState({ depth: depth() + 1 }, "", path);
  handler({ scroll: 0 });
}
// In-app back: real history when we have it, otherwise a sensible parent screen.
export function back(fallback) { if (depth() > 0) history.back(); else go(fallback, { replace: true }); }
export function pushOverlay() { remember(); history.pushState({ depth: depth() + 1, overlay: 1 }, ""); }

export function start() {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (!history.state) history.replaceState({ depth: 0 }, "");
  window.addEventListener("popstate", e => {
    for (const fn of popHooks) if (fn()) return;
    handler({ scroll: (e.state && e.state.y) || 0 });
  });
  handler({ scroll: 0 });
}
