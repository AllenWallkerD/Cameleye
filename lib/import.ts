import type { CategoryMeta, CatType } from "./data";

export type ParsedTx = {
  date: string;
  type: CatType;
  category: string;
  amountKzt: number;
  note: string;
};

// Minimal CSV parser (handles quoted fields, escaped quotes, CRLF).
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s.trim());

// Columns expected (same as the export):
// Date, Type, Category, Amount (KZT), Note, Category ID (optional, last)
export function parseTransactionsCSV(text: string, categories: CategoryMeta[]): ParsedTx[] {
  // strip BOM
  const rows = parseCSV(text.replace(/^﻿/, ""));
  const byName = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c.id]));
  const byId = new Map(categories.map((c) => [c.id.toLowerCase(), c.id]));
  const typeOf = new Map(categories.map((c) => [c.id, c.type]));

  const out: ParsedTx[] = [];
  for (const r of rows) {
    if (!r[0] || !isDate(r[0])) continue; // skip header / blank / bad rows
    const date = r[0].trim();
    const typeRaw = (r[1] ?? "").trim().toLowerCase();
    let type: CatType =
      typeRaw.includes("income") || typeRaw.includes("доход") || typeRaw.includes("кіріс")
        ? "income"
        : "expense";
    // resolve category: stable ID column first (locale-proof), then name
    const idText = (r[5] ?? "").trim().toLowerCase();
    const catText = (r[2] ?? "").trim().toLowerCase();
    let category = byId.get(idText) ?? byName.get(catText);
    if (category) {
      // trust the resolved category's own type so the two never contradict
      type = typeOf.get(category) ?? type;
    } else {
      category = type === "income" ? "income_other" : "other";
    }
    const amountKzt = Math.abs(parseFloat((r[3] ?? "").replace(/[^0-9.-]/g, ""))) || 0;
    const note = (r[4] ?? "").trim();
    if (amountKzt <= 0) continue;
    out.push({ date, type, category, amountKzt, note });
  }
  return out;
}
