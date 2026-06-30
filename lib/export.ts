// Client-side CSV export of transactions (amounts in the base currency, KZT).
export function exportTransactionsCSV(
  rows: { date: string; type: string; categoryName: string; amountKzt: number; note: string }[]
) {
  const esc = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  const header = ["Date", "Type", "Category", "Amount (KZT)", "Note"];
  const body = rows.map((r) =>
    [r.date, r.type, esc(r.categoryName), Math.round(r.amountKzt), esc(r.note)].join(",")
  );
  const csv = [header.join(","), ...body].join("\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cameleye-transactions.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
