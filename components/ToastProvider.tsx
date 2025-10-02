"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

export type ToastVariant = "success" | "error" | "info";

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, "variant">> {
  id: string;
  title?: string;
  description?: string;
  durationMs: number;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, number>>({});

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const handle = timers.current[id];
    if (handle) {
      window.clearTimeout(handle);
      delete timers.current[id];
    }
  }, []);

  const toast = useCallback(
    (opts: ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const item: ToastItem = {
        id,
        title: opts.title,
        description: opts.description,
        variant: opts.variant ?? "info",
        durationMs: opts.durationMs ?? 3000,
      };
      setToasts((prev) => [...prev, item]);
      timers.current[id] = window.setTimeout(() => remove(id), item.durationMs);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={[
              "min-w-[220px] max-w-[360px] p-3 rounded-md shadow-md border",
              "bg-[var(--ws-card)] text-[var(--ws-text)] border-[var(--ws-border)]",
              t.variant === "success" && "border-l-4 border-l-emerald-500",
              t.variant === "error" && "border-l-4 border-l-rose-500",
              t.variant === "info" && "border-l-4 border-l-sky-500",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {t.title && <div className="text-sm font-medium">{t.title}</div>}
            {t.description && (
              <div className="text-xs text-[var(--ws-muted)] mt-0.5">
                {t.description}
              </div>
            )}
            <button
              className="absolute top-1 right-2 text-xs text-[var(--ws-muted)] hover:text-[var(--ws-text)]"
              onClick={() => remove(t.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
