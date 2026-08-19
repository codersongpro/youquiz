import { NextRequest } from "next/server";
import { z } from "zod";

import { apiError, requireUser } from "@/lib/server/auth";
import { getAttempt, getQuiz, saveResponse } from "@/lib/server/store";

export const runtime = "nodejs";

export async function PUT(request: NextRequest, context: { params: Promise<{ attemptId: string; questionId: string }> }) {
  try {
    const uid = await requireUser(request);
    const { attemptId, questionId } = await context.params;
    const { answer } = z.object({ answer: z.union([z.number().int().min(0).max(3), z.string().trim().min(1).max(500)]) }).parse(await request.json());
    const attempt = await getAttempt(uid, attemptId);
    if (!attempt) return apiError("Attempt not found.", 404);
    const quiz = await getQuiz(uid, attempt.quizId);
    const question = quiz?.questions.find((item) => item.id === questionId);
    if (!question || question.type === "multiple_choice" && typeof answer !== "number" || question.type === "short_answer" && typeof answer !== "string") return apiError("Invalid answer.", 400);
    await saveResponse(uid, attemptId, { questionId, type: question.type, answer, isCorrect: null, locked: false, answeredAt: new Date().toISOString() });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error instanceof Error && error.message === "RESPONSE_LOCKED" ? "This answer has already been graded." : "Unable to save answer.", error instanceof Error && error.message === "RESPONSE_LOCKED" ? 409 : 401);
  }
}
