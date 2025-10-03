"use client";

import React, { useEffect } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative w-full ${width} bg-[var(--ws-card)] border border-[var(--ws-border)] rounded-lg shadow-lg`}
      >
        <div className="flex items-center justify-between p-3 border-b border-[var(--ws-border)]">
          <h3 className="font-medium">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="px-2 py-1 rounded-md hover:bg-[var(--ws-hover)] cursor-pointer"
          >
            ×
          </button>
        </div>
        <div className="p-3">{children}</div>
      </div>
    </div>
  );
}
