import { describe, it, expect, beforeEach } from "vitest";
import { STORE, sget, sset, setKey, schedKey, backupJSON, restoreJSON } from "../src/storage.js";

beforeEach(() => { for (const k of Object.keys(STORE)) delete STORE[k]; });

describe("backup and restore", () => {
  it("round-trips every log and schedule change", () => {
    sset(setKey(1, 0, 0, 0), { w: "135", r: "8", d: 1 });
    sset(schedKey(1), [-1, 0, 1, 2, 3, 4, 6]);
    const file = backupJSON();
    for (const k of Object.keys(STORE)) delete STORE[k];
    expect(restoreJSON(file)).toBe(2);
    expect(sget(setKey(1, 0, 0, 0))).toEqual({ w: "135", r: "8", d: 1 });
    expect(sget(schedKey(1))).toEqual([-1, 0, 1, 2, 3, 4, 6]);
  });
  it("replaces what is on the phone", () => {
    sset(setKey(2, 1, 0, 0), { w: "200" });
    restoreJSON(JSON.stringify({ app: "hybrid-build", v: 1, data: { w1s0: { "w1s0|0-0": { w: "95" } } } }));
    expect(sget(setKey(2, 1, 0, 0))).toBeUndefined();
    expect(sget(setKey(1, 0, 0, 0))).toEqual({ w: "95" });
  });
  it("rejects files that are not backups and leaves data alone", () => {
    sset(setKey(1, 0, 0, 0), { w: "135" });
    expect(() => restoreJSON("not json")).toThrow("Not a backup file");
    expect(() => restoreJSON(JSON.stringify({ hello: 1 }))).toThrow("Not a Hybrid Build backup");
    expect(sget(setKey(1, 0, 0, 0))).toEqual({ w: "135" });
  });
  it("ignores unknown keys inside a backup", () => {
    expect(restoreJSON(JSON.stringify({ app: "hybrid-build", data: { w1s0: { "w1s0|0-0": { w: "1" } }, evil: { x: 1 }, sched2: [1] } }))).toBe(1);
    expect(STORE.evil).toBeUndefined();
  });
});
