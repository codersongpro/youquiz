"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-context";
import type { WrongAnswerRecord } from "@/lib/types";

export default function ReviewPage() {
  const { ready, token, user } = useAuth();
  const [items, setItems] = useState<WrongAnswerRecord[] | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const value = await token();
        if (!value) throw new Error("Please sign in first.");
        const response = await fetch("/api/review", { headers: { Authorization: `Bearer ${value}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (cancelled) return;
        setItems(data.items);
        setMessage(data.items.length ? "" : "No mistakes to review yet.");
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Unable to load review items.");
      }
    })();
    return () => { cancelled = true; };
  }, [ready, user, token]);

  const signedOut = ready && !user;

  return (
    <section className="page">
      <p className="eyebrow">Practice again</p>
      <h1>Review mistakes</h1>
      {signedOut && <p className="empty-state">Sign in to revisit questions that need another look.</p>}
      {!signedOut && message && <p className="empty-state">{message}</p>}
      {!signedOut && items && items.length > 0 && (
        <div className="video-list">
          {items.map((item) => (
            <div key={`${item.attemptId}_${item.questionId}`} className="video-card">
              <span>{item.prompt}</span>
              <small>{item.videoTitle}</small>
              <small>Your answer: {item.answer}</small>
              {item.feedback && <small>{item.feedback}</small>}
              {item.explanation && <small>Explanation: {item.explanation}</small>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
