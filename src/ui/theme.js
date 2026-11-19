// User color. "auto" keeps mint + a different gradient per exercise; any hex drives
// the accent (buttons, progress, active tab, focus) and the Today gradient.
// Done (mint) and superset (purple) stay fixed so they keep their meaning.
import { store } from "../platform/index.js";

const KEY = "hb-theme";
export const SWATCHES = [
  ["auto", "Auto"], ["#6cc4ff", "Sky"], ["#b79bff", "Violet"], ["#ff7aa8", "Rose"],
  ["#ff8a5c", "Coral"], ["#ffd166", "Gold"], ["#b8f05a", "Lime"], ["#f2f2f2", "Mono"],
];

const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgb2hex = c => "#" + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
const BG = [18, 18, 18];

// Lighten until it reads on the dark background (4.5:1).
export function readable(hex) {
  let c = hex2rgb(hex);
  for (let i = 0; i < 20 && contrast(c, BG) < 4.5; i++) c = c.map(v => v + (255 - v) * .12);
  return rgb2hex(c);
}
// Same hue, dark enough for the header gradient behind white text.
export function deep(hex) {
  const [r, g, b] = hex2rgb(hex).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60; if (h < 0) h += 360;
  const s = d ? d / (1 - Math.abs(mx + mn - 1)) : 0;
  return `hsl(${Math.round(h)} ${Math.round(Math.min(s, .55) * 100)}% 30%)`;
}

export const getTheme = () => { const v = store.get(KEY); return v && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : "auto"; };
export function setTheme(v) { store.set(KEY, v); applyTheme(); }
// Gradient color for exercise k: per-exercise palette in Auto, the user's color otherwise.
export const themeHue = (k, auto) => { const t = getTheme(); return t === "auto" ? auto : deep(t); };

export function applyTheme() {
  if (typeof document === "undefined") return;
  const t = getTheme(), s = document.documentElement.style;
  if (t === "auto") { s.removeProperty("--accent"); s.removeProperty("--accent-ink"); }
  else { const a = readable(t); s.setProperty("--accent", a); s.setProperty("--accent-ink", lum(hex2rgb(a)) > .35 ? "#121212" : "#ffffff"); }
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = "#121212";
}
