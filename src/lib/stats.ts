import type { QuestionType } from "./quiz";

type AttemptForStats = {
  completedAt?: string | null;
  responses: Array<{ type: QuestionType; isCorrect: boolean | null }>;
};

type TypeStat = { answered: number; correct: number; accuracy: number };

export type LearningStats = {
  quizzes: number;
  answered: number;
  correct: number;
  accuracy: number;
  byType: Record<QuestionType, TypeStat>;
};

function accuracy(answered: number, correct: number): number {
  return answered === 0 ? 0 : Math.round((correct / answered) * 100);
}

export function summarizeAttempts(attempts: AttemptForStats[]): LearningStats {
  const byType: Record<QuestionType, TypeStat> = {
    multiple_choice: { answered: 0, correct: 0, accuracy: 0 },
    short_answer: { answered: 0, correct: 0, accuracy: 0 }
  };
  let answered = 0;
  let correct = 0;

  for (const attempt of attempts) {
    for (const response of attempt.responses) {
      if (response.isCorrect === null) continue;
      answered += 1;
      byType[response.type].answered += 1;
      if (response.isCorrect) {
        correct += 1;
        byType[response.type].correct += 1;
      }
    }
  }

  for (const type of Object.keys(byType) as QuestionType[]) {
    byType[type].accuracy = accuracy(byType[type].answered, byType[type].correct);
  }

  return {
    quizzes: attempts.length,
    answered,
    correct,
    accuracy: accuracy(answered, correct),
    byType
  };
}
