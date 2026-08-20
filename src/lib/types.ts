import type { QuestionType, QuizLanguage } from "./quiz";

export type VideoSummary = {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSeconds: number;
  url: string;
};

export type QuizQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  choices?: string[];
  correctIndex?: number;
  modelAnswer?: string;
  gradingRubric?: string;
  explanation: string;
};

export type QuizDocument = {
  id: string;
  video: VideoSummary;
  targetAge: number;
  language: QuizLanguage;
  questions: QuizQuestion[];
  createdAt: string;
};

export type StoredResponse = {
  questionId: string;
  type: QuestionType;
  answer: string | number;
  isCorrect: boolean | null;
  feedback?: string;
  locked: boolean;
  answeredAt: string;
  gradedAt?: string;
};

export type AttemptDocument = {
  id: string;
  quizId: string;
  video: VideoSummary;
  status: "in_progress" | "completed";
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  responses: StoredResponse[];
};

export type WrongAnswerRecord = StoredResponse & {
  attemptId: string;
  quizId: string;
  videoTitle: string;
  prompt: string;
  explanation: string;
  updatedAt: string;
};
