"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "./app-provider";
import { Icon } from "./icons";
import { formatMoney } from "@/lib/currency";
import { AddGoalDrawer } from "./add-goal-drawer";

export function Goals() {
  const { t, currency, goals } = useApp();
  const [open, setOpen] = useState(false);

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
              <Link
                key={g.id}
                href={`/goals/${g.id}`}
                className="group flex flex-col rounded-xl border bg-card-muted p-4 transition-colors hover:border-accent/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium leading-snug">{g.title}</p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-sm font-semibold tabular-nums" style={{ color: g.color }}>
                      {pct}%
                    </span>
                    <Icon.chevronRight
                      width={16}
                      height={16}
                      className="text-fg-muted opacity-50 transition-opacity group-hover:opacity-100"
                    />
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
              </Link>
            );
          })}
        </div>
      )}

      <AddGoalDrawer key={open ? "new" : "closed"} open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
