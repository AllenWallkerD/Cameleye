"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/components/app-provider";
import { Icon } from "@/components/icons";
import { CategoryIcon } from "@/components/category-icons";
import { formatDateShort, todayISO } from "@/components/date-picker";
import { formatMoney } from "@/lib/currency";
import { addDays } from "@/lib/data";
import {
  daysFor,
  forecast,
  formatDuration,
  formatDurationShort,
  savingRate,
} from "@/lib/goal-time";
import { TransactionsTable } from "@/components/transactions-table";
import { ContributeDrawer } from "@/components/contribute-drawer";
import { AddGoalDrawer } from "@/components/add-goal-drawer";
import { DeleteGoalDialog } from "@/components/delete-goal-dialog";

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, locale, currency, goals, transactions, loadingData, removeGoal, categoryById, setPrimaryGoal } =
    useApp();
  const goal = goals.find((g) => g.id === params.id);

  const [contribMode, setContribMode] = useState<"add" | "withdraw" | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);

  const today = todayISO();
  // this goal's own pace — a non-primary goal still gets an honest forecast
  const rate = useMemo(
    () => savingRate(goal ?? null, transactions, today),
    [goal, transactions, today]
  );

  // last 30 days of spending, grouped by category and re-priced in goal-days
  const drivers = useMemo(() => {
    const from = addDays(today, -30);
    const totals = new Map<string, number>();
    for (const x of transactions) {
      if (x.type !== "expense" || x.goalId || x.category === "savings") continue;
      if (x.date < from || x.date > today) continue;
      totals.set(x.category, (totals.get(x.category) ?? 0) + x.amountKzt);
    }
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, amount]) => {
        const c = categoryById(id);
        return {
          id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          amount,
          days: daysFor(amount, rate),
        };
      });
  }, [transactions, categoryById, rate, today]);

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
  const fc = forecast(goal, rate, today);

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
        {goal.isPrimary ? (
          <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent">
            {t("goals.primary")}
          </span>
        ) : (
          <button
            onClick={() => setPrimaryGoal(goal.id)}
            className="hidden shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium text-fg-muted transition-colors hover:border-accent hover:text-accent sm:block"
          >
            {t("goals.makePrimary")}
          </button>
        )}
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

      {/* forecast — money turned into a date, and a pace to hold */}
      <section className="mt-5 rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">{t("kopilka.title")}</h2>
        <div className="mt-3 space-y-2 text-sm">
          {fc.done ? (
            <p className="font-medium text-pos">{t("goal.done")}</p>
          ) : fc.etaIso ? (
            <p>
              <span className="text-fg-muted">{t("time.eta")} — </span>
              <span className="font-semibold">{formatDateShort(fc.etaIso, locale)}</span>
              <span className="text-xs text-fg-muted">
                {" "}
                · {t(rate.source === "plan" ? "kopilka.rate.plan" : "kopilka.rate.actual")}
              </span>
            </p>
          ) : (
            <p className="text-fg-muted">{t("kopilka.noRate")}</p>
          )}

          {goal.deadline && !fc.done && (
            <>
              <p className="text-fg-muted">
                {t("goals.deadline")} {formatDateShort(goal.deadline, locale)}
                {fc.driftDays !== null && (
                  <span
                    className="font-medium"
                    style={{ color: fc.driftDays > 0 ? "var(--neg)" : "var(--pos)" }}
                  >
                    {" "}
                    · {t(fc.driftDays > 0 ? "goal.behind" : "goal.ahead")}{" "}
                    {formatDuration(Math.abs(fc.driftDays), t)}
                  </span>
                )}
              </p>
              {fc.requiredMonthly !== null && (
                <p className="text-fg-muted">
                  {t("goal.need")}{" "}
                  <span className="font-semibold tabular-nums text-fg">
                    {formatMoney(fc.requiredMonthly, currency)}
                  </span>{" "}
                  {t("goal.perMonth")}
                </p>
              )}
            </>
          )}
        </div>

        {/* the same spending, re-priced in days of waiting */}
        <div className="mt-5 border-t pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold">{t("drivers.title")}</h3>
            <span className="text-xs text-fg-muted">{t("drivers.hint")}</span>
          </div>
          {drivers.length === 0 ? (
            <p className="py-4 text-sm text-fg-muted">{t("drivers.empty")}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {drivers.map((d) => (
                <li key={d.id} className="flex items-center gap-3">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                    style={{
                      background: `color-mix(in srgb, ${d.color} 16%, transparent)`,
                      color: d.color,
                    }}
                  >
                    <CategoryIcon name={d.icon} width={15} height={15} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{d.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-fg-muted">
                    {formatMoney(d.amount, currency, { compact: true })}
                  </span>
                  <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">
                    {d.days === null ? "—" : formatDurationShort(d.days, t)}
                  </span>
                </li>
              ))}
            </ul>
          )}
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
