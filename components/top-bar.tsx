"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "./app-provider";
import { Icon } from "./icons";
import { LOCALES, type Locale } from "@/lib/i18n";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";

export function TopBar() {
  const { t, locale, setLocale, currency, setCurrency, theme, toggleTheme, email, displayName, search, setSearch, openAddTransaction, signOut } =
    useApp();
  const router = useRouter();
  const [menu, setMenu] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-bg/80 px-4 py-3 backdrop-blur-md sm:px-6">
      {/* mobile brand */}
      <div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
        <div className="grad-accent grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white">
          <Icon.camel width={18} height={18} />
        </div>
        <span className="text-grad truncate text-lg font-bold tracking-tight">{t("appName")}</span>
      </div>

      {/* desktop greeting */}
      <div className="hidden min-w-0 flex-1 items-center lg:flex">
        <h1 className="truncate text-xl font-semibold tracking-tight">
          {displayName ? `${t("greeting")}, ${displayName}` : t("nav.dashboard")}
        </h1>
      </div>

      {/* search — tablet & up */}
      <div className="hidden items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm text-fg-muted md:flex md:w-56">
        <Icon.search width={16} height={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => router.push("/transactions")}
          placeholder={t("search.placeholder")}
          className="w-full bg-transparent text-fg outline-none placeholder:text-fg-muted"
        />
      </div>

      {/* language + currency — tablet & up (phones have these in Settings) */}
      <div className="hidden md:block">
        <Segmented
          value={locale}
          onChange={(v) => setLocale(v as Locale)}
          options={LOCALES.map((l) => ({ value: l.code, label: l.code.toUpperCase() }))}
        />
      </div>
      <div className="hidden md:block">
        <Segmented
          value={currency}
          onChange={(v) => setCurrency(v as CurrencyCode)}
          options={(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => ({
            value: c,
            label: CURRENCIES[c].symbol,
          }))}
        />
      </div>

      {/* theme — always */}
      <button
        onClick={toggleTheme}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border bg-card text-fg-muted transition-colors hover:text-fg"
        aria-label={t("theme")}
      >
        {theme === "light" ? <Icon.moon width={17} height={17} /> : <Icon.sun width={17} height={17} />}
      </button>

      {/* add — desktop only (mobile uses the FAB) */}
      <button
        onClick={openAddTransaction}
        className="grad-accent hidden items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-white shadow-sm shadow-accent/30 transition-opacity hover:opacity-90 lg:flex"
      >
        <Icon.plus width={17} height={17} />
        {t("tx.add")}
      </button>

      {/* account — always */}
      <div className="relative shrink-0">
        <button
          onClick={() => setMenu((m) => !m)}
          className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-sm font-semibold uppercase text-accent"
          aria-label="Account"
        >
          {(displayName ?? email)?.[0] ?? "?"}
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border bg-card p-1.5 shadow-lg">
              {displayName && <p className="truncate px-2.5 pt-1.5 text-sm font-medium">{displayName}</p>}
              <p className="truncate px-2.5 pb-1.5 text-xs text-fg-muted">{email}</p>
              <button
                onClick={() => {
                  setMenu(false);
                  signOut();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-fg-muted transition-colors hover:bg-bg-subtle hover:text-neg"
              >
                <Icon.logout width={16} height={16} />
                {t("auth.signout")}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
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
          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            value === o.value ? "bg-accent-soft text-accent" : "text-fg-muted hover:text-fg"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
