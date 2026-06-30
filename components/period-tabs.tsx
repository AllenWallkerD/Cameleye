"use client";

import { useApp } from "./app-provider";
import { Icon } from "./icons";
import { MONTHS } from "./date-picker";
import { currentYM, shiftYM, type Period } from "@/lib/data";

export type { Period };
export { currentYM };

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

  let label = "";
  let nextDisabled = false;
  if (period.mode === "month") {
    const [y, m] = period.ym.split("-").map(Number);
    label = `${MONTHS[locale][m - 1]} ${y}`;
    nextDisabled = period.ym >= nowYM;
  } else {
    label = String(period.y);
    nextDisabled = period.y >= nowYear;
  }

  function step(delta: number) {
    if (period.mode === "month") onChange({ mode: "month", ym: shiftYM(period.ym, delta) });
    else onChange({ mode: "year", y: period.y + delta });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center rounded-xl border bg-card p-0.5">
        <Seg
          active={period.mode === "month"}
          onClick={() =>
            onChange({
              mode: "month",
              ym: period.mode === "month" ? period.ym : `${period.y}-${nowYM.slice(5)}`,
            })
          }
        >
          {t("month")}
        </Seg>
        <Seg
          active={period.mode === "year"}
          onClick={() =>
            onChange({
              mode: "year",
              y: period.mode === "month" ? Number(period.ym.slice(0, 4)) : period.y,
            })
          }
        >
          {t("period.year")}
        </Seg>
      </div>

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
