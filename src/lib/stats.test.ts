import { describe, expect, it } from "vitest";

import { summarizeAttempts } from "./stats";

describe("summarizeAttempts", () => {
  it("counts graded questions and separates question types", () => {
    const summary = summarizeAttempts([
      {
        completedAt: "2026-08-18T01:00:00.000Z",
        responses: [
          { type: "multiple_choice", isCorrect: true },
          { type: "short_answer", isCorrect: false },
          { type: "short_answer", isCorrect: null }
        ]
      }
    ]);

    expect(summary).toMatchObject({ quizzes: 1, answered: 2, correct: 1, accuracy: 50 });
    expect(summary.byType.multiple_choice).toMatchObject({ answered: 1, correct: 1 });
    expect(summary.byType.short_answer).toMatchObject({ answered: 1, correct: 0 });
  });
});
