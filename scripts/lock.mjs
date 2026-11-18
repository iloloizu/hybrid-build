// Password-locks the built app for static hosting (GitHub Pages).
// Encrypts dist/index.html with AES-GCM (key from PBKDF2-SHA256, 600k rounds) and
// replaces it with a small unlock page. The right password decrypts it in the
// browser; the key is then remembered on that device so the app opens offline.
// Usage: PAGE_PASSWORD=... node scripts/lock.mjs [distDir]
import fs from "node:fs";
import path from "node:path";
import { webcrypto as crypto } from "node:crypto";

const dir = process.argv[2] || "dist";
const pass = process.env.PAGE_PASSWORD;
if (!pass || pass.length < 10) { console.error("PAGE_PASSWORD missing or shorter than 10 characters; refusing to publish an unlocked page."); process.exit(1); }

const ITER = 600000;
const b64 = u8 => Buffer.from(u8).toString("base64");
const file = path.join(dir, "index.html");
const html = fs.readFileSync(file, "utf8");
const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(html)));

// Keep the original <head> metadata (manifest, icons, theme) so the locked page still installs.
const keepHead = (html.match(/<meta[^>]+>|<link rel="(manifest|icon|apple-touch-icon)"[^>]*>/g) || []).filter(t => !/charset/i.test(t)).join("\n");
const out = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Hybrid Build</title>
${keepHead}
<meta name="robots" content="noindex, nofollow">
<style>
:root { --bg: #0b0b0c; --card: #151517; --ink: #f3efe6; --muted: #8b877e; --line: #29292c; --accent: #ff5b1f; }
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; background: var(--bg); color: var(--ink); font: 600 15px/1.4 system-ui, -apple-system, sans-serif; }
main { max-width: 420px; margin: 0 auto; padding: max(18vh, 60px) 16px 40px; display: grid; gap: 18px; }
.mark { font: 900 13px system-ui, sans-serif; letter-spacing: .18em; text-transform: uppercase; }
.mark b { color: var(--accent); }
h1 { margin: 0; font: 900 44px/0.95 Impact, "Anton", system-ui, sans-serif; text-transform: uppercase; letter-spacing: .01em; }
form { display: grid; gap: 10px; }
input { width: 100%; padding: 14px; border-radius: 10px; border: 1px solid var(--line); background: var(--card); color: var(--ink); font: inherit; font-size: 16px; }
input:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
button { padding: 14px; border: 0; border-radius: 10px; background: var(--accent); color: var(--bg); font: 900 13px system-ui, sans-serif; letter-spacing: .12em; text-transform: uppercase; cursor: pointer; }
button:disabled { opacity: .6; }
.err { min-height: 1.4em; color: var(--accent); font-size: 13px; }
</style>
</head>
<body>
<main id="lock" hidden>
  <div class="mark">HYBRID <b>BUILD</b></div>
  <h1>Locked</h1>
  <form id="f"><input id="p" type="password" autocomplete="current-password" placeholder="Password" aria-label="Password" required><button id="go">Unlock</button><div class="err" id="e" role="alert"></div></form>
</main>
<script>
(() => {
  const D = { s: "${b64(salt)}", i: "${b64(iv)}", c: "${b64(ct)}", n: ${ITER} };
  const KEY = "hb-lock-" + D.s;
  const u8 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const show = html => { document.open(); document.write(html); document.close(); };
  async function open(raw) {
    const k = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: u8(D.i) }, k, u8(D.c)));
  }
  async function fromPassword(pw) {
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
    const k = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: u8(D.s), iterations: D.n, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, true, ["decrypt"]);
    return new Uint8Array(await crypto.subtle.exportKey("raw", k));
  }
  const lock = document.getElementById("lock");
  (async () => {
    let saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved) { try { return show(await open(u8(saved))); } catch (e) { try { localStorage.removeItem(KEY); } catch (e2) {} } }
    lock.hidden = false; document.getElementById("p").focus();
  })();
  document.getElementById("f").onsubmit = async ev => {
    ev.preventDefault();
    const go = document.getElementById("go"), err = document.getElementById("e");
    go.disabled = true; go.textContent = "Unlocking…"; err.textContent = "";
    try {
      const raw = await fromPassword(document.getElementById("p").value);
      const html = await open(raw);
      try { for (const k of Object.keys(localStorage)) if (k.startsWith("hb-lock-")) localStorage.removeItem(k); localStorage.setItem(KEY, btoa(String.fromCharCode(...raw))); } catch (e) {}
      show(html);
    } catch (e) { err.textContent = "Wrong password."; go.disabled = false; go.textContent = "Unlock"; }
  };
})();
</script>
</body>
</html>
`;
fs.writeFileSync(file, out);
console.log(`Locked ${file} (${(out.length / 1024).toFixed(0)} KB)`);
