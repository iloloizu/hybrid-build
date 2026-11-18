import { describe, it, expect } from "vitest";
import { dose, phaseOf, phaseName, DAYS } from "../src/plan/plan.js";

const item = (day, x) => DAYS.find(d => d.name === day).items.find(it => it.x === x);
const bench = item("Press Conference", "bench");
const pullup = item("Wingspan", "pullup");
const trapbar = item("Hinge Benefits", "trapbar");
const atg = item("Knee Deep", "atg");
const jefferson = item("Hinge Benefits", "jefferson");
const boxjump = item("Knee Deep", "boxjump");
const vup = item("Boulder Dash", "vup");
const latraise = item("Press Conference", "latraise"); // priority accessory, 3×15
const pecfly = item("Press Conference", "pecfly");     // regular accessory, 2×12-15

describe("phases", () => {
  it("maps weeks to the block's phases", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(phaseOf)).toEqual(["re", "re", "build", "cut", "heavy", "heavy", "heavy", "cut", "peak", "test"]);
    expect([1, 3, 4, 5, 8, 9, 10].map(phaseName)).toEqual(["Rust Off", "Ignition", "Pit Stop", "Project Get Big", "Pit Stop II", "Han Swolo Returns", "Moment of Truth"]);
  });
});

describe("dose: main lifts", () => {
  it("follows the MAIN table per phase", () => {
    expect(dose(bench, 1)).toEqual({ s: 3, r: "8", note: "" });
    expect(dose(bench, 3)).toEqual({ s: 4, r: "6-8", note: "" });
    expect(dose(bench, 6)).toEqual({ s: 4, r: "5-6", note: "" });
    expect(dose(bench, 9)).toEqual({ s: 5, r: "3-4", note: "" });
    expect(dose(bench, 10)).toEqual({ s: 3, r: "to 3RM", note: "" });
  });
  it("deloads to 2 sets at Ignition reps in both Pit Stops", () => {
    expect(dose(bench, 4)).toEqual({ s: 2, r: "6-8", note: "deload" });
    expect(dose(bench, 8)).toEqual({ s: 2, r: "6-8", note: "deload" });
  });
  it("adds load notes to pull-ups after Rust Off", () => {
    expect(dose(pullup, 1).note).toBe("");
    expect(dose(pullup, 3).note).toBe("+10 lb");
    expect(dose(pullup, 5).note).toBe("add weight");
    expect(dose(pullup, 4).note).toBe("deload");
  });
  it("drops the trap bar in test week", () => {
    expect(dose(trapbar, 10)).toBeNull();
  });
});

describe("dose: knees-over-toes work", () => {
  it("progresses through early, middle and late bands", () => {
    expect(dose(atg, 1)).toEqual({ s: 2, r: "8", note: "" });
    expect(dose(atg, 5)).toEqual({ s: 3, r: "6", note: "" });
    expect(dose(atg, 9)).toEqual({ s: 3, r: "5", note: "" });
  });
  it("deloads to the early-band reps", () => {
    expect(dose(atg, 4)).toEqual({ s: 2, r: "8", note: "deload" });
    expect(dose(atg, 8)).toEqual({ s: 2, r: "8", note: "deload" });
  });
  it("shows the Jefferson curl load for the band", () => {
    expect([1, 5, 9].map(w => dose(jefferson, w).note)).toEqual(["25 lb", "35 lb", "45 lb"]);
  });
  it("is in every lifting session except the upper days' plan items", () => {
    const kot = ["atg", "nordic", "slant", "tib", "soleus", "jefferson"];
    expect(DAYS.filter(d => d.items.some(it => kot.includes(it.p))).map(d => d.name)).toEqual(["Knee Deep", "Hinge Benefits"]);
  });
});

describe("dose: plyos, fixed and accessories", () => {
  it("adds a plyo set in heavy and peak weeks and drops plyos in deload and test weeks", () => {
    expect(dose(boxjump, 1)).toEqual({ s: 4, r: "3", note: "if pain-free" });
    expect(dose(boxjump, 6).s).toBe(5);
    expect(dose(boxjump, 9).s).toBe(5);
    expect(dose(boxjump, 4)).toBeNull();
    expect(dose(boxjump, 10)).toBeNull();
  });
  it("keeps fixed items fixed, with one round in deload and test weeks", () => {
    expect(dose(vup, 5)).toEqual({ s: 2, r: "1 round", note: "" });
    expect(dose(vup, 4).s).toBe(1);
    expect(dose(vup, 10).s).toBe(1);
  });
  it("gives priority accessories an extra set in heavy weeks", () => {
    expect(dose(latraise, 6)).toEqual({ s: 4, r: "15", note: "last set: fail + partials" });
    expect(dose(pecfly, 6)).toEqual({ s: 3, r: "12-15", note: "last set: fail + partials" });
  });
  it("uses the item's own sets in Rust Off and the phase sets after", () => {
    expect([1, 3, 4, 9, 10].map(w => dose(pecfly, w).s)).toEqual([2, 3, 2, 3, 2]);
    expect(dose(pecfly, 3).note).toBe("last set to failure");
    expect(dose(pecfly, 1).note).toBe("");
  });
  it("returns a dose for every item in every week except the documented drops", () => {
    for (let w = 1; w <= 10; w++) for (const d of DAYS) for (const it of d.items) {
      const ds = dose(it, w);
      if (ds === null) expect(it === trapbar && w === 10 || it.p === "plyo" && (w === 4 || w === 8 || w === 10)).toBe(true);
      else expect(ds.s).toBeGreaterThan(0);
    }
  });
});
