"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../lib/format";

export interface Holding {
  id: string;
  uid: string;
  symbol: string;
  shares: number;
  createdAt: number;
}

export default function HoldingsList({
  items,
  netContributed = 0,
  cashBalance = 0,
  onRemove,
  onValueChange,
  onMarketStatusChange,
}: {
  items: Holding[];
  netContributed?: number;
  cashBalance?: number;
  onRemove?: (id: string) => void;
  onValueChange?: (totalValue: number) => void;
  onMarketStatusChange?: (unavailable: boolean) => void;
}) {
  const [quotes, setQuotes] = useState<Record<string, number>>({});
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchQuotes() {
      const unique = Array.from(new Set(items.map((i) => i.symbol)));
      let unavailable = false;
      const entries = await Promise.all(
        unique.map(async (sym) => {
          try {
            const res = await fetch(
              `/api/quote?symbol=${encodeURIComponent(sym)}`,
            );
            if (res.status === 503) {
              unavailable = true;
            }
            const data = await res.json();
            const price = Number(data?.price);
            return [sym, isFinite(price) ? price : 0] as const;
          } catch {
            return [sym, 0] as const;
          }
        }),
      );
      if (!mounted) return;
      setQuotes(Object.fromEntries(entries));
      setServiceUnavailable(unavailable);
      onMarketStatusChange?.(unavailable);
    }
    if (items.length) fetchQuotes();
    return () => {
      mounted = false;
    };
  }, [items]);

  const rows = useMemo(() => {
    return items.map((h) => {
      const price = quotes[h.symbol] ?? 0;
      const value = price * h.shares;
      return { ...h, price, value };
    });
  }, [items, quotes]);

  const holdingsValue = rows.reduce((sum, r) => sum + r.value, 0);
  const totalValue = holdingsValue + Number(cashBalance || 0);
  useEffect(() => {
    onValueChange?.(holdingsValue);
  }, [onValueChange, holdingsValue]);
  const profit = totalValue - netContributed;
  const percent = netContributed > 0 ? (profit / netContributed) * 100 : 0;
  const profitClass =
    profit > 0
      ? "text-emerald-600"
      : profit < 0
        ? "text-rose-600"
        : "text-[var(--ws-muted)]";

  return (
    <div className="p-4 bg-[var(--ws-card)] rounded-lg border border-[var(--ws-border)]">
      <h3 className="font-medium text-lg mb-2">Holdings</h3>
      {rows.length === 0 && Number(cashBalance) <= 0 ? (
        <div className="text-sm text-[var(--ws-muted)]">No holdings yet</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 sm:justify-between text-sm"
            >
              <div className="font-medium">{r.symbol}</div>
              <div className="text-[var(--ws-muted)] order-3 sm:order-none">
                {r.shares} shares
              </div>
              <div className="tabular-nums">{formatCurrency(r.price)}</div>
              <div className="font-semibold tabular-nums">
                {formatCurrency(r.value)}
              </div>
              {onRemove && (
                <button
                  className="text-rose-500 hover:text-rose-600 cursor-pointer justify-self-start sm:justify-self-auto"
                  onClick={() => onRemove(r.id)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <div className="h-px bg-[var(--ws-border)]" />
          {serviceUnavailable && (
            <div className="text-xs text-[var(--ws-muted)] bg-[var(--ws-muted-card)] border border-[var(--ws-border)] rounded px-2 py-1">
              Market data service unavailable. Prices and profits are hidden.
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm">
              <div className="text-[var(--ws-muted)]">Portfolio value</div>
              <div className="text-lg font-semibold tabular-nums">
                {formatCurrency(totalValue)}
              </div>
            </div>
            {!serviceUnavailable && (
              <div className="text-right text-sm">
                <div className="text-[var(--ws-muted)]">Profit</div>
                <div
                  className={`text-lg font-semibold tabular-nums ${profitClass}`}
                >
                  {formatCurrency(profit)}{" "}
                  <span className="text-xs align-middle">
                    ({percent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <div className="text-[var(--ws-muted)]">Net TFSA contributed</div>
            <div className="tabular-nums">{formatCurrency(netContributed)}</div>
          </div>
          {Number(cashBalance) > 0 && (
            <div className="flex items-center justify-between text-[10px] mt-1">
              <div className="text-[var(--ws-muted)]">Includes cash</div>
              <div className="tabular-nums">
                {formatCurrency(Number(cashBalance))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
