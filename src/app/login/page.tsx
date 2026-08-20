"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const next = new URLSearchParams(window.location.search).get("next") || "/";
      window.location.href = next;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page home">
      <section className="hero">
        <p className="eyebrow">Video learning, made personal</p>
        <h1>YouQuiz</h1>
        <p>Enter the family password to continue.</p>
      </section>
      <section className="builder">
        <label>
          Password
          <input
            type="password"
            value={password}
            autoFocus
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") void submit(); }}
          />
        </label>
        {message && <p className="message" role="alert">{message}</p>}
        <button className="button primary" disabled={!password || loading} onClick={() => void submit()}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </section>
    </div>
  );
}
