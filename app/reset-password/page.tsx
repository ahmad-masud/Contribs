"use client";

import React, { useState } from "react";
import Link from "next/link";
import { auth } from "../../lib/firebase";
import { sendPasswordResetEmail, AuthError } from "firebase/auth";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function normalizeError(code?: string) {
    if (!code) return "Unable to send reset email";
    switch (code) {
      case "auth/invalid-email":
        return "Enter a valid email address";
      case "auth/user-not-found":
        return "If an account exists for that email, a reset link will be sent";
      case "auth/network-request-failed":
        return "Network error. Check your connection.";
      case "auth/too-many-requests":
        return "Too many requests. Try again later.";
      default:
        return "Unable to send reset email";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      setInfo(
        "If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder.",
      );
    } catch (e: unknown) {
      console.error("Password reset error", e);
      const err = e as AuthError & { code?: string };
      setError(normalizeError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--ws-bg)] text-[var(--ws-text)]">
      <div className="w-full max-w-md space-y-5 p-6 rounded-xl border border-[var(--ws-border)] bg-[var(--ws-card)] shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold">Reset password</h1>
          <p className="text-sm text-[var(--ws-muted)]">
            Enter your email and we will send you a link to reset your password.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm text-[var(--ws-muted)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full p-2 rounded-md border bg-[var(--ws-card)] border-[var(--ws-border)] text-[var(--ws-text)] outline-none focus:outline-none focus:ring-0 text-sm"
              autoComplete="email"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-md bg-[var(--ws-accent)] text-white font-medium hover:bg-[var(--ws-accent-600)] transition cursor-pointer disabled:opacity-60"
          >
            {loading ? "Sending…" : sent ? "Resend link" : "Send reset link"}
          </button>
        </form>
        {error && (
          <div className="text-sm text-rose-600" role="alert">
            {error}
          </div>
        )}
        {info && !error && (
          <div className="text-sm text-emerald-600" role="status">
            {info}
          </div>
        )}
        <div className="text-xs text-[var(--ws-muted)] text-center">
          Remembered your password?{" "}
          <Link href="/" className="text-[var(--ws-accent)] hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
