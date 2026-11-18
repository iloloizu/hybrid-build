import { describe, it, expect } from "vitest";
import { tweenJ, solve, NF } from "../src/figure/engine.js";
import { EX } from "../src/plan/exercises.js";

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const pose = (e, P) => solve(Object.assign({ v: e.v }, P));
const entries = Object.entries(EX);

describe("tweenJ", () => {
  it("lands on the authored start and finish poses for every exercise", () => {
    for (const [id, e] of entries) for (const [k, P] of [[0, e.A], [1, e.B]]) {
      const T = tweenJ(e, k), S = pose(e, P);
      expect(Object.keys(T).sort(), id).toEqual(Object.keys(S).sort());
      for (const j in S) expect(dist(T[j], S[j]), `${id} k=${k} ${j}`).toBeLessThan(0.5);
    }
  });
  it("keeps limbs within their start/finish lengths mid-rep", () => {
    const limbs = [["sh", "el"], ["el", "ha"], ["hip", "kn"], ["kn", "an"]];
    for (const [id, e] of entries) {
      const A = pose(e, e.A), B = pose(e, e.B), M = tweenJ(e, 0.5);
      for (const S of Object.keys(A).filter(j => /^sh/.test(j)).map(j => j.slice(2))) for (const [p, q] of limbs) {
        const pj = p === "sh" && !A["sh" + S] ? "neck" : p + S, qj = q + S;
        if (!A[pj] || !A[qj] || !M[pj] || !M[qj]) continue;
        const lo = Math.min(dist(A[pj], A[qj]), dist(B[pj], B[qj])), hi = Math.max(dist(A[pj], A[qj]), dist(B[pj], B[qj]));
        const m = dist(M[pj], M[qj]);
        expect(m, `${id} ${pj}-${qj}`).toBeGreaterThan(lo - 0.5);
        expect(m, `${id} ${pj}-${qj}`).toBeLessThan(hi + 0.5);
      }
    }
  });
  // Known issue carried over from the prototype: in these exercises the elbow snaps
  // to the other IK solution for one frame (1-2 px moves, then a 25-55 px jump).
  // Step 1 keeps behavior identical, so this pins the list; a tweenJ fix should empty it.
  // (dbohext, machineshoulder and smithincline reuse the poses of ohext, dbpress and incline.)
  const KNOWN_ELBOW_SNAPS = ["broadjump", "cablecrunch", "dbohext", "dbpress", "facepull", "incline", "latdb", "machinepress", "machineshoulder", "ohext", "ohrope", "pecfly", "revpec", "smithincline", "vup", "yraise"];
  it("moves smoothly frame to frame, apart from the known elbow snaps", () => {
    const snaps = new Set();
    for (const [id, e] of entries) {
      let prev = tweenJ(e, 0);
      for (let i = 1; i < NF; i++) {
        const cur = tweenJ(e, i / (NF - 1));
        for (const j in cur) if (dist(cur[j], prev[j]) >= 20) { expect(j, `${id} frame ${i}`).toMatch(/^el/); snaps.add(id); }
        prev = cur;
      }
    }
    expect([...snaps].sort()).toEqual(KNOWN_ELBOW_SNAPS);
  });
  it("caches the solved endpoints on the exercise", () => {
    const e = EX.bench;
    tweenJ(e, 0.3); const c = e._tw;
    tweenJ(e, 0.7);
    expect(e._tw).toBe(c);
  });
});
