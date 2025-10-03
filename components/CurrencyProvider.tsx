"use client";

import React, { useCallback, useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { __setCurrencyContext, BASE_CURRENCY } from "../lib/format";

export const SUPPORTED_CURRENCIES = ["CAD", "USD", "EUR", "GBP", "AUD", "JPY"];

interface CurrencyContextValue {
  preferred: string;
  rate: number;
  loading: boolean;
  setPreferred: (code: string) => Promise<void>;
  refreshRate: () => Promise<void>;
}

const CurrencyContext = React.createContext<CurrencyContextValue | undefined>(
  undefined,
);

async function fetchRate(base: string, target: string): Promise<number> {
  if (base === target) return 1;
  try {
    const res = await fetch(
      `/api/fx?base=${encodeURIComponent(base)}&target=${encodeURIComponent(
        target,
      )}`,
    );
    if (!res.ok) return 1;
    const data = await res.json();
    const r = Number(data?.rate);
    return Number.isFinite(r) && r > 0 ? r : 1;
  } catch {
    return 1;
  }
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [preferred, setPreferredState] = useState<string>(BASE_CURRENCY);
  const [rate, setRate] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const user = auth.currentUser;
    let pref: string | null = null;
    try {
      const ls =
        typeof window !== "undefined"
          ? localStorage.getItem("prefCurrency")
          : null;
      if (ls && SUPPORTED_CURRENCIES.includes(ls)) pref = ls;
    } catch {}
    if (user) {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data() as { currency?: string };
          if (data.currency && SUPPORTED_CURRENCIES.includes(data.currency)) {
            pref = data.currency;
          }
        }
      } catch {}
    }
    if (!pref) pref = BASE_CURRENCY;
    setPreferredState(pref);
    const r = await fetchRate(BASE_CURRENCY, pref);
    setRate(r);
    __setCurrencyContext(pref, r);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const unsub = onAuthStateChanged(auth, () => {
      setLoading(true);
      load();
    });
    return () => unsub();
  }, [load]);

  const setPreferred = useCallback(async (code: string) => {
    const upper = code.toUpperCase();
    if (!SUPPORTED_CURRENCIES.includes(upper)) return;
    setLoading(true);
    const r = await fetchRate(BASE_CURRENCY, upper);
    setPreferredState(upper);
    setRate(r);
    __setCurrencyContext(upper, r);
    const user = auth.currentUser;
    if (user) {
      await setDoc(
        doc(db, "users", user.uid),
        { currency: upper },
        { merge: true },
      );
    }
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("prefCurrency", upper);
      }
    } catch {}
    setLoading(false);
  }, []);

  const refreshRate = useCallback(async () => {
    setLoading(true);
    const r = await fetchRate(BASE_CURRENCY, preferred);
    setRate(r);
    __setCurrencyContext(preferred, r);
    setLoading(false);
  }, [preferred]);

  return (
    <CurrencyContext.Provider
      value={{ preferred, rate, loading, setPreferred, refreshRate }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = React.useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
