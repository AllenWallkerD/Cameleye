"use client";

import { useApp } from "./app-provider";
import { Icon } from "./icons";
import { useModal } from "@/lib/use-modal";

const SECTIONS = [
  { icon: "swap", key: "s1" },
  { icon: "flag", key: "s2" },
  { icon: "pie", key: "s3" },
  { icon: "calendar", key: "s4" },
  { icon: "planet", key: "s5" },
] as const;

export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useApp();
  const panelRef = useModal(open, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("help.title")}
        className="animate-fade-up relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl"
      >
        <div className="grad-accent relative shrink-0 px-6 py-6 text-white">
          <Icon.camel width={30} height={30} />
          <h2 className="mt-2 text-xl font-bold tracking-tight">{t("help.title")}</h2>
          <p className="mt-0.5 text-sm text-white/80">{t("help.subtitle")}</p>
          <button
            onClick={onClose}
            aria-label={t("tx.cancel")}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Icon.close width={20} height={20} />
          </button>
          <span className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        </div>

        <div className="flex-1 space-y-4 overflow-auto px-6 py-6">
          {SECTIONS.map(({ icon, key }) => {
            const I = Icon[icon];
            return (
              <div key={key} className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                  <I width={19} height={19} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{t(`help.${key}.title`)}</h3>
                  <p className="mt-0.5 text-sm text-fg-muted">{t(`help.${key}.body`)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="shrink-0 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="grad-accent w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm shadow-accent/30 transition-opacity hover:opacity-90"
          >
            {t("help.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
