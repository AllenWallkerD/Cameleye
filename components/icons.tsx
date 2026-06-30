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

export const Icon = {
  grid: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  swap: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M7 7h11l-3-3" />
      <path d="M17 17H6l3 3" />
    </svg>
  ),
  target: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  ),
  gauge: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M4 19a8 8 0 1 1 16 0" />
      <path d="M12 19l4-5" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  flag: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M5 22V3" />
      <path d="M5 4h12.5l-2.2 4 2.2 4H5" />
    </svg>
  ),
  pie: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M12 3a9 9 0 1 0 9 9h-9Z" />
      <path d="M14 3.3A9 9 0 0 1 20.7 10H14Z" />
    </svg>
  ),
  chart: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
  settings: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1l-.3-2.5H9.4l-.3 2.5a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.3 2.5h4.2l.3-2.5a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z" />
    </svg>
  ),
  search: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
  ),
  sun: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  moon: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  ),
  plus: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  close: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  pencil: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="M13.5 6.5l3 3" />
    </svg>
  ),
  trash: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
    </svg>
  ),
  arrowUp: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  ),
  arrowDown: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  ),
  calendar: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
  ),
  chevronLeft: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),
  chevronRight: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  logout: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  wallet: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h12v4M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7H6a2 2 0 0 1-2-2Z" />
      <circle cx="17" cy="13" r="1" />
    </svg>
  ),
  // Camel by Delapouite — game-icons.net, CC BY 3.0
  camel: (p: SVGProps<SVGSVGElement>) => (
    <svg width={20} height={20} viewBox="0 0 512 512" fill="currentColor" {...p}>
      <path d="M420.8 26.91c-11.4.76-23.7 4.65-33.6 10.29-5.3-4.86-13.5-10.52-19.3-6.11-12.5 9.46-2.4 20.76 6.8 27.94 5.5 35.86 20.7 93.17-9.8 105.97C317 183.1 308.4 36.14 241 37.94c-40.4 1.08-22.6 59.65-62.6 61.65-29.5 1.51-27.3-54.51-51.9-55.36-25.9-.9-44.62 18.9-57.71 86.97-25.63-.1-35.73 20.1-47.42 59.2-11.686 39-3 115.6 1.2 162.4l7.87-76.3c2.43 12 6.19 24.1 11.91 36.7 3.91 18.7 5.44 37.4 5.81 56-8.2 10.2-8.8 26.2-.42 35.5-.92 26.8-2.67 53.5-1.68 80.3 34.48.5 66.04-1 99.54 0 1.8-11.9-14.9-20.4-34.3-30.3.3-13.7.2-30.5 0-47.5 8.8-10.2 9-28.1-.2-36.8.1-21.3.8-38.6 3.3-43.9 8-17.1 20.6-31.9 29.1-47.2 28.7 5.3 59.7 2.9 91.9-4.7l.7 85.5c-7.7 11.3-8 27.7.3 37.8 4.7 29 .6 58.1.8 87.1h58c2.3-15-22.5-23.1-34.6-30.1 0-22.1-3.9-38.8-.4-60.3 5-9.9 5.3-21.5.4-30.8.9-33 3.3-66 10.7-99 1.6-.6 7.9-3.7 9.3-5.3l10.9 98.4c-5.6 11.9-4.4 27.3 4 36.7 6.6 30.1 4.5 59.5 7.9 89.6l61.2.8c.3-12.3-29.1-20-40.3-25.5-6.4-21.4-5.7-43.1-6.7-64.9 8-12.1 7.6-28.9-1.1-39.5.5-38.3 5.5-76.8 18.4-114.6 106.6-5.9 96.2-72 99.3-133.2 1.4-27.24 55.5 1.7 60-11.61 2.4-6.92 3.6-13.89 0-21.84-8.6-19.29-23.9-20.32-36.7-20.63-12.3-7.36-22.6-25.96-35.5-26.31zm6.7 19.58c4.9 2.64 3.8 7.47 2.7 10.11-6.6 1.96-16.3-1.08-20.8-4.59 3.9-2.99 12.2-5.39 18.1-5.52zM80.6 302.3c3.05 7.8 5.74 15.6 7.35 23.2 3.22 15.3 4.91 30.7 5.72 46.2-7.48 10.3-7.78 26.1.59 35-.25 21.6-1.3 43.2-1.52 64.7-4.54-7.5-12.92-14-24.94-17.1.16-14.4-.44-32.4-1.08-50.6 6.91-10.2 7.01-25.6-1.11-34.3-.67-27-.34-49.4 3.78-54.1 3.95-4.5 7.67-8.8 11.21-13z" />
    </svg>
  ),
  eye: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3.2" />
      <circle cx="13.4" cy="10.7" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  planet: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M3.6 14.5c-1.6.9-2.4 1.8-2.1 2.6.6 1.6 6 .9 12-1.5s10.4-5.6 9.8-7.2c-.3-.8-1.5-1-3.3-.8" />
    </svg>
  ),
  piggy: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base} {...p}>
      <path d="M19 10c1.5 0 2 1.5 2 3s-.5 3-2 3v2h-3v-1.5a6 6 0 0 1-6 0V20H7v-2.4A5.6 5.6 0 0 1 4 13c0-3.3 3.1-6 7-6h3l3-2v3c.6.5 1 1.2 1 2Z" />
      <path d="M9 9.5h3" />
    </svg>
  ),
};
