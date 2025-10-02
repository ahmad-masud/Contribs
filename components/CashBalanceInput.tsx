"use client";

import { useEffect, useRef, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { User } from "firebase/auth";
import { formatCurrency } from "../lib/format";

export default function CashBalanceInput({
  user,
  cash,
  setCash,
}: {
  user: User | null;
  cash: number;
  setCash: (val: number) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const prevRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    let mounted = true;

    getDoc(userRef)
      .then((snapshot) => {
        if (!mounted) return;
        const v = snapshot.exists() ? Number(snapshot.data()?.cash ?? 0) : 0;
        prevRef.current = v;
        setCash(Number.isFinite(v) ? v : 0);
      })
      .finally(() => mounted && setLoaded(true));

    return () => {
      mounted = false;
    };
  }, [user, setCash]);

  useEffect(() => {
    if (!user || !loaded) return;
    if (prevRef.current === cash) return;

    const userRef = doc(db, "users", user.uid);
    setDoc(userRef, { cash }, { merge: true }).then(() => {
      prevRef.current = cash;
    });
  }, [cash, loaded, user]);

  return (
    <div className="p-4 bg-[var(--ws-card)] border border-[var(--ws-border)] rounded-lg">
      <label className="block text-sm text-[var(--ws-muted)]">
        Cash balance
      </label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          step="0.01"
          value={cash}
          onChange={(e) => setCash(Number(e.target.value))}
          className="p-2 rounded-md border w-full sm:w-48 bg-[var(--ws-card)] border-[var(--ws-border)] text-[var(--ws-text)] outline-none focus:outline-none focus:ring-0"
        />
        <span className="text-xs text-[var(--ws-muted)]">
          {formatCurrency(cash)}
        </span>
      </div>
    </div>
  );
}
