"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/app-provider";
import { PeriodTabs, currentYM, type Period } from "@/components/period-tabs";
import { CategoryIcon } from "@/components/category-icons";
import { AddBudgetDrawer } from "@/components/add-budget-drawer";
import { Icon } from "@/components/icons";
import { inPeriod } from "@/lib/data";
import { formatMoney } from "@/lib/currency";

export default function BudgetsPage() {
  const { t, currency, transactions, categoryById, budgets, removeBudget, confirm } = useApp();
  const [period, setPeriod] = useState<Period>(() => ({ mode: "month", ym: currentYM() }));
  const [open, setOpen] = useState(false);
  const [editCat, setEditCat] = useState<string | null>(null);

  const multiplier = period.mode === "year" ? 12 : 1;

  const spentByCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const x of transactions) {
      if (x.type !== "expense" || !inPeriod(x.date, period)) continue;
      m.set(x.category, (m.get(x.category) ?? 0) + x.amountKzt);
    }
    return m;
  }, [transactions, period]);

  const rows = budgets
    .map((b) => {
      const cat = categoryById(b.category);
      const limit = b.limitKzt * multiplier;
      const spent = spentByCat.get(b.category) ?? 0;
      return { b, cat, limit, spent, pct: limit > 0 ? Math.min(100, (spent / limit) * 100) : 0, over: spent > limit };
    })
    .sort((a, b) => b.spent - a.spent);

  const totalLimit = rows.reduce((s, r) => s + r.limit, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const totalPct = totalLimit > 0 ? Math.min(100, (totalSpent / totalLimit) * 100) : 0;
  const totalOver = totalSpent > totalLimit && totalLimit > 0;

  async function del(category: string) {
    if (await confirm(t("confirm.delete"))) removeBudget(category);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("nav.budgets")}</h1>
        <div className="flex items-center gap-3">
          <PeriodTabs period={period} onChange={setPeriod} />
          <button
            onClick={() => {
              setEditCat(null);
              setOpen(true);
            }}
            className="grad-accent flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-white shadow-sm shadow-accent/30 hover:opacity-90"
          >
            <Icon.plus width={16} height={16} />
            <span className="hidden sm:inline">{t("budget.add")}</span>
          </button>
        </div>
      </div>

      {rows.length > 0 && (
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="text-fg-muted">{t("budget.total")}</span>
            <span className="font-semibold tabular-nums" style={{ color: totalOver ? "var(--neg)" : undefined }}>
              {formatMoney(totalSpent, currency)} / {formatMoney(totalLimit, currency)}
            </span>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-bg-subtle">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${totalPct}%`, background: totalOver ? "var(--neg)" : "var(--accent)" }}
            />
          </div>
        </section>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent">
            <Icon.pie width={24} height={24} />
          </span>
          <p className="mt-4 text-sm text-fg-muted">{t("budget.empty")}</p>
          <button
            onClick={() => {
              setEditCat(null);
              setOpen(true);
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium text-fg-muted hover:text-fg"
          >
            <Icon.plus width={15} height={15} />
            {t("budget.add")}
          </button>
        </div>
      ) : (
        <section className="divide-y rounded-2xl border bg-card shadow-sm">
          {rows.map(({ b, cat, limit, spent, pct, over }) => (
            <div key={b.id} className="group flex items-center gap-3 px-5 py-4">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                style={{ background: `color-mix(in srgb, ${cat.color} 16%, transparent)`, color: cat.color }}
              >
                <CategoryIcon name={cat.icon} width={18} height={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{cat.name}</span>
                  <span
                    className="shrink-0 text-sm tabular-nums"
                    style={{ color: over ? "var(--neg)" : "var(--fg-muted)" }}
                  >
                    {formatMoney(spent, currency, { compact: true })} / {formatMoney(limit, currency, { compact: true })}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-subtle">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: over ? "var(--neg)" : cat.color }}
                  />
                </div>
              </div>
              <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => {
                    setEditCat(b.category);
                    setOpen(true);
                  }}
                  className="rounded-lg p-1.5 text-fg-muted hover:text-accent"
                  aria-label={t("edit")}
                >
                  <Icon.pencil width={16} height={16} />
                </button>
                <button
                  onClick={() => del(b.category)}
                  className="rounded-lg p-1.5 text-fg-muted hover:text-neg"
                  aria-label={t("tx.delete")}
                >
                  <Icon.trash width={16} height={16} />
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      <AddBudgetDrawer
        key={open ? editCat ?? "new" : "closed"}
        open={open}
        editingCategory={editCat}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
