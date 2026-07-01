"use client";

import { useState } from "react";
import { useApp } from "./app-provider";
import { Icon } from "./icons";
import { formatMoney } from "@/lib/currency";
import { useModal } from "@/lib/use-modal";
import { AddGoalDrawer } from "./add-goal-drawer";
import { ContributeDrawer } from "./contribute-drawer";
import type { Goal } from "@/lib/data";

export function Goals() {
  const { t, currency, goals, transactions, removeGoal, confirm } = useApp();
  const [open, setOpen] = useState(false);
  const [contrib, setContrib] = useState<Goal | null>(null);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [pendingDel, setPendingDel] = useState<Goal | null>(null);

  async function del(g: Goal) {
    const linked = transactions.filter((x) => x.goalId === g.id).length;
    if (linked === 0) {
      // nothing attached — a plain confirm is enough
      if (await confirm(t("confirm.delete"))) removeGoal(g.id);
      return;
    }
    setPendingDel(g); // has contributions → ask what to do with them
  }

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon.flag width={18} height={18} className="text-accent" />
          <h2 className="font-semibold">{t("goals.title")}</h2>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:text-fg"
        >
          <Icon.plus width={15} height={15} />
          {t("goals.add")}
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-bg-subtle text-fg-muted">
            <Icon.flag width={22} height={22} />
          </span>
          <p className="text-sm text-fg-muted">{t("goals.empty")}</p>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium text-fg-muted hover:text-fg"
          >
            <Icon.plus width={15} height={15} />
            {t("goals.add")}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => {
            const pct = g.targetKzt > 0 ? Math.min(100, Math.round((g.savedKzt / g.targetKzt) * 100)) : 0;
            const left = Math.max(0, g.targetKzt - g.savedKzt);
            return (
              <div key={g.id} className="group flex flex-col rounded-xl border bg-card-muted p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium leading-snug">{g.title}</p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-sm font-semibold tabular-nums" style={{ color: g.color }}>
                      {pct}%
                    </span>
                    <button
                      onClick={() => setEditGoal(g)}
                      className="rounded p-1 text-fg-muted opacity-0 transition-opacity hover:text-accent group-hover:opacity-100"
                      aria-label={t("edit")}
                    >
                      <Icon.pencil width={14} height={14} />
                    </button>
                    <button
                      onClick={() => del(g)}
                      className="rounded p-1 text-fg-muted opacity-0 transition-opacity hover:text-neg group-hover:opacity-100"
                      aria-label={t("tx.delete")}
                    >
                      <Icon.trash width={14} height={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bg-subtle">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: g.color }} />
                </div>

                <div className="mt-2.5 flex items-center justify-between text-xs text-fg-muted">
                  <span className="tabular-nums">
                    {formatMoney(g.savedKzt, currency, { compact: true })}{" "}
                    <span className="opacity-60">
                      {t("goals.of")} {formatMoney(g.targetKzt, currency, { compact: true })}
                    </span>
                  </span>
                  <span className="tabular-nums">
                    {formatMoney(left, currency, { compact: true })} {t("goals.left")}
                  </span>
                </div>

                <button
                  onClick={() => setContrib(g)}
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-xs font-medium text-fg-muted transition-colors hover:border-accent hover:text-accent"
                >
                  <Icon.plus width={14} height={14} />
                  {t("goals.addMoney")}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <AddGoalDrawer key={open ? "new" : "closed"} open={open} onClose={() => setOpen(false)} />
      {editGoal && (
        <AddGoalDrawer key={editGoal.id} open editing={editGoal} onClose={() => setEditGoal(null)} />
      )}
      <ContributeDrawer goal={contrib} onClose={() => setContrib(null)} />

      {pendingDel && (
        <DeleteGoalDialog
          goal={pendingDel}
          count={transactions.filter((x) => x.goalId === pendingDel.id).length}
          onCancel={() => setPendingDel(null)}
          onConfirm={(alsoDelete) => {
            removeGoal(pendingDel.id, alsoDelete);
            setPendingDel(null);
          }}
        />
      )}
    </section>
  );
}

function DeleteGoalDialog({
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
          {goal.title} · {count} {t("goalDel.linked")}
        </p>

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

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border py-2.5 text-sm font-medium text-fg-muted hover:text-fg"
          >
            {t("tx.cancel")}
          </button>
          <button
            onClick={() => onConfirm(alsoDelete)}
            className="flex-1 rounded-xl bg-neg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("tx.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
