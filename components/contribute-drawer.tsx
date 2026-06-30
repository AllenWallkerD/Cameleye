"use client";

import { useState } from "react";
import { useApp } from "./app-provider";
import { Icon } from "./icons";
import { DatePicker, MIN_PICKABLE_DATE, todayISO } from "./date-picker";
import { CURRENCIES, formatMoney, groupAmountInput, parseAmountInput } from "@/lib/currency";
import type { Goal } from "@/lib/data";

export function ContributeDrawer({
  goal,
  onClose,
}: {
  goal: Goal | null;
  onClose: () => void;
}) {
  const { t, currency, contributeToGoal } = useApp();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO);
  const [busy, setBusy] = useState(false);

  if (!goal) return null;

  const left = Math.max(0, goal.targetKzt - goal.savedKzt);

  async function submit() {
    if (!goal) return;
    const value = parseAmountInput(amount);
    if (value <= 0) return;
    setBusy(true);
    await contributeToGoal(goal.id, value / CURRENCIES[currency].ratePerKzt, date);
    setBusy(false);
    setAmount("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="animate-fade-up relative flex h-full w-full max-w-md flex-col bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">{t("goals.addMoney")}</h2>
            <p className="text-sm text-fg-muted">{goal.title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-fg-muted hover:text-fg">
            <Icon.close width={20} height={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-auto px-6 py-6">
          <div className="rounded-xl border bg-card-muted p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-fg-muted">{t("goals.saved")}</span>
              <span className="font-medium tabular-nums">{formatMoney(goal.savedKzt, currency)}</span>
            </div>
            <div className="mt-1.5 flex justify-between">
              <span className="text-fg-muted">{t("goals.left")}</span>
              <span className="font-medium tabular-nums">{formatMoney(left, currency)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-fg-muted">{t("tx.amount")}</label>
            <div className="flex items-center rounded-xl border bg-card px-3 focus-within:border-accent">
              <span className="text-fg-muted">{CURRENCIES[currency].symbol}</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(groupAmountInput(e.target.value))}
                placeholder="0"
                className="w-full bg-transparent px-2 py-2.5 text-lg font-semibold outline-none"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-fg-muted">{t("tx.date")}</label>
            <DatePicker value={date} onChange={setDate} min={MIN_PICKABLE_DATE} max={todayISO()} />
          </div>

          <p className="text-xs text-fg-muted">
            {/* makes the savings flow explicit */}
            → {t("tx.expense")} · {t("cat.savings")}
          </p>
        </div>

        <div className="flex gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border py-2.5 text-sm font-medium text-fg-muted hover:text-fg"
          >
            {t("tx.cancel")}
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="grad-accent flex-1 rounded-xl py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/30 hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "…" : t("tx.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
