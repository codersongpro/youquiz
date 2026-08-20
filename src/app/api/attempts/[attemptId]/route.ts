import { NextRequest } from "next/server";

import { apiError, AuthError, requireUser } from "@/lib/server/auth";
import { getAttempt, getQuiz } from "@/lib/server/store";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ attemptId: string }> }) {
  try {
    const uid = await requireUser(request);
    const { attemptId } = await context.params;
    const attempt = await getAttempt(uid, attemptId);
    if (!attempt) return apiError("Attempt not found.", 404);
    const quiz = await getQuiz(uid, attempt.quizId);
    if (!quiz) return apiError("Quiz not found.", 404);
    return Response.json({ attempt, quiz });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    console.error(error);
    return apiError("Sign in to view this quiz.", 401);
  }
}
