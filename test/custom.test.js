import { describe, it, expect, beforeEach } from "vitest";
import { STORE, sget, sset, setKey } from "../src/storage.js";
import { DAYS } from "../src/plan/plan.js";
import { EX } from "../src/plan/exercises.js";
import { extraSets, addSet, removeSet, totalSets, activeSub, setSub, exFor, similar, subKey } from "../src/plan/custom.js";
import { progress } from "../src/views/common.js";

const MON = 0, bench = DAYS[MON].items[0], incline = DAYS[MON].items[1];
beforeEach(() => { for (const k of Object.keys(STORE)) delete STORE[k]; });

describe("extra sets", () => {
  it("adds and removes sets on top of the plan for that week only", () => {
    expect(totalSets(bench, 1, MON, 0)).toBe(3);
    addSet(1, MON, 0); addSet(1, MON, 0);
    expect(totalSets(bench, 1, MON, 0)).toBe(5);
    expect(totalSets(bench, 2, MON, 0)).toBe(3);
    removeSet(1, MON, 0); removeSet(1, MON, 0); removeSet(1, MON, 0);
    expect(extraSets(1, MON, 0)).toBe(0);
    expect(STORE.w1s0["w1s0|extra-0"]).toBeUndefined();
  });
  it("counts extra sets in the session progress", () => {
    addSet(1, MON, 0); addSet(1, MON, 0);
    for (let s = 0; s < 5; s++) sset(setKey(1, MON, 0, s), { w: "135", r: "8", d: 1 });
    const [done, total] = progress(1, MON);
    expect(done).toBe(5);
    expect(total).toBe(2 + progress(2, MON)[1]); // two more than an untouched week
  });
});

describe("substitutes", () => {
  it("apply from the chosen week onward and can be undone from a later week", () => {
    setSub(3, MON, 1, "machinepress", incline.x);
    expect([1, 2, 3, 4, 10].map(w => exFor(incline, w, MON, 1))).toEqual(["incline", "incline", "machinepress", "machinepress", "machinepress"]);
    setSub(6, MON, 1, incline.x, incline.x);
    expect([5, 6, 9].map(w => exFor(incline, w, MON, 1))).toEqual(["machinepress", "incline", "incline"]);
  });
  it("leaves nothing stored when you switch back in the same week", () => {
    setSub(2, MON, 0, "dbbench", bench.x);
    setSub(2, MON, 0, bench.x, bench.x);
    expect(sget(subKey(2, MON, 0))).toBeUndefined();
    expect(activeSub(5, MON, 0)).toBeNull();
  });
  it("keeps the logs on the planned slot, so sets carry across a swap", () => {
    sset(setKey(1, MON, 0, 0), { w: "135", r: "8", d: 1 });
    setSub(1, MON, 0, "dbbench", bench.x);
    expect(sget(setKey(1, MON, 0, 0))).toEqual({ w: "135", r: "8", d: 1 });
  });
});

describe("similar", () => {
  const top = (id, n = 3) => similar(id).slice(0, n).map(r => r.id);
  it("puts the same movement and muscles first", () => {
    expect(top("incline")).toEqual(expect.arrayContaining(["smithincline", "machinepress"]));
    expect(top("bench", 1)).toEqual(["dbbench"]);
    expect(top("ezcurl", 2).sort()).toEqual(["cablecurl", "dbcurl"]);
    expect(top("pullup", 1)).toEqual(["assistpull"]);
    expect(top("csrow", 3)).toContain("rowmachine");
  });
  it("keeps arms with arms", () => {
    for (const id of ["ezcurl", "pushdown", "ohext"]) for (const r of similar(id).slice(0, 3)) expect(EX[r.id].muscles.join(" "), id).toMatch(/biceps|triceps|brachialis/i);
  });
  it("lists every other exercise", () => {
    expect(similar("bench").length).toBe(Object.keys(EX).filter(k => !EX[k].noSub).length - 1);
  });
});
