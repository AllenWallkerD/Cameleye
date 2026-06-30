"use client";

import { useEffect } from "react";

export type Toast = { id: number; text: string; kind: "ok" | "err" };
export type ConfirmState = { text: string; resolve: (ok: boolean) => void } | null;

export function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-[80] flex -translate-x-1/2 flex-col items-center gap-2 lg:bottom-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className="animate-fade-up pointer-events-auto flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm shadow-lg"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: t.kind === "err" ? "var(--neg)" : "var(--pos)" }}
          />
          {t.text}
        </button>
      ))}
    </div>
  );
}

export function ConfirmDialog({
  state,
  confirmLabel,
  cancelLabel,
  bodyLabel,
  onResolve,
}: {
  state: ConfirmState;
  confirmLabel: string;
  cancelLabel: string;
  bodyLabel: string;
  onResolve: (ok: boolean) => void;
}) {
  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onResolve(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, onResolve]);

  if (!state) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => onResolve(false)} />
      <div className="animate-fade-up relative w-full max-w-sm rounded-2xl border bg-card p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neg/12 text-neg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
          </span>
          <h3 className="mt-4 text-base font-semibold">{state.text}</h3>
          <p className="mt-1 text-sm text-fg-muted">{bodyLabel}</p>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => onResolve(false)}
            className="flex-1 rounded-xl border py-2.5 text-sm font-medium text-fg-muted hover:text-fg"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => onResolve(true)}
            className="flex-1 rounded-xl bg-neg py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
