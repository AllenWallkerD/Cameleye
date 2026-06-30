"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/app-provider";
import { SummaryCards } from "@/components/summary-cards";
import { PeriodTabs, currentYM, type Period } from "@/components/period-tabs";
import { TransactionsTable } from "@/components/transactions-table";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { CategoryIcon } from "@/components/category-icons";
import { MONTHS } from "@/components/date-picker";
import { DashboardSkeleton } from "@/components/skeleton";
import { OnboardingCard } from "@/components/onboarding-card";
import { Icon } from "@/components/icons";
import { buildBarSeries, inPeriod, shiftYM } from "@/lib/data";
import { formatMoney } from "@/lib/currency";

export default function DashboardPage() {
  const { t, locale, currency, transactions, categoryById, budgets, loadingData } = useApp();
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

  const alerts = useMemo(() => {
    const mult = period.mode === "year" ? 12 : 1;
    const spent = new Map<string, number>();
    for (const x of filtered) {
      if (x.type !== "expense") continue;
      spent.set(x.category, (spent.get(x.category) ?? 0) + x.amountKzt);
    }
    return budgets
      .map((b) => {
        const limit = b.limitKzt * mult;
        const used = spent.get(b.category) ?? 0;
        const ratio = limit > 0 ? used / limit : 0;
        return { cat: categoryById(b.category), used, limit, ratio, over: ratio > 1, near: ratio >= 0.8 && ratio <= 1 };
      })
      .filter((a) => a.over || a.near)
      .sort((a, b) => b.ratio - a.ratio);
  }, [budgets, filtered, period, categoryById]);

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

      {alerts.length > 0 && (
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Icon.pie width={18} height={18} className="text-neg" />
            <h2 className="font-semibold">{t("alert.title")}</h2>
          </div>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {alerts.map((a) => (
              <li key={a.cat.id} className="flex items-center gap-3 rounded-xl border bg-card-muted px-3 py-2">
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                  style={{ background: `color-mix(in srgb, ${a.cat.color} 16%, transparent)`, color: a.cat.color }}
                >
                  <CategoryIcon name={a.cat.icon} width={15} height={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.cat.name}</p>
                  <p className="text-xs tabular-nums text-fg-muted">
                    {formatMoney(a.used, currency, { compact: true })} / {formatMoney(a.limit, currency, { compact: true })}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    color: a.over ? "var(--neg)" : "#d97706",
                    background: a.over ? "color-mix(in srgb, var(--neg) 14%, transparent)" : "color-mix(in srgb, #f59e0b 18%, transparent)",
                  }}
                >
                  {a.over ? t("alert.over") : t("alert.near")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

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
            <h2 className="truncate font-semibold">{t("chart.byCategory")}</h2>
            <span className="shrink-0 text-xs text-fg-muted">{periodLabel}</span>
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
