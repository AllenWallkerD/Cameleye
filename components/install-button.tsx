"use client";

import { useApp } from "./app-provider";
import { Icon } from "./icons";

// Full-width install button (used in Settings). Renders only when installable.
export function InstallButton() {
  const { t, canInstall, promptInstall } = useApp();
  if (!canInstall) return null;
  return (
    <button
      onClick={promptInstall}
      className="grad-accent flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-sm shadow-accent/30 transition-opacity hover:opacity-90"
    >
      <Icon.download width={18} height={18} />
      {t("pwa.install")}
    </button>
  );
}
