"use client";

import React, { useState } from "react";
import { auth } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  AuthError,
} from "firebase/auth";

export default function EmailPasswordSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sentVerification, setSentVerification] = useState(false);

  function normalizeError(code?: string) {
    if (!code) return "Authentication failed";
    switch (code) {
      case "auth/invalid-email":
        return "Enter a valid email address";
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Invalid email or password";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/network-request-failed":
        return "Network error. Check your connection.";
      default:
        return "Authentication failed";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email || !password) {
      setError("Email and password required");
      return;
    }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (!cred.user.emailVerified) {
        setInfo("Email not verified yet. Check your inbox or resend.");
      } else {
        setInfo("Signed in successfully.");
      }
    } catch (e: unknown) {
      console.error("Sign in error", e);
      const err = e as AuthError & { code?: string };
      setError(normalizeError(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function resendVerification() {
    setError(null);
    setInfo(null);
    const user = auth.currentUser;
    if (!user) {
      setError("Sign in first to resend verification.");
      return;
    }
    if (user.emailVerified) {
      setInfo("Email already verified.");
      return;
    }
    try {
      setLoading(true);
      await sendEmailVerification(user);
      setSentVerification(true);
      setInfo("Verification email sent. Check your inbox.");
    } catch (e: unknown) {
      console.error("Resend verification error", e);
      const err = e as AuthError & { code?: string };
      setError(normalizeError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mt-2 space-y-4 text-left"
      aria-label="Email sign in form"
    >
      <div className="space-y-1">
        <label className="block text-sm text-[var(--ws-muted)] text-left">
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
      <div className="space-y-1">
        <label className="block text-sm text-[var(--ws-muted)] text-left">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full p-2 rounded-md border bg-[var(--ws-card)] border-[var(--ws-border)] text-[var(--ws-text)] outline-none focus:outline-none focus:ring-0 text-sm"
          autoComplete="current-password"
          required
        />
      </div>
      {error && (
        <div className="text-xs text-rose-600" role="alert">
          {error}
        </div>
      )}
      {info && !error && (
        <div className="text-xs text-emerald-600" role="status">
          {info}
        </div>
      )}
      <div className="flex flex-col gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="w-full px-3 py-2 rounded-md bg-[var(--ws-accent)] text-white text-sm font-medium hover:bg-[var(--ws-accent-600)] transition cursor-pointer disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={resendVerification}
          disabled={loading}
          className="w-full px-3 py-2 rounded-md border border-[var(--ws-border)] text-sm hover:bg-[var(--ws-hover)] transition cursor-pointer disabled:opacity-60"
        >
          {sentVerification
            ? "Resend email verification"
            : "Send verification email"}
        </button>
        <a
          href="/reset-password"
          className="text-[var(--ws-accent)] text-xs text-center hover:underline mt-1"
        >
          Forgot password?
        </a>
      </div>
    </form>
  );
}
