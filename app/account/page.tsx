"use client";

import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../lib/firebase";
import {
  updateProfile,
  deleteUser,
  reauthenticateWithPopup,
  GoogleAuthProvider,
  User,
} from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function AccountPage() {
  const [user, loading] = useAuthState(auth);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) setDisplayName(user.displayName || "");
  }, [user]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateProfile(user as User, { displayName: displayName || null });
      setSuccess("Profile updated");
    } catch (e: any) {
      setError(e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!user) return;
    setError(null);
    setSuccess(null);
    try {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
      await deleteUser(user);
    } catch (e: any) {
      setError(e?.message || "Failed to delete account");
    }
  }

  async function handleDownload() {
    if (!user) return;
    setError(null);
    setSuccess(null);
    setDownloading(true);
    try {
      const contribSnap = await getDocs(
        query(collection(db, "contributions"), where("uid", "==", user.uid)),
      );
      const holdingSnap = await getDocs(
        query(collection(db, "holdings"), where("uid", "==", user.uid)),
      );

      const contributions = contribSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Record<string, unknown>),
      }));
      const holdings = holdingSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Record<string, unknown>),
      }));

      const payload = {
        exportedAt: new Date().toISOString(),
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        },
        contributions,
        holdings,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contribs-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSuccess("Data exported");
    } catch (e: any) {
      setError(e?.message || "Failed to export data");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ws-bg)] text-[var(--ws-text)]">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ws-bg)] text-[var(--ws-text)]">
        Please sign in to manage your account.
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold">Account</h1>
          <a
            href="/"
            className="text-sm text-[var(--ws-muted)] hover:underline"
          >
            Back to app
          </a>
        </header>

        <section className="p-4 bg-[var(--ws-card)] rounded-lg border border-[var(--ws-border)]">
          <h2 className="font-medium text-lg mb-2">Profile</h2>
          <div className="text-sm text-[var(--ws-muted)] mb-3">
            Manage your Google-linked profile details.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-[var(--ws-muted)]">
                Display name
              </label>
              <input
                className="mt-1 p-2 rounded-md border w-full bg-[var(--ws-card)] border-[var(--ws-border)] text-[var(--ws-text)] outline-none focus:outline-none focus:ring-0"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--ws-muted)]">
                Email
              </label>
              <input
                className="mt-1 p-2 rounded-md border w-full bg-[var(--ws-muted-card)] border-[var(--ws-border)] text-[var(--ws-text)] opacity-80 outline-none focus:outline-none focus:ring-0 cursor-not-allowed select-none"
                value={user.email || ""}
                readOnly
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="px-4 py-2 rounded-md bg-[var(--ws-accent)] text-white hover:bg-[var(--ws-accent-600)] transition cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {success && (
              <span className="text-emerald-600 text-sm self-center">
                {success}
              </span>
            )}
            {error && (
              <span className="text-rose-600 text-sm self-center">{error}</span>
            )}
          </div>
        </section>

        <section className="p-4 bg-[var(--ws-card)] rounded-lg border border-[var(--ws-border)]">
          <h2 className="font-medium text-lg mb-2">Data & privacy</h2>
          <p className="text-sm text-[var(--ws-muted)] mb-3">
            Download a copy of your data (contributions and holdings) as JSON.
          </p>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-2 rounded-md border border-[var(--ws-border)] hover:bg-[var(--ws-hover)] transition cursor-pointer disabled:opacity-50"
          >
            {downloading ? "Preparing…" : "Download my data"}
          </button>
        </section>

        <section className="p-4 bg-[var(--ws-card)] rounded-lg border border-[var(--ws-border)]">
          <h2 className="font-medium text-lg mb-2">Danger zone</h2>
          <p className="text-sm text-[var(--ws-muted)] mb-3">
            Deleting your account will remove your profile and sign you out.
            Your Firestore data for contributions and holdings will remain
            unless you remove it separately.
          </p>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer"
          >
            Delete account
          </button>
        </section>
      </div>
    </div>
  );
}
