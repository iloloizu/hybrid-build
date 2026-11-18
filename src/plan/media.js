/* ---------- RepDB animations (free preview pack, CC BY-NC 4.0) ----------
   Looping clips + start/finish stills for the exercises the free pack covers. Everything else keeps
   the in-app mannequin. Credit is required: "Exercise data & images: RepDB (https://repdb.co)".
   Non-commercial use only; a paid product would need RepDB's commercial license. */
export const REPDB_CREDIT = "Animation: RepDB (repdb.co), CC BY-NC 4.0";
const REPDB = {
  incline: "incline-db-press", hammer: "cross-body-hammer-curl", inclinecurl: "incline-db-curl",
  pullup: "pull-up", assistpull: "pull-up", dbcurl: "bicep-curl",
  "x-front-squat": "front-squat", "x-reverse-lunge": "barbell-reverse-lunge", "x-core-100-ab-rollouts": "ab-wheel-rollout",
  "x-rowing": "rowing-machine", "x-dumbbell-row": "bent-over-db-row",
};
export function mediaFor(id) {
  const s = REPDB[id]; if (!s) return null;
  return { video: `repdb/${s}.mp4`, start: `repdb/${s}-start.webp`, peak: `repdb/${s}-peak.webp` };
}
