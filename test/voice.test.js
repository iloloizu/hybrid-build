import { describe, it, expect } from "vitest";
import { parse, normalize, matchExercise } from "../src/plan/voice.js";

const E = [{ name: "Barbell bench press" }, { name: "Incline DB press" }, { name: "Romanian deadlift" }, { name: "Seated cable pec fly" }];
describe("voice logging", () => {
  it("reads sets x reps and weight", () => {
    expect(parse("5x5 bench of 145")).toMatchObject({ sets: 5, reps: 5, weight: 145 });
    expect(parse("bench 3 sets of 8 at 135")).toMatchObject({ sets: 3, reps: 8, weight: 135 });
    expect(parse("145 for 5")).toMatchObject({ reps: 5, weight: 145, sets: null });
    expect(parse("8 reps at 60 pounds")).toMatchObject({ reps: 8, weight: 60 });
    expect(parse("5 by 5 at 100 kg")).toMatchObject({ sets: 5, reps: 5, weight: 100, kg: true });
  });
  it("understands spoken numbers", () => {
    expect(normalize("five by five bench one forty five")).toBe("5 by 5 bench 145");
    expect(parse("three sets of eight incline at sixty five")).toMatchObject({ sets: 3, reps: 8, weight: 65 });
    expect(parse("one twenty for ten")).toMatchObject({ weight: 120, reps: 10 });
  });
  it("finds the exercise", () => {
    expect(matchExercise(parse("5x5 bench of 145").words, E).name).toBe("Barbell bench press");
    expect(matchExercise(parse("incline 3x10 at 60").words, E).name).toBe("Incline DB press");
    expect(matchExercise(parse("rdl 3 by 8 at 185").words, E).name).toBe("Romanian deadlift");
    expect(matchExercise(parse("3x8 at 135").words, E)).toBe(null);
  });
});
