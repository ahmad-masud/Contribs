"use client";

import { FormEvent } from "react";

export default function ContributionForm({
  amount,
  setAmount,
  date,
  setDate,
  type,
  setType,
  addItem,
}: {
  amount: number;
  setAmount: (val: number) => void;
  date: string;
  setDate: (val: string) => void;
  type: string;
  setType: (val: string) => void;
  addItem: (e: FormEvent) => void;
}) {
  return (
    <form
      onSubmit={addItem}
      className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
    >
      <div>
        <label className="block text-sm text-[var(--ws-muted)]">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="mt-1 p-2 rounded-md border w-full bg-[var(--ws-card)] border-[var(--ws-border)] text-[var(--ws-text)] outline-none focus:outline-none focus:ring-0"
        />
      </div>
      <div>
        <label className="block text-sm text-[var(--ws-muted)]">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 p-2 rounded-md border w-full bg-[var(--ws-card)] border-[var(--ws-border)] text-[var(--ws-text)] cursor-pointer outline-none focus:outline-none focus:ring-0"
        />
      </div>
      <div>
        <label className="block text-sm text-[var(--ws-muted)]">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mt-1 p-2 rounded-md border w-full bg-[var(--ws-card)] border-[var(--ws-border)] text-[var(--ws-text)] cursor-pointer outline-none focus:outline-none focus:ring-0"
        >
          <option value="contribution">Contribution</option>
          <option value="withdrawal">Withdrawal</option>
        </select>
      </div>
      <div className="sm:col-span-3">
        <button className="mt-2 px-4 py-2 bg-[var(--ws-accent)] text-white rounded-md shadow-sm hover:bg-[var(--ws-accent-600)] transition w-full cursor-pointer">
          Add record
        </button>
      </div>
    </form>
  );
}
