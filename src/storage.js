/* ---------- storage: local copy always, synced to your private db space when available ---------- */
export let STORE = {};
try { STORE = JSON.parse(localStorage.getItem("hb4") || "{}") || {}; } catch (e) {}
export let DB = null, UID = null, ACTS = {}, SYNC = null;
export const dirty = new Set();
export function persistLocal() { try { localStorage.setItem("hb4", JSON.stringify(STORE)); } catch (e) {} }
export const docName = k => k.split("|")[0]; // group keys into docs: "w3s2|..." -> doc w3s2
export function sget(k) { const g = STORE[docName(k)]; return g ? g[k] : undefined; }
export function sset(k, v) {
  const d = docName(k); STORE[d] = STORE[d] || {};
  if (v == null) delete STORE[d][k]; else STORE[d][k] = v;
  persistLocal(); dirty.add(d); flush(); keepForever();
}
// Ask the browser not to evict our data (Safari otherwise may clear it after weeks without use).
let persistAsked = false;
export function keepForever() {
  if (persistAsked) return; persistAsked = true;
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}
}
export const isSynced = () => !!(DB && UID);
let flushing = false;
export async function flush() {
  if (!DB || !UID || flushing) return;
  flushing = true;
  try {
    while (dirty.size) {
      const d = dirty.values().next().value; dirty.delete(d);
      await DB.collection("data/users/" + UID).doc(d).set({ v: STORE[d] || {} });
    }
  } catch (e) { /* stays local */ }
  flushing = false;
}
// w is a week key ("w3", "b2w3r1") or, for block 1, a plain week number.
const wk = w => typeof w === "number" ? "w" + w : typeof w === "object" ? w.key : w;
export const setKey = (w, s, i, n) => `${wk(w)}s${s}|${i}-${n}`;
export const warmKey = (w, s, i) => `${wk(w)}s${s}|warm-${i}`;
export const schedKey = w => { const k = wk(w); return `sched${/^w\d+$/.test(k) ? k.slice(1) : k}|slots`; };

/* ---------- connect: synced logs + Strava feed (Claude artifact host only) ---------- */
// onRemote is called whenever synced data changes, so the active view can re-render.
export async function connect(onRemote) {
  if (!window.claude || !window.claude.use) return;
  try {
    const [db, user] = await Promise.all([claude.use("db"), claude.use("user")]);
    if (!db) return;
    DB = db;
    const uid = user ? await user.id() : null;
    db.collection("strava").orderBy("date", "desc").limit(400).onSnapshot(snap => {
      const m = {}; snap.docs.forEach(doc => { const x = doc.data(); if (x && x.date) (m[x.date] = m[x.date] || []).push(x); });
      ACTS = m; onRemote();
    }, () => {});
    db.doc("meta/sync").onSnapshot(s => { const x = s.exists ? s.data() : null; SYNC = x && x.at ? new Date(x.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : null; onRemote(); }, () => {});
    if (uid) {
      UID = uid;
      db.collection("data/users/" + uid).onSnapshot(snap => {
        snap.docs.forEach(doc => { if (!dirty.has(doc.id)) { const x = doc.data(); if (x && x.v) STORE[doc.id] = Object.assign({}, x.v); } });
        persistLocal(); onRemote();
        Object.keys(STORE).forEach(k => { if (!snap.docs.some(d => d.id === k)) dirty.add(k); }); flush();
      }, () => {});
    }
  } catch (e) { /* offline: local copy keeps working */ }
}

/* ---------- backup: download all logs as a file, restore from one ---------- */
const DOC_RE = /^((b\d+)?w\d+(r\d+)?s\d+|sched[\w]+|blocks|checkin|runs|days)$/;
export function backupJSON() { return JSON.stringify({ app: "hybrid-build", v: 1, exported_at: new Date().toISOString(), data: STORE }, null, 1); }
// Returns the number of docs restored, or throws with a short reason.
export function restoreJSON(text) {
  let x; try { x = JSON.parse(text); } catch (e) { throw new Error("Not a backup file"); }
  const data = x && x.app === "hybrid-build" ? x.data : null;
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Not a Hybrid Build backup");
  const docs = Object.entries(data).filter(([k, v]) => DOC_RE.test(k) && v && typeof v === "object" && !Array.isArray(v));
  for (const k of Object.keys(STORE)) { delete STORE[k]; dirty.add(k); }
  for (const [k, v] of docs) { STORE[k] = Object.assign({}, v); dirty.add(k); }
  persistLocal(); flush(); keepForever();
  return docs.length;
}
