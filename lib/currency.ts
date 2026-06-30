// All monetary values are stored in a base currency of Kazakhstani tenge (KZT).
// The UI can display them converted into USD / EUR. Static rates are fine for the
// preview; when we wire Supabase we can pull live FX or store per-transaction currency.

export type CurrencyCode = "KZT" | "USD" | "EUR";

export const CURRENCIES: Record<
  CurrencyCode,
  { symbol: string; ratePerKzt: number; label: string }
> = {
  // ratePerKzt = how many of THIS currency 1 KZT is worth
  KZT: { symbol: "₸", ratePerKzt: 1, label: "Tenge" },
  USD: { symbol: "$", ratePerKzt: 1 / 470, label: "Dollar" },
  EUR: { symbol: "€", ratePerKzt: 1 / 510, label: "Euro" },
};

export function convert(amountKzt: number, code: CurrencyCode): number {
  return amountKzt * CURRENCIES[code].ratePerKzt;
}

// Format an amount-field string with space thousand-separators as the user types,
// e.g. "400000" -> "400 000". Keeps an optional single decimal part.
export function groupAmountInput(s: string): string {
  const cleaned = s.replace(/[^0-9.]/g, "");
  const dot = cleaned.indexOf(".");
  const intPart = dot === -1 ? cleaned : cleaned.slice(0, dot);
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  if (dot === -1) return grouped;
  return grouped + "." + cleaned.slice(dot + 1).replace(/\./g, "");
}

export function parseAmountInput(s: string): number {
  return parseFloat(s.replace(/[^0-9.]/g, "")) || 0;
}

export function formatMoney(
  amountKzt: number,
  code: CurrencyCode,
  opts: { compact?: boolean; sign?: boolean } = {}
): string {
  const value = convert(amountKzt, code);
  const { symbol } = CURRENCIES[code];
  const abs = Math.abs(value);

  let body: string;
  if (opts.compact && abs >= 1000) {
    if (abs >= 1_000_000) body = (abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1) + "M";
    else body = (abs / 1000).toFixed(abs >= 100_000 ? 0 : 1) + "K";
  } else {
    const decimals = code === "KZT" ? 0 : abs < 100 ? 2 : 0;
    body = abs.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  const signStr = value < 0 ? "−" : opts.sign ? "+" : "";
  // tenge reads better as a suffix, western currencies as a prefix
  return code === "KZT"
    ? `${signStr}${body} ${symbol}`
    : `${signStr}${symbol}${body}`;
}
