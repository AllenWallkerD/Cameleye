"use client";

import { useApp } from "@/components/app-provider";
import { Goals } from "@/components/goals";
import { formatMoney } from "@/lib/currency";

export default function GoalsPage() {
  const { t, currency, goals } = useApp();
  const totalSaved = goals.reduce((s, g) => s + g.savedKzt, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetKzt, 0);
  const pct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("nav.goals")}</h1>
        {goals.length > 0 && (
          <p className="text-sm text-fg-muted">
            <span className="font-semibold text-fg">{formatMoney(totalSaved, currency, { compact: true })}</span>{" "}
            {t("goals.of")} {formatMoney(totalTarget, currency, { compact: true })} · {pct}%
          </p>
        )}
      </div>

      <Goals />
    </>
  );
}
