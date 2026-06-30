"use client";

import { useState } from "react";
import { useApp } from "@/components/app-provider";
import { Icon } from "@/components/icons";
import { CategoryIcon } from "@/components/category-icons";
import { AddCategoryDrawer } from "@/components/add-category-drawer";
import { RecurringDrawer } from "@/components/recurring-drawer";
import { InstallButton } from "@/components/install-button";
import { LOCALES, type Locale } from "@/lib/i18n";
import { CURRENCIES, formatMoney, type CurrencyCode } from "@/lib/currency";
import { exportTransactionsCSV } from "@/lib/export";
import type { CategoryMeta, Recurring } from "@/lib/data";

export default function SettingsPage() {
  const {
    t, locale, setLocale, currency, setCurrency, theme, toggleTheme,
    displayName, email, categories, categoryById, removeCategory,
    recurring, removeRecurring, transactions, updatePassword, confirm, signOut,
  } = useApp();
  const [catOpen, setCatOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryMeta | null>(null);
  const [recOpen, setRecOpen] = useState(false);
  const [recEdit, setRecEdit] = useState<Recurring | null>(null);
  const [pw, setPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  function exportCsv() {
    const rows = [...transactions]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((x) => ({
        date: x.date,
        type: x.type,
        categoryName: categoryById(x.category).name,
        amountKzt: x.amountKzt,
        note: x.note,
      }));
    exportTransactionsCSV(rows);
  }

  async function changePassword() {
    if (pw.length < 6) return;
    setPwBusy(true);
    const ok = await updatePassword(pw);
    setPwBusy(false);
    if (ok) setPw("");
  }

  const custom = categories.filter((c) => c.custom);
  const builtin = categories.filter((c) => !c.custom);

  function openAdd() {
    setEditing(null);
    setCatOpen(true);
  }
  function openEdit(c: CategoryMeta) {
    setEditing(c);
    setCatOpen(true);
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t("nav.settings")}</h1>

      <InstallButton />

      {/* profile */}
      <Card title={t("settings.account")}>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-lg font-semibold uppercase text-accent">
            {(displayName ?? email)?.[0] ?? "?"}
          </span>
          <div className="min-w-0">
            {displayName && <p className="truncate font-medium">{displayName}</p>}
            <p className="truncate text-sm text-fg-muted">{email}</p>
          </div>
        </div>
      </Card>

      {/* preferences */}
      <Card title={t("settings.prefs")}>
        <Row label={t("settings.language")}>
          <Segmented
            value={locale}
            onChange={(v) => setLocale(v as Locale)}
            options={LOCALES.map((l) => ({ value: l.code, label: l.code.toUpperCase() }))}
          />
        </Row>
        <Row label={t("settings.currency")}>
          <Segmented
            value={currency}
            onChange={(v) => setCurrency(v as CurrencyCode)}
            options={(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => ({
              value: c,
              label: `${CURRENCIES[c].symbol} ${c}`,
            }))}
          />
        </Row>
        <Row label={t("theme")}>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
          >
            {theme === "light" ? <Icon.sun width={16} height={16} /> : <Icon.moon width={16} height={16} />}
            {theme === "light" ? "Light" : "Dark"}
          </button>
        </Row>
      </Card>

      {/* recurring payments */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg-muted">{t("recurring.title")}</h2>
          <button
            onClick={() => setRecOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
          >
            <Icon.plus width={15} height={15} />
            {t("recurring.add")}
          </button>
        </div>

        {recurring.length === 0 ? (
          <p className="py-4 text-center text-sm text-fg-muted">{t("recurring.none")}</p>
        ) : (
          <ul className="space-y-1.5">
            {recurring.map((r) => {
              const cat = categoryById(r.category);
              return (
                <li key={r.id} className="flex items-center gap-3 rounded-xl border bg-card-muted px-3 py-2.5">
                  <CatBadge c={cat} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{cat.name}</p>
                    <p className="truncate text-xs text-fg-muted">
                      {r.note || "—"} · {r.dayOfMonth} {t("recurring.dayShort")}
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-sm font-semibold tabular-nums"
                    style={{ color: r.type === "income" ? "var(--pos)" : "var(--fg)" }}
                  >
                    {r.type === "income" ? "+" : "−"}
                    {formatMoney(r.amountKzt, currency, { compact: true })}
                  </span>
                  <button
                    onClick={() => setRecEdit(r)}
                    className="shrink-0 rounded-lg p-1.5 text-fg-muted transition-colors hover:text-accent"
                    aria-label={t("edit")}
                  >
                    <Icon.pencil width={15} height={15} />
                  </button>
                  <button
                    onClick={async () => {
                      if (await confirm(t("confirm.delete"))) removeRecurring(r.id);
                    }}
                    className="shrink-0 rounded-lg p-1.5 text-fg-muted transition-colors hover:text-neg"
                    aria-label={t("tx.delete")}
                  >
                    <Icon.trash width={15} height={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* categories — full CRUD */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg-muted">{t("cat.yours")}</h2>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
          >
            <Icon.plus width={15} height={15} />
            {t("cat.add")}
          </button>
        </div>

        {custom.length === 0 ? (
          <p className="py-4 text-center text-sm text-fg-muted">{t("cat.none")}</p>
        ) : (
          <ul className="space-y-1.5">
            {custom.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-xl border bg-card-muted px-3 py-2">
                <CatBadge c={c} />
                <span className="flex-1 truncate text-sm font-medium">{c.name}</span>
                <span className="text-[11px] text-fg-muted">{t(`tx.${c.type}`)}</span>
                <button
                  onClick={() => openEdit(c)}
                  className="rounded-lg p-1.5 text-fg-muted transition-colors hover:text-accent"
                  aria-label={t("cat.edit")}
                >
                  <Icon.pencil width={15} height={15} />
                </button>
                <button
                  onClick={async () => {
                    if (await confirm(t("confirm.delete"))) removeCategory(c.id);
                  }}
                  className="rounded-lg p-1.5 text-fg-muted transition-colors hover:text-neg"
                  aria-label={t("tx.delete")}
                >
                  <Icon.trash width={15} height={15} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* built-in, read-only */}
        <h3 className="mb-2 mt-5 text-xs font-medium text-fg-muted">{t("cat.builtin")}</h3>
        <ul className="flex flex-wrap gap-2">
          {builtin.map((c) => (
            <li key={c.id} className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm">
              <CatBadge c={c} small />
              <span className="text-fg-muted">{c.name}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* data export */}
      <Card title={t("export.title")}>
        <button
          onClick={exportCsv}
          disabled={transactions.length === 0}
          className="flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:text-fg disabled:opacity-50"
        >
          <Icon.download width={16} height={16} />
          {t("export.csv")}
        </button>
      </Card>

      {/* security — change password */}
      <Card title={t("pw.title")}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 items-center rounded-xl border bg-card px-3 focus-within:border-accent">
            <Icon.lock width={16} height={16} className="text-fg-muted" />
            <input
              type="password"
              value={pw}
              minLength={6}
              onChange={(e) => setPw(e.target.value)}
              placeholder={t("pw.new")}
              className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
            />
          </div>
          <button
            onClick={changePassword}
            disabled={pw.length < 6 || pwBusy}
            className="grad-accent rounded-xl px-3.5 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/30 hover:opacity-90 disabled:opacity-50"
          >
            {pwBusy ? "…" : t("pw.change")}
          </button>
        </div>
      </Card>

      <button
        onClick={signOut}
        className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:border-neg hover:text-neg"
      >
        <Icon.logout width={16} height={16} />
        {t("auth.signout")}
      </button>

      <AddCategoryDrawer open={catOpen} onClose={() => setCatOpen(false)} editing={editing} />
      <RecurringDrawer open={recOpen} onClose={() => setRecOpen(false)} />
      {recEdit && (
        <RecurringDrawer key={recEdit.id} open editing={recEdit} onClose={() => setRecEdit(null)} />
      )}
    </>
  );
}

function CatBadge({ c, small = false }: { c: CategoryMeta; small?: boolean }) {
  const box = small ? "h-6 w-6" : "h-8 w-8";
  const sz = small ? 13 : 16;
  return (
    <span
      className={`grid ${box} shrink-0 place-items-center rounded-lg`}
      style={{ background: `color-mix(in srgb, ${c.color} 16%, transparent)`, color: c.color }}
    >
      <CategoryIcon name={c.icon} width={sz} height={sz} />
    </span>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-fg-muted">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center rounded-xl border bg-card p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === o.value ? "bg-accent-soft text-accent" : "text-fg-muted hover:text-fg"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
