export type CatType = "income" | "expense";

// A selected time window. `month` uses ym "YYYY-MM"; `year` aggregates a whole
// year; `range` is a custom inclusive span of ISO dates (from ≤ to).
export type Period =
  | { mode: "month"; ym: string }
  | { mode: "year"; y: number }
  | { mode: "range"; from: string; to: string };

const pad2 = (n: number) => String(n).padStart(2, "0");

// Colors are rendered into inline styles/SVG, so anything coming from the DB is
// validated to a plain 6-digit hex before use (defense-in-depth against a
// malicious color string smuggling a url()/beacon into a CSS shorthand).
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
export function safeColor(color: string, fallback = "#94a3b8"): string {
  return HEX_COLOR.test(color) ? color : fallback;
}

// A fully-resolved category used across the UI (defaults + user-created).
export type CategoryMeta = {
  id: string; // default slug (e.g. "rent") or DB uuid for custom ones
  type: CatType;
  name: string; // localized for defaults, user-typed for custom
  icon: string; // key into CATEGORY_ICONS
  color: string;
  custom: boolean;
};

// Built-in categories everyone gets. `labelKey` resolves via i18n at runtime.
export const DEFAULT_CATEGORIES: {
  id: string;
  type: CatType;
  icon: string;
  color: string;
  labelKey: string;
}[] = [
  // income
  { id: "income", type: "income", icon: "salary", color: "#10b981", labelKey: "cat.income" },
  { id: "income_other", type: "income", icon: "cash", color: "#34d399", labelKey: "cat.income_other" },
  // expense — common personal-finance categories
  { id: "groceries", type: "expense", icon: "cart", color: "#f59e0b", labelKey: "cat.groceries" },
  { id: "dining", type: "expense", icon: "food", color: "#fb923c", labelKey: "cat.dining" },
  { id: "transport", type: "expense", icon: "car", color: "#06b6d4", labelKey: "cat.transport" },
  { id: "rent", type: "expense", icon: "home", color: "#8b5cf6", labelKey: "cat.rent" },
  { id: "utilities", type: "expense", icon: "bolt", color: "#0ea5e9", labelKey: "cat.utilities" },
  { id: "subscriptions", type: "expense", icon: "wifi", color: "#6366f1", labelKey: "cat.subscriptions" },
  { id: "shopping", type: "expense", icon: "shirt", color: "#ec4899", labelKey: "cat.shopping" },
  { id: "entertainment", type: "expense", icon: "game", color: "#a855f7", labelKey: "cat.entertainment" },
  { id: "health", type: "expense", icon: "health", color: "#f43f6e", labelKey: "cat.health" },
  { id: "education", type: "expense", icon: "education", color: "#14b8a6", labelKey: "cat.education" },
  { id: "credit", type: "expense", icon: "card", color: "#ef4444", labelKey: "cat.credit" },
  { id: "debts", type: "expense", icon: "wallet", color: "#fb7185", labelKey: "cat.debts" },
  { id: "savings", type: "expense", icon: "piggy", color: "#22c55e", labelKey: "cat.savings" },
  { id: "other", type: "expense", icon: "dots", color: "#94a3b8", labelKey: "cat.other" },
];

export type Transaction = {
  id: string;
  date: string; // ISO yyyy-mm-dd (DB: occurred_on)
  category: string; // category id (default slug or custom uuid)
  type: CatType;
  amountKzt: number;
  note: string;
  goalId: string | null; // set when this tx is a contribution toward a goal
};

export type Goal = {
  id: string;
  key: string;
  title: string;
  targetKzt: number;
  savedKzt: number;
  color: string;
};

export type Recurring = {
  id: string;
  type: CatType;
  category: string;
  amountKzt: number;
  note: string;
  dayOfMonth: number; // 1–31, clamped to the month's length when generated
  lastYm: string | null; // last "YYYY-MM" already materialized
  active: boolean;
};

export function rowToRecurring(r: {
  id: string;
  type: CatType;
  category: string;
  amount_kzt: number | string;
  note: string | null;
  day_of_month: number;
  last_ym: string | null;
  active: boolean;
}): Recurring {
  return {
    id: r.id,
    type: r.type,
    category: r.category,
    amountKzt: Number(r.amount_kzt),
    note: r.note ?? "",
    dayOfMonth: r.day_of_month,
    lastYm: r.last_ym,
    active: r.active,
  };
}

export function daysInMonthYM(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export type Budget = { id: string; category: string; limitKzt: number };

export function rowToBudget(r: { id: string; category: string; limit_kzt: number | string }): Budget {
  return { id: r.id, category: r.category, limitKzt: Number(r.limit_kzt) };
}

export const GOAL_SUGGESTIONS: { key: string; color: string }[] = [
  { key: "installments", color: "#f43f6e" },
  { key: "downpayment", color: "#8b5cf6" },
  { key: "teeth", color: "#0ea5e9" },
  { key: "chinese", color: "#f59e0b" },
];

export function inPeriod(date: string, period: Period): boolean {
  if (period.mode === "month") return date.slice(0, 7) === period.ym;
  if (period.mode === "year") return date.slice(0, 4) === String(period.y);
  return date >= period.from && date <= period.to;
}

// ISO date shifted by N days (calendar-correct, no mutation surprises).
export function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

// Inclusive number of days between two ISO dates (from..to).
export function rangeDays(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000) + 1;
}

// Monthly budget limits are scaled to the selected window: 1× for a month,
// 12× for a year, and ~days/30.44 for a custom range.
export function budgetMultiplier(period: Period): number {
  if (period.mode === "month") return 1;
  if (period.mode === "year") return 12;
  return rangeDays(period.from, period.to) / 30.4375;
}

// Income/expense series for the bar chart: per-day when a single month is
// selected, per-month (Jan–Dec) for the whole-year view.
export function buildBarSeries(
  transactions: Transaction[],
  period: Period,
  monthsShort: string[]
): { label: string; income: number; expense: number }[] {
  if (period.mode === "month") {
    const [y, m] = period.ym.split("-").map(Number); // m is 1-based
    const days = new Date(y, m, 0).getDate();
    const arr = Array.from({ length: days }, (_, i) => ({
      label: String(i + 1),
      income: 0,
      expense: 0,
    }));
    for (const x of transactions) {
      if (x.date.slice(0, 7) !== period.ym) continue;
      const d = parseInt(x.date.slice(8, 10), 10) - 1;
      if (d < 0 || d >= days) continue;
      if (x.type === "income") arr[d].income += x.amountKzt;
      else arr[d].expense += x.amountKzt;
    }
    return arr;
  }
  if (period.mode === "range") {
    const span = rangeDays(period.from, period.to);
    // short spans read best per-day; longer ones bucket per-month
    if (span <= 45) {
      const idx = new Map<string, number>();
      const arr = Array.from({ length: span }, (_, i) => {
        const iso = addDays(period.from, i);
        idx.set(iso, i);
        return { label: String(Number(iso.slice(8, 10))), income: 0, expense: 0 };
      });
      for (const x of transactions) {
        const i = idx.get(x.date);
        if (i === undefined) continue;
        if (x.type === "income") arr[i].income += x.amountKzt;
        else arr[i].expense += x.amountKzt;
      }
      return arr;
    }
    const [fy, fm] = period.from.split("-").map(Number);
    const [ty, tm] = period.to.split("-").map(Number);
    const startIdx = fy * 12 + (fm - 1);
    const endIdx = ty * 12 + (tm - 1);
    const multiYear = fy !== ty;
    const arr = [];
    for (let i = startIdx; i <= endIdx; i++) {
      const mi = ((i % 12) + 12) % 12;
      const label = multiYear ? `${monthsShort[mi]} ${String(Math.floor(i / 12)).slice(2)}` : monthsShort[mi];
      arr.push({ label, income: 0, expense: 0 });
    }
    for (const x of transactions) {
      if (x.date < period.from || x.date > period.to) continue;
      const [xy, xm] = x.date.split("-").map(Number);
      const i = xy * 12 + (xm - 1) - startIdx;
      if (i < 0 || i >= arr.length) continue;
      if (x.type === "income") arr[i].income += x.amountKzt;
      else arr[i].expense += x.amountKzt;
    }
    return arr;
  }
  const arr = Array.from({ length: 12 }, (_, i) => ({
    label: monthsShort[i],
    income: 0,
    expense: 0,
  }));
  for (const x of transactions) {
    if (x.date.slice(0, 4) !== String(period.y)) continue;
    const mi = parseInt(x.date.slice(5, 7), 10) - 1;
    if (x.type === "income") arr[mi].income += x.amountKzt;
    else arr[mi].expense += x.amountKzt;
  }
  return arr;
}

export function currentYM(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

export function shiftYM(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

// ── DB row ↔ app model mappers ────────────────────────────────
type TxRow = {
  id: string;
  type: CatType;
  category: string;
  amount_kzt: number | string;
  note: string | null;
  occurred_on: string;
  goal_id?: string | null;
};

export function rowToTransaction(r: TxRow): Transaction {
  return {
    id: r.id,
    date: r.occurred_on,
    category: r.category,
    type: r.type,
    amountKzt: Number(r.amount_kzt),
    note: r.note ?? "",
    goalId: r.goal_id ?? null,
  };
}

type GoalRow = {
  id: string;
  key: string;
  title: string | null;
  target_kzt: number | string;
  saved_kzt: number | string;
  color: string;
};

export function rowToGoal(r: GoalRow): Goal {
  return {
    id: r.id,
    key: r.key,
    title: r.title ?? r.key,
    targetKzt: Number(r.target_kzt),
    savedKzt: Number(r.saved_kzt),
    color: safeColor(r.color, "#a78bfa"),
  };
}

type CatRow = {
  id: string;
  type: CatType;
  name: string;
  icon: string;
  color: string;
};

export function rowToCategory(r: CatRow): CategoryMeta {
  return {
    id: r.id,
    type: r.type,
    name: r.name,
    icon: r.icon,
    color: safeColor(r.color),
    custom: true,
  };
}
