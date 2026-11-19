/* ---------- Strava: connect, runs in, workouts out (through the project's strava function) ---------- */
import { sb, signedIn, onAccount } from "./account.js";
import { setActs } from "./storage.js";
import { store } from "./platform/index.js";

const FN = "https://filqlpwpdfuzazpusgok.supabase.co/functions/v1/strava";
const KEY = "sb_publishable_phMJjS_0kzHHGnL93uMUNQ_U_zsPT1G";
const RUNS = new Set(["Run", "TrailRun", "VirtualRun", "Walk", "Hike", "Treadmill"]);
export let STRAVA = { connected: false, name: null, canPost: false, checked: false };
const subs = new Set();
export const onStrava = fn => subs.add(fn);
const emit = () => subs.forEach(f => { try { f(); } catch (e) {} });

export const autoPost = () => store.get("hb-strava-auto") !== "0";
export const setAutoPost = on => store.set("hb-strava-auto", on ? "1" : "0");

async function call(action, body = {}) {
  const { data } = await sb.auth.getSession();
  if (!data.session) throw new Error("Sign in first.");
  let r;
  try { r = await fetch(FN, { method: "POST", headers: { "Content-Type": "application/json", apikey: KEY, Authorization: "Bearer " + data.session.access_token }, body: JSON.stringify(Object.assign({ action }, body)) }); }
  catch (e) { throw new Error("No connection. Try again when you're online."); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Strava didn't answer. Try again.");
  return j;
}

export async function refreshStatus() {
  if (!signedIn()) { STRAVA = { connected: false, name: null, canPost: false, checked: true }; emit(); return STRAVA; }
  try { STRAVA = Object.assign(await call("status"), { checked: true }); } catch (e) { STRAVA.checked = true; }
  emit(); return STRAVA;
}
export async function connectStrava() { const { url } = await call("start"); location.href = url; }
export async function disconnectStrava() { await call("disconnect"); STRAVA = { connected: false, name: null, canPost: false, checked: true }; setActs({}); emit(); }

// Runs (and walks) from Strava show on their days; Stride's own posts are left out.
export async function importRuns() {
  if (!STRAVA.connected) return;
  try {
    const { activities } = await call("import", { days: 120 });
    const m = {};
    const mmss = m0 => { const t = Math.round(m0 * 60), h = Math.floor(t / 3600), mm = Math.floor(t % 3600 / 60), ss = t % 60; return (h ? `${h}:${String(mm).padStart(2, "0")}` : `${mm}`) + `:${String(ss).padStart(2, "0")}`; };
    for (const a of activities || []) if (!a.stride && RUNS.has(a.type) && a.date) (m[a.date] = m[a.date] || []).push(Object.assign({}, a, {
      moving_time: a.moving_min ? mmss(a.moving_min) : "", pace: a.moving_min && a.distance_mi ? mmss(a.moving_min / a.distance_mi) : "" }));
    setActs(m); emit();
  } catch (e) { /* keep what we had */ }
}

// One finished workout → one Strava activity. Re-finishing updates it; a matching
// watch/Health strength activity gets Stride's details instead of a second post.
export async function postWorkout(w) {
  return call("post", w);
}

let started = false;
export function startStrava(onChange) {
  if (started) return; started = true;
  if (onChange) subs.add(onChange);
  let last = null;
  onAccount(async () => { const id = signedIn() ? "in" : "out"; if (id === last) return; last = id; await refreshStatus(); importRuns(); });
}
