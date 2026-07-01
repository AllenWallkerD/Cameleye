"use client";

import { useEffect, useState } from "react";
import { useApp } from "./app-provider";
import { Icon } from "./icons";
import { CategoryIcon } from "./category-icons";
import { CURRENCIES, convert, groupAmountInput, parseAmountInput } from "@/lib/currency";
import { useModal } from "@/lib/use-modal";
import type { CatType, Recurring } from "@/lib/data";

export function RecurringDrawer({
  open,
  onClose,
  editing = null,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Recurring | null;
}) {
  const { t, currency, categories, addRecurring, updateRecurring } = useApp();
  const [type, setType] = useState<CatType>(editing?.type ?? "expense");
  const [category, setCategory] = useState<string>(editing?.category ?? "");
  const [amount, setAmount] = useState(
    editing ? groupAmountInput(String(Math.round(convert(editing.amountKzt, currency)))) : ""
  );
  const [day, setDay] = useState(editing ? String(editing.dayOfMonth) : "1");
  const [note, setNote] = useState(editing?.note ?? "");
  const [busy, setBusy] = useState(false);

  const cats = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (!cats.some((c) => c.id === category)) setCategory(cats[0]?.id ?? "");
  }, [cats, category]);

  const panelRef = useModal(open, onClose);

  if (!open) return null;

  function setDayClamped(v: string) {
    const digits = v.replace(/[^0-9]/g, "");
    if (digits === "") return setDay("");
    setDay(String(Math.min(31, Math.max(1, parseInt(digits, 10)))));
  }

  async function submit() {
    const value = parseAmountInput(amount);
    const d = parseInt(day, 10);
    if (value <= 0 || !category || !d) return;
    const payload = {
      type,
      category,
      amountKzt: value / CURRENCIES[currency].ratePerKzt,
      note,
      dayOfMonth: d,
    };
    setBusy(true);
    if (editing) await updateRecurring(editing.id, payload);
    else await addRecurring(payload);
    setBusy(false);
    setAmount("");
    setNote("");
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
          <h2 className="text-lg font-semibold">{editing ? t("edit") : t("recurring.new")}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-fg-muted hover:text-fg">
            <Icon.close width={20} height={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-auto px-6 py-6">
          <div className="grid grid-cols-2 gap-2 rounded-xl border bg-card-muted p-1">
            {(["expense", "income"] as const).map((ty) => (
              <button
                key={ty}
                onClick={() => setType(ty)}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  type === ty ? "bg-accent text-white" : "text-fg-muted hover:text-fg"
                }`}
              >
                {t(`tx.${ty}`)}
              </button>
            ))}
          </div>

          <Field label={t("tx.amount")}>
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
          </Field>

          <Field label={t("tx.category")}>
            <div className="grid grid-cols-2 gap-2">
              {cats.map((c) => (
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
          </Field>

          <Field label={t("recurring.day")}>
            <input
              type="text"
              inputMode="numeric"
              value={day}
              onChange={(e) => setDayClamped(e.target.value)}
              className="w-full rounded-xl border bg-card px-3 py-2.5 outline-none focus:border-accent"
            />
          </Field>

          <Field label={t("tx.note")}>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="…"
              className="w-full rounded-xl border bg-card px-3 py-2.5 outline-none focus:border-accent"
            />
          </Field>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-fg-muted">{label}</label>
      {children}
    </div>
  );
}
