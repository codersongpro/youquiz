import { NextRequest } from "next/server";

import { apiError, requireUser } from "@/lib/server/auth";
import { gradeShortAnswers } from "@/lib/server/gemini";
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
    await saveGradedResponses(uid, attempt, responses);
    return Response.json({ responses });
  } catch {
    return apiError("Unable to grade answers. Please try again.", 400);
  }
}
