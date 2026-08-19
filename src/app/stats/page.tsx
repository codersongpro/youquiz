"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-context";
import type { LearningStats } from "@/lib/stats";

export default function StatsPage() {
  const { ready, token, user } = useAuth();
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const value = await token();
        if (!value) throw new Error("Please sign in first.");
        const response = await fetch("/api/stats", { headers: { Authorization: `Bearer ${value}` } });
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
  }, [ready, user, token]);

  const signedOut = ready && !user;

  return (
    <section className="page">
      <p className="eyebrow">Progress</p>
      <h1>Learning statistics</h1>
      <div className="stat-grid">
        <article><span>Quizzes</span><strong>{stats?.quizzes ?? "—"}</strong></article>
        <article><span>Questions answered</span><strong>{stats?.answered ?? "—"}</strong></article>
        <article><span>Accuracy</span><strong>{stats ? `${stats.accuracy}%` : "—"}</strong></article>
      </div>
      {signedOut && <p className="empty-state">Sign in to see your overall and recent results.</p>}
      {!signedOut && message && <p className="empty-state">{message}</p>}
    </section>
  );
}
