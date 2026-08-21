// "Копилка" math: turn money into TIME against a savings goal.
//
// The whole idea of the app rests on one conversion: if you can put aside R ₸
// per day, then spending X ₸ pushes your goal X/R days further away. Everything
// here is pure so the UI can call it freely inside render/useMemo.

import { addDays, type Goal, type Transaction } from "./data";

// average calendar month — same constant the budget scaling already uses
export const DAYS_PER_MONTH = 30.4375;

// How much the user can realistically set aside, per day.
//  • "plan"   — they told us ("откладываю в месяц"); trust it.
//  • "actual" — derived from what actually stayed unspent over the last 90 days.
//  • "none"   — nothing to go on, so time conversions are hidden entirely.
export type SavingRate = {
  perDay: number;
  monthly: number;
  source: "plan" | "actual" | "none";
};

export const NO_RATE: SavingRate = { perDay: 0, monthly: 0, source: "none" };

const ACTUAL_WINDOW_DAYS = 90;

export function savingRate(
  goal: Goal | null,
  transactions: Transaction[],
  today: string
): SavingRate {
  if (goal && goal.monthlyKzt > 0) {
    return { perDay: goal.monthlyKzt / DAYS_PER_MONTH, monthly: goal.monthlyKzt, source: "plan" };
  }
  // Fall back to observed behaviour: income minus everything that was actually
  // spent. Goal transfers and the "savings" category are skipped — moving money
  // into a jar isn't earning it, and counting it would deflate the rate twice.
  const from = addDays(today, -ACTUAL_WINDOW_DAYS);
  let net = 0;
  for (const x of transactions) {
    if (x.date < from || x.date > today) continue;
    if (x.goalId || x.category === "savings") continue;
    net += x.type === "income" ? x.amountKzt : -x.amountKzt;
  }
  if (net <= 0) return NO_RATE;
  const perDay = net / ACTUAL_WINDOW_DAYS;
  return { perDay, monthly: perDay * DAYS_PER_MONTH, source: "actual" };
}

// Days of progress an amount is worth. null when we have no rate to divide by.
export function daysFor(amountKzt: number, rate: SavingRate): number | null {
  if (rate.perDay <= 0 || amountKzt <= 0) return null;
  return amountKzt / rate.perDay;
}

// Calendar days between two ISO dates (to − from); negative when `to` is past.
export function diffDays(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}

export type Forecast = {
  remainingKzt: number;
  done: boolean;
  daysLeft: number | null; // at the current rate
  etaIso: string | null;
  deadlineDaysLeft: number | null; // calendar days until the user's deadline
  requiredMonthly: number | null; // pace needed to actually hit that deadline
  driftDays: number | null; // eta − deadline: >0 late, <0 early
};

export function forecast(goal: Goal, rate: SavingRate, today: string): Forecast {
  const remainingKzt = Math.max(0, goal.targetKzt - goal.savedKzt);
  const done = remainingKzt <= 0;
  const daysLeft = done ? 0 : daysFor(remainingKzt, rate);
  const etaIso = daysLeft === null ? null : addDays(today, Math.ceil(daysLeft));

  let deadlineDaysLeft: number | null = null;
  let requiredMonthly: number | null = null;
  let driftDays: number | null = null;
  if (goal.deadline) {
    deadlineDaysLeft = diffDays(today, goal.deadline);
    if (!done) {
      // an overdue deadline needs the whole remainder "this month" — clamp to a
      // single day of runway so the number stays finite instead of exploding
      const runway = Math.max(1, deadlineDaysLeft);
      requiredMonthly = (remainingKzt / runway) * DAYS_PER_MONTH;
    } else {
      requiredMonthly = 0;
    }
    if (etaIso) driftDays = diffDays(goal.deadline, etaIso);
  }

  return { remainingKzt, done, daysLeft, etaIso, deadlineDaysLeft, requiredMonthly, driftDays };
}

// ── formatting ────────────────────────────────────────────────
// Units come from the dictionary so kz/ru/en all read naturally.

function unit(t: (k: string) => string) {
  return { d: t("dur.d"), h: t("dur.h"), mo: t("dur.mo"), y: t("dur.y") };
}

// Full form: "2 д 4 ч", "3 мес 5 д", "1 г 2 мес".
export function formatDuration(days: number, t: (k: string) => string): string {
  const u = unit(t);
  if (!Number.isFinite(days) || days <= 0) return `0 ${u.h}`;

  if (days < 1) {
    const h = Math.max(1, Math.round(days * 24));
    return h === 24 ? `1 ${u.d}` : `${h} ${u.h}`;
  }
  if (days < 30) {
    let d = Math.floor(days);
    let h = Math.round((days - d) * 24);
    if (h === 24) {
      d += 1;
      h = 0;
    }
    return h > 0 ? `${d} ${u.d} ${h} ${u.h}` : `${d} ${u.d}`;
  }
  if (days < 365) {
    const mo = Math.floor(days / DAYS_PER_MONTH);
    const d = Math.round(days - mo * DAYS_PER_MONTH);
    return d > 0 ? `${mo} ${u.mo} ${d} ${u.d}` : `${mo} ${u.mo}`;
  }
  let y = Math.floor(days / 365.25);
  let mo = Math.round((days - y * 365.25) / DAYS_PER_MONTH);
  if (mo >= 12) {
    y += 1;
    mo = 0;
  }
  return mo > 0 ? `${y} ${u.y} ${mo} ${u.mo}` : `${y} ${u.y}`;
}

// Single-unit form for tight spots (list rows, chips): "4 ч", "12 д", "3 мес".
export function formatDurationShort(days: number, t: (k: string) => string): string {
  const u = unit(t);
  if (!Number.isFinite(days) || days <= 0) return `0 ${u.h}`;
  if (days < 1) return `${Math.max(1, Math.round(days * 24))} ${u.h}`;
  if (days < 30) return `${Math.round(days)} ${u.d}`;
  if (days < 365) return `${Math.round(days / DAYS_PER_MONTH)} ${u.mo}`;
  return `${(days / 365.25).toFixed(1)} ${u.y}`;
}
