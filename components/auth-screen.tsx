"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "./app-provider";
import { Icon } from "./icons";
import { LOCALES, type Locale } from "@/lib/i18n";

export function AuthScreen() {
  const { t, locale, setLocale, theme, toggleTheme } = useApp();
  const [supabase] = useState(() => createClient());
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // onAuthStateChange in AppProvider swaps to the dashboard
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) setNotice(t("auth.checkEmail"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  }

  return (
    <main className="relative grid min-h-screen place-items-center px-4">
      {/* top-right: language + theme */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <div className="flex items-center rounded-xl border bg-card p-0.5">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLocale(l.code as Locale)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                locale === l.code ? "bg-accent-soft text-accent" : "text-fg-muted hover:text-fg"
              }`}
            >
              {l.code.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={toggleTheme}
          aria-label={t("theme")}
          className="grid h-9 w-9 place-items-center rounded-xl border bg-card text-fg-muted hover:text-fg"
        >
          {theme === "light" ? <Icon.moon width={17} height={17} /> : <Icon.sun width={17} height={17} />}
        </button>
      </div>

      <div className="w-full max-w-sm animate-fade-up">
        {/* brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grad-accent grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg shadow-accent/30">
            <Icon.camel width={28} height={28} />
          </div>
          <h1 className="text-grad mt-4 text-3xl font-bold tracking-tight">{t("appName")}</h1>
          <p className="mt-1 text-sm text-fg-muted">{t("auth.subtitle")}</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <button
            onClick={google}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border bg-card py-2.5 text-sm font-medium transition-colors hover:bg-bg-subtle"
          >
            <GoogleMark />
            {t("auth.google")}
          </button>

          <div className="my-4 flex items-center gap-3 text-xs text-fg-muted">
            <span className="h-px flex-1 bg-border" />
            {t("auth.or")}
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("auth.name")}
                className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.email")}
              className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.password")}
              className="w-full rounded-xl border bg-card px-3 py-2.5 text-sm outline-none focus:border-accent"
            />

            {error && (
              <p className="rounded-lg bg-neg/10 px-3 py-2 text-xs text-neg">{error}</p>
            )}
            {notice && (
              <p className="rounded-lg bg-pos/10 px-3 py-2 text-xs text-pos">{notice}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="grad-accent w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm shadow-accent/30 transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "…" : mode === "signin" ? t("auth.signin") : t("auth.signup")}
            </button>
          </form>

          <button
            onClick={() => {
              setMode((m) => (m === "signin" ? "signup" : "signin"));
              setError(null);
              setNotice(null);
            }}
            className="mt-4 w-full text-center text-xs font-medium text-accent hover:underline"
          >
            {mode === "signin" ? t("auth.toSignup") : t("auth.toSignin")}
          </button>
        </div>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 24 44c11 0 20-8 20-20 0-1.3-.1-2.3-.4-3.5Z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7Z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.6 5C9.5 39.6 16.2 44 24 44Z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C39.9 35.5 44 30.4 44 24c0-1.3-.1-2.3-.4-3.5Z" />
    </svg>
  );
}
