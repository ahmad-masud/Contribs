"use client";
import React from "react";
import { SUPPORTED_CURRENCIES, useCurrency } from "./CurrencyProvider";

export default function CurrencySelector() {
  const { preferred, setPreferred, loading, rate, refreshRate } = useCurrency();
  return (
    <div className="flex items-center gap-1 text-xs">
      <select
        aria-label="Preferred currency"
        value={preferred}
        disabled={loading}
        onChange={(e) => setPreferred(e.target.value)}
        className="px-1.5 py-1 rounded-md border border-[var(--ws-border)] bg-[var(--ws-card)] text-[var(--ws-text)] outline-none focus:outline-none focus:ring-0 cursor-pointer"
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <button
        type="button"
        title="Refresh FX rate"
        onClick={() => refreshRate()}
        disabled={loading}
        className="px-2 py-1 rounded-md border border-[var(--ws-border)] hover:bg-[var(--ws-hover)] text-[var(--ws-muted)] disabled:opacity-50"
      >
        ⟳
      </button>
      <span className="text-[var(--ws-muted)] hidden sm:inline">
        {preferred !== "CAD" &&
          !loading &&
          `1 CAD → ${rate.toFixed(3)} ${preferred}`}
      </span>
    </div>
  );
}
