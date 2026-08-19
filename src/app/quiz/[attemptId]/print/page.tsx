"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-context";
import type { QuizDocument } from "@/lib/types";

const choiceLabels = ["A", "B", "C", "D"];

export default function QuizPrintPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { ready, token, user } = useAuth();
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizDocument | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { void params.then((value) => setAttemptId(value.attemptId)); }, [params]);

  useEffect(() => {
    if (!attemptId || !ready || !user) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const value = await token();
        if (!value) throw new Error("Please sign in first.");
        const response = await fetch(`/api/attempts/${attemptId}`, { headers: { Authorization: `Bearer ${value}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (cancelled) return;
        setQuiz(data.quiz);
        setMessage("");
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Unable to load this quiz.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [attemptId, ready, user, token]);

  if (ready && !user) return <section className="page"><p className="eyebrow">Print</p><h1>Printable quiz</h1><p className="empty-state">Sign in to print this quiz.</p></section>;
  if (loading) return <section className="page"><p className="eyebrow">Print</p><h1>Printable quiz</h1><p className="empty-state">Loading your questions…</p></section>;
  if (!quiz) return <section className="page"><p className="eyebrow">Print</p><h1>Printable quiz</h1><p className="empty-state">{message || "This quiz could not be found."}</p></section>;

  return (
    <section className="page">
      <p className="eyebrow">Print</p>
      <h1>Printable quiz</h1>
      <div className="print-toolbar"><button className="button primary" onClick={() => window.print()}>Print</button></div>

      <article className="print-sheet">
        <header className="print-header">
          <h2>{quiz.video.title}</h2>
          <p>Name: ______________________&nbsp;&nbsp;&nbsp;&nbsp;Date: ______________________</p>
        </header>
        <ol className="print-questions">
          {quiz.questions.map((question) => (
            <li key={question.id} className="print-question">
              <p>{question.prompt}</p>
              {question.type === "multiple_choice" ? (
                <ul className="print-choices">
                  {question.choices?.map((choice, choiceIndex) => (
                    <li key={choiceIndex}>{choiceLabels[choiceIndex]}. {choice}</li>
                  ))}
                </ul>
              ) : (
                <div className="print-answer-lines"><span /><span /></div>
              )}
            </li>
          ))}
        </ol>
      </article>

      <article className="print-sheet print-page-break print-answer-key">
        <header className="print-header">
          <h2>Answer key — {quiz.video.title}</h2>
        </header>
        <ol className="print-questions">
          {quiz.questions.map((question) => (
            <li key={question.id} className="print-question">
              <p>{question.type === "multiple_choice"
                ? `${choiceLabels[question.correctIndex ?? 0]}. ${question.choices?.[question.correctIndex ?? 0] ?? ""}`
                : question.modelAnswer}</p>
              <small>{question.explanation}</small>
            </li>
          ))}
        </ol>
      </article>
    </section>
  );
}
