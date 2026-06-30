import { Icon } from "./icons";

export const NAV = [
  { key: "nav.dashboard", icon: Icon.grid, href: "/" },
  { key: "nav.transactions", icon: Icon.swap, href: "/transactions" },
  { key: "nav.insights", icon: Icon.trend, href: "/insights" },
  { key: "nav.goals", icon: Icon.flag, href: "/goals" },
  { key: "nav.budgets", icon: Icon.pie, href: "/budgets" },
  { key: "nav.settings", icon: Icon.settings, href: "/settings" },
];

// Mobile bottom bar shows 5 (Settings lives in the account menu on mobile).
export const BOTTOM_NAV = NAV.filter((n) => n.href !== "/settings");
