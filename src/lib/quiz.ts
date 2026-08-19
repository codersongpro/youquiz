import { z } from "zod";

export const quizLanguageSchema = z.enum(["en", "ko"]);
export const questionTypeSchema = z.enum(["multiple_choice", "short_answer"]);

const generateQuizInputSchema = z.object({
  videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  targetAge: z.number().int().min(5).max(100),
  language: quizLanguageSchema.default("en"),
  questionCount: z.number().int().min(1).max(20)
});

export type QuizLanguage = z.infer<typeof quizLanguageSchema>;
export type QuestionType = z.infer<typeof questionTypeSchema>;
export type GenerateQuizInput = z.infer<typeof generateQuizInputSchema>;

export type AgeGuidance = {
  band: "5-7" | "8-10" | "11-13" | "14-16" | "17+";
  vocabulary: string;
  sentenceStyle: string;
  thinking: "recall" | "understanding" | "comparison" | "application" | "analysis";
};

export function validateGenerateQuizInput(input: unknown): GenerateQuizInput {
  return generateQuizInputSchema.parse(input);
}

export function ageGuidance(age: number): AgeGuidance {
  if (age <= 7) {
    return {
      band: "5-7",
      vocabulary: "Use very familiar everyday words and explain any necessary new word.",
      sentenceStyle: "Use short, positive sentences. Avoid negatives and similar distractors.",
      thinking: "recall"
    };
  }

  if (age <= 10) {
    return {
      band: "8-10",
      vocabulary: "Use everyday words. Explain essential subject words in plain English.",
      sentenceStyle: "Use clear, single-clause sentences when possible.",
      thinking: "understanding"
    };
  }

  if (age <= 13) {
    return {
      band: "11-13",
      vocabulary: "Use basic subject vocabulary and define uncommon words with context.",
      sentenceStyle: "Use clear cause-and-effect and comparison language.",
      thinking: "comparison"
    };
  }

  if (age <= 16) {
    return {
      band: "14-16",
      vocabulary: "Use limited abstract and subject-specific vocabulary when it is needed.",
      sentenceStyle: "Use precise sentences with enough context for inference.",
      thinking: "application"
    };
  }

  return {
    band: "17+",
    vocabulary: "Use topic-appropriate academic or professional vocabulary.",
    sentenceStyle: "Use precise, source-faithful language.",
    thinking: "analysis"
  };
}

export function buildQuestionBlueprint(questionCount: number): QuestionType[] {
  if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 20) {
    throw new Error("Question count must be an integer from 1 through 20.");
  }

  return Array.from({ length: questionCount }, (_, index) =>
    index % 2 === 0 ? "multiple_choice" : "short_answer"
  );
}

export function scoreMultipleChoice(selectedIndex: number, correctIndex: number): boolean {
  return selectedIndex === correctIndex;
}
