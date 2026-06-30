"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { dict, type Locale } from "@/lib/i18n";
import { type CurrencyCode } from "@/lib/currency";
import {
  DEFAULT_CATEGORIES,
  currentYM,
  daysInMonthYM,
  rowToBudget,
  rowToCategory,
  rowToGoal,
  rowToRecurring,
  rowToTransaction,
  shiftYM,
  type Budget,
  type CategoryMeta,
  type CatType,
  type Goal,
  type Recurring,
  type Transaction,
} from "@/lib/data";
import { todayISO } from "./date-picker";
import { AuthScreen } from "./auth-screen";
import { AppShell } from "./app-shell";
import { Toaster, ConfirmDialog, type Toast, type ConfirmState } from "./feedback-ui";

type Theme = "light" | "dark";

type NewTx = {
  date: string;
  category: string;
  type: CatType;
  amountKzt: number;
  note: string;
};

type NewGoal = {
  key: string;
  title: string;
  targetKzt: number;
  savedKzt: number;
  color: string;
};

type NewCategory = {
  type: CatType;
  name: string;
  icon: string;
  color: string;
};

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  theme: Theme;
  toggleTheme: () => void;
  email: string | undefined;
  displayName: string | undefined;
  signOut: () => Promise<void>;
  addTxOpen: boolean;
  openAddTransaction: () => void;
  closeAddTransaction: () => void;
  search: string;
  setSearch: (s: string) => void;
  toast: (text: string, kind?: "ok" | "err") => void;
  confirm: (text: string) => Promise<boolean>;
  loadingData: boolean;
  transactions: Transaction[];
  goals: Goal[];
  categories: CategoryMeta[];
  categoryById: (id: string) => CategoryMeta;
  budgets: Budget[];
  setBudget: (category: string, limitKzt: number) => Promise<void>;
  removeBudget: (category: string) => Promise<void>;
  recurring: Recurring[];
  addRecurring: (r: Omit<Recurring, "id" | "lastYm" | "active">) => Promise<void>;
  removeRecurring: (id: string) => Promise<void>;
  addTransaction: (tx: NewTx) => Promise<void>;
  updateTransaction: (id: string, patch: NewTx) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  removeTransactions: (ids: string[]) => Promise<void>;
  addGoal: (g: NewGoal) => Promise<void>;
  updateGoal: (id: string, patch: NewGoal) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  contributeToGoal: (goalId: string, amountKzt: number, date: string) => Promise<void>;
  addCategory: (c: NewCategory) => Promise<CategoryMeta | null>;
  updateCategory: (id: string, patch: NewCategory) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
};

const AppCtx = createContext<Ctx | null>(null);

// device-level preference storage (UI only — financial data lives in Supabase)
function readPref<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

function writePref(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore (private mode / quota) */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClient());

  const [locale, setLocale] = useState<Locale>(() =>
    readPref("cameleye.locale", ["kz", "ru", "en"], "ru")
  );
  const [currency, setCurrency] = useState<CurrencyCode>(() =>
    readPref("cameleye.currency", ["KZT", "USD", "EUR"], "KZT")
  );
  const [theme, setTheme] = useState<Theme>(() =>
    readPref("cameleye.theme", ["light", "dark"], "light")
  );

  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [customCats, setCustomCats] = useState<CategoryMeta[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [search, setSearch] = useState("");
  const [addTxOpen, setAddTxOpen] = useState(false);
  const openAddTransaction = useCallback(() => setAddTxOpen(true), []);
  const closeAddTransaction = useCallback(() => setAddTxOpen(false), []);

  // toasts + confirm dialog (custom, no system dialogs)
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const toastId = useRef(0);

  const toast = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    const id = ++toastId.current;
    setToasts((p) => [...p, { id, text, kind }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  const confirm = useCallback(
    (text: string) =>
      new Promise<boolean>((resolve) => setConfirmState({ text, resolve })),
    []
  );

  // theme class on <html> + persist
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    writePref("cameleye.theme", theme);
  }, [theme]);

  useEffect(() => writePref("cameleye.locale", locale), [locale]);
  useEffect(() => writePref("cameleye.currency", currency), [currency]);

  // auth bootstrap + subscription
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  // load the signed-in user's data
  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setGoals([]);
      setCustomCats([]);
      setBudgets([]);
      setRecurring([]);
      return;
    }
    let active = true;
    setLoadingData(true);
    (async () => {
      const [tx, gl, ct, bd, rc] = await Promise.all([
        supabase
          .from("transactions")
          .select("id,type,category,amount_kzt,note,occurred_on")
          .order("occurred_on", { ascending: false }),
        supabase
          .from("goals")
          .select("id,key,title,target_kzt,saved_kzt,color")
          .order("created_at", { ascending: true }),
        supabase
          .from("categories")
          .select("id,type,name,icon,color")
          .order("created_at", { ascending: true }),
        supabase.from("budgets").select("id,category,limit_kzt"),
        supabase
          .from("recurring")
          .select("id,type,category,amount_kzt,note,day_of_month,last_ym,active"),
      ]);
      if (!active) return;

      const rules = (rc.data ?? []).map(rowToRecurring);
      setGoals((gl.data ?? []).map(rowToGoal));
      setCustomCats((ct.data ?? []).map(rowToCategory));
      setBudgets((bd.data ?? []).map(rowToBudget));

      // materialize any due recurring occurrences up to today
      const today = todayISO();
      const curYm = currentYM();
      const newRows: Record<string, unknown>[] = [];
      const ruleUpdates: { id: string; lastYm: string | null }[] = [];
      for (const r of rules) {
        if (!r.active) continue;
        let cursor = shiftYM(r.lastYm ?? shiftYM(curYm, -1), 1);
        let last = r.lastYm;
        let guard = 0;
        while (cursor <= curYm && guard++ < 240) {
          const day = Math.min(r.dayOfMonth, daysInMonthYM(cursor));
          const date = `${cursor}-${String(day).padStart(2, "0")}`;
          if (date > today) break;
          newRows.push({
            user_id: userId,
            type: r.type,
            category: r.category,
            amount_kzt: r.amountKzt,
            note: r.note,
            occurred_on: date,
          });
          last = cursor;
          cursor = shiftYM(cursor, 1);
        }
        if (last !== r.lastYm) ruleUpdates.push({ id: r.id, lastYm: last });
      }

      let generated: Transaction[] = [];
      if (newRows.length) {
        const ins = await supabase
          .from("transactions")
          .insert(newRows)
          .select("id,type,category,amount_kzt,note,occurred_on");
        generated = (ins.data ?? []).map(rowToTransaction);
      }

      const baseTx = (tx.data ?? []).map(rowToTransaction);
      setTransactions(
        [...generated, ...baseTx].sort((a, b) => (a.date < b.date ? 1 : -1))
      );
      setRecurring(
        rules.map((r) => {
          const u = ruleUpdates.find((x) => x.id === r.id);
          return u ? { ...r, lastYm: u.lastYm } : r;
        })
      );
      for (const u of ruleUpdates) {
        await supabase.from("recurring").update({ last_ym: u.lastYm }).eq("id", u.id);
      }
      setLoadingData(false);
    })();
    return () => {
      active = false;
    };
  }, [userId, supabase]);

  const t = useMemo(() => {
    const table = dict[locale];
    return (key: string) => table[key] ?? key;
  }, [locale]);

  // built-in categories (localized) + the user's custom ones
  const categories = useMemo<CategoryMeta[]>(() => {
    const defaults: CategoryMeta[] = DEFAULT_CATEGORIES.map((c) => ({
      id: c.id,
      type: c.type,
      name: dict[locale][c.labelKey] ?? c.labelKey,
      icon: c.icon,
      color: c.color,
      custom: false,
    }));
    return [...defaults, ...customCats];
  }, [locale, customCats]);

  const categoryById = useCallback(
    (id: string): CategoryMeta =>
      categories.find((c) => c.id === id) ?? {
        id,
        type: "expense",
        name: dict[locale]["cat.other"] ?? "Other",
        icon: "dots",
        color: "#94a3b8",
        custom: false,
      },
    [categories, locale]
  );

  const addCategory = useCallback(
    async (c: NewCategory): Promise<CategoryMeta | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("categories")
        .insert({
          user_id: userId,
          type: c.type,
          name: c.name,
          icon: c.icon,
          color: c.color,
        })
        .select("id,type,name,icon,color")
        .single();
      if (error || !data) return null;
      const meta = rowToCategory(data);
      setCustomCats((prev) => [...prev, meta]);
      return meta;
    },
    [supabase, userId]
  );

  const updateCategory = useCallback(
    async (id: string, patch: NewCategory) => {
      setCustomCats((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      );
      await supabase
        .from("categories")
        .update({ type: patch.type, name: patch.name, icon: patch.icon, color: patch.color })
        .eq("id", id);
    },
    [supabase]
  );

  const removeCategory = useCallback(
    async (id: string) => {
      setCustomCats((prev) => prev.filter((x) => x.id !== id));
      await supabase.from("categories").delete().eq("id", id);
    },
    [supabase]
  );

  const setBudget = useCallback(
    async (category: string, limitKzt: number) => {
      if (!userId) return;
      const { data, error } = await supabase
        .from("budgets")
        .upsert(
          { user_id: userId, category, limit_kzt: limitKzt },
          { onConflict: "user_id,category" }
        )
        .select("id,category,limit_kzt")
        .single();
      if (!error && data) {
        const b = rowToBudget(data);
        setBudgets((prev) => [...prev.filter((x) => x.category !== category), b]);
        toast(t("toast.updated"));
      } else {
        toast(t("toast.error"), "err");
      }
    },
    [supabase, userId, toast, t]
  );

  const removeBudget = useCallback(
    async (category: string) => {
      setBudgets((prev) => prev.filter((x) => x.category !== category));
      await supabase.from("budgets").delete().eq("category", category);
    },
    [supabase]
  );

  const addRecurring = useCallback(
    async (r: Omit<Recurring, "id" | "lastYm" | "active">) => {
      if (!userId) return;
      // start generating from the current month onward (no backfill)
      const lastYm = shiftYM(currentYM(), -1);
      const { data, error } = await supabase
        .from("recurring")
        .insert({
          user_id: userId,
          type: r.type,
          category: r.category,
          amount_kzt: r.amountKzt,
          note: r.note,
          day_of_month: r.dayOfMonth,
          last_ym: lastYm,
          active: true,
        })
        .select("id,type,category,amount_kzt,note,day_of_month,last_ym,active")
        .single();
      if (!error && data) {
        const rule = rowToRecurring(data);
        setRecurring((prev) => [...prev, rule]);
        // materialize this month's occurrence immediately if its day has passed
        const today = todayISO();
        const curYm = currentYM();
        const day = Math.min(rule.dayOfMonth, daysInMonthYM(curYm));
        const date = `${curYm}-${String(day).padStart(2, "0")}`;
        if (date <= today) {
          const ins = await supabase
            .from("transactions")
            .insert({
              user_id: userId,
              type: rule.type,
              category: rule.category,
              amount_kzt: rule.amountKzt,
              note: rule.note,
              occurred_on: date,
            })
            .select("id,type,category,amount_kzt,note,occurred_on")
            .single();
          if (ins.data) {
            setTransactions((prev) =>
              [rowToTransaction(ins.data), ...prev].sort((a, b) => (a.date < b.date ? 1 : -1))
            );
          }
          await supabase.from("recurring").update({ last_ym: curYm }).eq("id", rule.id);
          setRecurring((prev) => prev.map((x) => (x.id === rule.id ? { ...x, lastYm: curYm } : x)));
        }
        toast(t("toast.added"));
      } else {
        toast(t("toast.error"), "err");
      }
    },
    [supabase, userId, toast, t]
  );

  const removeRecurring = useCallback(
    async (id: string) => {
      setRecurring((prev) => prev.filter((x) => x.id !== id));
      const { error } = await supabase.from("recurring").delete().eq("id", id);
      toast(error ? t("toast.error") : t("toast.deleted"), error ? "err" : "ok");
    },
    [supabase, toast, t]
  );

  const addTransaction = useCallback(
    async (tx: NewTx) => {
      if (!userId) return;
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type: tx.type,
          category: tx.category,
          amount_kzt: tx.amountKzt,
          note: tx.note,
          occurred_on: tx.date,
        })
        .select("id,type,category,amount_kzt,note,occurred_on")
        .single();
      if (!error && data) {
        setTransactions((prev) =>
          [rowToTransaction(data), ...prev].sort((a, b) =>
            a.date < b.date ? 1 : -1
          )
        );
        toast(t("toast.added"));
      } else {
        toast(t("toast.error"), "err");
      }
    },
    [supabase, userId, toast, t]
  );

  const updateTransaction = useCallback(
    async (id: string, patch: NewTx) => {
      const { data, error } = await supabase
        .from("transactions")
        .update({
          type: patch.type,
          category: patch.category,
          amount_kzt: patch.amountKzt,
          note: patch.note,
          occurred_on: patch.date,
        })
        .eq("id", id)
        .select("id,type,category,amount_kzt,note,occurred_on")
        .single();
      if (!error && data) {
        const updated = rowToTransaction(data);
        setTransactions((prev) =>
          prev.map((x) => (x.id === id ? updated : x)).sort((a, b) => (a.date < b.date ? 1 : -1))
        );
        toast(t("toast.updated"));
      } else {
        toast(t("toast.error"), "err");
      }
    },
    [supabase, toast, t]
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      setTransactions((prev) => prev.filter((x) => x.id !== id));
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      toast(error ? t("toast.error") : t("toast.deleted"), error ? "err" : "ok");
    },
    [supabase, toast, t]
  );

  const removeTransactions = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      setTransactions((prev) => prev.filter((x) => !idSet.has(x.id)));
      const { error } = await supabase.from("transactions").delete().in("id", ids);
      toast(error ? t("toast.error") : t("toast.deleted"), error ? "err" : "ok");
    },
    [supabase, toast, t]
  );

  const addGoal = useCallback(
    async (g: NewGoal) => {
      if (!userId) return;
      const { data, error } = await supabase
        .from("goals")
        .insert({
          user_id: userId,
          key: g.key,
          title: g.title,
          target_kzt: g.targetKzt,
          saved_kzt: g.savedKzt,
          color: g.color,
        })
        .select("id,key,title,target_kzt,saved_kzt,color")
        .single();
      if (!error && data) {
        setGoals((prev) => [...prev, rowToGoal(data)]);
        toast(t("toast.added"));
      } else {
        toast(t("toast.error"), "err");
      }
    },
    [supabase, userId, toast, t]
  );

  const updateGoal = useCallback(
    async (id: string, patch: NewGoal) => {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === id
            ? { ...g, title: patch.title, targetKzt: patch.targetKzt, savedKzt: patch.savedKzt, color: patch.color }
            : g
        )
      );
      const { error } = await supabase
        .from("goals")
        .update({
          title: patch.title,
          target_kzt: patch.targetKzt,
          saved_kzt: patch.savedKzt,
          color: patch.color,
        })
        .eq("id", id);
      toast(error ? t("toast.error") : t("toast.updated"), error ? "err" : "ok");
    },
    [supabase, toast, t]
  );

  const removeGoal = useCallback(
    async (id: string) => {
      setGoals((prev) => prev.filter((x) => x.id !== id));
      const { error } = await supabase.from("goals").delete().eq("id", id);
      toast(error ? t("toast.error") : t("toast.deleted"), error ? "err" : "ok");
    },
    [supabase, toast, t]
  );

  // Putting money into a goal is a real money movement: it records a
  // transaction (a "savings" expense — the cash leaves your spendable balance)
  // AND advances the goal's progress.
  const contributeToGoal = useCallback(
    async (goalId: string, amountKzt: number, date: string) => {
      if (!userId || amountKzt <= 0) return;
      const goal = goals.find((g) => g.id === goalId);

      const { data } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type: "expense",
          category: "savings",
          amount_kzt: amountKzt,
          note: goal?.title ?? "",
          occurred_on: date,
        })
        .select("id,type,category,amount_kzt,note,occurred_on")
        .single();
      if (data) {
        setTransactions((prev) =>
          [rowToTransaction(data), ...prev].sort((a, b) => (a.date < b.date ? 1 : -1))
        );
      }

      const newSaved = (goal?.savedKzt ?? 0) + amountKzt;
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, savedKzt: newSaved } : g))
      );
      await supabase.from("goals").update({ saved_kzt: newSaved }).eq("id", goalId);
      toast(t("toast.added"));
    },
    [supabase, userId, goals, toast, t]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const value: Ctx = {
    locale,
    setLocale,
    t,
    currency,
    setCurrency,
    theme,
    toggleTheme: () => setTheme((p) => (p === "light" ? "dark" : "light")),
    email: session?.user?.email,
    displayName:
      (session?.user?.user_metadata?.display_name as string | undefined) ||
      (session?.user?.user_metadata?.full_name as string | undefined) ||
      (session?.user?.user_metadata?.name as string | undefined) ||
      session?.user?.email?.split("@")[0],
    signOut,
    addTxOpen,
    openAddTransaction,
    closeAddTransaction,
    search,
    setSearch,
    toast,
    confirm,
    loadingData,
    transactions,
    goals,
    categories,
    categoryById,
    budgets,
    setBudget,
    removeBudget,
    recurring,
    addRecurring,
    removeRecurring,
    addTransaction,
    updateTransaction,
    removeTransaction,
    removeTransactions,
    addGoal,
    updateGoal,
    removeGoal,
    contributeToGoal,
    addCategory,
    updateCategory,
    removeCategory,
  };

  return (
    <AppCtx.Provider value={value}>
      {!authReady ? (
        <div className="grid min-h-screen place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : session ? (
        <AppShell>{children}</AppShell>
      ) : (
        <AuthScreen />
      )}

      <Toaster toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />
      <ConfirmDialog
        state={confirmState}
        confirmLabel={t("tx.delete")}
        cancelLabel={t("tx.cancel")}
        bodyLabel={t("confirm.body")}
        onResolve={(ok) => {
          confirmState?.resolve(ok);
          setConfirmState(null);
        }}
      />
    </AppCtx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
