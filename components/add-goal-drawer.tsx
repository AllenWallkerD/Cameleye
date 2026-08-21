"use client";

import { useState } from "react";
import { useApp } from "./app-provider";
import { Icon } from "./icons";
import { DatePicker, todayISO } from "./date-picker";
import { CURRENCIES, MAX_AMOUNT_KZT, convert, groupAmountInput, parseAmountInput } from "@/lib/currency";
import { useModal } from "@/lib/use-modal";
import { GOAL_SUGGESTIONS, addDays, type Goal } from "@/lib/data";

export function AddGoalDrawer({
  open,
  onClose,
  editing = null,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Goal | null;
}) {
  const { t, currency, goals, addGoal, updateGoal } = useApp();
  const [key, setKey] = useState(editing?.key ?? "custom");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [color, setColor] = useState(editing?.color ?? "#a78bfa");
  const [target, setTarget] = useState(
    editing ? groupAmountInput(String(convert(editing.targetKzt, currency))) : ""
  );
  const [saved, setSaved] = useState(
    editing ? groupAmountInput(String(convert(editing.savedKzt, currency))) : ""
  );
  const [monthly, setMonthly] = useState(
    editing && editing.monthlyKzt > 0
      ? groupAmountInput(String(convert(editing.monthlyKzt, currency)))
      : ""
  );
  // the deadline is optional, so it's a toggle + picker rather than a bare field
  const [hasDeadline, setHasDeadline] = useState(!!editing?.deadline);
  const [deadline, setDeadline] = useState(editing?.deadline ?? defaultDeadline());
  const [primary, setPrimary] = useState(editing?.isPrimary ?? goals.length === 0);
  const [busy, setBusy] = useState(false);

  // a goal already in focus can't be un-focused here — pick another one instead
  const primaryLocked = !!editing?.isPrimary || goals.length === 0;

  const panelRef = useModal(open, onClose);

  if (!open) return null;

  function pickSuggestion(s: { key: string; color: string }) {
    setKey(s.key);
    setTitle(t(`goal.${s.key}`));
    setColor(s.color);
  }

  async function submit() {
    if (!title.trim()) return;
    const rate = CURRENCIES[currency].ratePerKzt;
    const targetKzt = parseAmountInput(target) / rate;
    const savedKzt = parseAmountInput(saved) / rate;
    const monthlyKzt = parseAmountInput(monthly) / rate;
    if (targetKzt > MAX_AMOUNT_KZT || savedKzt > MAX_AMOUNT_KZT || monthlyKzt > MAX_AMOUNT_KZT) return;
    const payload = {
      key,
      title: title.trim(),
      targetKzt,
      savedKzt,
      color,
      monthlyKzt,
      deadline: hasDeadline ? deadline : null,
      isPrimary: primary,
    };
    setBusy(true);
    if (editing) await updateGoal(editing.id, payload);
    else await addGoal(payload);
    setBusy(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className="animate-fade-up relative flex h-full w-full max-w-md flex-col bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">{editing ? t("edit") : t("goals.new")}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-fg-muted hover:text-fg">
            <Icon.close width={20} height={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-auto px-6 py-6">
          {/* optional one-tap suggestions */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-fg-muted">{t("goals.suggest")}</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_SUGGESTIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => pickSuggestion(s)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    key === s.key ? "border-accent bg-accent-soft" : "hover:bg-bg-subtle"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {t(`goal.${s.key}`)}
                </button>
              ))}
            </div>
          </div>

          <Field label={t("goals.name")}>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setKey("custom");
              }}
              placeholder="…"
              className="w-full rounded-xl border bg-card px-3 py-2.5 outline-none focus:border-accent"
              autoFocus
            />
          </Field>

          <Field label={t("goals.target")}>
            <div className="flex items-center rounded-xl border bg-card px-3 focus-within:border-accent">
              <span className="text-fg-muted">{CURRENCIES[currency].symbol}</span>
              <input
                type="text"
                inputMode="decimal"
                value={target}
                onChange={(e) => setTarget(groupAmountInput(e.target.value))}
                placeholder="0"
                className="w-full bg-transparent px-2 py-2.5 outline-none"
              />
            </div>
          </Field>

          {/* the pace: this is what converts every future expense into days */}
          <Field label={t("goals.monthly")}>
            <div className="flex items-center rounded-xl border bg-card px-3 focus-within:border-accent">
              <span className="text-fg-muted">{CURRENCIES[currency].symbol}</span>
              <input
                type="text"
                inputMode="decimal"
                value={monthly}
                onChange={(e) => setMonthly(groupAmountInput(e.target.value))}
                placeholder="0"
                className="w-full bg-transparent px-2 py-2.5 outline-none"
              />
            </div>
            <p className="text-xs text-fg-muted">{t("goals.monthly.hint")}</p>
          </Field>

          <div className="space-y-1.5">
            <Check
              checked={hasDeadline}
              onChange={setHasDeadline}
              label={t("goals.deadline.set")}
            />
            {hasDeadline && (
              <div className="pt-1">
                <label className="text-xs font-medium text-fg-muted">{t("goals.deadline")}</label>
                <div className="mt-1.5">
                  <DatePicker
                    value={deadline}
                    onChange={setDeadline}
                    min={todayISO()}
                    max={addDays(todayISO(), 365 * 30)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Check
              checked={primary}
              onChange={setPrimary}
              disabled={primaryLocked}
              label={t("goals.makePrimary")}
            />
            <p className="pl-8 text-xs text-fg-muted">{t("goals.primary.hint")}</p>
          </div>

          {/* opening balance — money already set aside before tracking. Only on
              create; afterwards progress moves via "Add money" contributions. */}
          {!editing && (
            <Field label={t("goals.saved2")}>
              <div className="flex items-center rounded-xl border bg-card px-3 focus-within:border-accent">
                <span className="text-fg-muted">{CURRENCIES[currency].symbol}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={saved}
                  onChange={(e) => setSaved(groupAmountInput(e.target.value))}
                  placeholder="0"
                  className="w-full bg-transparent px-2 py-2.5 outline-none"
                />
              </div>
              <p className="text-xs text-fg-muted">{t("goals.saved2.hint")}</p>
            </Field>
          )}
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

function Check({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center gap-3 text-sm ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
          checked ? "border-accent bg-accent text-white" : "border-border"
        }`}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 6" />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="font-medium">{label}</span>
    </label>
  );
}

// a year out is a sane default when the user opts into a deadline
function defaultDeadline(): string {
  return addDays(todayISO(), 365);
}
