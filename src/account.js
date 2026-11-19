/* ---------- accounts: Supabase auth + per-user sync of the local store ----------
   The app stays local-first: everything is saved on the device, then copied to the
   signed-in user's rows (user_docs, protected by row-level security). The key below is
   the project's publishable key, which is meant to ship in client code. */
import { createClient } from "@supabase/supabase-js";
import { STORE, persistLocal, useRemote, dirty, flush } from "./storage.js";
import { store } from "./platform/index.js";

const URL_ = "https://filqlpwpdfuzazpusgok.supabase.co";
const KEY = "sb_publishable_phMJjS_0kzHHGnL93uMUNQ_U_zsPT1G";
export const APP_URL = "https://iloloizu.github.io/hybrid-build/";
const here = () => (typeof location !== "undefined" && location.protocol.startsWith("http") ? location.origin + location.pathname : APP_URL);

export const sb = typeof window !== "undefined" ? createClient(URL_, KEY, { auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;

export let USER = null, PROFILE = null, RECOVERY = false;
const subs = new Set();
export const onAccount = fn => { subs.add(fn); return () => subs.delete(fn); };
const emit = () => subs.forEach(f => { try { f(); } catch (e) {} });

export const signedIn = () => !!USER;
export const displayName = () => (PROFILE && PROFILE.display_name) || (USER && USER.email ? USER.email.split("@")[0] : "");
export const initial = () => (displayName()[0] || "?").toUpperCase();

const msg = e => {
  const m = (e && e.message) || String(e || "Something went wrong");
  if (/invalid login/i.test(m)) return "Wrong email or password.";
  if (/already registered/i.test(m)) return "That email already has an account. Sign in instead.";
  if (/email not confirmed/i.test(m)) return "Confirm your email first. Check your inbox.";
  if (/password should be/i.test(m)) return "Password needs at least 6 characters.";
  if (/rate limit/i.test(m)) return "Too many tries. Wait a minute and try again.";
  if (/fetch|network/i.test(m)) return "No connection. Try again when you're online.";
  return m;
};
const run = async p => { const { data, error } = await p; if (error) throw new Error(msg(error)); return data; };

export async function signUp(email, password, name) {
  const d = await run(sb.auth.signUp({ email, password, options: { data: { display_name: name || null }, emailRedirectTo: here() } }));
  return { confirm: !d.session };
}
export const signIn = (email, password) => run(sb.auth.signInWithPassword({ email, password }));
export const sendReset = email => run(sb.auth.resetPasswordForEmail(email, { redirectTo: here() }));
export async function setPassword(password) { await run(sb.auth.updateUser({ password })); RECOVERY = false; emit(); }
export async function signOut() {
  await flush();
  await sb.auth.signOut().catch(() => {});
  // This device's copy belonged to that account; start clean for whoever is next.
  for (const k of Object.keys(STORE)) delete STORE[k];
  persistLocal(); store.set("hb-welcomed", "");
}
export async function saveProfile(p) {
  const row = { display_name: (p.display_name || "").trim().slice(0, 40) || null, goal: (p.goal || "").trim().slice(0, 120) || null, updated_at: new Date().toISOString() };
  PROFILE = Object.assign({}, PROFILE, await run(sb.from("profiles").update(row).eq("id", USER.id).select().single()));
  emit();
}

/* ---------- sync ---------- */
const remote = {
  async put(doc, v) {
    if (!USER) throw new Error("signed out");
    const { error } = await sb.from("user_docs").upsert({ user_id: USER.id, doc, v, updated_at: new Date().toISOString() }, { onConflict: "user_id,doc" });
    if (error) throw error;
  },
  async del(doc) { if (USER) await sb.from("user_docs").delete().eq("user_id", USER.id).eq("doc", doc); },
};
// Remote wins for docs it has; docs only on this device get uploaded.
async function pull() {
  if (!USER) return;
  const { data, error } = await sb.from("user_docs").select("doc,v");
  if (error) return;
  const seen = new Set();
  for (const r of data || []) { seen.add(r.doc); if (!dirty.has(r.doc) && r.v && typeof r.v === "object") STORE[r.doc] = Object.assign({}, r.v); }
  for (const k of Object.keys(STORE)) if (!seen.has(k)) dirty.add(k);
  persistLocal(); flush(); emit();
}
async function loadProfile() {
  if (!USER) { PROFILE = null; return; }
  const { data } = await sb.from("profiles").select("*").eq("id", USER.id).maybeSingle();
  PROFILE = data || null;
}

let started = false;
export function startAccount(onChange) {
  if (!sb || started) return; started = true;
  if (onChange) subs.add(onChange);
  sb.auth.onAuthStateChange((event, session) => {
    const was = USER && USER.id;
    USER = session ? session.user : null;
    if (event === "PASSWORD_RECOVERY") RECOVERY = true;
    useRemote(USER ? remote : null);
    // Drop ?code=… left by an email link.
    if (/[?&]code=/.test(location.search)) history.replaceState(history.state, "", location.pathname + location.hash);
    if (USER && USER.id !== was) setTimeout(async () => { await loadProfile(); await pull(); emit(); }, 0);
    else emit();
  });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && USER) pull(); });
}
