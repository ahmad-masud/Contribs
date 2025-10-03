"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "../../lib/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signInWithEmailAndPassword,
  AuthError,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function normalizeError(code?: string) {
    if (!code) return "Unable to create account";
    switch (code) {
      case "auth/email-already-in-use":
        return "Email is already in use";
      case "auth/invalid-email":
        return "Enter a valid email address";
      case "auth/weak-password":
        return "Password is too weak";
      case "auth/operation-not-allowed":
        return "Email/password sign-up disabled";
      case "auth/network-request-failed":
        return "Network error. Check your connection.";
      default:
        return "Unable to create account";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      await setDoc(
        doc(db, "users", cred.user.uid),
        {
          createdAt: Date.now(),
          email: cred.user.email,
          displayName: name.trim() || null,
        },
        { merge: true },
      );
      await sendEmailVerification(cred.user);
      setSent(true);
      setInfo(
        "Verification email sent. Please check your inbox (and spam) then refresh after verifying.",
      );
    } catch (e: unknown) {
      console.error("Registration error", e);
      const err = e as AuthError & { code?: string };
      setError(normalizeError(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function signInAfterVerification() {
    setError(null);
    setInfo(null);
    if (!email || !password) return;
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (!cred.user.emailVerified) {
        setInfo("Email not yet verified. Verify to continue.");
      } else {
        router.push("/");
        return;
      }
    } catch (e: unknown) {
      console.error("Post-verification sign-in error", e);
      setError("Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--ws-bg)] text-[var(--ws-text)]">
      <div className="w-full max-w-md space-y-5 p-6 rounded-xl border border-[var(--ws-border)] bg-[var(--ws-card)] shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold">Create your account</h1>
          <p className="text-sm text-[var(--ws-muted)]">
            Register with email & password. A verification link will be sent.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-[var(--ws-muted)]">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full p-2 rounded-md border bg-[var(--ws-card)] border-[var(--ws-border)] outline-none focus:outline-none focus:ring-0"
              autoComplete="name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--ws-muted)]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full p-2 rounded-md border bg-[var(--ws-card)] border-[var(--ws-border)] outline-none focus:outline-none focus:ring-0"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--ws-muted)]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2 rounded-md border bg-[var(--ws-card)] border-[var(--ws-border)] outline-none focus:outline-none focus:ring-0"
              autoComplete="new-password"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--ws-muted)]">
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              className="w-full p-2 rounded-md border bg-[var(--ws-card)] border-[var(--ws-border)] outline-none focus:outline-none focus:ring-0"
              autoComplete="new-password"
              required
            />
          </div>
          <div className="pt-1">
            <button
              disabled={loading}
              className="w-full px-4 py-2 rounded-md bg-[var(--ws-accent)] text-white font-medium hover:bg-[var(--ws-accent-600)] transition cursor-pointer disabled:opacity-60"
              type="submit"
            >
              {loading ? "Creating…" : sent ? "Resend email" : "Create account"}
            </button>
          </div>
        </form>
        {error && (
          <div className="text-sm text-rose-600" role="alert">
            {error}
          </div>
        )}
        {info && <div className="text-sm text-emerald-600">{info}</div>}
        {sent && (
          <div className="space-y-2">
            <button
              onClick={signInAfterVerification}
              disabled={loading}
              className="w-full px-4 py-2 rounded-md border border-[var(--ws-border)] hover:bg-[var(--ws-hover)] transition cursor-pointer disabled:opacity-60 text-sm"
            >
              I verified my email – Sign me in
            </button>
          </div>
        )}
        <div className="text-xs text-[var(--ws-muted)] text-center">
          Already have an account?{" "}
          <Link href="/" className="text-[var(--ws-accent)] hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
