"use client";

import { useState } from "react";
import { useApp } from "./app-provider";
import { useModal } from "@/lib/use-modal";
import type { Goal } from "@/lib/data";

// Confirm deleting a goal, offering to also drop its linked contributions
// (returning that money to the balance) or keep them as unlinked history.
export function DeleteGoalDialog({
  goal,
  count,
  onCancel,
  onConfirm,
}: {
  goal: Goal;
  count: number;
  onCancel: () => void;
  onConfirm: (alsoDelete: boolean) => void;
}) {
  const { t } = useApp();
  const [alsoDelete, setAlsoDelete] = useState(true);
  const panelRef = useModal(true, onCancel);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className="animate-fade-up relative w-full max-w-sm rounded-2xl border bg-card p-6 shadow-2xl"
      >
        <h2 className="text-lg font-semibold">{t("goalDel.title")}</h2>
        <p className="mt-1 text-sm text-fg-muted">
          {goal.title}
          {count > 0 && ` · ${count} ${t("goalDel.linked")}`}
        </p>

        {count > 0 && (
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border bg-card-muted p-3">
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
                alsoDelete ? "border-accent bg-accent text-white" : "border-border"
              }`}
            >
              {alsoDelete && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5L20 6" />
                </svg>
              )}
            </span>
            <input
              type="checkbox"
              checked={alsoDelete}
              onChange={(e) => setAlsoDelete(e.target.checked)}
              className="sr-only"
            />
            <span className="min-w-0">
              <span className="text-sm font-medium">{t("goalDel.also")}</span>
              <span className="mt-0.5 block text-xs text-fg-muted">{t("goalDel.alsoHint")}</span>
            </span>
          </label>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border py-2.5 text-sm font-medium text-fg-muted hover:text-fg"
          >
            {t("tx.cancel")}
          </button>
          <button
            onClick={() => onConfirm(count > 0 && alsoDelete)}
            className="flex-1 rounded-xl bg-neg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("tx.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
