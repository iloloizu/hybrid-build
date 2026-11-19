import { describe, it, expect } from "vitest";
import { afterLog, firstOpen, supersetLetters, REST_SEC } from "../src/plan/flow.js";

const E = [{ ss: null, done: 3, total: 3 }, { ss: 1, done: 0, total: 2 }, { ss: 1, done: 0, total: 3 }, { ss: null, done: 0, total: 3 }, { ss: 3, done: 0, total: 2 }, { ss: 3, done: 0, total: 2 }];

describe("workout flow", () => {
  it("moves from the first superset exercise to its partner without rest", () => {
    expect(afterLog(E, 1)).toEqual({ goTo: 2, rest: 0 });
    expect(afterLog(E, 4)).toEqual({ goTo: 5, rest: 0 });
  });
  it("rests 2:00 after the second superset exercise and after normal exercises", () => {
    expect(afterLog(E, 2)).toEqual({ goTo: null, rest: REST_SEC });
    expect(afterLog(E, 0)).toEqual({ goTo: null, rest: 120 });
    expect(afterLog(E, 5)).toEqual({ goTo: null, rest: 120 });
  });
  it("finds the first exercise with an open set", () => {
    expect(firstOpen(E)).toBe(1);
    expect(firstOpen(E.map(e => Object.assign({}, e, { done: e.total })))).toBe(-1);
  });
  it("letters supersets in order", () => {
    expect(supersetLetters(E)).toEqual({ 1: "A", 3: "B" });
  });
});
