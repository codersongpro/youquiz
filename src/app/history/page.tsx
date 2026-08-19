"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-context";
import type { AttemptDocument } from "@/lib/types";

export default function HistoryPage() {
  const { ready, token, user } = useAuth();
  const [attempts, setAttempts] = useState<AttemptDocument[] | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const value = await token();
        if (!value) throw new Error("Please sign in first.");
        const response = await fetch("/api/history", { headers: { Authorization: `Bearer ${value}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (cancelled) return;
        setAttempts(data.attempts);
        setMessage(data.attempts.length ? "" : "No quizzes yet. Create one from the home page.");
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Unable to load history.");
      }
    })();
    return () => { cancelled = true; };
  }, [ready, user, token]);

  const signedOut = ready && !user;

  return (
    <section className="page">
      <p className="eyebrow">Learning record</p>
      <h1>Quiz history</h1>
      {signedOut && <p className="empty-state">Sign in to see completed and in-progress quizzes here.</p>}
      {!signedOut && message && <p className="empty-state">{message}</p>}
      {!signedOut && attempts && attempts.length > 0 && (
        <div className="video-list">
          {attempts.map((attempt) => {
            const graded = attempt.responses.filter((response) => response.locked);
            const correct = graded.filter((response) => response.isCorrect).length;
            return (
              <Link key={attempt.id} href={`/quiz/${attempt.id}`} className="video-card">
                <span>{attempt.video.title}</span>
                <small>{attempt.status === "completed" ? "Completed" : "In progress"} · {graded.length ? `${correct}/${graded.length} correct` : "Not graded yet"} · {new Date(attempt.updatedAt).toLocaleDateString()}</small>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
