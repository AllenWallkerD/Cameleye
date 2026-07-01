"use client";

import { useRef, useState } from "react";
import { useApp } from "./app-provider";
import { Icon } from "./icons";
import { useEscape } from "@/lib/use-escape";
import type { Locale } from "@/lib/i18n";

export const MONTHS: Record<Locale, string[]> = {
  kz: ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"],
  ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

const WEEKDAYS: Record<Locale, string[]> = {
  kz: ["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жс"],
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
};

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// far enough back to cover any realistic history
export const MIN_PICKABLE_DATE = "2015-01-01";

// "2026-07-01" -> "1 июл 2026" (localized, short month)
export function formatDateShort(iso: string, locale: Locale): string {
  const [y, m, d] = iso.split("-").map(Number);
  const month = MONTHS[locale][m - 1]?.slice(0, 3) ?? "";
  return `${d} ${month} ${y}`;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
}: {
  value: string;
  onChange: (iso: string) => void;
  min: string;
  max: string;
}) {
  const { locale } = useApp();
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEscape(() => setOpen(false), open);

  const [sy, sm, sd] = value.split("-").map(Number);
  const [view, setView] = useState({ y: sy, m: sm - 1 });

  function toggle() {
    setOpen((o) => {
      const next = !o;
      if (next) {
        setView({ y: sy, m: sm - 1 }); // reopen on the selected month
        const rect = wrapRef.current?.getBoundingClientRect();
        if (rect) {
          const spaceBelow = window.innerHeight - rect.bottom;
          // flip upward only when there's clearly more room above
          setDropUp(spaceBelow < 360 && rect.top > spaceBelow);
        }
      }
      return next;
    });
  }

  const minMV = monthValue(min);
  const maxMV = monthValue(max);
  const curMV = view.y * 12 + view.m;

  const firstIdx = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Mon-first
  const daysIn = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstIdx).fill(null),
    ...Array.from({ length: daysIn }, (_, i) => i + 1),
  ];

  function shift(delta: number) {
    setView((v) => {
      const total = v.y * 12 + v.m + delta;
      return { y: Math.floor(total / 12), m: ((total % 12) + 12) % 12 };
    });
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between rounded-xl border bg-card px-3 py-2.5 text-left outline-none transition-colors focus:border-accent"
      >
        <span>{`${sd} ${MONTHS[locale][sm - 1]} ${sy}`}</span>
        <Icon.calendar width={17} height={17} className="text-fg-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className={`absolute left-0 z-20 w-72 rounded-2xl border bg-card p-3 shadow-xl ${
              dropUp ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                disabled={curMV <= minMV}
                onClick={() => shift(-1)}
                className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-bg-subtle disabled:opacity-30"
              >
                <Icon.chevronLeft width={18} height={18} />
              </button>
              <span className="text-sm font-semibold">
                {MONTHS[locale][view.m]} {view.y}
              </span>
              <button
                type="button"
                disabled={curMV >= maxMV}
                onClick={() => shift(1)}
                className="grid h-8 w-8 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-bg-subtle disabled:opacity-30"
              >
                <Icon.chevronRight width={18} height={18} />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-fg-muted">
              {WEEKDAYS[locale].map((w) => (
                <span key={w} className="py-1">{w}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) return <span key={i} />;
                const iso = toISO(view.y, view.m, day);
                const disabled = iso < min || iso > max;
                const selected = iso === value;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                    className={`grid h-9 place-items-center rounded-lg text-sm transition-colors ${
                      selected
                        ? "grad-accent font-semibold text-white"
                        : disabled
                        ? "text-fg-muted/30"
                        : "hover:bg-bg-subtle"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function monthValue(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
}
