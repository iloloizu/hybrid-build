/* ---------- plan ---------- */
export const KNEE = [["backwalk", "3 min"], ["tib", "1×25"], ["patrick", "15/leg"], ["atg", "6/leg"], ["couch", "30s/side"]];
export const SWAPS = {
  S1: { t: "Express Upper", m: "35 min", l: ["DB bench 8-10 + chest-supported DB row 10 · 3 rounds", "Seated DB press 10 + pull-ups 2 short of failure · 3 rounds", "Cable lateral raise 15/side + Bayesian curl 12 + overhead triceps ext 12 · 3 rounds"] },
  S2: { t: "Express Lower", m: "30 min", l: ["Box jumps 3×3 (skip if Achilles or ankle is sore)", "One main lift, 3×5 at last week's weight", "ATG split squat 2×8/leg + Nordic curl 2×5", "Tib raises 1×25 + backward walk 3 min"] },
  S3: { t: "DBs Only", m: "35 min", l: ["DB press 4×10-12 + 1-arm row 4×10/side", "Bulgarian split squat 3×10/leg + DB RDL 3×10", "Lateral raise 4×15 + curl 3×12 + overhead ext 3×12", "100 V-ups, any way you break them up"] },
  S4: { t: "No Equipment", m: "25 min", l: ["5 rounds: push-ups 15-20 · pull-ups 2 short · ATG split squat 8/leg · pike push-ups 10 · towel leg curls 8 · hollow hold 30s"] },
  S5: { t: "Pump Only", m: "20 min", l: ["Lateral raise 4×20", "Push-ups 3× max minus 2", "Bayesian curl + rope pushdown 3×15", "Reverse pec deck or band pull-aparts 3×20"] },
  S7: { t: "Run + Lift", m: "80 min", l: ["Run first", "5 min: water, shake if the run went over an hour, short knee warm-up", "Easy run: full session. Quality run: Express Upper or Express Lower instead"] }
};
// sessions (index = session id). rank: lower = more important when a week gets crushed
export const DAYS = [
  { dow: "Mon", ln: "PRESS", name: "Press Conference", kind: "upper", rank: 1, mins: 60, run: "Rest day", order: "Lift only", swaps: ["S1", "S3", "S5"],
    items: [
      { x: "bench", p: "bench", tag: "main" },
      { x: "incline", p: "incline" },
      { ss: 1, x: "pecfly", s: 2, r: "12-15" },
      { ss: 1, x: "latraise", s: 3, r: "15", u: "/side", tag: "pri" },
      { ss: 2, x: "ohext", s: 2, r: "12", tag: "pri" },
      { ss: 2, x: "pushdown", s: 2, r: "15" },
      { x: "legraise", s: 3, r: "10", bw: 1 }
    ] },
  { dow: "Tue", ln: "KNEES", name: "Knee Deep", kind: "lower", rank: 4, mins: 60, run: "Quality run", order: "Run first", swaps: ["S2", "S7"],
    items: [
      { x: "boxjump", p: "plyo", s: 4, r: "3", bw: 1 },
      { x: "squat", p: "squat", tag: "main" },
      { x: "atg", p: "atg", u: "/leg", bw: 1 },
      { x: "nordic", p: "nordic", bw: 1 },
      { ss: 1, x: "slant", p: "slant" },
      { ss: 1, x: "calfraise", s: 2, r: "12" },
      { ss: 3, x: "latraise", s: 2, r: "15", u: "/side", tag: "pri" },
      { ss: 3, x: "bayesian", s: 2, r: "15", tag: "pri" }
    ] },
  { dow: "Wed", ln: "WINGS", name: "Wingspan", kind: "upper", rank: 2, mins: 60, run: "Easy run", order: "Either order", swaps: ["S1", "S3", "S5"],
    items: [
      { x: "pullup", p: "pullup", tag: "main", bw: 1 },
      { x: "csrow", p: "row", tag: "pri" },
      { x: "pulldown", s: 3, r: "12", tag: "pri" },
      { x: "onearmpd", s: 2, r: "12", u: "/side", tag: "pri" },
      { x: "facepull", s: 2, r: "15" },
      { ss: 1, x: "ezcurl", s: 2, r: "10", tag: "pri" },
      { ss: 1, x: "inclinecurl", s: 2, r: "12", tag: "pri" },
      { x: "cablecrunch", s: 2, r: "15" }
    ] },
  { dow: "Thu", ln: "HINGE", name: "Hinge Benefits", kind: "lower", rank: 5, mins: 50, run: "Easy / med-long", order: "Run first", swaps: ["S2", "S4", "S7"],
    items: [
      { x: "broadjump", p: "plyo", s: 3, r: "3", bw: 1 },
      { x: "trapbar", p: "trapbar", tag: "main" },
      { x: "rdl", s: 2, r: "8" },
      { ss: 1, x: "poliquin", s: 2, r: "15", u: "/leg", bw: 1 },
      { ss: 1, x: "soleus", p: "soleus" },
      { x: "jefferson", p: "jefferson" },
      { x: "tib", p: "tib" },
      { ss: 3, x: "latraise", s: 2, r: "15", u: "/side", tag: "pri" },
      { ss: 3, x: "ohext", s: 2, r: "15", tag: "pri" }
    ] },
  { dow: "Fri", ln: "BOULDER", name: "Boulder Dash", kind: "upper", rank: 3, mins: 50, run: "Easy or off", order: "Lift first", swaps: ["S1", "S3", "S5"],
    items: [
      { x: "dbpress", p: "dbpress", tag: "main" },
      { x: "latraise", s: 3, r: "15", u: "/side", tag: "pri" },
      { x: "yraise", s: 2, r: "15", tag: "pri" },
      { x: "revpec", s: 2, r: "15" },
      { ss: 1, x: "bayesian", s: 2, r: "12", tag: "pri" },
      { ss: 1, x: "ohrope", s: 2, r: "12", tag: "pri" },
      { ss: 2, x: "hammer", s: 2, r: "10", tag: "pri" },
      { ss: 2, x: "closebench", s: 2, r: "10", tag: "pri" },
      { x: "vup", s: 2, r: "1 round", bw: 1, fixed: 1 }
    ] },
  { dow: "Sat", ln: "PUMP", name: "Pump Fiction", kind: "upper", rank: 6, mins: 40, run: "Easy, off or F45", order: "Optional", optional: true, swaps: ["S5"],
    items: [
      { ss: 1, x: "machinepress", s: 2, r: "12" },
      { ss: 1, x: "rowmachine", s: 2, r: "12", tag: "pri" },
      { ss: 2, x: "revpec", s: 2, r: "15" },
      { ss: 2, x: "closepulldown", s: 2, r: "15", tag: "pri" },
      { x: "latdb", s: 2, r: "10+10+10", tag: "pri", fixed: 1 }
    ] },
  { dow: "Sun", ln: "LONG", name: "Long Haul", kind: "run", rank: 0, items: [] }
];
export const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const PHASES = {
  re: { name: "Rust Off", rule: "Stop 3 reps short on everything", rir: "3 in the tank" },
  build: { name: "Ignition", rule: "Main lifts 2 short · last accessory set to failure", rir: "2 in the tank" },
  cut: { name: "Pit Stop", rule: "Deload · same weights, fewer sets, no jumps", rir: "Deload" },
  heavy: { name: "Project Get Big", rule: "Add weight weekly · accessories to failure + partials", rir: "1-2 in the tank" },
  peak: { name: "Han Swolo Returns", rule: "Heaviest week of the block", rir: "1 in the tank" },
  test: { name: "Moment of Truth", rule: "Work up to a 3-rep max, then pump work · retake photos", rir: "Test day" }
};
export const phaseOf = w => w <= 2 ? "re" : w === 3 ? "build" : (w === 4 || w === 8) ? "cut" : w <= 7 ? "heavy" : w === 9 ? "peak" : "test";
export const phaseName = w => (w === 8 ? "Pit Stop II" : PHASES[phaseOf(w)].name);
export const MAIN = {
  bench:   { re: [3, "8"], build: [4, "6-8"], heavy: [4, "5-6"], peak: [5, "3-4"], test: [3, "to 3RM"] },
  incline: { re: [3, "10"], build: [3, "8-10"], heavy: [4, "6-8"], peak: [4, "6"], test: [1, "AMRAP"] },
  squat:   { re: [3, "6"], build: [4, "5"], heavy: [4, "4-5"], peak: [4, "3"], test: [3, "to 3RM"] },
  pullup:  { re: [3, "max-2"], build: [4, "6"], heavy: [4, "5"], peak: [5, "3"], test: [3, "to 3RM"] },
  row:     { re: [3, "10"], build: [4, "8"], heavy: [4, "6-8"], peak: [4, "6"], test: [3, "8"] },
  trapbar: { re: [3, "5"], build: [3, "5"], heavy: [3, "4-5"], peak: [3, "3"], test: null },
  dbpress: { re: [3, "10"], build: [4, "8-10"], heavy: [4, "6-8"], peak: [4, "6"], test: [1, "AMRAP"] }
};
export const KOT = {
  atg: { e: [2, "8"], m: [3, "6"], l: [3, "5"] }, nordic: { e: [3, "3"], m: [3, "5"], l: [3, "5"] },
  slant: { e: [2, "15"], m: [2, "12"], l: [2, "10"] }, tib: { e: [2, "20"], m: [2, "15"], l: [2, "15"] },
  soleus: { e: [2, "20"], m: [3, "15"], l: [3, "12"] }, jefferson: { e: [2, "8"], m: [2, "8"], l: [2, "8"] }
};
export const JEFF_LB = { e: "25 lb", m: "35 lb", l: "45 lb" };
export function dose(it, w) {
  const ph = phaseOf(w);
  if (MAIN[it.p]) {
    if (ph === "cut") return { s: 2, r: MAIN[it.p].build[1], note: "deload" };
    const v = MAIN[it.p][ph]; if (!v) return null;
    const note = it.p === "pullup" && ph === "build" ? "+10 lb" : it.p === "pullup" && ph !== "re" ? "add weight" : "";
    return { s: v[0], r: v[1], note };
  }
  if (KOT[it.p]) {
    const band = w <= 3 ? "e" : w <= 7 ? "m" : "l";
    if (ph === "cut") return { s: 2, r: KOT[it.p].e[1], note: "deload" };
    const v = KOT[it.p][band];
    return { s: v[0], r: v[1], note: it.p === "jefferson" ? JEFF_LB[band] : "" };
  }
  if (it.p === "plyo") { if (ph === "cut" || ph === "test") return null; return { s: ph === "heavy" || ph === "peak" ? it.s + 1 : it.s, r: it.r, note: "if pain-free" }; }
  if (it.fixed) return { s: ph === "cut" || ph === "test" ? 1 : it.s, r: it.r, note: "" };
  const s = { re: it.s, build: 3, cut: 2, heavy: it.tag === "pri" ? 4 : 3, peak: 3, test: 2 }[ph];
  return { s, r: it.r, note: ph === "heavy" ? "last set: fail + partials" : ph === "build" ? "last set to failure" : "" };
}
// Holidays by date (month-day), so they land right in any block.
export const FLAGS = { "11-26": "Thanksgiving", "12-25": "Christmas", "01-01": "New Year's Day", "07-04": "July 4th", "05-25": "Memorial Day" };
export const flagFor = dt => FLAGS[`${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`];
export const START = new Date(2026, 10, 16);
export const dayDate = (w, d) => new Date(START.getFullYear(), START.getMonth(), START.getDate() + (w - 1) * 7 + d);
export const fmt = dt => dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
export const iso = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
