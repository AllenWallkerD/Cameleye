"use client";

import { useState } from "react";
import { formatMoney, type CurrencyCode } from "@/lib/currency";

export type DonutDatum = { label: string; value: number; color: string };

export function DonutChart({
  data,
  currency,
}: {
  data: DonutDatum[];
  currency: CurrencyCode;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 80;
  const r = 52;
  const cx = 100;
  const cy = 100;

  // cumulative fraction → arc angles (no mutation during render)
  const START = -Math.PI / 2;
  const arcs = data.map((d, i) => {
    const frac = d.value / total;
    const before = data.slice(0, i).reduce((s, x) => s + x.value, 0) / total;
    const start = START + before * Math.PI * 2;
    const end = start + frac * Math.PI * 2;
    return { ...d, start, end, frac, i };
  });

  const focus = hover !== null ? arcs[hover] : null;

  return (
    <div className="@container flex flex-col items-center gap-4">
      <svg viewBox="0 0 200 200" className="h-40 w-40 shrink-0" aria-hidden="true">
        {arcs.map((a) => (
          <path
            key={a.i}
            d={ring(cx, cy, R, r, a.start, a.end)}
            fill={a.color}
            opacity={hover === null || hover === a.i ? 1 : 0.35}
            onMouseEnter={() => setHover(a.i)}
            onMouseLeave={() => setHover(null)}
            style={{ transition: "opacity .15s" }}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-[var(--fg-muted)]" fontSize={11}>
          {focus ? focus.label : "Total"}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-[var(--fg)] font-semibold" fontSize={15}>
          {focus
            ? Math.round(focus.frac * 100) + "%"
            : formatMoney(total, currency, { compact: true })}
        </text>
      </svg>

      <ul className="grid w-full grid-cols-1 gap-1.5 text-sm">
        {arcs.map((a) => (
          <li
            key={a.i}
            className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 transition-colors"
            style={{ background: hover === a.i ? "var(--bg-subtle)" : "transparent" }}
            onMouseEnter={() => setHover(a.i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: a.color }} />
              <span className="truncate text-fg-muted">{a.label}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="font-medium tabular-nums">
                {formatMoney(a.value, currency, { compact: true })}
              </span>
              <span className="w-9 text-right text-xs text-fg-muted tabular-nums">
                {Math.round(a.frac * 100)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ring(
  cx: number,
  cy: number,
  R: number,
  r: number,
  start: number,
  end: number
) {
  // avoid full-circle degeneracy
  const e = end - start >= Math.PI * 2 ? end - 0.0001 : end;
  const large = e - start > Math.PI ? 1 : 0;
  const x1 = cx + R * Math.cos(start);
  const y1 = cy + R * Math.sin(start);
  const x2 = cx + R * Math.cos(e);
  const y2 = cy + R * Math.sin(e);
  const x3 = cx + r * Math.cos(e);
  const y3 = cy + r * Math.sin(e);
  const x4 = cx + r * Math.cos(start);
  const y4 = cy + r * Math.sin(start);
  return [
    `M ${x1} ${y1}`,
    `A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${r} ${r} 0 ${large} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}
