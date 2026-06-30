"use client";

import { useState } from "react";
import { formatMoney, type CurrencyCode } from "@/lib/currency";

export type BarDatum = { label: string; income: number; expense: number };

export function BarChart({
  data,
  currency,
  incomeColor = "var(--pos)",
  expenseColor = "var(--accent)",
}: {
  data: BarDatum[];
  currency: CurrencyCode;
  incomeColor?: string;
  expenseColor?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = 280;
  const padX = 28;
  const padTop = 16;
  const padBottom = 36;
  const plotH = H - padTop - padBottom;
  const max = Math.max(1, ...data.map((d) => Math.max(d.income, d.expense)));
  const niceMax = roundUp(max);
  const groupW = (W - padX * 2) / data.length;
  const barW = Math.min(18, groupW / 3.2);
  const gap = Math.min(6, barW * 0.5);
  const labelEvery = data.length <= 12 ? 1 : Math.ceil(data.length / 12);

  const y = (v: number) => padTop + plotH - (v / niceMax) * plotH;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" aria-hidden="true">
        {/* gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line
              x1={padX}
              x2={W - padX}
              y1={padTop + plotH * g}
              y2={padTop + plotH * g}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray={g === 1 ? "0" : "3 4"}
            />
            <text
              x={padX - 6}
              y={padTop + plotH * g + 4}
              textAnchor="end"
              className="fill-[var(--fg-muted)]"
              fontSize={10}
            >
              {short(niceMax * (1 - g))}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const gx = padX + groupW * i + groupW / 2;
          const active = hover === i;
          return (
            <g
              key={d.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <rect
                x={padX + groupW * i}
                y={padTop}
                width={groupW}
                height={plotH}
                fill={active ? "var(--bg-subtle)" : "transparent"}
                rx={8}
              />
              <rect
                x={gx - barW - gap / 2}
                y={y(d.income)}
                width={barW}
                height={padTop + plotH - y(d.income)}
                rx={4}
                fill={incomeColor}
                opacity={hover === null || active ? 1 : 0.4}
              />
              <rect
                x={gx + gap / 2}
                y={y(d.expense)}
                width={barW}
                height={padTop + plotH - y(d.expense)}
                rx={4}
                fill={expenseColor}
                opacity={hover === null || active ? 1 : 0.4}
              />
              {i % labelEvery === 0 && (
                <text
                  x={gx}
                  y={H - 14}
                  textAnchor="middle"
                  className="fill-[var(--fg-muted)]"
                  fontSize={11}
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -top-1 rounded-xl border bg-card px-3 py-2 text-xs shadow-lg"
          style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}
        >
          <div className="mb-1 font-medium">{data[hover].label}</div>
          <div className="flex items-center gap-1.5" style={{ color: incomeColor }}>
            ● {formatMoney(data[hover].income, currency, { compact: true })}
          </div>
          <div className="flex items-center gap-1.5" style={{ color: expenseColor }}>
            ● {formatMoney(data[hover].expense, currency, { compact: true })}
          </div>
        </div>
      )}
    </div>
  );

  function short(v: number) {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
    if (v >= 1000) return Math.round(v / 1000) + "K";
    return String(Math.round(v));
  }
}

function roundUp(v: number) {
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / mag) * mag;
}
