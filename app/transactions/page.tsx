"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/app-provider";
import { TransactionsTable } from "@/components/transactions-table";
import { PeriodTabs, currentYM, type Period } from "@/components/period-tabs";
import { Skeleton } from "@/components/skeleton";
import { Icon } from "@/components/icons";
import { inPeriod } from "@/lib/data";

type Filter = "all" | "income" | "expense";

export default function TransactionsPage() {
  const { t, transactions, categoryById, search, setSearch, loadingData } = useApp();
  const [period, setPeriod] = useState<Period>(() => ({ mode: "month", ym: currentYM() }));
  const [filter, setFilter] = useState<Filter>("all");
  const q = search.trim().toLowerCase();

  const items = useMemo(() => {
    // when searching, look across ALL time; otherwise scope to the period
    let list = q ? transactions : transactions.filter((x) => inPeriod(x.date, period));
    if (filter !== "all") list = list.filter((x) => x.type === filter);
    if (q) {
      list = list.filter(
        (x) =>
          x.note.toLowerCase().includes(q) ||
          categoryById(x.category).name.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transactions, period, filter, q, categoryById]);

  return (
    <>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("nav.transactions")}</h1>

        {/* search — primary on mobile, also handy on desktop */}
        <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2.5 text-sm text-fg-muted lg:hidden">
          <Icon.search width={16} height={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search.placeholder")}
            className="w-full bg-transparent text-fg outline-none placeholder:text-fg-muted"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label={t("select.clear")}>
              <Icon.close width={15} height={15} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <PeriodTabs period={period} onChange={setPeriod} />
          <div className="flex items-center rounded-xl border bg-card p-0.5">
            {(["all", "income", "expense"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === f ? "bg-accent-soft text-accent" : "text-fg-muted hover:text-fg"
                }`}
              >
                {f === "all" ? t("all") : t(`tx.${f}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loadingData ? (
        <Skeleton className="h-96" />
      ) : (
        <TransactionsTable items={items} full selectable />
      )}
    </>
  );
}
