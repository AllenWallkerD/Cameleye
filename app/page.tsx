"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/app-provider";
import { SummaryCards } from "@/components/summary-cards";
import { PeriodTabs, currentYM, type Period } from "@/components/period-tabs";
import { TransactionsTable } from "@/components/transactions-table";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { MONTHS } from "@/components/date-picker";
import { DashboardSkeleton } from "@/components/skeleton";
import { OnboardingCard } from "@/components/onboarding-card";
import { buildBarSeries, inPeriod, shiftYM } from "@/lib/data";

export default function DashboardPage() {
  const { t, locale, currency, transactions, categoryById, loadingData } = useApp();
  const [period, setPeriod] = useState<Period>(() => ({ mode: "month", ym: currentYM() }));

  const filtered = useMemo(
    () => transactions.filter((x) => inPeriod(x.date, period)),
    [transactions, period]
  );

  const totals = useMemo(() => {
    const income = sum(filtered.filter((x) => x.type === "income"));
    const expenses = sum(filtered.filter((x) => x.type === "expense"));
    const balance = income - expenses;
    return { income, expenses, balance, savingsRate: income > 0 ? (balance / income) * 100 : 0 };
  }, [filtered]);

  const deltas = useMemo(() => {
    if (period.mode !== "month") return undefined;
    const prevYm = shiftYM(period.ym, -1);
    const prev = transactions.filter((x) => x.date.slice(0, 7) === prevYm);
    const pIncome = sum(prev.filter((x) => x.type === "income"));
    const pExpenses = sum(prev.filter((x) => x.type === "expense"));
    return {
      income: pct(totals.income, pIncome),
      expenses: pct(totals.expenses, pExpenses),
      balance: pct(totals.balance, pIncome - pExpenses),
    };
  }, [period, transactions, totals]);

  const barData = useMemo(
    () =>
      buildBarSeries(
        transactions,
        period,
        MONTHS[locale].map((m) => m.slice(0, 3))
      ),
    [transactions, period, locale]
  );

  const donutData = useMemo(() => {
    const totalsMap = new Map<string, number>();
    for (const x of filtered) {
      if (x.type !== "expense") continue;
      totalsMap.set(x.category, (totalsMap.get(x.category) ?? 0) + x.amountKzt);
    }
    return [...totalsMap.entries()]
      .map(([id, value]) => {
        const c = categoryById(id);
        return { label: c.name, value, color: c.color };
      })
      .sort((a, b) => b.value - a.value);
  }, [filtered, categoryById]);

  const periodLabel =
    period.mode === "year"
      ? String(period.y)
      : `${MONTHS[locale][Number(period.ym.slice(5)) - 1]} ${period.ym.slice(0, 4)}`;

  const recent = useMemo(
    () => [...filtered].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6),
    [filtered]
  );

  if (loadingData) return <DashboardSkeleton />;
  if (transactions.length === 0) return <OnboardingCard />;

  return (
    <>
      <PeriodTabs period={period} onChange={setPeriod} />

      <SummaryCards
        income={totals.income}
        expenses={totals.expenses}
        balance={totals.balance}
        savingsRate={totals.savingsRate}
        deltas={deltas}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <section className="rounded-2xl border bg-card p-5 shadow-sm md:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-semibold">{t("chart.incomeVsExpense")}</h2>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-fg-muted sm:inline">{periodLabel}</span>
              <Legend t={t} />
            </div>
          </div>
          <BarChart data={barData} currency={currency} />
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-semibold">{t("chart.byCategory")}</h2>
            <span className="truncate text-xs text-fg-muted">{periodLabel}</span>
          </div>
          {donutData.length ? (
            <DonutChart data={donutData} currency={currency} />
          ) : (
            <p className="py-10 text-center text-sm text-fg-muted">—</p>
          )}
        </section>
      </div>

      <TransactionsTable items={recent} viewAllHref="/transactions" />
    </>
  );
}

function Legend({ t }: { t: (k: string) => string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-fg-muted">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--pos)" }} />
        {t("summary.income")}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent)" }} />
        {t("summary.expenses")}
      </span>
    </div>
  );
}

function sum(items: { amountKzt: number }[]) {
  return items.reduce((s, x) => s + x.amountKzt, 0);
}

function pct(current: number, prev: number) {
  if (!prev) return 0;
  return ((current - prev) / Math.abs(prev)) * 100;
}
