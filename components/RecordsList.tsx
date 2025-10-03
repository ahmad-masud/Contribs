"use client";
import React from "react";
import { formatCurrency, formatDate } from "../lib/format";

interface ContributionItem {
  id: string;
  uid: string;
  type: "contribution" | "withdrawal";
  amount: number;
  date: string;
  createdAt: number;
}

export default function RecordsList({
  items,
  removeItem,
  onAdd,
}: {
  items: ContributionItem[];
  removeItem: (id: string) => void;
  onAdd?: () => void;
}) {
  const groups = React.useMemo(() => {
    const by: Record<string, ContributionItem[]> = {};
    for (const it of items) {
      const key = new Date(it.date).toISOString().slice(0, 10);
      (by[key] ||= []).push(it);
    }
    const orderedDates = Object.keys(by).sort((a, b) => (a < b ? 1 : -1));
    for (const d of orderedDates) {
      by[d].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    }
    return { orderedDates, by };
  }, [items]);

  return (
    <div className="p-4 bg-[var(--ws-card)] rounded-lg border border-[var(--ws-border)]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-lg">Records</h3>
        {onAdd && (
          <button
            onClick={onAdd}
            className="px-3 py-1.5 rounded-md border border-[var(--ws-border)] text-[var(--ws-text)] hover:bg-[var(--ws-hover)] transition cursor-pointer text-sm"
          >
            Add record
          </button>
        )}
      </div>
      {items.length === 0 && (
        <div className="text-sm text-[var(--ws-muted)]">No records yet</div>
      )}
      <div className="space-y-3">
        {groups.orderedDates.map((day) => (
          <div key={day} className="">
            <div className="sticky top-0 bg-[var(--ws-card)] z-0">
              <div className="text-xs text-[var(--ws-muted)] font-medium py-1">
                {formatDate(day)}
              </div>
            </div>
            <div className="space-y-2">
              {groups.by[day].map((it) => {
                const isWithdrawal = it.type === "withdrawal";
                return (
                  <div
                    key={it.id}
                    className="flex flex-wrap items-center justify-between gap-2 border border-[var(--ws-border)] p-2 rounded hover:bg-[var(--ws-hover)] transition"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          isWithdrawal
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20"
                            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                        }`}
                      >
                        {isWithdrawal ? "Withdrawal" : "Contribution"}
                      </span>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatCurrency(Number(it.amount))}
                      </span>
                    </div>
                    <div>
                      <button
                        onClick={() => removeItem(it.id)}
                        className="text-sm text-rose-500 hover:text-rose-600 transition cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
