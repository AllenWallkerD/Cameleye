"use client";

import { useState } from "react";
import { useApp } from "./app-provider";
import { Icon } from "./icons";
import { CategoryIcon } from "./category-icons";
import {
  CURRENCIES,
  convert,
  groupAmountInput,
  parseAmountInput,
} from "@/lib/currency";
import { useModal } from "@/lib/use-modal";

export function AddBudgetDrawer({
  open,
  onClose,
  editingCategory = null,
}: {
  open: boolean;
  onClose: () => void;
  editingCategory?: string | null; // category id when editing an existing budget
}) {
  const { t, currency, categories, budgets, setBudget } = useApp();

  const editingBudget = editingCategory
    ? budgets.find((b) => b.category === editingCategory)
    : null;

  // categories available to add a budget for: expense, not already budgeted
  const available = categories.filter(
    (c) => c.type === "expense" && !budgets.some((b) => b.category === c.id)
  );

  const [category, setCategory] = useState<string>(editingCategory ?? available[0]?.id ?? "");
  const [amount, setAmount] = useState(
    editingBudget ? groupAmountInput(String(Math.round(convert(editingBudget.limitKzt, currency)))) : ""
  );
  const [busy, setBusy] = useState(false);

  const panelRef = useModal(open, onClose);

  if (!open) return null;

  const isEdit = !!editingCategory;
  const cat = categories.find((c) => c.id === category);

  async function submit() {
    const value = parseAmountInput(amount);
    if (!category || value <= 0) return;
    setBusy(true);
    await setBudget(category, value / CURRENCIES[currency].ratePerKzt);
    setBusy(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className="animate-fade-up relative flex h-full w-full max-w-md flex-col bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{isEdit ? t("edit") : t("budget.new")}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-fg-muted hover:text-fg">
            <Icon.close width={20} height={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-auto px-6 py-6">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-fg-muted">{t("budget.category")}</label>
            {isEdit && cat ? (
              <div className="flex items-center gap-2 rounded-xl border bg-card-muted px-3 py-2.5">
                <span
                  className="grid h-7 w-7 place-items-center rounded-lg"
                  style={{ background: `color-mix(in srgb, ${cat.color} 16%, transparent)`, color: cat.color }}
                >
                  <CategoryIcon name={cat.icon} width={15} height={15} />
                </span>
                <span className="text-sm font-medium">{cat.name}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {available.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                      category === c.id ? "border-accent bg-accent-soft" : "hover:bg-bg-subtle"
                    }`}
                  >
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-lg"
                      style={{ background: `color-mix(in srgb, ${c.color} 16%, transparent)`, color: c.color }}
                    >
                      <CategoryIcon name={c.icon} width={14} height={14} />
                    </span>
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-fg-muted">{t("budget.limit")}</label>
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
