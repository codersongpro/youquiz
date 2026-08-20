"use client";

import { useEffect, useState } from "react";

import type { LearningStats } from "@/lib/stats";

export default function StatsPage() {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/stats");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (cancelled) return;
        setStats(data);
        setMessage("");
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Unable to load statistics.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="page">
      <p className="eyebrow">Progress</p>
      <h1>Learning statistics</h1>
      <div className="stat-grid">
        <article><span>Quizzes</span><strong>{stats?.quizzes ?? "—"}</strong></article>
        <article><span>Questions answered</span><strong>{stats?.answered ?? "—"}</strong></article>
        <article><span>Accuracy</span><strong>{stats ? `${stats.accuracy}%` : "—"}</strong></article>
      </div>
      {message && <p className="empty-state">{message}</p>}
    </section>
  );
}
