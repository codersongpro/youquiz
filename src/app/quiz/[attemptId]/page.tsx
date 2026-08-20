"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { AttemptDocument, QuizDocument, StoredResponse } from "@/lib/types";

function responseFor(attempt: AttemptDocument | null, questionId: string): StoredResponse | undefined {
  return attempt?.responses.find((response) => response.questionId === questionId);
}

export default function QuizPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<AttemptDocument | null>(null);
  const [quiz, setQuiz] = useState<QuizDocument | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);

  useEffect(() => { void params.then((value) => setAttemptId(value.attemptId)); }, [params]);

  useEffect(() => {
    if (!attemptId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/attempts/${attemptId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (cancelled) return;
        setAttempt(data.attempt);
        setQuiz(data.quiz);
        setMessage("");
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Unable to load this quiz.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [attemptId]);

  const saveAnswer = async (questionId: string, type: "multiple_choice" | "short_answer", raw: string) => {
    if (!attemptId || raw.trim() === "") return;
    const answer = type === "multiple_choice" ? Number(raw) : raw.trim();
    try {
      setSavingId(questionId);
      const response = await fetch(`/api/attempts/${attemptId}/responses/${questionId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAttempt((current) => {
        if (!current) return current;
        const saved: StoredResponse = { questionId, type, answer, isCorrect: null, locked: false, answeredAt: new Date().toISOString() };
        return { ...current, responses: [...current.responses.filter((item) => item.questionId !== questionId), saved] };
      });
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save this answer.");
    } finally {
      setSavingId(null);
    }
  };

  const seeResults = async () => {
    if (!attemptId) return;
    try {
      setGrading(true);
      const response = await fetch(`/api/attempts/${attemptId}/grade`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAttempt((current) => current ? { ...current, responses: data.responses } : current);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to grade your answers.");
    } finally {
      setGrading(false);
    }
  };

  if (loading) return <section className="page"><p className="eyebrow">Quiz</p><h1>Your quiz is ready</h1><p className="empty-state">Loading your questions…</p></section>;
  if (!quiz || !attempt) return <section className="page"><p className="eyebrow">Quiz</p><h1>Your quiz is ready</h1><p className="empty-state">{message || "This quiz could not be found."}</p></section>;

  const answeredUnlocked = attempt.responses.some((response) => !response.locked);
  const correctCount = attempt.responses.filter((response) => response.isCorrect === true).length;
  const lockedCount = attempt.responses.filter((response) => response.locked).length;

  return (
    <section className="page">
      <p className="eyebrow">{quiz.video.title}</p>
      <h1>{attempt.status === "completed" ? "Quiz complete" : "Answer each question"}</h1>
      <Link href={`/quiz/${attemptId}/print`} className="secondary-button">Print worksheet &amp; answer key</Link>
      {lockedCount > 0 && <p className="selected-video">Score so far: {correctCount} / {lockedCount} graded{attempt.status === "completed" ? "" : ` (of ${quiz.questions.length} questions)`}</p>}
      <div className="video-list">
        {quiz.questions.map((question, index) => {
          const saved = responseFor(attempt, question.id);
          const draft = drafts[question.id] ?? (typeof saved?.answer === "string" ? saved.answer : saved?.answer !== undefined ? String(saved.answer) : "");
          const locked = Boolean(saved?.locked);
          return (
            <div key={question.id} className="video-card">
              <strong>{index + 1}. {question.prompt}</strong>
              {question.type === "multiple_choice" ? (
                <fieldset>
                  {question.choices?.map((choice, choiceIndex) => (
                    <label key={choiceIndex}>
                      <input type="radio" name={question.id} disabled={locked} checked={draft === String(choiceIndex)} onChange={() => { setDrafts((current) => ({ ...current, [question.id]: String(choiceIndex) })); void saveAnswer(question.id, "multiple_choice", String(choiceIndex)); }} /> {choice}
                    </label>
                  ))}
                </fieldset>
              ) : (
                <label>
                  Your answer
                  <textarea rows={3} disabled={locked} value={draft} onChange={(event) => setDrafts((current) => ({ ...current, [question.id]: event.target.value }))} onBlur={(event) => void saveAnswer(question.id, "short_answer", event.target.value)} />
                </label>
              )}
              {savingId === question.id && <small>Saving…</small>}
              {locked && <small className={saved?.isCorrect ? "note" : "message"} role="status">{saved?.isCorrect ? "Correct. " : "Not quite. "}{saved?.feedback}</small>}
            </div>
          );
        })}
      </div>
      {message && <p className="message" role="alert">{message}</p>}
      {attempt.status !== "completed" && <button className="button primary" disabled={!answeredUnlocked || grading} onClick={() => void seeResults()}>{grading ? "Grading…" : "Save & see current results"}</button>}
    </section>
  );
}
