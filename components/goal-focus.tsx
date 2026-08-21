"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "./app-provider";
import { Icon } from "./icons";
import { AddGoalDrawer } from "./add-goal-drawer";
import { ContributeDrawer } from "./contribute-drawer";
import { formatDateShort, todayISO } from "./date-picker";
import { formatMoney } from "@/lib/currency";
import { currentYM, goalDelta } from "@/lib/data";
import { daysFor, forecast, formatDuration } from "@/lib/goal-time";

// The dashboard hero: one goal, and everything else expressed as time against
// it. This is the card that makes the app "Копилка" rather than a ledger.
export function GoalFocus() {
  const { t, locale, currency, primaryGoal, rate, transactions } = useApp();
  const [newOpen, setNewOpen] = useState(false);
  const [contribOpen, setContribOpen] = useState(false);

  const today = todayISO();
  const ym = currentYM();

  const fc = useMemo(
    () => (primaryGoal ? forecast(primaryGoal, rate, today) : null),
    [primaryGoal, rate, today]
  );

  // what this month's ordinary spending cost the goal, in days
  const monthDays = useMemo(() => {
    if (!primaryGoal) return null;
    let spent = 0;
    for (const x of transactions) {
      if (x.type !== "expense" || x.date.slice(0, 7) !== ym) continue;
      if (x.goalId || x.category === "savings") continue;
      spent += x.amountKzt;
    }
    return daysFor(spent, rate);
  }, [transactions, primaryGoal, rate, ym]);

  // monthly plan vs what actually landed in the jar this month
  const planLeft = useMemo(() => {
    if (!primaryGoal || primaryGoal.monthlyKzt <= 0) return null;
    let put = 0;
    for (const x of transactions) {
      if (x.goalId !== primaryGoal.id || x.date.slice(0, 7) !== ym) continue;
      put += goalDelta(x);
    }
    return Math.max(0, primaryGoal.monthlyKzt - put);
  }, [transactions, primaryGoal, ym]);

  if (!primaryGoal || !fc) {
    return (
      <>
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
            {t("kopilka.title")}
          </p>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-tight">{t("kopilka.none")}</h2>
          <p className="mt-2 max-w-md text-sm text-fg-muted">{t("kopilka.noneHint")}</p>
          <button
            onClick={() => setNewOpen(true)}
            className="grad-accent mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/30 transition-opacity hover:opacity-90"
          >
            <Icon.plus width={16} height={16} />
            {t("kopilka.create")}
          </button>
        </section>
        <AddGoalDrawer key={newOpen ? "new" : "closed"} open={newOpen} onClose={() => setNewOpen(false)} />
      </>
    );
  }

  const g = primaryGoal;
  const pct = g.targetKzt > 0 ? Math.min(100, Math.round((g.savedKzt / g.targetKzt) * 100)) : 0;

  return (
    <>
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
              {t("kopilka.title")}
            </p>
            <h2 className="mt-1 truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {g.title}
            </h2>
          </div>
          <Link
            href={`/goals/${g.id}`}
            className="shrink-0 rounded-lg p-1.5 text-fg-muted transition-colors hover:text-accent"
            aria-label={t("nav.goals")}
          >
            <Icon.chevronRight width={18} height={18} />
          </Link>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <p className="text-3xl font-bold tabular-nums" style={{ color: g.color }}>
            {pct}%
          </p>
          <p className="text-right text-sm text-fg-muted tabular-nums">
            {formatMoney(g.savedKzt, currency, { compact: true })}{" "}
            <span className="opacity-60">
              {t("goals.of")} {formatMoney(g.targetKzt, currency, { compact: true })}
            </span>
          </p>
        </div>

        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-bg-subtle">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: g.color }}
          />
        </div>

        {/* the forecast: a real date, not just a percentage */}
        <div className="mt-4 space-y-1.5 border-t pt-4 text-sm">
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

          {g.deadline && !fc.done && (
            <p className="text-fg-muted">
              {t("goals.deadline")} {formatDateShort(g.deadline, locale)}
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
          )}

          {monthDays !== null && (
            <p className="text-fg-muted">
              {t("time.month")}{" "}
              <span className="font-semibold text-fg">{formatDuration(monthDays, t)}</span>
            </p>
          )}
        </div>

        {/* monthly-plan reminder — the app nudging instead of waiting */}
        {planLeft !== null && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card-muted px-4 py-3">
            {planLeft > 0 ? (
              <>
                <p className="min-w-0 text-sm">
                  <span className="font-medium">{t("remind.title")}</span>
                  <span className="text-fg-muted">
                    {" "}
                    · {t("remind.left")}{" "}
                    <span className="font-semibold tabular-nums text-fg">
                      {formatMoney(planLeft, currency)}
                    </span>
                  </span>
                </p>
                <button
                  onClick={() => setContribOpen(true)}
                  className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent hover:text-accent"
                >
                  {t("remind.action")}
                </button>
              </>
            ) : (
              <p className="text-sm font-medium text-pos">{t("remind.done")}</p>
            )}
          </div>
        )}
      </section>

      <ContributeDrawer
        goal={contribOpen ? g : null}
        mode="add"
        onClose={() => setContribOpen(false)}
      />
    </>
  );
}
