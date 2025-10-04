"use client";

import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../lib/firebase";
import { formatCurrency, formatDate } from "../../lib/format";
import Link from "next/link";
import {
  updateProfile,
  deleteUser,
  reauthenticateWithPopup,
  GoogleAuthProvider,
  User,
} from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

export default function AccountPage() {
  const [user, loading] = useAuthState(auth);
  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || "");
    const userRef = doc(db, "users", user.uid);
    getDoc(userRef).then((snap) => {
      if (snap.exists()) {
        const bd = (snap.data() as { birthDate?: string } | undefined)
          ?.birthDate;
        if (typeof bd === "string" && bd.length >= 8) {
          setBirthDate(bd);
        } else {
          setBirthDate("");
        }
      } else {
        setBirthDate("");
      }
    });
  }, [user]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateProfile(user as User, { displayName: displayName || null });
      if (birthDate !== "") {
        if (!isNaN(new Date(birthDate).getTime())) {
          await setDoc(
            doc(db, "users", user.uid),
            { birthDate },
            { merge: true },
          );
        } else {
          throw new Error("Please enter a valid birth date");
        }
      }
      setSuccess("Profile updated");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update profile");
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete account");
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to export data");
    } finally {
      setDownloading(false);
    }
  }

  async function handleExportPdf() {
    if (!user) return;
    setError(null);
    setSuccess(null);
    setExportingPdf(true);
    try {
      const [contribSnap, holdingSnap, userSnap] = await Promise.all([
        getDocs(
          query(collection(db, "contributions"), where("uid", "==", user.uid)),
        ),
        getDocs(
          query(collection(db, "holdings"), where("uid", "==", user.uid)),
        ),
        getDoc(doc(db, "users", user.uid)),
      ]);

      type Contribution = {
        id: string;
        uid: string;
        amount: number;
        date: string;
        type: "contribution" | "withdrawal";
        createdAt: number;
      };
      const contributions: Contribution[] = contribSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Contribution, "id">) }))
        .map((it) => ({
          ...it,
          amount: Number(it.amount || 0),
          date: it.date,
          type: it.type as "contribution" | "withdrawal",
          createdAt: Number(it.createdAt || 0),
        }));
      type HoldingRow = {
        id: string;
        uid: string;
        symbol: string;
        shares: number;
        createdAt: number;
      };
      const holdings: HoldingRow[] = holdingSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<HoldingRow, "id">) }))
        .map((h) => ({
          ...h,
          symbol: String(h.symbol || "").toUpperCase(),
          shares: Number(h.shares || 0),
        }));
      const cash = userSnap.exists()
        ? Number((userSnap.data() as { cash?: number } | undefined)?.cash || 0)
        : 0;

      const totalContrib = contributions
        .filter((c) => c.type === "contribution")
        .reduce((s, c) => s + Number(c.amount || 0), 0);
      const totalWithdrawals = contributions
        .filter((c) => c.type === "withdrawal")
        .reduce((s, c) => s + Number(c.amount || 0), 0);
      const netContributed = totalContrib - totalWithdrawals;

      const recent = [...contributions]
        .sort((a, b) => {
          const ad = new Date(a.date).getTime();
          const bd = new Date(b.date).getTime();
          if (ad === bd) return Number(b.createdAt) - Number(a.createdAt);
          return bd - ad;
        })
        .slice(0, 10);

      const { jsPDF } = await import("jspdf");
      const docPdf = new jsPDF();
      const margin = 14;
      let y = margin;

      docPdf.setFontSize(16);
      docPdf.text("Contribs Account Statement", margin, y);
      y += 8;
      docPdf.setFontSize(10);
      docPdf.text(`Exported: ${new Date().toLocaleString()}`, margin, y);
      y += 6;
      docPdf.text(
        `User: ${user.displayName || "Unnamed"} (${user.email || ""})`,
        margin,
        y,
      );
      y += 6;
      if (birthDate) {
        docPdf.text(`Birth date: ${birthDate}`, margin, y);
        y += 6;
      }

      y += 2;
      docPdf.setFontSize(12);
      docPdf.text("Summary", margin, y);
      y += 6;
      docPdf.setFontSize(10);
      docPdf.text(
        `Total contributions: ${formatCurrency(totalContrib)}`,
        margin,
        y,
      );
      y += 5;
      docPdf.text(
        `Total withdrawals: ${formatCurrency(totalWithdrawals)}`,
        margin,
        y,
      );
      y += 5;
      docPdf.text(
        `Net TFSA contributed: ${formatCurrency(netContributed)}`,
        margin,
        y,
      );
      y += 5;
      docPdf.text(`Cash balance: ${formatCurrency(cash)}`, margin, y);
      y += 8;

      docPdf.setFontSize(12);
      docPdf.text("Holdings", margin, y);
      y += 6;
      docPdf.setFontSize(10);
      if (holdings.length === 0) {
        docPdf.text("No holdings", margin, y);
        y += 6;
      } else {
        for (const h of holdings) {
          docPdf.text(`${h.symbol} • ${h.shares} shares`, margin, y);
          y += 5;
          if (y > 280) {
            docPdf.addPage();
            y = margin;
          }
        }
        y += 2;
      }

      docPdf.setFontSize(12);
      docPdf.text("Recent transactions", margin, y);
      y += 6;
      docPdf.setFontSize(10);
      if (recent.length === 0) {
        docPdf.text("No recent transactions", margin, y);
        y += 6;
      } else {
        for (const r of recent) {
          const line = `${formatDate(r.date)} • ${r.type} • ${formatCurrency(Number(r.amount || 0))}`;
          docPdf.text(line, margin, y);
          y += 5;
          if (y > 280) {
            docPdf.addPage();
            y = margin;
          }
        }
      }

      docPdf.save(
        `contribs-statement-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
      setSuccess("Statement exported");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to export statement");
    } finally {
      setExportingPdf(false);
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
          <Link
            href="/"
            className="text-sm text-[var(--ws-muted)] hover:underline"
          >
            Back to app
          </Link>
        </header>

        <section className="p-4 bg-[var(--ws-card)] rounded-lg border border-[var(--ws-border)]">
          <h2 className="font-medium text-lg mb-2">Profile</h2>
          <div className="text-sm text-[var(--ws-muted)] mb-3">
            Manage your Google-linked profile details.
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
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
            <div>
              <label className="block text-sm text-[var(--ws-muted)]">
                Birth date
              </label>
              <input
                type="date"
                className="mt-1 p-2 rounded-md border w-full bg-[var(--ws-card)] border-[var(--ws-border)] text-[var(--ws-text)] outline-none focus:outline-none focus:ring-0"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
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
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-2 rounded-md border border-[var(--ws-border)] hover:bg-[var(--ws-hover)] transition cursor-pointer disabled:opacity-50"
            >
              {downloading ? "Preparing…" : "Download my data"}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="px-4 py-2 rounded-md border border-[var(--ws-border)] hover:bg-[var(--ws-hover)] transition cursor-pointer disabled:opacity-50"
            >
              {exportingPdf ? "Building…" : "Export statement (PDF)"}
            </button>
          </div>
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
