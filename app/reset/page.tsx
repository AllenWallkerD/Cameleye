"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/components/app-provider";
import { Icon } from "@/components/icons";

// Landing page for the password-recovery email link. Supabase's browser client
// exchanges the recovery token on load (detectSessionInUrl), establishing a
// session; here the user just sets a new password. This is the recovery entry
// point — the in-app change (Settings) still requires the current password.
export default function ResetPasswordPage() {
  const { t, toast } = useApp();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8 || busy) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      toast(t("toast.error"), "err");
      return;
    }
    toast(t("toast.updated"), "ok");
    router.push("/");
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-lg font-semibold">{t("pw.reset")}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t("pw.hint")}</p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="flex items-center rounded-xl border bg-card px-3 focus-within:border-accent">
            <Icon.lock width={16} height={16} className="text-fg-muted" />
            <input
              type="password"
              value={pw}
              minLength={8}
              onChange={(e) => setPw(e.target.value)}
              placeholder={t("pw.new")}
              autoComplete="new-password"
              autoFocus
              className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={pw.length < 8 || busy}
            className="grad-accent w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm shadow-accent/30 transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "…" : t("pw.change")}
          </button>
        </form>
      </div>
    </div>
  );
}
