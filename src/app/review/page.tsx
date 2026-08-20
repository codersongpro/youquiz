"use client";

import { useEffect, useState } from "react";

import type { WrongAnswerRecord } from "@/lib/types";

export default function ReviewPage() {
  const [items, setItems] = useState<WrongAnswerRecord[] | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/review");
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
  }, []);

  return (
    <section className="page">
      <p className="eyebrow">Practice again</p>
      <h1>Review mistakes</h1>
      {message && <p className="empty-state">{message}</p>}
      {items && items.length > 0 && (
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
