import { NextRequest } from "next/server";

import { apiError, AuthError, requireUser } from "@/lib/server/auth";
import { gradeShortAnswers, isGeminiRateLimitError } from "@/lib/server/gemini";
import { getAttempt, getQuiz, saveGradedResponses } from "@/lib/server/store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest, context: { params: Promise<{ attemptId: string }> }) {
  try {
    const uid = await requireUser(request);
    const { attemptId } = await context.params;
    const attempt = await getAttempt(uid, attemptId);
    if (!attempt) return apiError("Attempt not found.", 404);
    const quiz = await getQuiz(uid, attempt.quizId);
    if (!quiz) return apiError("Quiz not found.", 404);
    const answers = attempt.responses.filter((response) => !response.locked);
    const shortAnswers = answers.flatMap((response) => {
      const question = quiz.questions.find((item) => item.id === response.questionId);
      return question?.type === "short_answer" && typeof response.answer === "string" && question.modelAnswer && question.gradingRubric
        ? [{ questionId: question.id, prompt: question.prompt, answer: response.answer, modelAnswer: question.modelAnswer, gradingRubric: question.gradingRubric }]
        : [];
    });
    const gradedShort = await gradeShortAnswers(shortAnswers, quiz.language);
    const responses = attempt.responses.map((response) => {
      if (response.locked) return response;
      const question = quiz.questions.find((item) => item.id === response.questionId);
      if (!question) return response;
      if (question.type === "multiple_choice") return { ...response, isCorrect: response.answer === question.correctIndex, feedback: question.explanation, locked: true, gradedAt: new Date().toISOString() };
      const result = gradedShort.find((item) => item.questionId === question.id);
      return result ? { ...response, isCorrect: result.isCorrect, feedback: result.feedback, locked: true, gradedAt: new Date().toISOString() } : response;
    });
    await saveGradedResponses(uid, attempt, quiz, responses);
    return Response.json({ responses });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    if (isGeminiRateLimitError(error)) return apiError("The AI is at its usage limit right now. Please wait a minute and try again.", 429);
    console.error(error);
    return apiError("Unable to grade answers. Please try again.", 400);
  }
}
