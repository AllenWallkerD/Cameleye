"use client";

import { useApp } from "./app-provider";
import { Icon } from "./icons";
import { formatMoney } from "@/lib/currency";

type Card = {
  key: string;
  value: number;
  icon: keyof typeof Icon;
  accent: string;
  delta?: number;
  isRate?: boolean;
};

export function SummaryCards({
  income,
  expenses,
  balance,
  savingsRate,
  deltas,
}: {
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
  deltas?: { income?: number; expenses?: number; balance?: number };
}) {
  const { t, currency } = useApp();

  const cards: Card[] = [
    { key: "summary.income", value: income, icon: "arrowDown", accent: "var(--pos)", delta: deltas?.income },
    { key: "summary.expenses", value: expenses, icon: "arrowUp", accent: "var(--accent)", delta: deltas?.expenses },
    { key: "summary.balance", value: balance, icon: "wallet", accent: "var(--fg)", delta: deltas?.balance },
    { key: "summary.savings", value: savingsRate, icon: "piggy", accent: "#8b5cf6", isRate: true },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.key}
          className="animate-fade-up rounded-2xl border bg-card p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl"
              style={{ background: "color-mix(in srgb, " + c.accent + " 14%, transparent)", color: c.accent }}
            >
              {iconNode(c.icon)}
            </span>
            {typeof c.delta === "number" && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  color: c.delta >= 0 ? "var(--pos)" : "var(--neg)",
                  background: c.delta >= 0 ? "color-mix(in srgb, var(--pos) 14%, transparent)" : "color-mix(in srgb, var(--neg) 14%, transparent)",
                }}
              >
                {c.delta >= 0 ? "+" : ""}
                {c.delta.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="mt-4 text-sm text-fg-muted">{t(c.key)}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
            {c.isRate ? `${Math.round(c.value)}%` : formatMoney(c.value, currency)}
          </p>
        </div>
      ))}
    </div>
  );

  function iconNode(name: keyof typeof Icon) {
    const I = Icon[name];
    return <I width={19} height={19} />;
  }
}
