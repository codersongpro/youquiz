import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { buildGenerationPrompt } from "../generation";
import type { QuizQuestion } from "../types";
import { buildQuestionBlueprint, type GenerateQuizInput } from "../quiz";
import { readServerConfig } from "./env";

const generatedQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["multiple_choice", "short_answer"]),
  prompt: z.string().min(1),
  choices: z.array(z.string().min(1)).length(4).optional(),
  correctIndex: z.number().int().min(0).max(3).optional(),
  modelAnswer: z.string().min(1).optional(),
  gradingRubric: z.string().min(1).optional(),
  explanation: z.string().min(1)
});

const generatedQuizSchema = z.object({ questions: z.array(generatedQuestionSchema).min(1).max(20) });

function jsonSchema(questionCount: number) {
  return {
    type: "object",
    properties: {
      questions: {
        type: "array",
        minItems: questionCount,
        maxItems: questionCount,
        items: {
          type: "object",
          properties: {
            id: { type: "string" }, type: { type: "string", enum: ["multiple_choice", "short_answer"] },
            prompt: { type: "string" }, choices: { type: "array", items: { type: "string" } },
            correctIndex: { type: "integer" }, modelAnswer: { type: "string" }, gradingRubric: { type: "string" }, explanation: { type: "string" }
          },
          required: ["id", "type", "prompt", "explanation"]
        }
      }
    },
    required: ["questions"]
  };
}

function validateQuestionSet(questions: QuizQuestion[], count: number) {
  const blueprint = buildQuestionBlueprint(count);
  if (questions.length !== count || questions.some((question, index) => question.type !== blueprint[index])) throw new Error("INVALID_MODEL_OUTPUT");
  for (const question of questions) {
    if (question.type === "multiple_choice" && (!question.choices || question.correctIndex === undefined)) throw new Error("INVALID_MODEL_OUTPUT");
    if (question.type === "short_answer" && (!question.modelAnswer || !question.gradingRubric)) throw new Error("INVALID_MODEL_OUTPUT");
  }
}

type InteractionStep = { type: string; content?: Array<{ type: string; text?: string }> };

function interactionText(interaction: { steps?: InteractionStep[] }) {
  const text = (interaction.steps ?? [])
    .filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? [])
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("");
  if (!text) throw new Error("INVALID_MODEL_OUTPUT");
  return text;
}

export async function generateQuiz(videoUrl: string, input: GenerateQuizInput): Promise<QuizQuestion[]> {
  const config = readServerConfig();
  const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  const prompt = buildGenerationPrompt({ videoUrl, ...input });
  const interaction = await ai.interactions.create({
    model: config.GEMINI_MODEL,
    input: [
      { type: "video", uri: videoUrl },
      { type: "text", text: prompt }
    ],
    response_format: { type: "text", mime_type: "application/json", schema: jsonSchema(input.questionCount) }
  });
  const parsed = generatedQuizSchema.parse(JSON.parse(interactionText(interaction)));
  validateQuestionSet(parsed.questions, input.questionCount);
  return parsed.questions;
}

const gradeResultSchema = z.object({ results: z.array(z.object({ questionId: z.string(), isCorrect: z.boolean(), feedback: z.string().min(1) })) });

export async function gradeShortAnswers(items: Array<{ questionId: string; prompt: string; answer: string; modelAnswer: string; gradingRubric: string }>, language: "en" | "ko") {
  if (items.length === 0) return [];
  const config = readServerConfig();
  const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  const outputLanguage = language === "en" ? "English" : "Korean";
  const interaction = await ai.interactions.create({
    model: config.GEMINI_MODEL,
    input: `Grade each student answer by meaning using the model answer and rubric. Return only JSON. Feedback must be in ${outputLanguage}. ${JSON.stringify(items)}`,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: { type: "object", properties: { results: { type: "array", items: { type: "object", properties: { questionId: { type: "string" }, isCorrect: { type: "boolean" }, feedback: { type: "string" } }, required: ["questionId", "isCorrect", "feedback"] } } }, required: ["results"] }
    }
  });
  return gradeResultSchema.parse(JSON.parse(interactionText(interaction))).results;
}
