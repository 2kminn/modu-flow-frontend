import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeExerciseIdentity,
  validateWorkoutItemDraft
} from "../src/api/validation.js";

test("normalizes the legacy overhead press identity", () => {
  assert.deepEqual(
    normalizeExerciseIdentity({
      exerciseId: "overhead-press",
      name: "오버헤드 프레스"
    }),
    {
      exerciseId: "shoulder-press",
      name: "숄더 프레스"
    }
  );
});

test("sends the shoulder press identity after workout validation", () => {
  const result = validateWorkoutItemDraft({
    id: "legacy-item",
    exerciseId: "overhead-press",
    name: "오버헤드 프레스",
    sets: 3,
    reps: 10,
    weight: 20
  });

  assert.equal(result.ok, true);
  assert.equal(result.item.exerciseId, "shoulder-press");
  assert.equal(result.item.name, "숄더 프레스");
});
