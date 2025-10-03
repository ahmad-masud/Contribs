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
  onAdd,
  onAddCash,
  onLoadingChange,
}: {
  items: Holding[];
  netContributed?: number;
  cashBalance?: number;
  onRemove?: (id: string) => void;
  onValueChange?: (totalValue: number) => void;
  onMarketStatusChange?: (unavailable: boolean) => void;
  onAdd?: () => void;
  onAddCash?: () => void;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const [quotes, setQuotes] = useState<Record<string, number>>({});
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchQuotes() {
      if (!items.length) {
        setQuotes({});
        setServiceUnavailable(false);
        setLoadingQuotes(false);
        onLoadingChange?.(false);
        return;
      }
      setLoadingQuotes(true);
      onLoadingChange?.(true);
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
      setLoadingQuotes(false);
      onLoadingChange?.(false);
    }
    if (items.length) fetchQuotes();
    return () => {
      mounted = false;
    };
  }, [items, onLoadingChange, onMarketStatusChange]);

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
    if (!loadingQuotes) {
      onValueChange?.(holdingsValue);
    }
  }, [onValueChange, holdingsValue, loadingQuotes]);
  const profit = totalValue - netContributed;
  const percent = netContributed > 0 ? (profit / netContributed) * 100 : 0;
  const profitClass =
    profit > 0
      ? "text-emerald-600"
      : profit < 0
        ? "text-rose-600"
        : "text-[var(--ws-muted)]";

  const allocation = useMemo(() => {
    if (serviceUnavailable)
      return [] as Array<{ name: string; value: number; color: string }>;
    const palette = [
      "#10b981",
      "#3b82f6",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#14b8a6",
      "#f97316",
      "#22c55e",
    ];
    const parts: Array<{ name: string; value: number; color: string }> = [];
    rows.forEach((r, idx) => {
      if (r.value > 0)
        parts.push({
          name: r.symbol,
          value: r.value,
          color: palette[idx % palette.length],
        });
    });
    if (Number(cashBalance) > 0) {
      parts.push({
        name: "Cash",
        value: Number(cashBalance),
        color: "#64748b",
      });
    }
    const total = parts.reduce((s, p) => s + p.value, 0);
    const filtered = parts.filter((p) =>
      total === 0 ? false : p.value / total >= 0.005,
    );
    return filtered;
  }, [rows, cashBalance, serviceUnavailable]);

  return (
    <div className="p-4 bg-[var(--ws-card)] rounded-lg border border-[var(--ws-border)]">
      <div className="flex items-center justify-between mb-2 gap-2">
        <h3 className="font-medium text-lg">Holdings</h3>
        <div className="flex items-center gap-2">
          {onAddCash && (
            <button
              onClick={onAddCash}
              className="px-3 py-1.5 rounded-md border border-[var(--ws-border)] text-[var(--ws-text)] hover:bg-[var(--ws-hover)] transition cursor-pointer text-sm"
            >
              Cash
            </button>
          )}
          {onAdd && (
            <button
              onClick={onAdd}
              className="px-3 py-1.5 rounded-md border border-[var(--ws-border)] text-[var(--ws-text)] hover:bg-[var(--ws-hover)] transition cursor-pointer text-sm"
            >
              Add holding
            </button>
          )}
        </div>
      </div>
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
          {(serviceUnavailable || loadingQuotes) && (
            <div className="text-xs text-[var(--ws-muted)] bg-[var(--ws-muted-card)] border border-[var(--ws-border)] rounded px-2 py-1">
              {loadingQuotes
                ? "Fetching latest prices…"
                : "Market data service unavailable. Prices and profits are hidden."}
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm">
              <div className="text-[var(--ws-muted)]">Portfolio value</div>
              {loadingQuotes && items.length > 0 ? (
                <div className="text-lg font-semibold tabular-nums opacity-60">
                  —
                </div>
              ) : (
                <div className="text-lg font-semibold tabular-nums">
                  {formatCurrency(totalValue)}
                </div>
              )}
            </div>
            {!serviceUnavailable && !loadingQuotes && (
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
          {!loadingQuotes &&
            allocation.length > 0 &&
            (() => {
              const total = allocation.reduce((s, a) => s + a.value, 0);
              return (
                <div className="mt-3">
                  <div className="text-sm font-medium mb-2">Allocation</div>
                  <div
                    className="w-full h-3 rounded-full bg-[var(--ws-border)] overflow-hidden"
                    role="img"
                    aria-label="Holdings allocation"
                  >
                    <div className="flex h-full">
                      {allocation.map((a, idx) => {
                        const pct = total > 0 ? (a.value / total) * 100 : 0;
                        return (
                          <div
                            key={idx}
                            title={`${a.name}: ${pct.toFixed(1)}%`}
                            style={{
                              width: `${pct}%`,
                              backgroundColor: a.color,
                            }}
                            className="h-full"
                          />
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 text-xs">
                    {allocation.map((a, idx) => {
                      const pct = total > 0 ? (a.value / total) * 100 : 0;
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span
                            className="inline-block w-3 h-3 rounded-sm"
                            style={{ backgroundColor: a.color }}
                          />
                          <span className="truncate" title={a.name}>
                            {a.name}
                          </span>
                          <span className="tabular-nums ml-auto">
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
        </div>
      )}
    </div>
  );
}
