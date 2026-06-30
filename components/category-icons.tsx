import type { SVGProps } from "react";

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type IconC = (p: SVGProps<SVGSVGElement>) => React.ReactElement;

// Pickable icons for categories. Keys are stored in the DB (categories.icon).
export const CATEGORY_ICONS: Record<string, IconC> = {
  salary: (p) => (
    <svg {...base} {...p}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9v6M18 9v6" />
    </svg>
  ),
  wallet: (p) => (
    <svg {...base} {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h12v4M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7H6a2 2 0 0 1-2-2Z" />
      <circle cx="17" cy="13" r="1" />
    </svg>
  ),
  card: (p) => (
    <svg {...base} {...p}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 15h4" />
    </svg>
  ),
  cash: (p) => (
    <svg {...base} {...p}>
      <path d="M3 8l3-2 3 2 3-2 3 2 3-2 3 2v8l-3 2-3-2-3 2-3-2-3 2-3-2Z" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  home: (p) => (
    <svg {...base} {...p}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </svg>
  ),
  bolt: (p) => (
    <svg {...base} {...p}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  ),
  water: (p) => (
    <svg {...base} {...p}>
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />
    </svg>
  ),
  phone: (p) => (
    <svg {...base} {...p}>
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M11 18h2" />
    </svg>
  ),
  wifi: (p) => (
    <svg {...base} {...p}>
      <path d="M5 12a10 10 0 0 1 14 0M8 15a6 6 0 0 1 8 0" />
      <circle cx="12" cy="18.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  car: (p) => (
    <svg {...base} {...p}>
      <path d="M5 16v2M19 16v2" />
      <path d="M3 13l1.5-5A2 2 0 0 1 6.4 6.5h11.2A2 2 0 0 1 19.5 8L21 13v3H3v-3Z" />
      <path d="M3 13h18M7 16h.01M17 16h.01" />
    </svg>
  ),
  bus: (p) => (
    <svg {...base} {...p}>
      <rect x="4" y="4" width="16" height="13" rx="2" />
      <path d="M4 11h16M8 17v2M16 17v2M8 14h.01M16 14h.01" />
    </svg>
  ),
  fuel: (p) => (
    <svg {...base} {...p}>
      <path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12" />
      <path d="M14 8h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V9l-3-3" />
      <path d="M7 7h4" />
    </svg>
  ),
  plane: (p) => (
    <svg {...base} {...p}>
      <path d="M10 4 4 12l2 8 3-6 6 3 1-3-4-3 4-4Z" />
    </svg>
  ),
  cart: (p) => (
    <svg {...base} {...p}>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h2l2.5 12.5A2 2 0 0 0 8.5 17H18l2-9H6" />
    </svg>
  ),
  food: (p) => (
    <svg {...base} {...p}>
      <path d="M5 2v8a2 2 0 0 0 4 0V2M7 10v12M16 2c-1.5 0-2.5 2-2.5 5s1 4 2.5 4 2.5-1 2.5-4-1-5-2.5-5ZM16 15v7" />
    </svg>
  ),
  coffee: (p) => (
    <svg {...base} {...p}>
      <path d="M4 8h13v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z" />
      <path d="M17 9h2a2 2 0 0 1 0 6h-2M6 2v2M10 2v2M14 2v2M5 21h12" />
    </svg>
  ),
  health: (p) => (
    <svg {...base} {...p}>
      <path d="M12 21s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.4-7 10-7 10Z" />
    </svg>
  ),
  pill: (p) => (
    <svg {...base} {...p}>
      <rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)" />
      <path d="M8.5 8.5 15.5 15.5" />
    </svg>
  ),
  education: (p) => (
    <svg {...base} {...p}>
      <path d="M2 8l10-4 10 4-10 4Z" />
      <path d="M6 10v5c0 1 3 2.5 6 2.5s6-1.5 6-2.5v-5M22 8v5" />
    </svg>
  ),
  gift: (p) => (
    <svg {...base} {...p}>
      <rect x="3" y="9" width="18" height="5" rx="1" />
      <path d="M5 14v7h14v-7M12 9v12" />
      <path d="M12 9C9 9 7 8 7 6.5S8.5 4 10 4.5 12 9 12 9Zm0 0c3 0 5-1 5-2.5S15.5 4 14 4.5 12 9 12 9Z" />
    </svg>
  ),
  fitness: (p) => (
    <svg {...base} {...p}>
      <path d="M6 8v8M18 8v8M4 10v4M20 10v4M6 12h12" />
    </svg>
  ),
  pet: (p) => (
    <svg {...base} {...p}>
      <circle cx="6" cy="10" r="1.6" />
      <circle cx="10.5" cy="7" r="1.6" />
      <circle cx="15" cy="7" r="1.6" />
      <circle cx="18.5" cy="10.5" r="1.6" />
      <path d="M8 16.5c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5-1.8 3-4 3-4-1-4-3Z" />
    </svg>
  ),
  shirt: (p) => (
    <svg {...base} {...p}>
      <path d="M8 3 4 6l2 3 2-1v10h8V8l2 1 2-3-4-3-2 2H10Z" />
    </svg>
  ),
  baby: (p) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M10 7.5h.01M14 7.5h.01M10.5 10c.5.5 2.5.5 3 0M5 21c1-4 4-6 7-6s6 2 7 6" />
    </svg>
  ),
  music: (p) => (
    <svg {...base} {...p}>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </svg>
  ),
  game: (p) => (
    <svg {...base} {...p}>
      <rect x="2" y="7" width="20" height="10" rx="5" />
      <path d="M7 11v2M6 12h2M15.5 11.5h.01M18 13.5h.01" />
    </svg>
  ),
  tools: (p) => (
    <svg {...base} {...p}>
      <path d="M14 7a3 3 0 0 0 4 3l3 3-3 3-3-3a3 3 0 0 0-3-4Z" />
      <path d="M10 14 4 20l-1-1 6-6M6.5 6.5 4 4l2-1 3 3" />
    </svg>
  ),
  briefcase: (p) => (
    <svg {...base} {...p}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" />
    </svg>
  ),
  piggy: (p) => (
    <svg {...base} {...p}>
      <path d="M19 10c1.5 0 2 1.5 2 3s-.5 3-2 3v2h-3v-1.5a6 6 0 0 1-6 0V20H7v-2.4A5.6 5.6 0 0 1 4 13c0-3.3 3.1-6 7-6h3l3-2v3c.6.5 1 1.2 1 2Z" />
      <path d="M9 9.5h3" />
    </svg>
  ),
  heart: (p) => (
    <svg {...base} {...p}>
      <path d="M12 21s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.4-7 10-7 10Z" />
    </svg>
  ),
  star: (p) => (
    <svg {...base} {...p}>
      <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9Z" />
    </svg>
  ),
  tag: (p) => (
    <svg {...base} {...p}>
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </svg>
  ),
  dots: (p) => (
    <svg {...base} {...p}>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  ),
};

export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS);

export const CATEGORY_COLORS = [
  "#10b981", "#34d399", "#0ea5e9", "#06b6d4", "#6366f1", "#8b5cf6",
  "#a855f7", "#d946ef", "#ec4899", "#f43f6e", "#fb923c", "#f59e0b",
  "#eab308", "#84cc16", "#14b8a6", "#94a3b8",
];

export function CategoryIcon({
  name,
  ...props
}: { name: string } & SVGProps<SVGSVGElement>) {
  const C = CATEGORY_ICONS[name] ?? CATEGORY_ICONS.tag;
  return <C {...props} />;
}
