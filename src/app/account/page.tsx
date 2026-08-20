"use client";

import { useState } from "react";

export default function AccountPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      if (newPassword !== confirmPassword) throw new Error("New passwords don't match.");
      setLoading(true);
      const response = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setSuccess(true);
      setMessage("Password updated. Other signed-in devices will need to sign in again with the new password.");
    } catch (error) {
      setSuccess(false);
      setMessage(error instanceof Error ? error.message : "Unable to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <p className="eyebrow">Account</p>
      <h1>Change family password</h1>
      <div className="builder">
        <label>Current password<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
        <label>New password<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
        <label>Confirm new password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
        {message && <p className={success ? "note" : "message"} role="status">{message}</p>}
        <button className="button primary" disabled={!currentPassword || !newPassword || !confirmPassword || loading} onClick={() => void submit()}>
          {loading ? "Saving…" : "Update password"}
        </button>
      </div>
    </section>
  );
}
