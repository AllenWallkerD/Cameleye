"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./app-provider";
import { NAV } from "./nav-items";

// Mobile-only bottom tab bar (native app feel).
export function BottomNav() {
  const { t } = useApp();
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/90 backdrop-blur-lg lg:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {NAV.map(({ key, icon: I, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={key}
              href={href}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium"
            >
              <span
                className={`grid h-8 w-12 place-items-center rounded-full transition-colors ${
                  active ? "bg-accent-soft text-accent" : "text-fg-muted"
                }`}
              >
                <I width={20} height={20} />
              </span>
              <span className={active ? "text-accent" : "text-fg-muted"}>{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
