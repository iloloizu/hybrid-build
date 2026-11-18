import { EX } from "../plan/exercises.js";
import { importPlan } from "./index.js";

/* ---------- AI import: PDFs and screenshots → a plan, using Claude in the Claude app ----------
   Runs where the page is opened inside Claude (the `sample` capability: the viewer's own Claude
   plan, asked for consent once). No API key, no server. Elsewhere it reports unavailable. */

let samplePromise = null;
export function aiSample() {
  if (!samplePromise) samplePromise = (window.claude && window.claude.use ? window.claude.use("sample").catch(() => null) : Promise.resolve(null));
  return samplePromise;
}
export async function aiLimits() { const s = await aiSample(); if (!s) return null; try { return await s.limits(); } catch (e) { return null; } }

// pdf.js loads only when a PDF is picked (keeps the app small and offline-first).
const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
function loadScript(src) { return new Promise((ok, bad) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => bad(new Error("Couldn't load the PDF reader")); document.head.appendChild(s); }); }
async function pdfjs() {
  if (!window.pdfjsLib) { await loadScript(PDFJS + "pdf.min.js"); await loadScript(PDFJS + "pdf.worker.min.js"); } // worker runs in-page
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js";
  return window.pdfjsLib;
}
// A PDF's text (all pages) and page images (up to `maxImages`), images only where text is thin (scans).
async function readPdf(file, maxImages, onStep) {
  const lib = await pdfjs(), doc = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = ""; const images = [];
  for (let n = 1; n <= doc.numPages; n++) {
    onStep && onStep(`Reading ${file.name}, page ${n} of ${doc.numPages}`);
    const page = await doc.getPage(n), tc = await page.getTextContent();
    const pageText = tc.items.map(i => i.str).join(" ").replace(/\s+/g, " ").trim();
    text += `\n--- ${file.name} p.${n} ---\n${pageText}`;
    if (images.length < maxImages) { // always send pages as images too: PDF text is often garbled by embedded fonts
      const vp = page.getViewport({ scale: 2 }), c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height;
      await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
      images.push(await new Promise(r => c.toBlob(r, "image/jpeg", 0.85)));
    }
  }
  return { text, images };
}

function prompt(text, nImages, hint) {
  const lib = Object.keys(EX).filter(k => !EX[k].fromPlan).map(k => `${k}: ${EX[k].name}`).join("\n");
  return `You turn workout programs into a structured plan for a workout app. ${nImages ? `${nImages} image(s) of the program are attached (screenshots or scanned pages).` : ""}${text ? " Extracted document text is below." : ""}
${hint ? `The person says: ${hint}\n` : ""}
Reply with ONLY one JSON object:
{"name": string, "by": string (coach or source, "" if unknown), "blurb": one sentence, "note": one sentence about anything assumed, "weeks": number,
 "phases": [{"from": firstWeek, "to": lastWeek, "name": string, "rule": short intensity rule or "",
   "days": [7 entries Monday→Sunday, each null for rest or {"name": short session name or "", "exercises": [lines]}]}]}
Each exercise line is: Name | ref | muscles | doses | flags
- Name: as written in the program (keep coach notes out of it).
- ref: "=<id>" if it is the same exercise as a library id below, else "~<id>" of the closest-looking library exercise.
- muscles: comma list (primary first) only when ref starts with "~", e.g. "Upper back, Lats".
- doses: one per week of the phase separated by ";" (last repeats): "<sets>x<reps>" with optional " @<target or note>", e.g. "5x4 @78% · 124", "3x8ea" (per side), "3x20,15,10", "4x25 yd", "1x15 min".
- flags (optional, space separated): main (main lift), core, cardio, opt (optional).
Rules: copy sets, reps, percentages and printed target weights exactly; ignore handwriting that logs what was lifted. If sets or reps are missing, use 3x10 and say so in "note". Map days to weekdays in order if the program says Day 1, Day 2...; keep rest days null. Never invent exercises.
Library ids:
${lib}
${text ? `\nDocument text:\n${text.slice(0, 120000)}` : ""}`;
}

// files: File[] (PDFs and images). Returns the saved plan.
export async function aiImport(files, { hint = "", onStep, signal } = {}) {
  const sample = await aiSample(); if (!sample) throw { code: "unavailable" };
  const lim = await aiLimits(), maxImg = (lim && lim.images && lim.images.maxCount) || 0;
  let text = "", images = [];
  for (const f of files) {
    if (/pdf$/i.test(f.type) || /\.pdf$/i.test(f.name)) { const r = await readPdf(f, Math.max(0, maxImg - images.length), onStep); text += r.text; images = images.concat(r.images); }
    else if (/^image\//.test(f.type)) { if (images.length < maxImg) images.push(f); }
  }
  if (!text.trim() && !images.length) throw { code: "nothing", message: maxImg ? "No readable pages or images" : "Images can't be sent from this view" };
  onStep && onStep("Claude is reading your plan…");
  const plan = await sample.json(prompt(text, images.length, hint), { images: images.length ? images : undefined, modelTier: "default", signal, onText: () => onStep && onStep("Writing the plan…") });
  return importPlan(JSON.stringify(plan));
}

// Error codes → short copy for the person.
export function aiErrorCopy(e) {
  const c = e && e.code;
  return { unavailable: "AI import works when Hybrid Build is open inside the Claude app.", not_granted: "Claude wasn't allowed for this page.", rate_limited: "Claude is busy or you've hit a usage limit. Try again in a bit.", invalid_json: "Claude's answer wasn't a plan. Try again or add a hint.", image_rejected: "One of the files couldn't be read. Try a different one.", cancelled: "Stopped.", refused: "Claude couldn't read that. Try different files." }[c] || (e && e.message) || "Something went wrong. Try again.";
}
