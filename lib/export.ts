// Client-side CSV export of transactions (amounts in the base currency, KZT).
export function exportTransactionsCSV(
  rows: { date: string; type: string; categoryName: string; categoryId: string; amountKzt: number; note: string }[]
) {
  // Quote every field AND neutralize CSV formula injection: a leading
  // = + - @ (or tab/CR) makes Excel/Sheets evaluate the cell, so we prefix a
  // single quote to force it to be treated as text.
  const esc = (s: string | number) => {
    let v = String(s);
    if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
    return `"${v.replace(/"/g, '""')}"`;
  };
  // Category ID (a stable slug/uuid) is appended last so it survives a
  // round-trip across languages; older exports without it still import by name.
  const header = ["Date", "Type", "Category", "Amount (KZT)", "Note", "Category ID"];
  const body = rows.map((r) =>
    [r.date, r.type, esc(r.categoryName), Math.round(r.amountKzt), esc(r.note), r.categoryId].join(",")
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
