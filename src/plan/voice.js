/* ---------- spoken or typed set logging: "5x5 bench at 145", "3 sets of 8 incline 60" ---------- */
const NUM = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, a: 1, single: 1, once: 1, twice: 2 };
const ALIAS = { bench: "bench press", rdl: "romanian deadlift", ohp: "overhead press", db: "dumbbell", dbs: "dumbbell", bb: "barbell", tricep: "triceps", pulldowns: "pulldown", pullups: "pull-up", pullup: "pull-up", squats: "squat", deadlifts: "deadlift", curls: "curl", rows: "row", raises: "raise", lunges: "lunge" };
const STOP = new Set(["at", "of", "for", "with", "and", "the", "sets", "set", "reps", "rep", "times", "x", "by", "lb", "lbs", "pound", "pounds", "kg", "kilos", "did", "i", "my", "on", "do", "just", "log", "add", "plus", "about"]);

// Spoken numbers to digits ("one forty five" → "145", "twenty five" → "25").
export function normalize(text) {
  let t = " " + String(text).toLowerCase().replace(/[×*]/g, " x ").replace(/(\d)\s*x\s*(\d)/g, "$1 x $2").replace(/[,.!?]/g, " ").replace(/-/g, " ") + " ";
  t = t.replace(/\b(\d+)(lbs?|kg|pounds)\b/g, "$1 $2");
  const words = t.trim().split(/\s+/), out = [];
  for (let k = 0; k < words.length; k++) {
    const w = words[k];
    if (w in NUM && !(w === "a" && !(words[k + 1] in NUM) && !/^\d/.test(words[k + 1] || ""))) {
      let n = NUM[w], j = k + 1;
      if (w === "a" || w === "single" || w === "once" || w === "twice") { out.push(String(n)); continue; }
      // "one forty five" = 145; "twenty five" = 25; "one hundred" = 100
      if (n < 10 && words[j] === "hundred") { n *= 100; j++; if (words[j] === "and") j++; }
      if (words[j] in NUM && NUM[words[j]] >= 20 && NUM[words[j]] < 100 && n < 10 && n > 0 && w !== "a") { n = n * 100 + NUM[words[j]]; j++; }
      if (n >= 20 && n % 10 === 0 && words[j] in NUM && NUM[words[j]] < 10 && NUM[words[j]] > 0) { n += NUM[words[j]]; j++; }
      else if (n >= 100 && n % 10 === 0 && words[j] in NUM && NUM[words[j]] < 10 && NUM[words[j]] > 0) { n += NUM[words[j]]; j++; }
      out.push(String(n)); k = j - 1; continue;
    }
    out.push(w);
  }
  return out.join(" ");
}

// → { sets, reps, weight, words } (any can be missing)
export function parse(text) {
  let t = " " + normalize(text) + " ";
  const r = { sets: null, reps: null, weight: null, kg: false };
  const take = (re, fn) => { const m = t.match(re); if (m) { fn(m); t = t.replace(m[0], " "); } return !!m; };
  take(/\b(\d+(?:\.\d+)?)\s*(lbs?|pounds?|kg|kilos?)\b/, m => { r.weight = +m[1]; r.kg = /k/.test(m[2]); });
  take(/\b(?:at|@|with)\s+(\d+(?:\.\d+)?)\b/, m => { if (r.weight == null) r.weight = +m[1]; });
  take(/\b(\d+)\s*(?:x|by|times)\s*(\d+)\b/, m => { r.sets = +m[1]; r.reps = +m[2]; })
    || take(/\b(\d+)\s*sets?\s*(?:of\s*)?(\d+)\b/, m => { r.sets = +m[1]; r.reps = +m[2]; });
  if (r.sets == null) take(/\b(\d+)\s*sets?\b/, m => { r.sets = +m[1]; });
  if (r.reps == null) take(/\b(?:for\s+)?(\d+)\s*reps?\b/, m => { r.reps = +m[1]; });
  if (r.reps == null) take(/\bfor\s+(\d+)\b/, m => { r.reps = +m[1]; });
  if (r.weight == null) take(/\b(?:of\s+)?(\d+(?:\.\d+)?)\b/, m => { r.weight = +m[1]; });
  r.words = t.split(/\s+/).filter(w => w && !STOP.has(w) && !/^\d/.test(w)).flatMap(w => (ALIAS[w] || w).split(" "));
  return r;
}

// Which of today's exercises the words point at (null = none named).
export function matchExercise(words, entries) {
  if (!words.length) return null;
  const stem = w => w.replace(/(es|s)$/, "");
  let best = null, bs = 0;
  for (const e of entries) {
    const name = e.name.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).map(stem);
    const hit = words.map(stem).filter(w => name.includes(w)).length;
    const sc = hit / words.length + hit * 0.1 - (name.length - hit) * 0.01;
    if (hit && sc > bs) { bs = sc; best = e; }
  }
  return best;
}
