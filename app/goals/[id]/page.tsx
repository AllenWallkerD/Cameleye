"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/components/app-provider";
import { Icon } from "@/components/icons";
import { formatMoney } from "@/lib/currency";
import { TransactionsTable } from "@/components/transactions-table";
import { ContributeDrawer } from "@/components/contribute-drawer";
import { AddGoalDrawer } from "@/components/add-goal-drawer";
import { DeleteGoalDialog } from "@/components/delete-goal-dialog";

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, currency, goals, transactions, loadingData, removeGoal } = useApp();
  const goal = goals.find((g) => g.id === params.id);

  const [contribMode, setContribMode] = useState<"add" | "withdraw" | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);

  // On a hard refresh the goal may not be loaded yet; distinguish loading from
  // a genuinely missing/deleted goal.
  if (!goal) {
    return (
      <div className="grid place-items-center py-24 text-center">
        {loadingData ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-fg-muted">{t("goals.notFound")}</p>
            <Link href="/goals" className="text-sm font-medium text-accent hover:underline">
              {t("goals.back")}
            </Link>
          </div>
        )}
      </div>
    );
  }

  const linked = transactions.filter((x) => x.goalId === goal.id);
  const pct = goal.targetKzt > 0 ? Math.min(100, Math.round((goal.savedKzt / goal.targetKzt) * 100)) : 0;
  const left = Math.max(0, goal.targetKzt - goal.savedKzt);

  return (
    <>
      {/* header */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/goals"
          aria-label={t("goals.back")}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-fg-muted transition-colors hover:text-fg"
        >
          <Icon.chevronLeft width={18} height={18} />
        </Link>
        <h1 className="flex-1 truncate text-2xl font-semibold tracking-tight">{goal.title}</h1>
        <button
          onClick={() => setEditOpen(true)}
          aria-label={t("edit")}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-fg-muted transition-colors hover:text-accent"
        >
          <Icon.pencil width={16} height={16} />
        </button>
        <button
          onClick={() => setDelOpen(true)}
          aria-label={t("tx.delete")}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-fg-muted transition-colors hover:text-neg"
        >
          <Icon.trash width={16} height={16} />
        </button>
      </div>

      {/* progress + actions */}
      <section className="mt-5 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-3xl font-bold tabular-nums" style={{ color: goal.color }}>
              {pct}%
            </p>
            <p className="mt-1 truncate text-sm text-fg-muted tabular-nums">
              {formatMoney(goal.savedKzt, currency)}{" "}
              <span className="opacity-60">
                {t("goals.of")} {formatMoney(goal.targetKzt, currency)}
              </span>
            </p>
          </div>
          <p className="shrink-0 text-sm text-fg-muted tabular-nums">
            {formatMoney(left, currency)} {t("goals.left")}
          </p>
        </div>

        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-bg-subtle">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: goal.color }} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => setContribMode("add")}
            className="grad-accent flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/30 transition-opacity hover:opacity-90"
          >
            <Icon.plus width={16} height={16} />
            {t("goals.addMoney")}
          </button>
          <button
            onClick={() => setContribMode("withdraw")}
            disabled={goal.savedKzt <= 0}
            className="flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium text-fg-muted transition-colors hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon.arrowDown width={16} height={16} />
            {t("goals.withdraw")}
          </button>
        </div>
      </section>

      {/* linked transactions — delete/edit any of them right here */}
      <div className="mt-5">
        <TransactionsTable items={linked} full title={t("goals.history")} />
      </div>

      <ContributeDrawer
        goal={contribMode ? goal : null}
        mode={contribMode === "withdraw" ? "withdraw" : "add"}
        onClose={() => setContribMode(null)}
      />
      {editOpen && <AddGoalDrawer key={goal.id} open editing={goal} onClose={() => setEditOpen(false)} />}
      {delOpen && (
        <DeleteGoalDialog
          goal={goal}
          count={linked.length}
          onCancel={() => setDelOpen(false)}
          onConfirm={(alsoDelete) => {
            removeGoal(goal.id, alsoDelete);
            setDelOpen(false);
            router.push("/goals");
          }}
        />
      )}
    </>
  );
}
