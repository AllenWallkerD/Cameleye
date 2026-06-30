"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "./app-provider";
import { Icon } from "./icons";
import { CategoryIcon } from "./category-icons";
import { formatDateShort } from "./date-picker";
import { AddTransactionDrawer } from "./add-transaction-drawer";
import { formatMoney } from "@/lib/currency";
import { type Transaction } from "@/lib/data";

export function TransactionsTable({
  items,
  full = false,
  viewAllHref,
  selectable = false,
}: {
  items: Transaction[];
  full?: boolean;
  viewAllHref?: string;
  selectable?: boolean;
}) {
  const { t, locale, currency, categoryById, removeTransaction, removeTransactions, confirm } =
    useApp();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function exitSelect() {
    setSelectMode(false);
    setSelected(new Set());
  }

  const allSelected = items.length > 0 && selected.size === items.length;

  async function del(id: string) {
    if (await confirm(t("confirm.delete"))) removeTransaction(id);
  }

  async function delSelected() {
    if (selected.size === 0) return;
    if (await confirm(t("confirm.delete"))) {
      await removeTransactions([...selected]);
      exitSelect();
    }
  }

  return (
    <section className="rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="font-semibold">{t("tx.title")}</h2>
        <div className="flex items-center gap-3">
          {selectable && items.length > 0 && !selectMode && (
            <button
              onClick={() => setSelectMode(true)}
              className="text-sm font-medium text-fg-muted transition-colors hover:text-fg"
            >
              {t("select")}
            </button>
          )}
          {selectMode && (
            <>
              <button
                onClick={() =>
                  setSelected(allSelected ? new Set() : new Set(items.map((x) => x.id)))
                }
                className="text-sm font-medium text-accent hover:underline"
              >
                {allSelected ? t("select.clear") : t("select.all")}
              </button>
              <button
                onClick={exitSelect}
                className="text-sm font-medium text-fg-muted transition-colors hover:text-fg"
              >
                {t("tx.cancel")}
              </button>
            </>
          )}
          {!selectMode && <span className="text-xs text-fg-muted">{items.length}</span>}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-bg-subtle text-fg-muted">
            <Icon.swap width={22} height={22} />
          </span>
          <p className="text-sm text-fg-muted">{t("tx.empty")}</p>
        </div>
      ) : (
        <ul className={`divide-y ${full ? "" : "max-h-[420px] overflow-auto"}`}>
          {items.map((tx) => {
            const cat = categoryById(tx.category);
            const income = tx.type === "income";
            const checked = selected.has(tx.id);
            return (
              <li
                key={tx.id}
                onClick={selectMode ? () => toggle(tx.id) : undefined}
                className={`group flex items-center gap-3 px-5 py-3 transition-colors ${
                  selectMode ? "cursor-pointer" : ""
                } ${checked ? "bg-accent-soft" : "hover:bg-bg-subtle"}`}
              >
                {selectMode && (
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
                      checked ? "border-accent bg-accent text-white" : "border-border"
                    }`}
                  >
                    {checked && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5L20 6" />
                      </svg>
                    )}
                  </span>
                )}

                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                  style={{ background: `color-mix(in srgb, ${cat.color} 16%, transparent)`, color: cat.color }}
                >
                  <CategoryIcon name={cat.icon} width={17} height={17} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{cat.name}</p>
                  <p className="truncate text-xs text-fg-muted">
                    {tx.note || "—"} · {formatDateShort(tx.date, locale)}
                  </p>
                </div>

                <span
                  className="shrink-0 text-sm font-semibold tabular-nums"
                  style={{ color: income ? "var(--pos)" : "var(--fg)" }}
                >
                  {income ? "+" : "−"}
                  {formatMoney(tx.amountKzt, currency)}
                </span>

                {!selectMode && (
                  <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => setEditing(tx)}
                      className="rounded-lg p-1.5 text-fg-muted hover:text-accent"
                      aria-label={t("edit")}
                    >
                      <Icon.pencil width={16} height={16} />
                    </button>
                    <button
                      onClick={() => del(tx.id)}
                      className="rounded-lg p-1.5 text-fg-muted hover:text-neg"
                      aria-label={t("tx.delete")}
                    >
                      <Icon.trash width={16} height={16} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {viewAllHref && items.length > 0 && (
        <Link
          href={viewAllHref}
          className="flex items-center justify-center gap-1 border-t px-5 py-3 text-sm font-medium text-accent transition-colors hover:bg-bg-subtle"
        >
          {t("all")}
          <Icon.chevronRight width={15} height={15} />
        </Link>
      )}

      {editing && (
        <AddTransactionDrawer key={editing.id} open editing={editing} onClose={() => setEditing(null)} />
      )}

      {/* floating bulk-action bar */}
      {selectMode && selected.size > 0 && (
        <div className="animate-fade-up fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border bg-card px-4 py-2.5 shadow-2xl lg:bottom-5">
          <span className="text-sm font-medium tabular-nums">
            {selected.size} {t("selected")}
          </span>
          <button
            onClick={delSelected}
            className="flex items-center gap-1.5 rounded-xl bg-neg px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Icon.trash width={15} height={15} />
            {t("tx.delete")}
          </button>
        </div>
      )}
    </section>
  );
}
