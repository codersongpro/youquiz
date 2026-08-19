import { describe, expect, it } from "vitest";

import { buildGenerationPrompt } from "./generation";

describe("buildGenerationPrompt", () => {
  it("defaults to English and includes age guidance", () => {
    const prompt = buildGenerationPrompt({
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      targetAge: 7,
      language: "en",
      questionCount: 3
    });

    expect(prompt).toContain("Output language: English");
    expect(prompt).toContain("5-7");
    expect(prompt).toContain("Avoid negatives");
  });

  it("permits Korean when selected", () => {
    const prompt = buildGenerationPrompt({
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      targetAge: 17,
      language: "ko",
      questionCount: 5
    });

    expect(prompt).toContain("Output language: Korean");
    expect(prompt).toContain("17+");
    expect(prompt).toContain("analysis");
  });
});
