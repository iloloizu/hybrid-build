import { go, back } from "../router.js";
import { topbar } from "../ui/topbar.js";
import { toast } from "../ui/toast.js";
import { store } from "../platform/index.js";
import { esc } from "./common.js";
import { USER, PROFILE, RECOVERY, signedIn, displayName, initial, signUp, signIn, sendReset, setPassword, signOut, saveProfile } from "../account.js";

const app = () => document.getElementById("app");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const welcomed = () => store.get("hb-welcomed") === "1";
// A saved Supabase session means this device is (or was just) signed in.
export const hasSession = () => { try { return Object.keys(localStorage).some(k => /^sb-.*-auth-token$/.test(k)); } catch (e) { return false; } };

/* ---------- first open: create an account or carry on without one ---------- */
export function renderWelcome() {
  const a = app(); a.className = "wrap acct welcome";
  document.body.classList.add("bare");
  a.innerHTML = `<div class="wl-hue"></div>
    <header class="wl-head"><span class="kick">Hybrid Build</span><h1>Lift. Run. Track it all.</h1>
      <p>Pick a plan, log every set, and pick up where you left off on any device.</p></header>
    <div class="wl-acts">
      <button class="bigbtn" id="wl-up">Create account</button>
      <button class="bigbtn ghost" id="wl-in">Sign in</button>
      <button class="textbtn center" id="wl-skip">Not now</button>
    </div>`;
  const done = () => store.set("hb-welcomed", "1");
  document.getElementById("wl-up").onclick = () => { done(); go("#/signup", { replace: true }); };
  document.getElementById("wl-in").onclick = () => { done(); go("#/signin", { replace: true }); };
  document.getElementById("wl-skip").onclick = () => { done(); go("#/today", { replace: true }); };
}

/* ---------- sign up / sign in / forgot password ---------- */
export function renderAuth(mode) {
  if (signedIn() && !RECOVERY) { go("#/profile", { replace: true }); return; }
  const a = app(); a.className = "wrap acct";
  const up = mode === "signup", reset = mode === "reset";
  if (RECOVERY) return renderNewPassword();
  const title = up ? "Create account" : reset ? "Reset password" : "Sign in";
  a.innerHTML = topbar({ title, back: { label: "Back" } }) + `
    <form class="acct-form" id="af" novalidate>
      ${up ? `<label class="af"><span>Name</span><input name="name" autocomplete="given-name" maxlength="40" placeholder="What should we call you?"></label>` : ""}
      <label class="af"><span>Email</span><input name="email" type="email" autocomplete="email" inputmode="email" required placeholder="you@example.com"></label>
      ${reset ? "" : `<label class="af"><span>Password</span><input name="password" type="password" autocomplete="${up ? "new-password" : "current-password"}" minlength="6" required placeholder="${up ? "At least 6 characters" : ""}"></label>`}
      <p class="af-err" id="af-err" role="alert"></p>
      <button class="bigbtn" type="submit">${up ? "Create account" : reset ? "Send reset link" : "Sign in"}</button>
      ${up ? `<p class="af-note">Your workouts on this device move into your account.</p>` : ""}
    </form>
    <div class="af-alt">
      ${up ? `<span>Have an account?</span><a href="#/signin" data-sw="signin">Sign in</a>` : reset ? `<a href="#/signin" data-sw="signin">Back to sign in</a>` : `<span>New here?</span><a href="#/signup" data-sw="signup">Create account</a><a href="#/reset" data-sw="reset">Forgot password?</a>`}
    </div>`;
  document.getElementById("tb-back").onclick = () => back("#/settings");
  a.querySelectorAll("[data-sw]").forEach(l => l.onclick = e => { e.preventDefault(); go("#/" + l.dataset.sw, { replace: true }); });
  const f = document.getElementById("af"), err = document.getElementById("af-err"), btn = f.querySelector("button[type=submit]");
  f.onsubmit = async e => {
    e.preventDefault(); err.textContent = "";
    const email = f.email.value.trim(), pw = f.password ? f.password.value : "", name = f.name ? f.name.value.trim() : "";
    if (!EMAIL_RE.test(email)) { err.textContent = "Enter a valid email."; f.email.focus(); return; }
    if (!reset && pw.length < 6) { err.textContent = "Password needs at least 6 characters."; f.password.focus(); return; }
    btn.disabled = true; const label = btn.textContent; btn.textContent = "One sec…";
    try {
      if (up) {
        const r = await signUp(email, pw, name);
        if (r.confirm) { renderCheckEmail(email, "confirm"); return; }
        toast("Account created."); go("#/profile", { replace: true });
      } else if (reset) { await sendReset(email); renderCheckEmail(email, "reset"); return; }
      else { await signIn(email, pw); toast(`Signed in. Welcome back.`); go("#/today", { replace: true }); }
    } catch (x) { err.textContent = x.message; }
    btn.disabled = false; btn.textContent = label;
  };
}
function renderCheckEmail(email, kind) {
  app().innerHTML = topbar({ title: "Check your email", back: { label: "Back" } }) + `<section class="acct-msg"><h2>Check your email</h2>
    <p>We sent a ${kind === "reset" ? "reset" : "confirmation"} link to <b>${esc(email)}</b>. Open it on this device to ${kind === "reset" ? "set a new password" : "finish creating your account"}.</p>
    <p class="muted">Nothing there? Check spam, or try again in a minute.</p>
    <button class="bigbtn ghost" id="ce-ok">Back to sign in</button></section>`;
  document.getElementById("tb-back").onclick = () => back("#/settings");
  document.getElementById("ce-ok").onclick = () => go("#/signin", { replace: true });
}
function renderNewPassword() {
  app().innerHTML = topbar({ title: "New password" }) + `<form class="acct-form" id="np" novalidate>
    <label class="af"><span>New password</span><input name="password" type="password" autocomplete="new-password" minlength="6" required></label>
    <p class="af-err" id="np-err" role="alert"></p><button class="bigbtn" type="submit">Save password</button></form>`;
  const f = document.getElementById("np");
  f.onsubmit = async e => {
    e.preventDefault(); const pw = f.password.value;
    if (pw.length < 6) { document.getElementById("np-err").textContent = "At least 6 characters."; return; }
    try { await setPassword(pw); toast("Password saved."); go("#/today", { replace: true }); } catch (x) { document.getElementById("np-err").textContent = x.message; }
  };
}

/* ---------- profile ---------- */
export function renderProfile() {
  if (RECOVERY) return renderAuth("signin");
  if (!signedIn()) {
    if (hasSession()) { app().innerHTML = topbar({ title: "Profile", back: { label: "Back" } }) + `<p class="muted center">Loading…</p>`; document.getElementById("tb-back").onclick = () => back("#/settings"); return; }
    go("#/signin", { replace: true }); return;
  }
  const a = app(); a.className = "wrap acct";
  const since = USER.created_at ? new Date(USER.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "";
  a.innerHTML = topbar({ title: "Profile", back: { label: "Back" } }) + `
    <section class="pf-card"><span class="avatar big">${esc(initial())}</span><div><b>${esc(displayName())}</b><span>${esc(USER.email || "")}</span>${since ? `<small>Member since ${since}</small>` : ""}</div></section>
    <form class="acct-form" id="pf" novalidate>
      <label class="af"><span>Name</span><input name="display_name" maxlength="40" value="${esc((PROFILE && PROFILE.display_name) || "")}" autocomplete="given-name"></label>
      <label class="af"><span>Goal</span><input name="goal" maxlength="120" value="${esc((PROFILE && PROFILE.goal) || "")}" placeholder="e.g. Sub-25 5K and a 315 deadlift"></label>
      <p class="af-err" id="pf-err" role="alert"></p>
      <button class="bigbtn" type="submit">Save</button>
    </form>
    <div class="lbl">Account</div>
    <section class="pf-rows">
      <div class="pf-row"><span>Sync</span><b class="ok"><i></i>Workouts saved to your account</b></div>
      <button class="pf-row" id="pf-pw"><span>Change password</span></button>
      <button class="pf-row danger" id="pf-out"><span>Sign out</span></button>
    </section>
    <p class="af-note">To delete your account and data, email <a href="mailto:iloloizu97@gmail.com?subject=Delete%20my%20Hybrid%20Build%20account">iloloizu97@gmail.com</a>.</p>`;
  document.getElementById("tb-back").onclick = () => back("#/settings");
  const f = document.getElementById("pf");
  f.onsubmit = async e => {
    e.preventDefault(); const b = f.querySelector("button"); b.disabled = true;
    try { await saveProfile({ display_name: f.display_name.value, goal: f.goal.value }); toast("Saved."); }
    catch (x) { document.getElementById("pf-err").textContent = x.message; }
    b.disabled = false;
  };
  document.getElementById("pf-pw").onclick = () => { renderNewPassword(); };
  document.getElementById("pf-out").onclick = async () => { await signOut(); toast("Signed out."); go("#/welcome", { replace: true }); };
}

/* ---------- small account card for Settings ---------- */
export function accountCard() {
  if (signedIn()) return `<a class="pf-card link" href="#/profile"><span class="avatar">${esc(initial())}</span><div><b>${esc(displayName())}</b><span>${esc(USER.email || "")}</span></div><i class="chev">›</i></a>`;
  return `<section class="pf-card cta"><div><b>Create your account</b><span>Save your workouts and pick them up on any device.</span></div>
    <div class="pf-acts"><a class="bigbtn" href="#/signup">Create account</a><a class="bigbtn ghost" href="#/signin">Sign in</a></div></section>`;
}
export function avatarBtn() {
  return `<a class="avatar-btn" href="${signedIn() ? "#/profile" : "#/signin"}" aria-label="${signedIn() ? "Profile" : "Sign in"}"><span class="avatar sm">${signedIn() ? esc(initial()) : "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'><circle cx='12' cy='8' r='4'/><path d='M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6'/></svg>"}</span></a>`;
}
