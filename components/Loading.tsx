"use client";

export default function Loading() {
  return (
    <div className="min-h-screen grid place-items-center bg-[var(--ws-bg)] text-[var(--ws-text)]">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 rounded-full border-2 border-[var(--ws-border)] border-t-[var(--ws-accent)] animate-spin" aria-label="Loading" />
        <span className="text-sm text-[var(--ws-muted)]">Loading…</span>
      </div>
    </div>
  );
}
