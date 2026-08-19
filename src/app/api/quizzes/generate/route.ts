import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { validateGenerateQuizInput } from "@/lib/quiz";
import { apiError, requireUser } from "@/lib/server/auth";
import { generateQuiz } from "@/lib/server/gemini";
import { saveQuizAndAttempt } from "@/lib/server/store";
import { getVideoById } from "@/lib/server/youtube-api";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const uid = await requireUser(request);
    const input = validateGenerateQuizInput(await request.json());
    const video = await getVideoById(input.videoId);
    if (!video) return apiError("Use a public, non-live YouTube video of 60 minutes or less.", 400);
    const questions = await generateQuiz(video.url, input);
    const createdAt = new Date().toISOString();
    const quizId = randomUUID();
    const attemptId = randomUUID();
    const quiz = { id: quizId, video, targetAge: input.targetAge, language: input.language, questions, createdAt };
    const attempt = { id: attemptId, quizId, video, status: "in_progress" as const, startedAt: createdAt, updatedAt: createdAt, responses: [] };
    await saveQuizAndAttempt(uid, quiz, attempt);
    return Response.json({ quiz, attempt });
  } catch (error) {
    return apiError(error instanceof Error && error.message === "UNAUTHENTICATED" ? "Sign in to create a quiz." : "Unable to create a quiz. Please try another public video.", error instanceof Error && error.message === "UNAUTHENTICATED" ? 401 : 400);
  }
}
