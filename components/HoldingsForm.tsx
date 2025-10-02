"use client";

import { FormEvent, useState } from "react";

export default function HoldingsForm({
  onAdd,
}: {
  onAdd: (symbol: string, shares: number) => Promise<void>;
}) {
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const s = symbol.trim().toUpperCase();
    const qty = Number(shares);
    if (!s || !isFinite(qty) || qty <= 0) return;
    setLoading(true);
    try {
      await onAdd(s, qty);
      setSymbol("");
      setShares("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-3 gap-2 items-end">
      <div className="col-span-2">
        <label className="block text-sm text-[var(--ws-muted)]">
          Ticker symbol
        </label>
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="e.g. AAPL"
          className="mt-1 p-2 rounded-md border w-full bg-[var(--ws-card)] border-[var(--ws-border)] text-[var(--ws-text)] outline-none"
        />
      </div>
      <div>
        <label className="block text-sm text-[var(--ws-muted)]">
          Shares (can be fractional)
        </label>
        <input
          value={shares}
          inputMode="decimal"
          onChange={(e) => setShares(e.target.value)}
          placeholder="e.g. 1.25"
          className="mt-1 p-2 rounded-md border w-full bg-[var(--ws-card)] border-[var(--ws-border)] text-[var(--ws-text)] outline-none"
        />
      </div>
      <div className="col-span-3">
        <button
          disabled={loading}
          className="mt-2 px-4 py-2 bg-[var(--ws-accent)] text-white rounded-md shadow-sm hover:bg-[var(--ws-accent-600)] transition w-full cursor-pointer disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add holding"}
        </button>
      </div>
    </form>
  );
}
