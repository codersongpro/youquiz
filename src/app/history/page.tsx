"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { AttemptDocument } from "@/lib/types";

export default function HistoryPage() {
  const [attempts, setAttempts] = useState<AttemptDocument[] | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/history");
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
  }, []);

  return (
    <section className="page">
      <p className="eyebrow">Learning record</p>
      <h1>Quiz history</h1>
      {message && <p className="empty-state">{message}</p>}
      {attempts && attempts.length > 0 && (
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
