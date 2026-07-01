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
import { HelpModal } from "./help-modal";
import { Toaster, ConfirmDialog, type Toast, type ConfirmState } from "./feedback-ui";

type Theme = "light" | "dark";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

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
  updatePassword: (newPassword: string) => Promise<boolean>;
  deleteAccount: () => Promise<void>;
  addTxOpen: boolean;
  openAddTransaction: () => void;
  closeAddTransaction: () => void;
  helpOpen: boolean;
  openHelp: () => void;
  closeHelp: () => void;
  canInstall: boolean;
  promptInstall: () => Promise<void>;
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
  updateRecurring: (id: string, patch: Omit<Recurring, "id" | "lastYm" | "active">) => Promise<void>;
  removeRecurring: (id: string) => Promise<void>;
  addTransaction: (tx: NewTx) => Promise<void>;
  updateTransaction: (id: string, patch: NewTx) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  removeTransactions: (ids: string[]) => Promise<void>;
  importTransactions: (rows: NewTx[]) => Promise<void>;
  addGoal: (g: NewGoal) => Promise<void>;
  updateGoal: (id: string, patch: NewGoal) => Promise<void>;
  removeGoal: (id: string, deleteTransactions?: boolean) => Promise<void>;
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
  const [helpOpen, setHelpOpen] = useState(false);
  const openHelp = useCallback(() => setHelpOpen(true), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  // PWA install prompt (Android / desktop Chrome fire `beforeinstallprompt`)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  const promptInstall = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }, [installPrompt]);

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

  useEffect(() => {
    writePref("cameleye.locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);
  useEffect(() => writePref("cameleye.currency", currency), [currency]);

  // show the quick guide once, on a user's very first authenticated visit
  useEffect(() => {
    if (!session) return;
    if (readPref("cameleye.guided", ["1"], "") === "1") return;
    setHelpOpen(true);
    writePref("cameleye.guided", "1");
  }, [session]);

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
          .select("id,type,category,amount_kzt,note,occurred_on,goal_id")
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
          .select("id,type,category,amount_kzt,note,occurred_on,goal_id");
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
      // Don't orphan data: move this category's transactions & recurring rules to
      // a safe default, drop its budget, THEN delete the category itself.
      const fallback = customCats.find((c) => c.id === id)?.type === "income" ? "income_other" : "other";
      setCustomCats((prev) => prev.filter((x) => x.id !== id));
      setTransactions((prev) => prev.map((x) => (x.category === id ? { ...x, category: fallback } : x)));
      setRecurring((prev) => prev.map((r) => (r.category === id ? { ...r, category: fallback } : r)));
      setBudgets((prev) => prev.filter((b) => b.category !== id));
      await Promise.all([
        supabase.from("transactions").update({ category: fallback }).eq("category", id),
        supabase.from("recurring").update({ category: fallback }).eq("category", id),
        supabase.from("budgets").delete().eq("category", id),
      ]);
      await supabase.from("categories").delete().eq("id", id);
    },
    [supabase, customCats]
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
            .select("id,type,category,amount_kzt,note,occurred_on,goal_id")
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

  const updateRecurring = useCallback(
    async (id: string, patch: Omit<Recurring, "id" | "lastYm" | "active">) => {
      setRecurring((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      const { error } = await supabase
        .from("recurring")
        .update({
          type: patch.type,
          category: patch.category,
          amount_kzt: patch.amountKzt,
          note: patch.note,
          day_of_month: patch.dayOfMonth,
        })
        .eq("id", id);
      toast(error ? t("toast.error") : t("toast.updated"), error ? "err" : "ok");
    },
    [supabase, toast, t]
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
        .select("id,type,category,amount_kzt,note,occurred_on,goal_id")
        .single();
      if (!error && data) {
        setTransactions((prev) =>
          [rowToTransaction(data), ...prev].sort((a, b) =>
            a.date < b.date ? 1 : -1
          )
        );
        // proactive nudge: did this push the category over its budget?
        let warned = false;
        if (tx.type === "expense") {
          const b = budgets.find((x) => x.category === tx.category);
          if (b) {
            const ym = tx.date.slice(0, 7);
            const spent =
              transactions
                .filter((x) => x.type === "expense" && x.category === tx.category && x.date.slice(0, 7) === ym)
                .reduce((s, x) => s + x.amountKzt, 0) + tx.amountKzt;
            if (spent > b.limitKzt) {
              toast(`${categoryById(tx.category).name} · ${t("alert.over")}`, "err");
              warned = true;
            }
          }
        }
        if (!warned) toast(t("toast.added"));
      } else {
        toast(t("toast.error"), "err");
      }
    },
    [supabase, userId, toast, t, budgets, transactions, categoryById]
  );

  const importTransactions = useCallback(
    async (rows: NewTx[]) => {
      if (!userId || rows.length === 0) return;
      const payload = rows.map((r) => ({
        user_id: userId,
        type: r.type,
        category: r.category,
        amount_kzt: r.amountKzt,
        note: r.note,
        occurred_on: r.date,
      }));
      const { data, error } = await supabase
        .from("transactions")
        .insert(payload)
        .select("id,type,category,amount_kzt,note,occurred_on,goal_id");
      if (!error && data) {
        setTransactions((prev) =>
          [...data.map(rowToTransaction), ...prev].sort((a, b) => (a.date < b.date ? 1 : -1))
        );
        toast(`${data.length} ${t("import.imported")}`);
      } else {
        toast(t("toast.error"), "err");
      }
    },
    [supabase, userId, toast, t]
  );

  // Keep a goal's saved_kzt in step with its linked transactions (DB + state).
  const adjustGoalSaved = useCallback(
    async (goalId: string, delta: number) => {
      if (!delta) return;
      const g = goals.find((x) => x.id === goalId);
      if (!g) return;
      const newSaved = Math.max(0, g.savedKzt + delta);
      setGoals((prev) => prev.map((x) => (x.id === goalId ? { ...x, savedKzt: newSaved } : x)));
      await supabase.from("goals").update({ saved_kzt: newSaved }).eq("id", goalId);
    },
    [supabase, goals]
  );

  const updateTransaction = useCallback(
    async (id: string, patch: NewTx) => {
      const before = transactions.find((x) => x.id === id);
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
        .select("id,type,category,amount_kzt,note,occurred_on,goal_id")
        .single();
      if (!error && data) {
        const updated = rowToTransaction(data);
        setTransactions((prev) =>
          prev.map((x) => (x.id === id ? updated : x)).sort((a, b) => (a.date < b.date ? 1 : -1))
        );
        // if this was a goal contribution and the amount changed, move the goal
        if (updated.goalId) {
          await adjustGoalSaved(updated.goalId, updated.amountKzt - (before?.amountKzt ?? 0));
        }
        toast(t("toast.updated"));
      } else {
        toast(t("toast.error"), "err");
      }
    },
    [supabase, toast, t, transactions, adjustGoalSaved]
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      const removed = transactions.find((x) => x.id === id);
      setTransactions((prev) => prev.filter((x) => x.id !== id));
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (!error && removed?.goalId) await adjustGoalSaved(removed.goalId, -removed.amountKzt);
      toast(error ? t("toast.error") : t("toast.deleted"), error ? "err" : "ok");
    },
    [supabase, toast, t, transactions, adjustGoalSaved]
  );

  const removeTransactions = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      // tally how much to walk back per goal before we drop the rows
      const perGoal = new Map<string, number>();
      for (const x of transactions) {
        if (idSet.has(x.id) && x.goalId) {
          perGoal.set(x.goalId, (perGoal.get(x.goalId) ?? 0) + x.amountKzt);
        }
      }
      setTransactions((prev) => prev.filter((x) => !idSet.has(x.id)));
      const { error } = await supabase.from("transactions").delete().in("id", ids);
      if (!error) {
        for (const [goalId, amount] of perGoal) await adjustGoalSaved(goalId, -amount);
      }
      toast(error ? t("toast.error") : t("toast.deleted"), error ? "err" : "ok");
    },
    [supabase, toast, t, transactions, adjustGoalSaved]
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
      // saved_kzt is intentionally NOT edited here — progress only moves via
      // contributions (and their deletion), so it always matches transactions.
      setGoals((prev) =>
        prev.map((g) =>
          g.id === id
            ? { ...g, title: patch.title, targetKzt: patch.targetKzt, color: patch.color }
            : g
        )
      );
      const { error } = await supabase
        .from("goals")
        .update({
          title: patch.title,
          target_kzt: patch.targetKzt,
          color: patch.color,
        })
        .eq("id", id);
      toast(error ? t("toast.error") : t("toast.updated"), error ? "err" : "ok");
    },
    [supabase, toast, t]
  );

  const removeGoal = useCallback(
    async (id: string, deleteTransactions = false) => {
      setGoals((prev) => prev.filter((x) => x.id !== id));
      if (deleteTransactions) {
        // remove the goal's contributions too (that money returns to balance)
        const ids = transactions.filter((x) => x.goalId === id).map((x) => x.id);
        if (ids.length) {
          setTransactions((prev) => prev.filter((x) => x.goalId !== id));
          await supabase.from("transactions").delete().in("id", ids);
        }
      } else {
        // keep them as history — just unlink locally (DB does ON DELETE SET NULL)
        setTransactions((prev) => prev.map((x) => (x.goalId === id ? { ...x, goalId: null } : x)));
      }
      const { error } = await supabase.from("goals").delete().eq("id", id);
      toast(error ? t("toast.error") : t("toast.deleted"), error ? "err" : "ok");
    },
    [supabase, toast, t, transactions]
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
          goal_id: goalId,
        })
        .select("id,type,category,amount_kzt,note,occurred_on,goal_id")
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

  const updatePassword = useCallback(
    async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      toast(error ? t("toast.error") : t("toast.updated"), error ? "err" : "ok");
      return !error;
    },
    [supabase, toast, t]
  );

  const deleteAccount = useCallback(async () => {
    // delete_user() is a SECURITY DEFINER SQL function that removes the auth
    // user; ON DELETE CASCADE wipes all their rows. Then we sign out.
    const { error } = await supabase.rpc("delete_user");
    if (error) {
      toast(t("toast.error"), "err");
      return;
    }
    await supabase.auth.signOut();
  }, [supabase, toast, t]);

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
    updatePassword,
    deleteAccount,
    addTxOpen,
    openAddTransaction,
    closeAddTransaction,
    helpOpen,
    openHelp,
    closeHelp,
    canInstall: !!installPrompt,
    promptInstall,
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
    updateRecurring,
    removeRecurring,
    addTransaction,
    updateTransaction,
    removeTransaction,
    removeTransactions,
    importTransactions,
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

      {session && <HelpModal open={helpOpen} onClose={closeHelp} />}

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
