import type { AttemptDocument, QuizDocument, StoredResponse, WrongAnswerRecord } from "../types";
import { summarizeAttempts } from "../stats";
import { getAdminDb } from "./firebase-admin";

const now = () => new Date().toISOString();
const userRoot = (uid: string) => getAdminDb().collection("users").doc(uid);

export async function saveQuizAndAttempt(uid: string, quiz: QuizDocument, attempt: AttemptDocument) {
  const root = userRoot(uid);
  const batch = getAdminDb().batch();
  batch.set(root.collection("quizzes").doc(quiz.id), quiz);
  batch.set(root.collection("attempts").doc(attempt.id), attempt);
  await batch.commit();
}

export async function getAttempt(uid: string, attemptId: string): Promise<AttemptDocument | null> {
  const snapshot = await userRoot(uid).collection("attempts").doc(attemptId).get();
  return snapshot.exists ? snapshot.data() as AttemptDocument : null;
}

export async function getQuiz(uid: string, quizId: string): Promise<QuizDocument | null> {
  const snapshot = await userRoot(uid).collection("quizzes").doc(quizId).get();
  return snapshot.exists ? snapshot.data() as QuizDocument : null;
}

export async function saveResponse(uid: string, attemptId: string, response: StoredResponse) {
  const ref = userRoot(uid).collection("attempts").doc(attemptId);
  await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new Error("NOT_FOUND");
    const attempt = snapshot.data() as AttemptDocument;
    const prior = attempt.responses.find((item) => item.questionId === response.questionId);
    if (prior?.locked) throw new Error("RESPONSE_LOCKED");
    const responses = [...attempt.responses.filter((item) => item.questionId !== response.questionId), response];
    transaction.update(ref, { responses, updatedAt: now() });
  });
}

export async function saveGradedResponses(uid: string, attempt: AttemptDocument, quiz: QuizDocument, responses: StoredResponse[]) {
  const ref = userRoot(uid).collection("attempts").doc(attempt.id);
  const completed = responses.length === quiz.questions.length && responses.every((response) => response.locked);
  await ref.set({ ...attempt, responses, status: completed ? "completed" : "in_progress", updatedAt: now(), ...(completed ? { completedAt: now() } : {}) });
  const batch = getAdminDb().batch();
  for (const response of responses.filter((item) => item.isCorrect === false)) {
    const question = quiz.questions.find((item) => item.id === response.questionId);
    const record: WrongAnswerRecord = { ...response, attemptId: attempt.id, quizId: attempt.quizId, videoTitle: quiz.video.title, prompt: question?.prompt ?? "", explanation: question?.explanation ?? "", updatedAt: now() };
    batch.set(userRoot(uid).collection("wrongAnswers").doc(`${attempt.id}_${response.questionId}`), record);
  }
  await batch.commit();
}

export async function listAttempts(uid: string) {
  const snapshot = await userRoot(uid).collection("attempts").orderBy("updatedAt", "desc").limit(100).get();
  return snapshot.docs.map((doc) => doc.data() as AttemptDocument);
}

export async function listWrongAnswers(uid: string): Promise<WrongAnswerRecord[]> {
  const snapshot = await userRoot(uid).collection("wrongAnswers").orderBy("updatedAt", "desc").limit(100).get();
  return snapshot.docs.map((doc) => doc.data() as WrongAnswerRecord);
}

export async function getStats(uid: string) {
  return summarizeAttempts(await listAttempts(uid));
}
