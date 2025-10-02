"use client";
import { formatCurrency, formatDate } from "../lib/format";

export default function RecordsList({
  items,
  removeItem,
}: {
  items: any[];
  removeItem: (id: string) => void;
}) {
  return (
    <div className="p-4 bg-[var(--ws-card)] rounded-lg border border-[var(--ws-border)] max-h-96 overflow-y-auto">
      <h3 className="font-medium text-lg">Records</h3>
      <div className="mt-3 space-y-2">
        {items.length === 0 && (
          <div className="text-sm text-[var(--ws-muted)]">No records yet</div>
        )}
        {items.map((it) => (
          <div
            key={it.id}
            className="flex items-center justify-between border border-[var(--ws-border)] p-2 rounded hover:bg-[var(--ws-hover)] transition"
          >
            <div>
              <div className="text-sm font-medium capitalize">
                {it.type} {formatCurrency(Number(it.amount))}
              </div>
              <div className="text-xs text-[var(--ws-muted)]">
                {formatDate(it.date)}
              </div>
            </div>
            <div>
              <button
                onClick={() => removeItem(it.id)}
                className="text-sm text-red-500 hover:text-red-700 transition cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
