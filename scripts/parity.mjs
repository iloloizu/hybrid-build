// Parity check: drives prototype/index.html and dist/index.html through the same
// clicks with a frozen clock and compares the rendered DOM and saved data at every step.
// Usage: npm run build && npm run parity   (needs Playwright + Chromium installed)
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // devDependency or a global install
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const TARGETS = { prototype: "prototype/index.html", build: "dist/index.html" };
const NOW = new Date(process.env.PARITY_NOW || "2026-11-18T12:00:00");

// rAF phase can shift the progress bar by a few ms between runs; compare it to 1%.
const norm = h => h.replace(/(id="prog" style="width: )([\d.]+)%/, (_, a, v) => a + Math.round(+v) + "%");

// Fake Claude artifact host: claude.use("db") / claude.use("user"), records every write.
const FAKE_HOST = () => {
  window.__writes = [];
  const snap = docs => ({ docs: docs.map(([id, v]) => ({ id, data: () => v })) });
  const strava = [["2026-11-17-1", { date: "2026-11-17", type: "Run", name: "Tempo <6>", distance_mi: 8.1, moving_time: "1:02:10", pace: "7:40", avg_hr: 158 }], ["2026-11-22-2", { date: "2026-11-22", type: "Run", name: "Long run", distance_mi: 16 }]];
  const user = [["w1s0", { v: { "w1s0|0-0": { w: "155", r: "8", d: 1 } } }]];
  const coll = name => ({
    orderBy: () => ({ limit: () => ({ onSnapshot: cb => setTimeout(() => cb(snap(strava)), 0) }) }),
    onSnapshot: cb => setTimeout(() => cb(snap(user)), 0),
    doc: id => ({ set: async v => { window.__writes.push([name, id, JSON.stringify(v)]); } })
  });
  const db = { collection: coll, doc: () => ({ onSnapshot: cb => setTimeout(() => cb({ exists: true, data: () => ({ at: "2026-11-18T06:00:00Z" }) }), 0) }) };
  window.claude = { use: async k => k === "db" ? db : { id: async () => "u1" } };
};

async function run(browser, file) {
  const out = [];
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const page = await ctx.newPage();
  if (process.env.PARITY_HOST) await page.addInitScript(FAKE_HOST);
  await page.clock.install({ time: NOW });
  await page.clock.pauseAt(new Date(NOW.getTime() + 1000)); // frozen: animation frames only advance on runFor
  const url = "file://" + path.join(root, file);
  await page.goto(url);
  if (process.env.PARITY_HOST) await page.clock.runFor(50);
  const snap = async label => out.push({ label, html: norm(await page.$eval("#app", e => e.innerHTML)), ls: await page.evaluate(() => localStorage.getItem("hb4") + JSON.stringify(window.__writes || null)) });
  const click = async sel => { await page.click(sel); };
  await snap("load");
  for (let w = 1; w <= 10; w++) {
    await click(`[data-w="${w}"]`);
    for (let d = 0; d < 7; d++) { await click(`[data-d="${d}"]`); await snap(`w${w}d${d}`); }
  }
  // logging
  await click(`[data-w="1"]`); await click(`[data-d="0"]`);
  await page.fill(`input[data-i="0"][data-s="0"][data-f="w"]`, "135"); await page.dispatchEvent(`input[data-i="0"][data-s="0"][data-f="w"]`, "change"); await snap("weight");
  await page.fill(`input[data-i="0"][data-s="1"][data-f="r"]`, "7"); await page.dispatchEvent(`input[data-i="0"][data-s="1"][data-f="r"]`, "change"); await snap("reps");
  await click(`[data-i="0"][data-s="0"][data-done]`); await snap("done");
  await click(`[data-i="1"][data-s="0"][data-done]`); await click(`[data-i="1"][data-s="0"][data-done]`); await snap("undone");
  await click(`[data-warm="0"]`); await snap("warm");
  await click(`[data-w="2"]`); await click(`[data-d="0"]`); await snap("prev-week-placeholder");
  // swaps
  await click(`[data-w="1"]`); await click(`[data-d="0"]`);
  for (const k of ["S1", "S3", "S5"]) { await click(`[data-sw="${k}"]`); await snap("swap-" + k); }
  await click(`[data-sw="S5"]`); await snap("swap-close");
  // day controls
  await click(`[data-act="push"]`); await snap("push-sheet");
  await click(`[data-confirm="push"]`); await snap("pushed");
  await click(`[data-d="1"]`); await click(`[data-act="push"]`); await click(`[data-confirm="push"]`); await snap("pushed-2");
  await click(`[data-d="3"]`); await click(`[data-act="swap"]`); await snap("swap-sheet");
  await click(`[data-swapwith="5"]`); await snap("swapped");
  await click(`[data-d="4"]`); await click(`[data-act="skip"]`); await snap("skip-sheet");
  await click(`[data-confirm="skip"]`); await snap("skipped");
  await click(`[data-sw="S5"]`); await snap("skipped-pump");
  await click(`[data-d="5"]`); await click(`[data-act="push"]`); await click(`[data-confirm="push"]`); await snap("sat-push");
  await click(`[data-d="0"]`); await click(`#resetweek`); await snap("reset");
  await click(`#clearday`); await snap("cleared");
  // exercise screens
  await click(`[data-w="5"]`);
  for (let d = 0; d < 6; d++) {
    await click(`[data-d="${d}"]`);
    const ids = await page.$$eval("[data-ex]", bs => [...new Set(bs.map(b => b.dataset.ex))]);
    for (const id of ids) {
      await click(`[data-ex="${id}"]`); await snap(`ex-${id}`);
      await page.clock.runFor(1700); await snap(`ex-${id}-t1700`);
      await click("#pp"); await page.clock.runFor(900); await snap(`ex-${id}-paused`);
      await click("#back"); await snap(`ex-${id}-back`);
    }
  }
  await page.goto(url + "#posegrid"); await snap("posegrid");
  await ctx.close();
  return out;
}

const browser = await chromium.launch();
const [a, b] = await Promise.all(Object.values(TARGETS).map(f => run(browser, f)));
await browser.close();
let bad = 0;
for (let i = 0; i < Math.max(a.length, b.length); i++) {
  const x = a[i], y = b[i];
  if (!x || !y || x.label !== y.label || x.html !== y.html || x.ls !== y.ls) {
    bad++;
    if (bad <= 5) {
      console.log("MISMATCH at", x?.label, y?.label, x?.ls === y?.ls ? "" : "(storage differs)");
      if (x && y && x.html !== y.html) { let j = 0; while (x.html[j] === y.html[j]) j++; console.log(" prototype:", x.html.slice(j - 80, j + 120)); console.log(" build:    ", y.html.slice(j - 80, j + 120)); }
    }
  }
}
const synced = b.filter(x => x.html.includes("From Strava")).length, writes = (b.at(-2)?.ls.match(/\["data\/users/g) || []).length;
if (process.env.PARITY_HOST) console.log(`fake host: ${synced} steps showed the Strava card, ${writes} db writes in the last step`);
console.log(`${a.length} steps compared, ${bad} mismatches`);
process.exit(bad ? 1 : 0);
