"use client";

import Link from "next/link";
import { useApp } from "./app-provider";
import { Icon } from "./icons";

export function OnboardingCard() {
  const { t, displayName, openAddTransaction } = useApp();

  return (
    <section className="animate-fade-up overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="grad-accent relative px-6 py-8 text-white">
        <Icon.camel width={36} height={36} />
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          {displayName ? `${t("greeting")}, ${displayName}` : t("onb.title")}
        </h1>
        <p className="mt-1 text-sm text-white/80">{t("onb.subtitle")}</p>
        <span className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      </div>

      <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
        <button
          onClick={openAddTransaction}
          className="flex flex-col items-start gap-2 rounded-xl border bg-card-muted p-4 text-left transition-colors hover:border-accent"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
            <Icon.plus width={20} height={20} />
          </span>
          <span className="text-sm font-medium">{t("tx.add")}</span>
        </button>

        <Link
          href="/goals"
          className="flex flex-col items-start gap-2 rounded-xl border bg-card-muted p-4 transition-colors hover:border-accent"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
            <Icon.flag width={20} height={20} />
          </span>
          <span className="text-sm font-medium">{t("goals.add")}</span>
        </Link>

        <Link
          href="/budgets"
          className="flex flex-col items-start gap-2 rounded-xl border bg-card-muted p-4 transition-colors hover:border-accent"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
            <Icon.pie width={20} height={20} />
          </span>
          <span className="text-sm font-medium">{t("budget.add")}</span>
        </Link>
      </div>
    </section>
  );
}
