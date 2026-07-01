"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/app-provider";
import { PeriodTabs, currentYM, type Period } from "@/components/period-tabs";
import { BarChart } from "@/components/charts/bar-chart";
import { CategoryIcon } from "@/components/category-icons";
import { MONTHS } from "@/components/date-picker";
import { Skeleton } from "@/components/skeleton";
import { Icon } from "@/components/icons";
import { buildBarSeries, daysInMonthYM, inPeriod, shiftYM } from "@/lib/data";
import { formatMoney } from "@/lib/currency";

export default function InsightsPage() {
  const { t, locale, currency, transactions, categoryById, loadingData } = useApp();
  const [period, setPeriod] = useState<Period>(() => ({ mode: "month", ym: currentYM() }));

  const prevPeriod: Period =
    period.mode === "month"
      ? { mode: "month", ym: shiftYM(period.ym, -1) }
      : { mode: "year", y: period.y - 1 };

  const cur = useMemo(() => totalsFor(transactions, period), [transactions, period]);
  const prev = useMemo(() => totalsFor(transactions, prevPeriod), [transactions, prevPeriod]);

  const trend = useMemo(() => {
    if (period.mode === "year") {
      return buildBarSeries(transactions, period, MONTHS[locale].map((m) => m.slice(0, 3)));
    }
    const out: { label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const ym = shiftYM(period.ym, -i);
      let income = 0;
      let expense = 0;
      for (const x of transactions) {
        if (x.date.slice(0, 7) !== ym) continue;
        if (x.type === "income") income += x.amountKzt;
        else expense += x.amountKzt;
      }
      out.push({ label: MONTHS[locale][Number(ym.slice(5)) - 1].slice(0, 3), income, expense });
    }
    return out;
  }, [transactions, period, locale]);

  const top = useMemo(() => {
    const m = new Map<string, number>();
    let biggest = 0;
    let count = 0;
    for (const x of transactions) {
      if (!inPeriod(x.date, period)) continue;
      count++;
      if (x.type !== "expense") continue;
      m.set(x.category, (m.get(x.category) ?? 0) + x.amountKzt);
      if (x.amountKzt > biggest) biggest = x.amountKzt;
    }
    const totalExp = [...m.values()].reduce((s, v) => s + v, 0) || 1;
    const list = [...m.entries()]
      .map(([id, value]) => ({ cat: categoryById(id), value, share: (value / totalExp) * 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    // divide by days *elapsed* so the current month/year isn't understated
    const now = new Date();
    let days: number;
    if (period.mode === "month") {
      days = period.ym === currentYM() ? now.getDate() : daysInMonthYM(period.ym);
    } else {
      const leap = (period.y % 4 === 0 && period.y % 100 !== 0) || period.y % 400 === 0;
      days =
        period.y === now.getFullYear()
          ? Math.round((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
          : leap
          ? 366
          : 365;
    }
    return { list, biggest, count, avgDaily: cur.expenses / Math.max(1, days) };
  }, [transactions, period, categoryById, cur.expenses]);

  const vsLabel = t(period.mode === "year" ? "vsPrevYear" : "vsPrev");
  const empty = transactions.length === 0;

  return (
    <>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("nav.insights")}</h1>
        <PeriodTabs period={period} onChange={setPeriod} />
      </div>

      {loadingData ? (
        <Skeleton className="h-96" />
      ) : empty ? (
        <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent">
            <Icon.trend width={24} height={24} />
          </span>
          <p className="mt-4 text-sm text-fg-muted">{t("insights.empty")}</p>
        </div>
      ) : (
        <>
          {/* comparison vs previous period */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CompareCard label={t("summary.income")} value={cur.income} prev={prev.income} positiveIsGood currency={currency} vsLabel={vsLabel} />
            <CompareCard label={t("summary.expenses")} value={cur.expenses} prev={prev.expenses} currency={currency} vsLabel={vsLabel} />
            <CompareCard label={t("summary.balance")} value={cur.balance} prev={prev.balance} positiveIsGood currency={currency} vsLabel={vsLabel} />
          </div>

          {/* trend */}
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="mb-4 font-semibold">{t("insights.trend")}</h2>
            <BarChart data={trend} currency={currency} />
          </section>

          {/* quick stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat label={t("insights.avgDaily")} value={formatMoney(top.avgDaily, currency)} icon="chart" />
            <Stat label={t("insights.biggest")} value={formatMoney(top.biggest, currency)} icon="arrowUp" />
            <Stat label={t("insights.txCount")} value={String(top.count)} icon="swap" />
          </div>

          {/* top categories */}
          <section className="rounded-2xl border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">{t("insights.top")}</h2>
            </div>
            {top.list.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-fg-muted">—</p>
            ) : (
              <ul className="divide-y">
                {top.list.map(({ cat, value, share }) => (
                  <li key={cat.id} className="flex items-center gap-3 px-5 py-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                      style={{ background: `color-mix(in srgb, ${cat.color} 16%, transparent)`, color: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} width={17} height={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{cat.name}</span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(value, currency)}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-subtle">
                          <div className="h-full rounded-full" style={{ width: `${share}%`, background: cat.color }} />
                        </div>
                        <span className="w-9 shrink-0 text-right text-xs text-fg-muted tabular-nums">{Math.round(share)}%</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}

function totalsFor(transactions: { date: string; type: string; amountKzt: number }[], period: Period) {
  let income = 0;
  let expenses = 0;
  for (const x of transactions) {
    if (!inPeriod(x.date, period)) continue;
    if (x.type === "income") income += x.amountKzt;
    else expenses += x.amountKzt;
  }
  return { income, expenses, balance: income - expenses };
}

function CompareCard({
  label,
  value,
  prev,
  positiveIsGood = false,
  currency,
  vsLabel,
}: {
  label: string;
  value: number;
  prev: number;
  positiveIsGood?: boolean;
  currency: Parameters<typeof formatMoney>[1];
  vsLabel: string;
}) {
  const delta = prev ? ((value - prev) / Math.abs(prev)) * 100 : 0;
  const up = delta >= 0;
  const good = positiveIsGood ? up : !up;
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-fg-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{formatMoney(value, currency)}</p>
      {prev > 0 || value > 0 ? (
        <p className="mt-1 text-xs" style={{ color: good ? "var(--pos)" : "var(--neg)" }}>
          {up ? "▲" : "▼"} {Math.abs(delta).toFixed(0)}% <span className="text-fg-muted">{vsLabel}</span>
        </p>
      ) : (
        <p className="mt-1 text-xs text-fg-muted">—</p>
      )}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: keyof typeof Icon }) {
  const I = Icon[icon];
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-5 shadow-sm">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
        <I width={19} height={19} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-fg-muted">{label}</p>
        <p className="truncate text-lg font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}
