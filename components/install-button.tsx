"use client";

import { useEffect, useState } from "react";
import { useApp } from "./app-provider";
import { Icon } from "./icons";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Renders an "Install app" button only on devices/browsers where the app is
// installable and not yet installed (Android Chrome, desktop Chrome/Edge).
export function InstallButton() {
  const { t } = useApp();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred) return null;

  return (
    <button
      onClick={async () => {
        await deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
      }}
      className="grad-accent flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-sm shadow-accent/30 transition-opacity hover:opacity-90"
    >
      <Icon.download width={18} height={18} />
      {t("pwa.install")}
    </button>
  );
}
