import { describe, expect, it } from "vitest";

import {
  ageGuidance,
  buildQuestionBlueprint,
  scoreMultipleChoice,
  validateGenerateQuizInput
} from "./quiz";

describe("validateGenerateQuizInput", () => {
  it("accepts English as the default language", () => {
    expect(
      validateGenerateQuizInput({ videoId: "abcdefghijk", targetAge: 10, questionCount: 3 })
    ).toMatchObject({ language: "en" });
  });

  it("rejects ages outside 5 through 20", () => {
    expect(() => validateGenerateQuizInput({ videoId: "abcdefghijk", targetAge: 4, questionCount: 3 })).toThrow();
    expect(() => validateGenerateQuizInput({ videoId: "abcdefghijk", targetAge: 21, questionCount: 3 })).toThrow();
  });

  it("rejects question counts outside 1 through 20", () => {
    expect(() => validateGenerateQuizInput({ videoId: "abcdefghijk", targetAge: 10, questionCount: 21 })).toThrow();
  });
});

describe("ageGuidance", () => {
  it("uses child-friendly language at age 7", () => {
    expect(ageGuidance(7)).toMatchObject({ band: "5-7", thinking: "recall" });
  });

  it("uses analytical language from age 17", () => {
    expect(ageGuidance(17)).toMatchObject({ band: "17+", thinking: "analysis" });
  });
});

describe("buildQuestionBlueprint", () => {
  it("keeps both question types for a three-question quiz", () => {
    expect(buildQuestionBlueprint(3)).toEqual(["multiple_choice", "short_answer", "multiple_choice"]);
  });

  it("uses a multiple-choice question when only one question is requested", () => {
    expect(buildQuestionBlueprint(1)).toEqual(["multiple_choice"]);
  });
});

describe("scoreMultipleChoice", () => {
  it("scores matching answer indexes", () => {
    expect(scoreMultipleChoice(2, 2)).toBe(true);
    expect(scoreMultipleChoice(1, 2)).toBe(false);
  });
});
