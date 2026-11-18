import { describe, it, expect } from "vitest";
import { importPlan, cleanText, planById, sessionsOf } from "../src/plans/index.js";
import { EX } from "../src/plan/exercises.js";

const plan = over => JSON.stringify(Object.assign({ name: "Test Plan", weeks: 2, phases: [{ from: 1, to: 2, name: "P", days: [{ name: "Day", exercises: ["Bench | =bench | | 3x10"] }] }] }, over));

describe("imported plans are plain, bounded text", () => {
  it("strips markup from every field", () => {
    const p = importPlan(plan({ name: "<img src=x onerror=alert(1)>Evil", blurb: "<script>alert(1)</script>", phases: [{ from: 1, to: 1, name: "<b>x</b>", days: [{ name: "<svg onload=alert(1)>", exercises: ["<img src=x onerror=alert(2)> Curl | ~ezcurl | Biceps<script> | 3x10 @<b>"] }] }] }));
    const all = JSON.stringify(p) + JSON.stringify(sessionsOf(p.id, 1)) + JSON.stringify(Object.values(EX).filter(e => e.fromPlan === p.name).map(e => [e.name, e.muscles]));
    expect(all).not.toMatch(/[<>]/);
  });
  it("forces unknown exercise refs to a library animation", () => {
    const p = importPlan(plan({ phases: [{ from: 1, to: 1, days: [{ exercises: ["Thing | javascript:alert(1) | Abs | 3x10", "Other | =__proto__ | | 3x10"] }] }] }));
    const S = sessionsOf(p.id, 1)[0];
    expect(S.items.every(it => EX[it.x])).toBe(true);
    expect(Object.prototype.polluted).toBeUndefined();
  });
  it("rejects oversized or empty plans", () => {
    expect(() => importPlan("x".repeat(400000))).toThrow(/too large/);
    expect(() => importPlan(plan({ phases: [{ from: 1, to: 1, days: [null, null] }] }))).toThrow(/No exercises/);
    expect(() => importPlan("[1,2]")).toThrow();
  });
  it("bounds weeks, phases and lines", () => {
    const lines = Array.from({ length: 200 }, (_, i) => `Ex ${i} | =bench | | 3x10`);
    const p = importPlan(plan({ weeks: 9999, phases: Array.from({ length: 50 }, (_, k) => ({ from: k + 1, to: k + 1, days: [{ exercises: lines }] })) }));
    expect(p.weeks).toBeLessThanOrEqual(52);
    expect(planById(p.id).phases.length).toBeLessThanOrEqual(20);
    expect(sessionsOf(p.id, 1)[0].items.length).toBeLessThanOrEqual(40);
  });
  it("cleanText removes control characters and markup", () => {
    const t = cleanText("a\u0000<b>c</b>`d`\\e", 50); expect(t).not.toMatch(/[\u0000<>`\\]/); expect(t).toContain("c");
  });
});
