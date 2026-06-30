"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./app-provider";
import { Icon } from "./icons";
import { NAV } from "./nav-items";

// Desktop sidebar only — mobile uses the bottom tab bar.
export function Sidebar() {
  const { t } = useApp();
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card px-4 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <div className="grad-accent grid h-9 w-9 place-items-center rounded-xl text-white shadow-sm shadow-accent/30">
          <Icon.camel width={20} height={20} />
        </div>
        <div className="leading-none">
          <span className="text-grad text-lg font-bold tracking-tight">{t("appName")}</span>
          <p className="mt-1 text-[11px] text-fg-muted">{t("tagline")}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ key, icon: I, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={key}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-accent-soft text-accent" : "text-fg-muted hover:bg-bg-subtle hover:text-fg"
              }`}
            >
              <I width={19} height={19} />
              {t(key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
