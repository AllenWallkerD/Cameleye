"use client";

import { useApp } from "./app-provider";
import { Icon } from "./icons";
import { DatePicker, MIN_PICKABLE_DATE, MONTHS, formatDateShort, todayISO } from "./date-picker";
import { currentYM, shiftYM, type Period } from "@/lib/data";
import type { Locale } from "@/lib/i18n";

export type { Period };
export { currentYM };

// Localized label for any period: "March 2026", "2026", or "1 Jul – 31 Jul 2026".
export function periodLabel(period: Period, locale: Locale): string {
  if (period.mode === "year") return String(period.y);
  if (period.mode === "month") {
    const [y, m] = period.ym.split("-").map(Number);
    return `${MONTHS[locale][m - 1]} ${y}`;
  }
  return `${formatDateShort(period.from, locale)} – ${formatDateShort(period.to, locale)}`;
}

export function PeriodTabs({
  period,
  onChange,
}: {
  period: Period;
  onChange: (p: Period) => void;
}) {
  const { t, locale } = useApp();
  const nowYM = currentYM();
  const nowYear = new Date().getFullYear();

  function step(delta: number) {
    if (period.mode === "month") onChange({ mode: "month", ym: shiftYM(period.ym, delta) });
    else if (period.mode === "year") onChange({ mode: "year", y: period.y + delta });
  }

  // pick a sensible year to anchor month/range when switching modes
  const anchorYear =
    period.mode === "month"
      ? Number(period.ym.slice(0, 4))
      : period.mode === "year"
      ? period.y
      : Number(period.from.slice(0, 4));

  let label = "";
  let nextDisabled = false;
  if (period.mode === "month") {
    label = periodLabel(period, locale);
    nextDisabled = period.ym >= nowYM;
  } else if (period.mode === "year") {
    label = periodLabel(period, locale);
    nextDisabled = period.y >= nowYear;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center rounded-xl border bg-card p-0.5">
        <Seg
          active={period.mode === "month"}
          onClick={() =>
            onChange({
              mode: "month",
              ym: period.mode === "month" ? period.ym : `${anchorYear}-${nowYM.slice(5)}`,
            })
          }
        >
          {t("month")}
        </Seg>
        <Seg
          active={period.mode === "year"}
          onClick={() => onChange({ mode: "year", y: anchorYear })}
        >
          {t("period.year")}
        </Seg>
        <Seg
          active={period.mode === "range"}
          onClick={() =>
            onChange(
              period.mode === "range"
                ? period
                : { mode: "range", from: `${nowYM}-01`, to: todayISO() }
            )
          }
        >
          {t("period.range")}
        </Seg>
      </div>

      {period.mode === "range" ? (
        <div className="flex items-center gap-2">
          <div className="w-36 sm:w-40">
            <DatePicker
              value={period.from}
              onChange={(from) => onChange({ mode: "range", from, to: period.to })}
              min={MIN_PICKABLE_DATE}
              max={period.to}
            />
          </div>
          <span className="text-fg-muted">–</span>
          <div className="w-36 sm:w-40">
            <DatePicker
              value={period.to}
              onChange={(to) => onChange({ mode: "range", from: period.from, to })}
              min={period.from}
              max={todayISO()}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1 rounded-xl border bg-card p-0.5">
          <button
            onClick={() => step(-1)}
            className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-bg-subtle"
            aria-label="Previous"
          >
            <Icon.chevronLeft width={18} height={18} />
          </button>
          <span className="min-w-[124px] text-center text-sm font-medium">{label}</span>
          <button
            onClick={() => step(1)}
            disabled={nextDisabled}
            className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-bg-subtle disabled:opacity-30"
            aria-label="Next"
          >
            <Icon.chevronRight width={18} height={18} />
          </button>
        </div>
      )}
    </div>
  );
}

function Seg({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-accent-soft text-accent" : "text-fg-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
