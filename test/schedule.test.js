import { describe, it, expect, beforeEach } from "vitest";
import { STORE, sget, schedKey } from "../src/storage.js";
import { slots, pushToTomorrow, swapDays, skipDay } from "../src/schedule.js";

const MON = 0, TUE = 1, WED = 2, THU = 3, FRI = 4, SAT = 5, SUN = 6;
// session ids: 0 Press Conference, 1 Knee Deep, 2 Wingspan, 3 Hinge Benefits, 4 Boulder Dash, 5 Pump Fiction, 6 Long Haul
beforeEach(() => { for (const k of Object.keys(STORE)) delete STORE[k]; });

describe("pushToTomorrow", () => {
  it("slides the week and drops Pump Fiction when there is no room", () => {
    expect(pushToTomorrow(1, MON)).toBe("Pump Fiction dropped this week to make room.");
    expect(slots(1)).toEqual([-1, 0, 1, 2, 3, 4, 6]);
  });
  it("drops Hinge Benefits next once Pump Fiction is already gone", () => {
    pushToTomorrow(1, MON);
    expect(pushToTomorrow(1, TUE)).toBe("Hinge Benefits dropped this week to make room.");
    expect(slots(1)).toEqual([-1, -1, 0, 1, 2, 4, 6]);
  });
  it("just slides when a rest day absorbs the push", () => {
    skipDay(1, SAT); // Pump Fiction skipped: -2 is not a session, so the queue fits
    expect(pushToTomorrow(1, WED)).toBe("Everything after today slid one day.");
    expect(slots(1)).toEqual([0, 1, -1, 2, 3, 4, 6]);
  });
  it("drops a Saturday session outright", () => {
    expect(pushToTomorrow(1, SAT)).toBe("Pushed past Saturday, so it's dropped this week.");
    expect(slots(1)).toEqual([0, 1, 2, 3, 4, -1, 6]);
  });
  it("never touches Sunday's long run", () => {
    for (const d of [MON, TUE, WED, THU, FRI, SAT]) pushToTomorrow(2, d);
    expect(slots(2)[SUN]).toBe(6);
  });
  it("keeps weeks independent and stores only changed weeks", () => {
    pushToTomorrow(3, FRI);
    expect(slots(4)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(sget(schedKey(4))).toBeUndefined();
    expect(sget(schedKey(3))).toEqual([0, 1, 2, 3, -1, 4, 6]);
  });
});

describe("swapDays and skipDay", () => {
  it("swaps two days, and swapping back clears the stored schedule", () => {
    swapDays(1, TUE, THU);
    expect(slots(1)).toEqual([0, 3, 2, 1, 4, 5, 6]);
    swapDays(1, TUE, THU);
    expect(sget(schedKey(1))).toBeUndefined();
  });
  it("marks a skipped day as -2", () => {
    skipDay(1, FRI);
    expect(slots(1)).toEqual([0, 1, 2, 3, -2, 5, 6]);
  });
});
