import { describe, it, expect } from "vitest";
import { parse } from "../src/router.js";
import { todayWD, todayTarget } from "../src/views/today.js";

describe("routes", () => {
  it("parses every screen", () => {
    expect(parse("")).toEqual({ name: "today" });
    expect(parse("#/today")).toEqual({ name: "today" });
    expect(parse("#/week")).toEqual({ name: "week" });
    expect(parse("#/w/4")).toEqual({ name: "week", w: 4 });
    expect(parse("#/w/4/d/6")).toEqual({ name: "day", w: 4, d: 6 });
    expect(parse("#/block")).toEqual({ name: "block" });
    expect(parse("#/exercises")).toEqual({ name: "library" });
    expect(parse("#/ex/bench")).toEqual({ name: "ex", id: "bench" });
    expect(parse("#posegrid")).toEqual({ name: "posegrid" });
  });
  it("falls back to Today on anything out of range", () => {
    expect(parse("#/w/11")).toEqual({ name: "today" });
    expect(parse("#/w/0/d/1")).toEqual({ name: "today" });
    expect(parse("#/w/3/d/7")).toEqual({ name: "week", w: 3 });
    expect(parse("#/nope")).toEqual({ name: "today" });
  });
});

describe("today", () => {
  it("maps dates inside the block to week and day", () => {
    expect(todayWD(new Date(2026, 10, 16, 23, 59))).toEqual({ w: 1, d: 0 });
    expect(todayWD(new Date(2026, 10, 18, 0, 5))).toEqual({ w: 1, d: 2 });
    expect(todayWD(new Date(2027, 0, 24))).toEqual({ w: 10, d: 6 });
  });
  it("lands on the nearest end of the block outside it", () => {
    expect(todayWD(new Date(2026, 10, 15))).toBeNull();
    expect(todayTarget(new Date(2026, 10, 1))).toEqual({ w: 1, d: 0 });
    expect(todayTarget(new Date(2027, 1, 1))).toEqual({ w: 10, d: 6 });
  });
});
