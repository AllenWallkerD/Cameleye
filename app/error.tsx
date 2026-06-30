"use client";

import { useEffect } from "react";
import { dict, type Locale } from "@/lib/i18n";
import { Icon } from "@/components/icons";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  let locale: Locale = "ru";
  try {
    const v = typeof window !== "undefined" ? localStorage.getItem("cameleye.locale") : null;
    if (v === "kz" || v === "ru" || v === "en") locale = v;
  } catch {
    /* ignore */
  }
  const t = (k: string) => dict[locale][k] ?? k;

  return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div className="max-w-sm">
        <div className="grad-accent mx-auto grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg shadow-accent/30">
          <Icon.camel width={28} height={28} />
        </div>
        <h1 className="mt-4 text-xl font-semibold">{t("err.title")}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t("err.body")}</p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={reset}
            className="grad-accent rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/30"
          >
            {t("err.retry")}
          </button>
          <a
            href="/"
            className="rounded-xl border px-4 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
          >
            {t("err.home")}
          </a>
        </div>
      </div>
    </div>
  );
}
