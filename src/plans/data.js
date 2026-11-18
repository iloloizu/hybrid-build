/* ---------- plans from your files ----------
   Each exercise line:  Name | ref | muscles | week doses | flags
   ref "=bench"  → the library exercise itself (shares weight history)
   ref "~csrow"  → its own exercise, drawn with that library animation
   doses: one per week of the phase, separated by ";" (the last repeats).
     "5x4 @78% · 124" = 5 sets × 4 reps, note "78% · 124" (printed target).
     "3x8ea" = 8 per side. "3x20,15,10" = descending reps.
   flags: main (main lift), core, cardio, opt (optional). */

export const SIMON = {
  id: "simon", name: "Coach Simon's Plan", by: "Coach Simon", short: "Simon",
  blurb: "Fall 2019. Four weeks of volume and conditioning, then two strength phases built on percentages of your max.",
  note: "Printed targets come from 2019 maxes (squat 160, bench 205, deadlift 180). Always include 1-2 warm-up sets for main lifts.",
  weeks: 10,
  phases: [
    { from: 1, to: 4, name: "Base Phase", rule: "Volume, power and a Friday circuit", days: [
      { name: "Push", lines: `
TRX Row | ~csrow | Upper back, Lats | 2x15 @BW
Bench Press (1-2 warmup sets) | =bench | | 5x10 @120; 4x10 @130; 3x10 @140; 5x5 @150 | main
DB Incline | =incline | | 3x10
MB Wide Pushup | ~dbbench | Chest, Triceps | 3x10
Cable Chest Fly | =pecfly | | 3x10
Incline EZ Bar Skull Crusher | ~ohext | Triceps | 3x10
Band Tricep Pushdown | =pushdown | | 2x50
Core: Hyper Series | ~rdl | Back, Glutes | 1x1 round | core` },
      { name: "Pull + Power", lines: `
Hang Clean (build up sets) | ~trapbar | Glutes, Hamstrings, Upper back | 5x3 @70kg; 5x3 @75kg; 5x3 @80kg; 5x5 @60kg | main
Deadlift (2 warmup sets) | ~trapbar | Glutes, Hamstrings, Back | 5x5 @100kg; 4x5 @110kg; 3x5 @120kg; 5x3 @130kg | main
Mid Thigh Pull (use straps) | ~trapbar | Glutes, Upper back | 3x10 @100kg; 3x10 @110kg; 3x8 @120kg; 3x8 @130kg
Weighted Chin Ups | ~pullup | Lats, Biceps | 4x6 @+10% BW; 4x5 @+15% BW; 5x4 @+20% BW; 6x3-4 @+25% BW
Chest Supported Row | =csrow | | 3x12 @35; 3x12
TRX Rear Delt | ~facepull | Rear delts, Upper back | 2x8
DB Bent Over Rear Delt | ~revpec | Rear delts | 2x16
Cable Rope Curl | ~cablecurl | Biceps | 3x20
DB Hammer Curl | =hammer | | 1x50
Core: Physioball, Rev Crunch, Tucks | ~vup | Abs | 1x1 round | core` },
      { name: "Legs + Shoulders", lines: `
Overhead Press (build up sets) | ~dbpress | Front delts, Triceps | 5x5 | main
Back Squat (2 warmup sets) | =squat | | 4x8 @90kg; 4x8; 5x5 | main
DB Arnold Press | ~dbpress | Front delts, Side delts | 3x10
DB Lateral Raise | ~latdb | Side delts | 2x10
Leg Press | ~squat | Quads, Glutes | 3x20,15,10
Leg Curl | ~nordic | Hamstrings | 3x15
Rope Face Pull | =facepull | | 3x10
Banded Front Raise | ~latraise | Front delts | 2x20
Weighted Hypers | ~rdl | Back, Glutes | 2x20
Core: Hyper Series | ~rdl | Back, Glutes | 1x1 round | core` },
      { name: "Push 2", lines: `
Cable Row | ~rowmachine | Upper back, Lats | 2x15 @50% BW
Incline Bench Press (build up sets) | ~smithincline | Upper chest, Front delts, Triceps | 5x10; 5x8 @110; 5x10; 5x5 | main
DB Bench Press | =dbbench | | 3x10; 4x8; 3x10
Dips | ~closebench | Triceps, Chest | 3x20,15,10
Diamond Pushup | ~closebench | Triceps, Chest | 3x10
EZ Bar Row to Press | ~ezcurl | Side delts, Upper back | 3x10
Cable Rope Pushdown | =pushdown | | 3x20
Core: Hanging Ab Series | =legraise | | 1x1 round | core` },
      { name: "Circuit Day", lines: `
Kettlebell Swing | ~rdl | Glutes, Hamstrings | 4x15 @24kg+
Trap Bar Carry | ~trapbar | Forearms, Upper back | 4x25 yd @100kg
TRX Sled Pull (Row) | ~csrow | Upper back, Biceps | 4x50 yd @2 Red
Rope Sled Pull | ~facepull | Upper back, Biceps | 4x20 yd @3 Red
Plate Pinch Walk | ~trapbar | Forearms | 4x25 yd @2 Green
Indoor Circuit of Choice (Core or BB) | ~vup | Abs | 1x1 round | core` },
      { name: "Cardio", lines: `
Incline Treadmill Walk (12% incline) or Stairmaster | ~backwalk | Calves, Glutes | 1x20 min; 1x30 min; 1x30+ min | cardio` },
      null] },
    { from: 5, to: 7, name: "Strength Phase", rule: "Main lifts at 78-83% (70-75% front squat, 63-68% trap bar)", days: [
      { name: "Squat + Bench", lines: `
Squat | =squat | | 5x4 @78% · 124; 5x4 @80% · 128; 5x4 @83% · 132 | main
Split Squat | ~atg | Quads, Glutes | 3x8ea @56; 3x8ea @58; 3x8ea @59
RDL | =rdl | | 3x8 @62; 3x8 @64; 3x8 @66
Bench Press | =bench | | 5x4 @78% · 159; 5x4 @80% · 164; 5x4 @83% · 169 | main
DB Incline | =incline | | 3x8 @51; 3x8 @52; 3x8 @54
Dips | ~closebench | Triceps, Chest | 3x15
Core: 100 V-Ups | =vup | | 1x100 | core` },
      { name: "Deadlift + Press", lines: `
Deadlift | ~trapbar | Glutes, Hamstrings, Back | 5x4 @78% · 140; 5x4 @80% · 144; 5x4 @83% · 149 | main
Overhead Press | ~dbpress | Front delts, Triceps | 5x4 @54; 5x4 @56; 5x4 @58 | main
Barbell Row | ~csrow | Upper back, Lats | 3x8 @54; 3x8 @56; 3x8 @58
Pullup | =pullup | | 5x4 @39; 5x4 @40; 5x4 @41 | main
Lat Pulldown | =pulldown | | 3x12 @70% BW; 3x12 @75% BW; 3x12 @80% BW
Cable Row | ~rowmachine | Upper back, Lats | 3x12 @75% BW; 3x12 @80% BW; 3x12 @85% BW
Core: 100 Ab Rollouts | ~vup | Abs | 1x100 | core` },
      null,
      { name: "Front Squat + Bench", lines: `
Front Squat | ~squat | Quads, Glutes | 5x4 @70% · 90; 5x4 @73% · 93; 5x4 @75% · 96 | main
Reverse Lunge | ~atg | Quads, Glutes | 3x8ea @45; 3x8ea @46; 3x8ea @48
Weighted Hyper | ~rdl | Back, Glutes | 3x12 @45; 3x12 @46; 3x12 @48
Bench Press | =bench | | 3x8 @129; 3x8 @134; 3x8 @138 | main
DB Bench | =dbbench | | 3x8 @52; 3x8 @54; 3x8 @55
Skull Crushers | ~ohext | Triceps | 3x12
Core: 100 Hanging Leg Lifts | =legraise | | 1x100 | core` },
      { name: "Trap Bar + Pull", lines: `
Trap Bar Deadlift | =trapbar | | 3x8 @63% · 113; 3x8 @65% · 117; 3x8 @68% · 122 | main
DB Overhead Press | =dbpress | | 3x8 @18; 3x8 @18; 3x8 @19
DB Row (Elbow out) | ~csrow | Upper back, Rear delts | 3x8ea @18; 3x8ea @18; 3x8ea @19
Chin Up | ~pullup | Lats, Biceps | 3x10 @31; 3x10 @33; 3x10 @34
DB Lateral Raise | ~latdb | Side delts | 3x15
Cable Upright Row | ~facepull | Side delts, Traps | 3x15
Core: 100 Plate Russian Twists | ~vup | Abs | 1x100 | core` },
      null, null] },
    { from: 8, to: 10, name: "Strength Phase 2", rule: "Main lifts at 85-90% (75-80% incline)", days: [
      { name: "Bench + Push Press", lines: `
Bench Press | =bench | | 5x2 @85% · 174; 4x2 @88% · 179; 3x2 @90% · 185 | main
Bench Drop Sets | ~bench | Chest, Triceps | 2x10 @131; 2x10 @135; 2x10 @140
Push Press | ~dbpress | Front delts, Triceps | 3x5 @65; 3x4 @67; 4x3 @69 | main
Dips | ~closebench | Triceps, Chest | 3x20
DB Incline | =incline | | 3x5 @56; 3x5 @57; 3x5 @59
Cable Chest Fly | =pecfly | | 3x8
Skull Crushers | ~ohext | Triceps | 3x15
Core: 80 Weighted Situps | ~vup | Abs | 1x80 | core` },
      { name: "Trap Bar + Pull", lines: `
Trap Bar Deadlift | =trapbar | | 5x2 @85% · 153; 4x2 @88% · 158; 3x2 @90% · 162 | main
Pullup | =pullup | | 1x15 total @43; 1x15 total @44; 1x15 total @45 | main
Barbell Row | ~csrow | Upper back, Lats | 4x5 @59; 4x5 @61; 4x5 @63
Lat Pulldown | =pulldown | | 3x20,15,10
DB Row (Elbow out) | ~csrow | Upper back, Rear delts | 3x10
EZ Bar Curl | =ezcurl | | 3x20,15,10
Core: 80 Alternating V-Ups / Bicycles / Leg Lifts | =vup | | 1x80 | core` },
      null,
      { name: "Pause Squat + Legs", lines: `
Pause Back Squat | ~squat | Quads, Glutes | 5x2 @85% · 122; 4x2 @88% · 126; 3x2 @90% · 130 | main
DB RFESS | ~atg | Quads, Glutes | 3x8ea @31; 3x8ea @32; 3x8ea @32
RDL | =rdl | | 3x5 @61; 3x5 @63; 3x5 @65
Leg Extension | ~slant | Quads | 3x20,15,10
Leg Curl | ~nordic | Hamstrings | 3x20,15,10
Calf Raises | =calfraise | | 3x20
Core: 80 Weighted V-Ups | =vup | | 1x80 | core` },
      { name: "Incline + Shoulders", lines: `
Incline Bench Press | ~smithincline | Upper chest, Front delts, Triceps | 4x5 @75% · 123; 4x5 @78% · 127; 4x5 @80% · 131 | main
Incline Max Set | ~smithincline | Upper chest, Triceps | 1xAMRAP @92; 1xAMRAP @95; 1xAMRAP @98
DB Arnold Press | ~dbpress | Front delts, Side delts | 3x8
Weighted Pushups | ~dbbench | Chest, Triceps | 3x8 @+10% BW; 3x8 @+15% BW; 3x8 @+20% BW
DB Bench | =dbbench | | 3x5 @62; 3x5 @64; 3x5 @66
3-Way DB Raise | ~latdb | Side delts, Front delts | 3x15
Cable Tricep Pushdown | =pushdown | | 3x15
Core: 80 Plate Russian Twists | ~vup | Abs | 1x80 | core` },
      null, null] }
  ]
};

export const AWO = {
  id: "awo", name: "AWO's Plan", by: "AWO", short: "AWO",
  blurb: "Three focused days from AWO: Pull (Back & Bi), Arms, and Glutes & Hammies, each with an incline-walk finisher.",
  note: "From the March 2026 AWO sessions. The same week repeats; start a new block to keep going.",
  weeks: 4,
  phases: [{ from: 1, to: 4, name: "AWO Week", rule: "Feeder sets build to heavy working sets", days: [
    { name: "Pull (Back & Bi)", lines: `
Wide Grip Lat Pulldown | =pulldown | | 4x12-15, 12-15, 8-10, 8-10 @First two are feeder sets | main
Dumbbell Single Arm Row | ~csrow | Lats, Upper back | 3x8-10 @Or barbell bent-over row
Cable Seated Row | ~rowmachine | Upper back, Lats | 3x10-12
Alternate Hammer Curl | =hammer | | 2x12-15 @Or alternating DB curl
Abs: Cable Crunch, Ab Roller | =cablecrunch | | 2x10-12 | core
Treadmill Incline Walk | ~backwalk | Calves, Glutes | 1x15 min @Or stairmaster / bike | cardio` },
    null, null, null,
    { name: "Arms", lines: `
Dumbbell Shoulder Press (Seated) | =dbpress | | 3x12 | main
Cable Tricep Pushdown (V-Bar) | =pushdown | | 3x12
Cable Bicep Curl (Rope) | =cablecurl | | 3x12
Cable Front Lateral Raise | ~latraise | Front delts | 3x12
Incline Inner Bicep Curl | =inclinecurl | | 3x12
Seated Dumbbell Tricep Extension | =dbohext | | 3x12
Treadmill Incline Walk | ~backwalk | Calves, Glutes | 1x15 min @Or stairmaster / bike | cardio` },
    { name: "Glutes & Hammies", lines: `
Warm-up: Incline Walk or Stairs | ~backwalk | Calves, Glutes | 1x10-15 min @Plus dynamic stretching | cardio
Hip Thrust (Barbell, DB or Smith) | ~rdl | Glutes, Hamstrings | 4x12, 8, 8, 8 @First set is a warm-up | main
Seated or Lying Leg Curl | ~nordic | Hamstrings | 4x15, 12, 12, 12 @Aim for at least 8 good reps
Dumbbell Bulgarian Split Squat | ~atg | Quads, Glutes | 4x12, 10, 10, 10 @Each side; start 10-20 lb
Romanian Deadlift (Smith) | =rdl | | 4x10 @Start 15-30 lb
Leg Extensions | ~slant | Quads | 3x10 | opt
Standing Calf Raises | =calfraise | | 3x12 | opt` },
    null] }]
};

export const AI = {
  id: "ai", name: "AI-Generated Plan", by: "AI app", short: "AI",
  blurb: "Push, pull, legs, rest, push, pull, rest. A classic split from an AI workout app, with cardio finishers.",
  note: "The screenshots list exercises but not sets or reps, so each starts at 3 × 10. Change reps as you go.",
  weeks: 4,
  phases: [{ from: 1, to: 4, name: "PPL Week", rule: "Sets and reps weren't in the source: 3 × 10 to start", days: [
    { name: "Push", lines: PUSH() },
    { name: "Pull", lines: PULL() },
    { name: "Legs", lines: `
Barbell Back Squat | =squat | | 3x10 | main
Bulgarian Split Squat | ~atg | Quads, Glutes | 3x10ea
Leg Extension | ~slant | Quads | 3x10
Leg Curl | ~nordic | Hamstrings | 3x10
Calf Raises | =calfraise | | 3x10
Plank Toe Touches | ~vup | Abs | 3x10 | core
Rowing | ~rowmachine | Upper back, Quads | 1x10 min | cardio` },
    null,
    { name: "Push", lines: PUSH() },
    { name: "Pull", lines: PULL() },
    null] }]
};
function PUSH() { return `
Incline Barbell Bench Press | ~smithincline | Upper chest, Front delts, Triceps | 3x10 | main
Incline Dumbbell Fly | ~pecfly | Upper chest | 3x10
Dumbbell Bench Press | =dbbench | | 3x10
Dumbbell Shoulder Press | =dbpress | | 3x10
Dumbbell Lateral Raise | ~latdb | Side delts | 3x10
Cable Rope Pushdown | =pushdown | | 3x10
EZ-Bar Skullcrushers | ~ohext | Triceps | 3x10
Incline Treadmill | ~backwalk | Calves, Glutes | 1x10 min | cardio`; }
function PULL() { return `
Bent-over Barbell Row | ~csrow | Upper back, Lats | 3x10 | main
Dumbbell Row | ~csrow | Lats, Upper back | 3x10ea
Lat Pulldown | =pulldown | | 3x10
Dumbbell Shrugs | ~trapbar | Traps, Upper back | 3x10
Machine Rear Delt Flyes | =revpec | | 3x10
Z-Bar Biceps Curl | =ezcurl | | 3x10
Cross Body Hammer Curls | =hammer | | 3x10
Cycling | ~boxjump | Quads, Calves | 1x10 min | cardio`; }
